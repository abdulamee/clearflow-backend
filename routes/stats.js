const router = require('express').Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [monthlyData] = await Transaction.aggregate([
      { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(req.user.id), date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: {
        _id: '$type',
        total: { $sum: '$amount' }
      }}
    ]);

    const allMonthly = await Transaction.aggregate([
      { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(req.user.id), date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);

    const income = allMonthly.find(d => d._id === 'income')?.total || 0;
    const expenses = allMonthly.find(d => d._id === 'expense')?.total || 0;

    res.json({ income, expenses, saved: income - expenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/by-category', async (req, res) => {
  try {
    const { months = 1 } = req.query;
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const data = await Transaction.aggregate([
      {
        $match: {
          user: require('mongoose').Types.ObjectId.createFromHexString(req.user.id),
          type: 'expense',
          date: { $gte: since }
        }
      },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    res.json({ categories: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/monthly-trend', async (req, res) => {
  try {
    const since = new Date();
    since.setMonth(since.getMonth() - 6);

    const data = await Transaction.aggregate([
      {
        $match: {
          user: require('mongoose').Types.ObjectId.createFromHexString(req.user.id),
          date: { $gte: since }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({ trend: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
