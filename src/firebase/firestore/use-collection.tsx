'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  orderBy,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Need to reset state when query becomes null
      setData(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(null);
      return;
    }

    // Prevent blind list queries for tambola_games and kitty_groups
    // These collections require where clauses for security
    let guardCollectionName: string | null = null;
    
    if (memoizedTargetRefOrQuery.type === 'collection') {
      const collectionRef = memoizedTargetRefOrQuery as CollectionReference;
      guardCollectionName = collectionRef.path;
      if (guardCollectionName === 'tambola_games' || guardCollectionName === 'kitty_groups') {
        console.error(`🚨 SECURITY ERROR: Blind list query detected for ${guardCollectionName}. This collection requires a where clause.`);
        console.error('Stack trace:', new Error().stack);
        setError(new Error(`Security: ${guardCollectionName} requires a where clause in the query`));
        setData(null);
        setIsLoading(false);
        return;
      }
    }
    
    // Also check if query has where clauses for tambola_games and kitty_groups
    if (memoizedTargetRefOrQuery.type === 'query') {
      const queryRef = memoizedTargetRefOrQuery as unknown as InternalQuery;
      const guardFullPath = queryRef._query.path.canonicalString();
      // Extract collection name from full path
      const guardPathSegments = guardFullPath.split('/');
      guardCollectionName = guardPathSegments[guardPathSegments.length - 1];
      
      if (guardCollectionName === 'tambola_games' || guardCollectionName === 'kitty_groups') {
        // Check if query has where clauses by inspecting the query structure
        // Firestore queries store filters in _query.filters array (not structuredQuery.where)
        const queryObj = queryRef._query as any;
        
        // Check for filters array - this is where Firestore stores where clauses
        const hasFilters = queryObj.filters && Array.isArray(queryObj.filters) && queryObj.filters.length > 0;
        
        // Also check structuredQuery.where for compatibility
        const structuredQuery = queryObj.structuredQuery;
        const hasStructuredWhere = structuredQuery && structuredQuery.where && 
          (structuredQuery.where.fieldFilter || structuredQuery.where.compositeFilter);
        
        if (!hasFilters && !hasStructuredWhere) {
          console.error(`🚨 SECURITY ERROR: Query for ${guardCollectionName} has no where clauses. This collection requires a where clause.`);
          console.error('Query object structure:', {
            hasFilters: hasFilters,
            filtersLength: queryObj.filters ? queryObj.filters.length : 0,
            hasStructuredQuery: !!structuredQuery,
            hasStructuredWhere: hasStructuredWhere,
            collectionName: guardCollectionName,
            fullPath: guardFullPath
          });
          console.error('Full query object:', JSON.stringify(queryObj, null, 2));
          console.error('Stack trace:', new Error().stack);
          setError(new Error(`Security: ${guardCollectionName} requires a where clause in the query`));
          setData(null);
          setIsLoading(false);
          return;
        }
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Need to set loading state when starting new subscription
    setIsLoading(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);

    // Extract path and query details for logging
    const fullPath: string =
      memoizedTargetRefOrQuery.type === 'collection'
        ? (memoizedTargetRefOrQuery as CollectionReference).path
        : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();
    
    // Extract just the collection name from the path
    // canonicalString() returns: "databases/(default)/documents/tambola_games"
    // CollectionReference.path returns: "tambola_games"
    const pathSegments = fullPath.split('/');
    const collectionName = pathSegments[pathSegments.length - 1];

    // Log query details for tambola_games and kitty_groups
    if (collectionName === 'tambola_games' || collectionName === 'kitty_groups') {
      const stackTrace = new Error().stack;
      const queryDetails: any = {
        collectionName,
        fullPath,
        type: memoizedTargetRefOrQuery.type,
      };
      
      if (memoizedTargetRefOrQuery.type === 'query') {
        const queryRef = memoizedTargetRefOrQuery as unknown as InternalQuery;
        const queryObj = queryRef._query as any;
        queryDetails.filters = queryObj.filters || [];
        queryDetails.hasFilters = queryObj.filters && queryObj.filters.length > 0;
        queryDetails.structuredQuery = queryObj.structuredQuery ? {
          hasWhere: !!queryObj.structuredQuery.where,
        } : null;
      }
      
      console.log(`🔍 [useCollection] Creating listener for ${collectionName}:`, queryDetails);
      console.log(`📍 Stack trace:`, stackTrace);
    }

    // Directly use memoizedTargetRefOrQuery as it's assumed to be the final query
    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        // This logic extracts the path from either a ref or a query
        const errorFullPath: string =
          memoizedTargetRefOrQuery.type === 'collection'
            ? (memoizedTargetRefOrQuery as CollectionReference).path
            : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();
        
        // Extract just the collection name
        const errorPathSegments = errorFullPath.split('/');
        const errorCollectionName = errorPathSegments[errorPathSegments.length - 1];

        // Enhanced error logging for tambola_games and kitty_groups
        if (errorCollectionName === 'tambola_games' || errorCollectionName === 'kitty_groups') {
          console.error(`❌ [useCollection] Permission error for ${errorCollectionName}:`, {
            code: error.code,
            message: error.message,
            collectionName: errorCollectionName,
            fullPath: errorFullPath,
            queryType: memoizedTargetRefOrQuery.type,
            stack: new Error().stack,
          });
        }

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: errorCollectionName,
        })

        setError(contextualError)
        setData(null)
        setIsLoading(false)

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]); // Re-run if the target query/reference changes.
  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('Query was not properly memoized using useMemoFirebase');
  }
  return { data, isLoading, error };
}
