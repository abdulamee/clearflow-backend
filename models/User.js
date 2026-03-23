const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  currency: { type: String, default: 'EUR' },
  monthlyIncome: { type: Number, default: 0 },
  fcmToken: { type: String },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now }
})

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  if (!this.username) {
    this.username = this.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 999)
  }
  next()
})

userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password)
}

userSchema.methods.toJSON = function() {
  const obj = this.toObject()
  delete obj.password
  delete obj.fcmToken
  return obj
}

module.exports = mongoose.model('User', userSchema)
