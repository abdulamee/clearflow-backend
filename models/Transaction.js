const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    enum: ['groceries','dining','transport','housing','utilities','health',
           'entertainment','subscriptions','travel','shopping','income','other'],
    required: true
  },
  description: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now },
  recurring: { type: Boolean, default: false },
  notes: { type: String, trim: true }
}, { timestamps: true });

transactionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
