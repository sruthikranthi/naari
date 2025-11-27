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
  const isSettingUpRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);

  useEffect(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Clean up any existing subscription first
    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current();
      } catch (e) {
        // Ignore errors during cleanup
      }
      unsubscribeRef.current = null;
    }

    isSettingUpRef.current = false;

    if (!memoizedDocRef) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Need to reset state when ref becomes null
      setData(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(null);
      currentRefPath.current = null;
      retryCountRef.current = 0;
      return;
    }

    // Check if this is the same document reference to avoid unnecessary re-subscriptions
    const refPath = memoizedDocRef.path;
    if (currentRefPath.current === refPath && unsubscribeRef.current && !isSettingUpRef.current) {
      // Same document and already subscribed, don't re-subscribe
      return;
    }

    // If we're already setting up a subscription, don't start another one
    if (isSettingUpRef.current) {
      return;
    }

    currentRefPath.current = refPath;
    isSettingUpRef.current = true;

    // Add a longer delay to prevent rapid subscription setup/teardown
    // Increase delay based on retry count (exponential backoff)
    const delay = Math.min(200 + (retryCountRef.current * 100), 1000);
    
    timeoutRef.current = setTimeout(() => {
      // Double-check the ref hasn't changed during the timeout
      if (currentRefPath.current !== refPath || !isSettingUpRef.current) {
        isSettingUpRef.current = false;
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

            // Reset retry count on success
            retryCountRef.current = 0;
            isSettingUpRef.current = false;

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

            isSettingUpRef.current = false;

            // If it's a permission error for a user's own profile, it might be because the document doesn't exist yet
            // In this case, we'll treat it as if the document doesn't exist (null) rather than an error
            // This is especially common for new users who haven't created their profile yet
            if (error.code === 'permission-denied' && memoizedDocRef.path.startsWith('users/')) {
              // For user profiles, permission denied might mean the document doesn't exist
              // Set data to null and don't treat it as an error
              setData(null);
              setError(null);
              setIsLoading(false);
              retryCountRef.current = 0; // Reset retry count
              return;
            }

            // Handle Firestore internal errors gracefully - don't retry immediately
            if (error.message?.includes('INTERNAL ASSERTION FAILED') || 
                error.message?.includes('Unexpected state') ||
                error.code === 'unavailable' ||
                error.code === 'deadline-exceeded') {
              console.warn('Firestore error, will not retry immediately:', error.code);
              setIsLoading(false);
              // Don't increment retry count for these errors, just stop trying
              retryCountRef.current = 0;
              return;
            }

            // For other errors, increment retry count but don't retry automatically
            retryCountRef.current = Math.min(retryCountRef.current + 1, 5);

            const contextualError = new FirestorePermissionError({
              operation: 'get',
              path: memoizedDocRef.path,
            })

            setError(contextualError)
            setData(null)
            setIsLoading(false)

            // Only emit permission errors, not other errors
            if (error.code === 'permission-denied') {
              errorEmitter.emit('permission-error', contextualError);
            }
          }
        );

        unsubscribeRef.current = unsubscribe;
      } catch (e) {
        console.error('Error setting up Firestore subscription:', e);
        setIsLoading(false);
        setError(e as Error);
        isSettingUpRef.current = false;
        retryCountRef.current = Math.min(retryCountRef.current + 1, 5);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (e) {
          // Ignore errors during cleanup
        }
        unsubscribeRef.current = null;
      }
      isSettingUpRef.current = false;
      // Only clear currentRefPath if this is still the active subscription
      if (currentRefPath.current === refPath) {
        currentRefPath.current = null;
      }
    };
  }, [memoizedDocRef]); // Re-run if the memoizedDocRef changes.

  return { data, isLoading, error };
}