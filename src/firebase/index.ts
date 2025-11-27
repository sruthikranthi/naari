'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export function initializeFirebase() {
  // Check if Firebase is already initialized
  if (getApps().length > 0) {
    // If already initialized, return the SDKs with the already initialized App
    return getSdks(getApp());
  }

  // Validate that firebaseConfig has required fields
  if (!firebaseConfig || !firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error(
      'Firebase configuration is missing. Please ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set.'
    );
  }

  // Initialize Firebase with the config
  // In production with Firebase App Hosting, initializeApp() can be called without arguments
  // but for standard Next.js deployments, we need to pass the config
  let firebaseApp: FirebaseApp;
  
  try {
    // First, try to initialize without config (for Firebase App Hosting)
    // This will work if deployed to Firebase App Hosting
    firebaseApp = initializeApp();
  } catch (e) {
    // If that fails (normal for standard Next.js deployments), use the config
    // This is the standard approach for Next.js apps
    firebaseApp = initializeApp(firebaseConfig);
  }

  // Always return the SDKs - this ensures we always have a valid return value
  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/use-paginated-collection';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
