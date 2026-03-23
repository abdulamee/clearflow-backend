const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  emoji: { type: String, default: '👥' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  active: { type: Boolean, default: true }
}, { timestamps: true })

module.exports = mongoose.model('Group', groupSchema)
