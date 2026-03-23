const mongoose = require('mongoose')

const splitShareSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  percentage: { type: Number },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'settled'], default: 'pending' },
  settledAt: { type: Date }
})

const splitSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  category: { type: String, default: 'other' },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shares: [splitShareSchema],
  splitType: { type: String, enum: ['equal', 'custom', 'percentage'], default: 'equal' },
  receiptUrl: { type: String },
  notes: { type: String, trim: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  date: { type: Date, default: Date.now },
  recurring: { type: Boolean, default: false },
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true })

splitSchema.index({ paidBy: 1, createdAt: -1 })
splitSchema.index({ 'shares.user': 1 })

module.exports = mongoose.model('Split', splitSchema)
