const router = require('express').Router();
const Intention = require('../models/Intention');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const intentions = await Intention.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ intentions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, targetAmount, savedAmount, targetDate, color } = req.body;
    const intention = await Intention.create({
      user: req.user.id, title, description, targetAmount,
      savedAmount: savedAmount || 0, targetDate, color
    });
    res.status(201).json({ intention });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const intention = await Intention.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body, { new: true }
    );
    if (!intention) return res.status(404).json({ error: 'Not found' });
    res.json({ intention });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Intention.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
