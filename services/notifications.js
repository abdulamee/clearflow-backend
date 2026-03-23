const Notification = require('../models/Notification')

async function createNotification(userId, type, title, body, data = {}) {
  try {
    const notification = await Notification.create({ user: userId, type, title, body, data })

    // Send FCM push notification if user has a token
    const User = require('../models/User')
    const user = await User.findById(userId).select('fcmToken')
    if (user?.fcmToken && process.env.FCM_SERVER_KEY) {
      await sendFCM(user.fcmToken, title, body, data)
    }

    return notification
  } catch (err) {
    console.error('Notification error:', err.message)
  }
}

async function sendFCM(token, title, body, data) {
  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${process.env.FCM_SERVER_KEY}`
      },
      body: JSON.stringify({
        to: token,
        notification: { title, body, sound: 'default' },
        data,
        priority: 'high'
      })
    })
    const result = await response.json()
    if (result.failure) console.error('FCM send failed:', result)
  } catch (err) {
    console.error('FCM error:', err.message)
  }
}

module.exports = { createNotification }
