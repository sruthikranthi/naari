/**
 * Notifications system
 * Real-time notifications with Firestore
 */

import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, limit, Firestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Get Firestore instance
function getDb(): Firestore {
  const { firestore } = initializeFirebase();
  return firestore;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'post' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: any;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
  types: {
    likes: boolean;
    comments: boolean;
    follows: boolean;
    messages: boolean;
    posts: boolean;
    system: boolean;
  };
}

/**
 * Create a notification
 */
export async function createNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
  const db = getDb();
  const notificationsRef = collection(db, 'notifications');
  await addDoc(notificationsRef, {
    ...notification,
    read: false,
    createdAt: serverTimestamp(),
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const db = getDb();
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    read: true,
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string) {
  const db = getDb();
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('read', '==', false)
  );
  
  const snapshot = await getDocs(q);
  const promises = snapshot.docs.map((doc) =>
    updateDoc(doc.ref, { read: true })
  );
  
  await Promise.all(promises);
}

/**
 * Get user notifications (real-time)
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
) {
  const db = getDb();
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications: Notification[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
    callback(notifications);
  });
}

/**
 * Get unread notification count
 */
export function subscribeToUnreadCount(
  userId: string,
  callback: (count: number) => void
) {
  const db = getDb();
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('read', '==', false)
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  });
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const db = getDb();
  const preferencesRef = collection(db, 'notification_preferences');
  const q = query(preferencesRef, where('userId', '==', userId), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // Return default preferences
    return {
      userId,
      email: true,
      push: true,
      inApp: true,
      types: {
        likes: true,
        comments: true,
        follows: true,
        messages: true,
        posts: true,
        system: true,
      },
    };
  }

  return snapshot.docs[0].data() as NotificationPreferences;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
) {
  const db = getDb();
  const preferencesRef = collection(db, 'notification_preferences');
  const q = query(preferencesRef, where('userId', '==', userId), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // Create new preferences
    await addDoc(preferencesRef, {
      userId,
      ...preferences,
    });
  } else {
    // Update existing preferences
    await updateDoc(snapshot.docs[0].ref, preferences);
  }
}

/**
 * Helper to create specific notification types
 */
export const notificationHelpers = {
  async likePost(userId: string, postId: string, postAuthorId: string, likerName: string) {
    if (userId === postAuthorId) return; // Don't notify self
    
    await createNotification({
      userId: postAuthorId,
      type: 'like',
      title: 'New Like',
      message: `${likerName} liked your post`,
      link: `/dashboard?post=${postId}`,
      metadata: { postId, likerId: userId },
    });
  },

  async commentOnPost(userId: string, postId: string, postAuthorId: string, commenterName: string) {
    if (userId === postAuthorId) return; // Don't notify self
    
    await createNotification({
      userId: postAuthorId,
      type: 'comment',
      title: 'New Comment',
      message: `${commenterName} commented on your post`,
      link: `/dashboard?post=${postId}`,
      metadata: { postId, commenterId: userId },
    });
  },

  async followUser(followerId: string, followedUserId: string, followerName: string) {
    if (followerId === followedUserId) return; // Don't notify self
    
    await createNotification({
      userId: followedUserId,
      type: 'follow',
      title: 'New Follower',
      message: `${followerName} started following you`,
      link: `/dashboard/profile/${followerId}`,
      metadata: { followerId },
    });
  },

  async newMessage(chatId: string, recipientId: string, senderName: string, messagePreview: string) {
    await createNotification({
      userId: recipientId,
      type: 'message',
      title: 'New Message',
      message: `${senderName}: ${messagePreview}`,
      link: `/dashboard/chat/${chatId}`,
      metadata: { chatId },
    });
  },
};

