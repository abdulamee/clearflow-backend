const router = require('express').Router()
const Notification = require('../models/Notification')
const User = require('../models/User')
const auth = require('../middleware/auth')

router.use(auth)

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 }).limit(50)
    const unread = await Notification.countDocuments({ user: req.user.id, read: false })
    res.json({ notifications, unread })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Mark as read
router.patch('/:id/read', async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { read: true })
    res.json({ message: 'Marked as read' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Mark all as read
router.patch('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true })
    res.json({ message: 'All marked as read' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Save FCM token
router.post('/fcm-token', async (req, res) => {
  try {
    const { token } = req.body
    await User.findByIdAndUpdate(req.user.id, { fcmToken: token })
    res.json({ message: 'Token saved' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
