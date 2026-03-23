const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['split_added', 'split_accepted', 'split_rejected', 'split_settled',
           'friend_request', 'friend_accepted', 'payment_reminder', 'group_invite'],
    required: true
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  read: { type: Boolean, default: false },
  actionUrl: { type: String }
}, { timestamps: true })

notificationSchema.index({ user: 1, read: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
