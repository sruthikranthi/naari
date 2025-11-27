'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    try {
      // Initialize Firebase on the client side, once per component mount.
      const services = initializeFirebase();
      
      // Validate that all services were initialized
      if (!services || !services.firebaseApp || !services.auth || !services.firestore || !services.storage) {
        throw new Error('Firebase initialization failed: One or more services are undefined');
      }
      
      return services;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw error; // Re-throw to prevent rendering with invalid state
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}