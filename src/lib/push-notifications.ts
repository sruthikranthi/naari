/**
 * Web Push Notifications
 * Service Worker integration for push notifications
 */

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Request push notification permission
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Get service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Workers are not supported');
  }

  const registration = await navigator.serviceWorker.ready;
  return registration;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  try {
    const permission = await requestPushPermission();
    if (permission !== 'granted') {
      console.warn('Push notification permission denied');
      return null;
    }

    const registration = await getServiceWorkerRegistration();
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      },
    };
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await getServiceWorkerRegistration();
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

/**
 * Check if user is subscribed
 */
export async function isSubscribedToPushNotifications(): Promise<boolean> {
  try {
    const registration = await getServiceWorkerRegistration();
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Error checking push subscription:', error);
    return false;
  }
}

/**
 * Send test notification
 */
export async function sendTestNotification(title: string, options?: NotificationOptions) {
  const permission = await requestPushPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission not granted');
  }

  const registration = await getServiceWorkerRegistration();
  await registration.showNotification(title, {
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    ...options,
  });
}

/**
 * Utility: Convert VAPID key from base64 URL to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Utility: Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Save push subscription to Firestore
 */
export async function savePushSubscription(
  userId: string,
  subscription: PushSubscription
) {
  const { collection, addDoc, query, where, getDocs, updateDoc, doc } = await import('firebase/firestore');
  const { db } = await import('@/firebase/config');
  
  const subscriptionsRef = collection(db, 'push_subscriptions');
  const q = query(subscriptionsRef, where('userId', '==', userId), where('endpoint', '==', subscription.endpoint));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    await addDoc(subscriptionsRef, {
      userId,
      ...subscription,
      createdAt: new Date(),
    });
  } else {
    await updateDoc(snapshot.docs[0].ref, {
      ...subscription,
      updatedAt: new Date(),
    });
  }
}

/**
 * Remove push subscription from Firestore
 */
export async function removePushSubscription(userId: string, endpoint: string) {
  const { collection, query, where, getDocs, deleteDoc } = await import('firebase/firestore');
  const { db } = await import('@/firebase/config');
  
  const subscriptionsRef = collection(db, 'push_subscriptions');
  const q = query(subscriptionsRef, where('userId', '==', userId), where('endpoint', '==', endpoint));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    await deleteDoc(snapshot.docs[0].ref);
  }
}

