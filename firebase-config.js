/**
 * Firebase Configuration for Push Notifications
 */

const firebaseConfig = {
  apiKey: "AIzaSyAz93zeJXiiaDDGWMRTLmIeaWfrzF6nDMQ",
  authDomain: "palace-bar-notifications.firebaseapp.com",
  projectId: "palace-bar-notifications",
  storageBucket: "palace-bar-notifications.firebasestorage.app",
  messagingSenderId: "340505466627",
  appId: "1:340505466627:web:e39b947af6ae953853bb36"
};

// REPLACE THIS with your VAPID key from Cloud Messaging settings
const vapidKey = "BNWzNeVqsaVmSx0WDoaxw_maJ7IsvF_t2bHvNzGmubmyqMj6J9OHgcBLkt072MiFV5vFouURZdxyMpY58d1JfAY";

export { firebaseConfig, vapidKey };