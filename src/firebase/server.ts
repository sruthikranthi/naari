/**
 * Server-side Firebase initialization for API routes
 * This file is for server-side use only (API routes, server components)
 * 
 * Note: For server-side operations, we use the regular Firebase SDK
 * but we need to handle authentication differently in API routes.
 */

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

let firebaseApp: FirebaseApp | null = null;

export function initializeFirebaseServer() {
  // Return existing app if already initialized
  if (firebaseApp) {
    return getSdks(firebaseApp);
  }

  // Check if Firebase is already initialized
  if (getApps().length > 0) {
    firebaseApp = getApp();
    return getSdks(firebaseApp);
  }

  // Validate that firebaseConfig has required fields
  if (!firebaseConfig || !firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error(
      'Firebase configuration is missing. Please ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set.'
    );
  }

  // Initialize Firebase with the config (server-side always needs config)
  firebaseApp = initializeApp(firebaseConfig, 'server');

  // Return the SDKs
  return getSdks(firebaseApp);
}

function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
}

/**
 * Verify Firebase Auth token and get user ID
 */
export async function verifyAuthToken(token: string): Promise<string | null> {
  try {
    const { initializeFirebaseServer } = await import('./server');
    const { auth } = initializeFirebaseServer();
    // Note: verifyIdToken is from Admin SDK, we'll use a different approach
    // For now, we'll trust the token and extract userId from it
    // In production, you should use Firebase Admin SDK to verify tokens
    return null; // Will be implemented with Admin SDK if needed
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

