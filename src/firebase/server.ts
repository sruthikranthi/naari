/**
 * Server-side Firebase initialization for API routes
 * This file is for server-side use only (API routes, server components)
 * 
 * Uses Firebase Admin SDK for server-side operations which bypasses security rules
 */

import { firebaseConfig } from '@/firebase/config';
import admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK for server-side operations
 * Admin SDK bypasses Firestore security rules and is designed for server-side use
 */
export function initializeFirebaseServer() {
  // Return existing app if already initialized
  if (adminApp) {
    return {
      firestore: admin.firestore(),
      auth: admin.auth(),
      storage: admin.storage(),
    };
  }

  // Check if already initialized
  if (admin.apps.length > 0) {
    adminApp = admin.app();
    return {
      firestore: admin.firestore(),
      auth: admin.auth(),
      storage: admin.storage(),
    };
  }

  // Initialize Admin SDK
  // Option 1: Use service account (recommended for production)
  // Option 2: Use application default credentials
  // Option 3: Use environment variables (for Vercel/Netlify)
  
  try {
    // Try to initialize with service account credentials from environment
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Use application default credentials (for Firebase App Hosting or GCP)
      adminApp = admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    } else {
      // Fallback: Initialize with project ID only (works in some environments)
      adminApp = admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error);
    // If Admin SDK fails, try to initialize with minimal config
    try {
      adminApp = admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    } catch (fallbackError: any) {
      throw new Error(
        `Failed to initialize Firebase Admin SDK: ${fallbackError.message}. ` +
        `Please set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID environment variable.`
      );
    }
  }

  return {
    firestore: admin.firestore(),
    auth: admin.auth(),
    storage: admin.storage(),
  };
}

/**
 * Verify Firebase Auth token and get user ID
 */
export async function verifyAuthToken(token: string): Promise<string | null> {
  try {
    const { auth } = initializeFirebaseServer();
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}
