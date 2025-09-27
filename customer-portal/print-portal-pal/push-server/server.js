const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
require('dotenv').config({ path: '../.env.local' });

const app = express();
const PORT = process.env.PUSH_SERVER_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:test@example.com',
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// In-memory storage for subscriptions (use a database in production)
const subscriptions = new Map();

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    vapidConfigured: !!(process.env.VITE_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
  });
});

// Store a push subscription
app.post('/api/subscribe', (req, res) => {
  const { subscription, userId } = req.body;
  
  if (!subscription || !userId) {
    return res.status(400).json({ error: 'Subscription and userId required' });
  }

  subscriptions.set(userId, {
    subscription,
    timestamp: new Date().toISOString()
  });
  
  console.log(`Stored subscription for user: ${userId}`);
  res.json({ success: true, message: 'Subscription stored' });
});

// Remove a push subscription
app.post('/api/unsubscribe', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const deleted = subscriptions.delete(userId);
  
  console.log(`${deleted ? 'Removed' : 'Could not find'} subscription for user: ${userId}`);
  res.json({ success: true, message: 'Subscription removed' });
});

// Send a push notification to a specific user
app.post('/api/send-notification', async (req, res) => {
  const { userId, title, body, data, icon, badge } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const userSubscription = subscriptions.get(userId);
  
  if (!userSubscription) {
    return res.status(404).json({ error: 'No subscription found for user' });
  }

  const notificationPayload = JSON.stringify({
    title: title || 'Test Notification',
    body: body || 'This is a test notification from the server',
    data: data || { url: '/' },
    icon: icon || '/icon-192x192.png',
    badge: badge || '/icon-192x192.png',
    timestamp: Date.now(),
    tag: `notification-${Date.now()}`
  });

  try {
    await webpush.sendNotification(userSubscription.subscription, notificationPayload);
    console.log(`Notification sent to user: ${userId}`);
    res.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // If subscription is invalid, remove it
    if (error.statusCode === 410) {
      subscriptions.delete(userId);
    }
    
    res.status(500).json({ 
      error: 'Failed to send notification', 
      details: error.message 
    });
  }
});

// Send notification to all subscribers
app.post('/api/broadcast', async (req, res) => {
  const { title, body, data, icon, badge } = req.body;
  
  if (subscriptions.size === 0) {
    return res.status(404).json({ error: 'No subscriptions found' });
  }

  const notificationPayload = JSON.stringify({
    title: title || 'Broadcast Notification',
    body: body || 'This is a broadcast notification',
    data: data || { url: '/' },
    icon: icon || '/icon-192x192.png',
    badge: badge || '/icon-192x192.png',
    timestamp: Date.now(),
    tag: `broadcast-${Date.now()}`
  });

  const results = [];
  const failedSubscriptions = [];

  for (const [userId, { subscription }] of subscriptions) {
    try {
      await webpush.sendNotification(subscription, notificationPayload);
      results.push({ userId, status: 'sent' });
      console.log(`Broadcast sent to user: ${userId}`);
    } catch (error) {
      console.error(`Error sending to user ${userId}:`, error.message);
      results.push({ userId, status: 'failed', error: error.message });
      
      // Remove invalid subscriptions
      if (error.statusCode === 410) {
        failedSubscriptions.push(userId);
      }
    }
  }

  // Clean up failed subscriptions
  failedSubscriptions.forEach(userId => subscriptions.delete(userId));

  res.json({ 
    success: true, 
    message: 'Broadcast completed',
    results,
    totalSent: results.filter(r => r.status === 'sent').length,
    totalFailed: results.filter(r => r.status === 'failed').length
  });
});

// Get subscription status
app.get('/api/subscriptions', (req, res) => {
  const subs = Array.from(subscriptions.entries()).map(([userId, data]) => ({
    userId,
    timestamp: data.timestamp,
    endpoint: data.subscription.endpoint
  }));
  
  res.json({
    total: subscriptions.size,
    subscriptions: subs
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Push notification server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Subscriptions: http://localhost:${PORT}/api/subscriptions`);
  console.log(`🔑 VAPID configured: ${!!(process.env.VITE_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)}`);
});
