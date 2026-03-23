const router = require('express').Router()
const Friend = require('../models/Friend')
const User = require('../models/User')
const auth = require('../middleware/auth')
const { createNotification } = require('../services/notifications')

router.use(auth)

// Search users by username or name
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.length < 2) return res.json({ users: [] })
    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    }).select('name username avatar').limit(10)
    res.json({ users })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get all friends and pending requests
router.get('/', async (req, res) => {
  try {
    const friends = await Friend.find({
      $or: [{ requester: req.user.id }, { recipient: req.user.id }]
    }).populate('requester recipient', 'name username avatar')
    res.json({ friends })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Send friend request
router.post('/request', async (req, res) => {
  try {
    const { userId } = req.body
    const existing = await Friend.findOne({
      $or: [
        { requester: req.user.id, recipient: userId },
        { requester: userId, recipient: req.user.id }
      ]
    })
    if (existing) return res.status(409).json({ error: 'Request already exists' })

    const friend = await Friend.create({ requester: req.user.id, recipient: userId })
    const requester = await User.findById(req.user.id).select('name username')

    await createNotification(userId, 'friend_request',
      'Friend request',
      `${requester.name} (@${requester.username}) sent you a friend request`,
      { requestId: friend._id, fromUser: req.user.id }
    )

    res.status(201).json({ friend })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Accept or reject friend request
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body
    const friend = await Friend.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { status }, { new: true }
    ).populate('requester recipient', 'name username')

    if (!friend) return res.status(404).json({ error: 'Request not found' })

    if (status === 'accepted') {
      await createNotification(friend.requester._id, 'friend_accepted',
        'Friend request accepted',
        `${friend.recipient.name} accepted your friend request`,
        { userId: friend.recipient._id }
      )
    }

    res.json({ friend })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Remove friend
router.delete('/:id', async (req, res) => {
  try {
    await Friend.findOneAndDelete({
      _id: req.params.id,
      $or: [{ requester: req.user.id }, { recipient: req.user.id }]
    })
    res.json({ message: 'Removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
