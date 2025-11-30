/**
 * Server-side Firebase initialization for API routes
 * This file is for server-side use only (API routes, server components)
 */

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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
  firebaseApp = initializeApp(firebaseConfig);

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

