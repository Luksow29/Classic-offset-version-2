// Service Worker for Classic Offset Customer Portal
// Handles push notifications, background sync, and offline functionality

const CACHE_NAME = 'classic-offset-customer-v1';
const API_CACHE_NAME = 'classic-offset-api-v1';

// URLs to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/login',
  '/register',
  '/orders',
  '/chat',
  '/offline.html',
  '/manifest.json'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('SW: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .catch((error) => {
        console.error('SW: Failed to cache static resources:', error);
      })
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('SW: Activated and ready');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.includes('/rest/v1/') || url.hostname.includes('supabase')) {
    event.respondWith(
      caches.open(API_CACHE_NAME)
        .then((cache) => {
          return fetch(request)
            .then((response) => {
              // Cache successful GET requests for 5 minutes
              if (request.method === 'GET' && response.ok) {
                const responseClone = response.clone();
                cache.put(request, responseClone);
              }
              return response;
            })
            .catch(() => {
              // Return cached version if available
              return cache.match(request);
            });
        })
    );
    return;
  }

  // Handle static resources
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(request)
          .catch(() => {
            // Return offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('SW: Push notification received:', event);
  
  let notificationData = {
    title: 'Classic Offset',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'default',
    data: {},
    actions: []
  };

	  if (event.data) {
	    try {
	      const pushData = event.data.json();
	      console.log('SW: Push data:', pushData);
	      
	      const embeddedData = (pushData && typeof pushData.data === 'object' && pushData.data !== null)
	        ? pushData.data
	        : {};

	      const url = pushData.url || embeddedData.url || '/';
	      const orderId = pushData.order_id || embeddedData.orderId || embeddedData.order_id;
	      const notificationId = pushData.id || embeddedData.notificationId || embeddedData.notification_id;
	      const type = pushData.type || embeddedData.type;
	      
	      notificationData = {
	        title: pushData.title || notificationData.title,
	        body: pushData.message || pushData.body || notificationData.body,
	        icon: pushData.icon || notificationData.icon,
	        badge: pushData.badge || notificationData.badge,
	        tag: pushData.tag || type || notificationData.tag,
	        data: {
	          url,
	          orderId,
	          notificationId,
	          type,
	          timestamp: Date.now()
	        },
	        actions: pushData.actions || getDefaultActions(type),
	        requireInteraction: pushData.priority === 'urgent',
	        silent: pushData.priority === 'low',
	        vibrate: pushData.priority === 'urgent' ? [200, 100, 200] : [100],
	        timestamp: Date.now()
	      };

	      // Add order-specific actions
	      if (orderId) {
	        notificationData.actions.unshift({
	          action: 'view_order',
	          title: 'View Order',
	          icon: '/icons/view.png'
        });
      }

    } catch (error) {
      console.error('SW: Error parsing push data:', error);
    }
  }

  const notificationPromise = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      vibrate: notificationData.vibrate,
      timestamp: notificationData.timestamp
    }
  );

  event.waitUntil(notificationPromise);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification clicked:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close the notification
  notification.close();

	  // Handle different actions
	  let url = (typeof data.url === 'string' && data.url) ? data.url : '/';
	  
	  if (action === 'dismiss') {
	    // Just close the notification
	    return;
	  }

  // Focus existing window or open new one
  const clientPromise = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    // Try to focus existing window
    for (const client of clientList) {
      if (client.url.includes(self.location.origin)) {
        client.focus();
        client.postMessage({
          type: 'NOTIFICATION_CLICK',
          url: url,
          data: data
        });
        return client;
      }
    }
    
    // Open new window
    if (clients.openWindow) {
      return clients.openWindow(url);
    }
  });

  event.waitUntil(clientPromise);
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('SW: Notification closed:', event);
  
  // Optional: Track notification dismissals
  const data = event.notification.data || {};
  
  if (data.notificationId) {
    // Could send analytics about dismissed notifications
    console.log('SW: Notification dismissed:', data.notificationId);
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync triggered:', event.tag);
  
  if (event.tag === 'order-sync') {
    event.waitUntil(syncOrders());
  } else if (event.tag === 'message-sync') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('SW: Message received:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(data.urls));
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearCache(data.cacheName));
      break;
      
    case 'GET_CACHE_SIZE':
      event.waitUntil(getCacheSize().then(size => {
        event.ports[0].postMessage(size);
      }));
      break;
  }
});

// Helper functions
function getDefaultActions(notificationType) {
  const actions = [
    {
      action: 'dismiss',
      title: 'Dismiss',
      icon: '/icons/dismiss.png'
    }
  ];

  switch (notificationType) {
    case 'order_update':
      actions.unshift({
        action: 'view_order',
        title: 'View Order',
        icon: '/icons/view.png'
      });
      break;
      
    case 'payment_received':
      actions.unshift({
        action: 'view_payment',
        title: 'View Payment',
        icon: '/icons/payment.png'
      });
      break;
      
    case 'chat_message':
      actions.unshift({
        action: 'view_chat',
        title: 'Reply',
        icon: '/icons/chat.png'
      });
      break;
  }

  return actions.slice(0, 2); // Max 2 actions on most platforms
}

async function syncOrders() {
  try {
    console.log('SW: Syncing orders...');
    // Implement order sync logic here
    // This would fetch latest orders from API
    return Promise.resolve();
  } catch (error) {
    console.error('SW: Order sync failed:', error);
    throw error;
  }
}

async function syncMessages() {
  try {
    console.log('SW: Syncing messages...');
    // Implement message sync logic here
    // This would fetch latest messages from API
    return Promise.resolve();
  } catch (error) {
    console.error('SW: Message sync failed:', error);
    throw error;
  }
}

async function syncNotifications() {
  try {
    console.log('SW: Syncing notifications...');
    // Implement notification sync logic here
    // This would fetch latest notifications from API
    return Promise.resolve();
  } catch (error) {
    console.error('SW: Notification sync failed:', error);
    throw error;
  }
}

async function cacheUrls(urls) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urls);
    console.log('SW: URLs cached successfully');
  } catch (error) {
    console.error('SW: Failed to cache URLs:', error);
  }
}

async function clearCache(cacheName) {
  try {
    await caches.delete(cacheName || CACHE_NAME);
    console.log('SW: Cache cleared successfully');
  } catch (error) {
    console.error('SW: Failed to clear cache:', error);
  }
}

async function getCacheSize() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    return keys.length;
  } catch (error) {
    console.error('SW: Failed to get cache size:', error);
    return 0;
  }
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('SW: Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('SW: Unhandled promise rejection:', event.reason);
});

console.log('SW: Service Worker loaded successfully');
