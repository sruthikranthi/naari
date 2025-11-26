'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Query,
  QuerySnapshot,
  DocumentData,
  CollectionReference,
  QueryDocumentSnapshot,
  limit,
  startAfter,
  getDocs,
  query,
  FirestoreError,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useMemoFirebase } from '@/firebase';

export type WithId<T> = T & { id: string };

export interface UsePaginatedCollectionResult<T> {
  data: WithId<T>[];
  isLoading: boolean;
  error: FirestoreError | Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PAGE_SIZE = 20; // Default page size

/**
 * React hook for paginated Firestore collection queries.
 * Supports loading more data and refreshing.
 * 
 * @template T Type of the document data.
 * @param queryFactory Function that returns a Firestore query with limit.
 * @param pageSize Number of documents per page (default: 20).
 * @returns Paginated collection result with loadMore and refresh functions.
 */
export function usePaginatedCollection<T = any>(
  queryFactory: () => (CollectionReference<DocumentData> | Query<DocumentData>) | null,
  pageSize: number = PAGE_SIZE
): UsePaginatedCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  const memoizedQuery = useMemoFirebase(queryFactory, []);

  const loadPage = useCallback(async (isRefresh: boolean = false) => {
    if (!memoizedQuery) {
      setData([]);
      setIsLoading(false);
      setHasMore(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build query with pagination
      let firestoreQuery: Query<DocumentData>;
      
      if (isRefresh || !lastDoc) {
        // First page or refresh
        if (memoizedQuery.type === 'collection') {
          const collectionRef = memoizedQuery as CollectionReference<DocumentData>;
          firestoreQuery = query(collectionRef, limit(pageSize));
        } else {
          // If it's already a query, add limit to it
          const existingQuery = memoizedQuery as Query<DocumentData>;
          firestoreQuery = query(existingQuery, limit(pageSize));
        }
      } else {
        // Subsequent pages - use startAfter
        if (memoizedQuery.type === 'collection') {
          const collectionRef = memoizedQuery as CollectionReference<DocumentData>;
          firestoreQuery = query(collectionRef, startAfter(lastDoc), limit(pageSize));
        } else {
          const existingQuery = memoizedQuery as Query<DocumentData>;
          firestoreQuery = query(existingQuery, startAfter(lastDoc), limit(pageSize));
        }
      }

      const snapshot: QuerySnapshot<DocumentData> = await getDocs(firestoreQuery);
      
      const results: WithId<T>[] = [];
      snapshot.forEach((doc) => {
        results.push({ ...(doc.data() as T), id: doc.id });
      });

      if (isRefresh) {
        setData(results);
      } else {
        setData(prev => [...prev, ...results]);
      }

      // Update pagination state
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === pageSize);
      } else {
        setHasMore(false);
      }

      setIsInitialLoad(false);
    } catch (err) {
      const firestoreError = err as FirestoreError;
      const path = memoizedQuery.type === 'collection'
        ? (memoizedQuery as CollectionReference).path
        : 'unknown';

      const contextualError = new FirestorePermissionError({
        operation: 'list',
        path,
      });

      setError(contextualError);
      errorEmitter.emit('permission-error', contextualError);
    } finally {
      setIsLoading(false);
    }
  }, [memoizedQuery, lastDoc, pageSize]);

  // Initial load
  useEffect(() => {
    if (isInitialLoad && memoizedQuery) {
      loadPage(true);
    }
  }, [memoizedQuery, isInitialLoad, loadPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await loadPage(false);
  }, [hasMore, isLoading, loadPage]);

  const refresh = useCallback(async () => {
    setLastDoc(null);
    setHasMore(true);
    setIsInitialLoad(true);
    await loadPage(true);
  }, [loadPage]);

  return {
    data,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

