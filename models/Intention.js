const mongoose = require('mongoose');

const intentionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  targetAmount: { type: Number, required: true, min: 1 },
  savedAmount: { type: Number, default: 0, min: 0 },
  targetDate: { type: Date, required: true },
  color: { type: String, default: '#1D9E75' },
  status: { type: String, enum: ['active','completed','paused'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Intention', intentionSchema);
