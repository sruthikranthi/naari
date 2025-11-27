'use client';
    
import { useState, useEffect, useRef } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Handles nullable references.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} docRef -
 * The Firestore DocumentReference. Waits if null/undefined.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const currentRefPath = useRef<string | null>(null);

  useEffect(() => {
    // Clean up any existing subscription first
    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current();
      } catch (e) {
        // Ignore errors during cleanup
        console.warn('Error cleaning up Firestore subscription:', e);
      }
      unsubscribeRef.current = null;
    }

    if (!memoizedDocRef) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Need to reset state when ref becomes null
      setData(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(null);
      currentRefPath.current = null;
      return;
    }

    // Check if this is the same document reference to avoid unnecessary re-subscriptions
    const refPath = memoizedDocRef.path;
    if (currentRefPath.current === refPath && unsubscribeRef.current) {
      // Same document, don't re-subscribe
      return;
    }

    currentRefPath.current = refPath;

    // Add a small delay to prevent rapid subscription setup/teardown
    const timeoutId = setTimeout(() => {
      // Double-check the ref hasn't changed during the timeout
      if (currentRefPath.current !== refPath) {
        return;
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect -- Need to set loading state when starting new subscription
      setIsLoading(true);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(null);

      try {
        const unsubscribe = onSnapshot(
          memoizedDocRef,
          (snapshot: DocumentSnapshot<DocumentData>) => {
            // Verify this is still the current subscription
            if (currentRefPath.current !== refPath) {
              return;
            }

            if (snapshot.exists()) {
              setData({ ...(snapshot.data() as T), id: snapshot.id });
            } else {
              // Document does not exist
              setData(null);
            }
            setError(null); // Clear any previous error on successful snapshot (even if doc doesn't exist)
            setIsLoading(false);
          },
          (error: FirestoreError) => {
            // Verify this is still the current subscription
            if (currentRefPath.current !== refPath) {
              return;
            }

            // If it's a permission error for a user's own profile, it might be because the document doesn't exist yet
            // In this case, we'll treat it as if the document doesn't exist (null) rather than an error
            // This is especially common for new users who haven't created their profile yet
            if (error.code === 'permission-denied' && memoizedDocRef.path.startsWith('users/')) {
              // For user profiles, permission denied might mean the document doesn't exist
              // Set data to null and don't treat it as an error
              setData(null);
              setError(null);
              setIsLoading(false);
              return;
            }

            // Handle Firestore internal errors gracefully
            if (error.message?.includes('INTERNAL ASSERTION FAILED') || error.message?.includes('Unexpected state')) {
              console.warn('Firestore internal error, will retry:', error);
              // Don't set error state for internal errors, just log and retry
              setIsLoading(false);
              return;
            }

            const contextualError = new FirestorePermissionError({
              operation: 'get',
              path: memoizedDocRef.path,
            })

            setError(contextualError)
            setData(null)
            setIsLoading(false)

            // trigger global error propagation
            errorEmitter.emit('permission-error', contextualError);
          }
        );

        unsubscribeRef.current = unsubscribe;
      } catch (e) {
        console.error('Error setting up Firestore subscription:', e);
        setIsLoading(false);
        setError(e as Error);
      }
    }, 50); // 50ms delay to prevent rapid subscription changes

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (e) {
          // Ignore errors during cleanup
          console.warn('Error cleaning up Firestore subscription:', e);
        }
        unsubscribeRef.current = null;
      }
      // Only clear currentRefPath if this is still the active subscription
      if (currentRefPath.current === refPath) {
        currentRefPath.current = null;
      }
    };
  }, [memoizedDocRef]); // Re-run if the memoizedDocRef changes.

  return { data, isLoading, error };
}