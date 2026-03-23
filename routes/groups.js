const router = require('express').Router()
const Group = require('../models/Group')
const User = require('../models/User')
const auth = require('../middleware/auth')
const { createNotification } = require('../services/notifications')

router.use(auth)

router.get('/', async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id, active: true })
      .populate('members', 'name username avatar')
      .populate('createdBy', 'name username')
    res.json({ groups })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, description, emoji, memberIds } = req.body
    const members = [...new Set([req.user.id, ...(memberIds || [])])]
    const group = await Group.create({ name, description, emoji, createdBy: req.user.id, members })
    await group.populate('members', 'name username avatar')

    const creator = await User.findById(req.user.id).select('name')
    for (const memberId of memberIds || []) {
      if (memberId !== req.user.id) {
        await createNotification(memberId, 'group_invite',
          'Added to group',
          `${creator.name} added you to the group "${name}"`,
          { groupId: group._id }
        )
      }
    }

    res.status(201).json({ group })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const group = await Group.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body, { new: true }
    ).populate('members', 'name username avatar')
    if (!group) return res.status(404).json({ error: 'Not found' })
    res.json({ group })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await Group.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { active: false }
    )
    res.json({ message: 'Group archived' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
