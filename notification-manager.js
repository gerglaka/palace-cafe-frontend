/**
 * Push Notification Manager
 */

class NotificationManager {
    constructor() {
        this.messaging = null;
        this.token = null;
    }

    async init() {
        try {
            // Check browser support
            if (!('Notification' in window)) {
                console.warn('❌ Notifications not supported');
                return false;
            }

            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp({
                  apiKey: "AIzaSyAz93zeJXiiaDDGWMRTLmIeaWfrzF6nDMQ",
                  authDomain: "palace-bar-notifications.firebaseapp.com",
                  projectId: "palace-bar-notifications",
                  storageBucket: "palace-bar-notifications.firebasestorage.app",
                  messagingSenderId: "340505466627",
                  appId: "1:340505466627:web:e39b947af6ae953853bb36"
                });
            }

            this.messaging = firebase.messaging();

            // Register service worker
            await navigator.serviceWorker.register('/firebase-messaging-sw.js');

            // Request permission and get token
            await this.requestPermission();

            // Listen for foreground messages
            this.onForegroundMessage();

            console.log('✅ Notifications initialized');
            return true;

        } catch (error) {
            console.error('❌ Notification init failed:', error);
            return false;
        }
    }

    async requestPermission() {
        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                console.log('✅ Permission granted');

                const vapidKey = "BNWzNeVqsaVmSx0WDoaxw_maJ7IsvF_t2bHvNzGmubmyqMj6J9OHgcBLkt072MiFV5vFouURZdxyMpY58d1JfAY";
                
                this.token = await this.messaging.getToken({ vapidKey });
                console.log('🔑 FCM Token:', this.token);

                // Save to backend
                await this.saveToken(this.token);

            } else {
                console.warn('⚠️ Permission denied');
            }

        } catch (error) {
            console.error('❌ Permission error:', error);
        }
    }

    async saveToken(token) {
        try {
            const response = await fetch('https://palace-cafe-backend-production.up.railway.app/api/admin/fcm-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ fcmToken: token })
            });

            const result = await response.json();
            if (result.success) {
                console.log('✅ Token saved');
            }

        } catch (error) {
            console.error('❌ Save token failed:', error);
        }
    }

    onForegroundMessage() {
        this.messaging.onMessage((payload) => {
            console.log('🔔 Foreground message:', payload);

            const { title, body } = payload.notification;

            // Show notification
            new Notification(title, {
                body: body,
                icon: '/palace-icon.png',
                vibrate: [200, 100, 200]
            });

            // Play sound
            try {
                const audio = new Audio('/notification.mp3');
                audio.play();
            } catch (e) {}

            // Show in-app toast
            if (window.adminDashboard) {
                window.adminDashboard.showNotification(body, 'info');
            }

            // Refresh orders
            if (window.ordersApp) {
                window.ordersApp.refresh();
            }
        });
    }
}

// Create global instance
window.notificationManager = new NotificationManager();