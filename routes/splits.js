const router = require('express').Router()
const Split = require('../models/Split')
const User = require('../models/User')
const auth = require('../middleware/auth')
const { createNotification } = require('../services/notifications')

router.use(auth)

// Get all splits for current user
router.get('/', async (req, res) => {
  try {
    const splits = await Split.find({
      $or: [{ paidBy: req.user.id }, { 'shares.user': req.user.id }]
    })
      .populate('paidBy', 'name username avatar')
      .populate('shares.user', 'name username avatar')
      .sort({ createdAt: -1 })
    res.json({ splits })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get debt summary - what I owe and what others owe me
router.get('/summary', async (req, res) => {
  try {
    const splits = await Split.find({
      $or: [{ paidBy: req.user.id }, { 'shares.user': req.user.id }]
    }).populate('paidBy shares.user', 'name username avatar')

    const owedToMe = {}
    const iOwe = {}

    splits.forEach(split => {
      const iAmPayer = split.paidBy._id.toString() === req.user.id

      split.shares.forEach(share => {
        const shareUserId = share.user._id.toString()
        if (share.status === 'settled') return

        if (iAmPayer && shareUserId !== req.user.id) {
          if (!owedToMe[shareUserId]) owedToMe[shareUserId] = { user: share.user, amount: 0 }
          owedToMe[shareUserId].amount += share.amount
        }

        if (!iAmPayer && shareUserId === req.user.id) {
          const payerId = split.paidBy._id.toString()
          if (!iOwe[payerId]) iOwe[payerId] = { user: split.paidBy, amount: 0 }
          iOwe[payerId].amount += share.amount
        }
      })
    })

    res.json({
      owedToMe: Object.values(owedToMe),
      iOwe: Object.values(iOwe)
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create a split
router.post('/', async (req, res) => {
  try {
    const { title, description, totalAmount, currency, category, shares, splitType, notes, date } = req.body

    const split = await Split.create({
      title, description, totalAmount, currency, category,
      paidBy: req.user.id, shares, splitType, notes,
      date: date || Date.now()
    })

    await split.populate('paidBy shares.user', 'name username avatar')

    const payer = await User.findById(req.user.id).select('name username')

    // Notify all participants
    for (const share of split.shares) {
      if (share.user._id.toString() !== req.user.id) {
        await createNotification(
          share.user._id,
          'split_added',
          'New expense split',
          `${payer.name} added "${title}" — you owe ${share.amount} ${currency || 'EUR'}`,
          { splitId: split._id, amount: share.amount }
        )
      }
    }

    res.status(201).json({ split })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Accept or reject your share
router.patch('/:id/share', async (req, res) => {
  try {
    const { status } = req.body
    const split = await Split.findOneAndUpdate(
      { _id: req.params.id, 'shares.user': req.user.id },
      { $set: { 'shares.$.status': status } },
      { new: true }
    ).populate('paidBy shares.user', 'name username avatar')

    if (!split) return res.status(404).json({ error: 'Split not found' })

    const user = await User.findById(req.user.id).select('name username')
    const notifType = status === 'accepted' ? 'split_accepted' : 'split_rejected'
    const notifMsg = status === 'accepted'
      ? `${user.name} accepted their share of "${split.title}"`
      : `${user.name} rejected their share of "${split.title}"`

    await createNotification(split.paidBy._id, notifType, `Split ${status}`, notifMsg, { splitId: split._id })

    res.json({ split })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Settle up a share
router.patch('/:id/settle', async (req, res) => {
  try {
    const { userId } = req.body
    const targetUser = userId || req.user.id

    const split = await Split.findOneAndUpdate(
      { _id: req.params.id, 'shares.user': targetUser },
      { $set: { 'shares.$.status': 'settled', 'shares.$.settledAt': new Date() } },
      { new: true }
    ).populate('paidBy shares.user', 'name username avatar')

    if (!split) return res.status(404).json({ error: 'Split not found' })

    const user = await User.findById(req.user.id).select('name username')
    const share = split.shares.find(s => s.user._id.toString() === targetUser)

    await createNotification(
      split.paidBy._id,
      'split_settled',
      'Expense settled',
      `${user.name} settled their share of "${split.title}" (${share?.amount} ${split.currency})`,
      { splitId: split._id }
    )

    res.json({ split })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Send payment reminder
router.post('/:id/remind', async (req, res) => {
  try {
    const split = await Split.findOne({ _id: req.params.id, paidBy: req.user.id })
      .populate('paidBy shares.user', 'name username')
    if (!split) return res.status(404).json({ error: 'Not found' })

    for (const share of split.shares) {
      if (share.status === 'pending' && share.user._id.toString() !== req.user.id) {
        await createNotification(
          share.user._id,
          'payment_reminder',
          'Payment reminder',
          `${split.paidBy.name} is reminding you to settle "${split.title}" — ${share.amount} ${split.currency}`,
          { splitId: split._id, amount: share.amount }
        )
      }
    }

    res.json({ message: 'Reminders sent' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
