/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config (same as firebase-config.js)
const firebaseConfig = {
  apiKey: "AIzaSyAz93zeJXiiaDDGWMRTLmIeaWfrzF6nDMQ",
  authDomain: "palace-bar-notifications.firebaseapp.com",
  projectId: "palace-bar-notifications",
  storageBucket: "palace-bar-notifications.firebasestorage.app",
  messagingSenderId: "340505466627",
  appId: "1:340505466627:web:e39b947af6ae953853bb36"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 Background notification:', payload);

  const notificationTitle = payload.notification?.title || 'Palace Bar';
  const notificationOptions = {
    body: payload.notification?.body || 'Új rendelés érkezett',
    icon: '/palace-icon.png',
    badge: '/palace-badge.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'new-order',
    requireInteraction: true,
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/admin-dashboard.html#orders')
  );
});