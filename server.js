require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const authRoutes = require('./routes/auth')
const transactionRoutes = require('./routes/transactions')
const intentionRoutes = require('./routes/intentions')
const statsRoutes = require('./routes/stats')
const friendRoutes = require('./routes/friends')
const splitRoutes = require('./routes/splits')
const notificationRoutes = require('./routes/notifications')
const groupRoutes = require('./routes/groups')

const app = express()

app.use(cors({ origin: '*', credentials: false }))
app.use(express.json())

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err))

app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/intentions', intentionRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/friends', friendRoutes)
app.use('/api/splits', splitRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/groups', groupRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`ClearFlow API running on port ${PORT}`))
