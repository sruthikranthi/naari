/**
 * Search functionality utilities
 * Global search across posts, users, communities
 */

import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Post, User } from '@/lib/mock-data';

export interface SearchResult {
  type: 'post' | 'user' | 'community';
  id: string;
  title: string;
  description?: string;
  image?: string;
  metadata?: Record<string, any>;
}

export interface SearchFilters {
  type?: 'post' | 'user' | 'community' | 'all';
  dateRange?: 'today' | 'week' | 'month' | 'all';
  sortBy?: 'relevance' | 'date' | 'popularity';
}

/**
 * Search posts
 */
export async function searchPosts(
  searchTerm: string,
  filters?: SearchFilters,
  lastDoc?: any
): Promise<{ results: SearchResult[]; lastDoc: any }> {
  const postsRef = collection(db, 'posts');
  let q = query(postsRef, orderBy('timestamp', 'desc'), limit(20));

  if (lastDoc) {
    q = query(postsRef, orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(20));
  }

  const snapshot = await getDocs(q);
  const results: SearchResult[] = [];
  let lastDocument = null;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const content = data.content?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();

    // Simple text matching (in production, use Algolia or Elasticsearch)
    if (content.includes(searchLower) || data.author?.name?.toLowerCase().includes(searchLower)) {
      results.push({
        type: 'post',
        id: doc.id,
        title: data.author?.name || 'Unknown',
        description: data.content?.substring(0, 150),
        image: data.image,
        metadata: {
          timestamp: data.timestamp,
          likes: data.likes || 0,
          comments: data.comments || 0,
        },
      });
    }

    if (snapshot.docs.length > 0) {
      lastDocument = snapshot.docs[snapshot.docs.length - 1];
    }
  });

  return { results, lastDoc: lastDocument };
}

/**
 * Search users
 */
export async function searchUsers(
  searchTerm: string,
  filters?: SearchFilters,
  lastDoc?: any
): Promise<{ results: SearchResult[]; lastDoc: any }> {
  const usersRef = collection(db, 'users');
  let q = query(usersRef, limit(20));

  if (lastDoc) {
    q = query(usersRef, startAfter(lastDoc), limit(20));
  }

  const snapshot = await getDocs(q);
  const results: SearchResult[] = [];
  let lastDocument = null;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const name = data.name?.toLowerCase() || '';
    const city = data.city?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();

    if (name.includes(searchLower) || city.includes(searchLower)) {
      results.push({
        type: 'user',
        id: doc.id,
        title: data.name || 'Unknown',
        description: `${data.city || ''} • ${data.bio || ''}`.substring(0, 150),
        image: data.avatar,
        metadata: {
          city: data.city,
          interests: data.interests || [],
        },
      });
    }

    if (snapshot.docs.length > 0) {
      lastDocument = snapshot.docs[snapshot.docs.length - 1];
    }
  });

  return { results, lastDoc: lastDocument };
}

/**
 * Search communities
 */
export async function searchCommunities(
  searchTerm: string,
  filters?: SearchFilters,
  lastDoc?: any
): Promise<{ results: SearchResult[]; lastDoc: any }> {
  const communitiesRef = collection(db, 'communities');
  let q = query(communitiesRef, orderBy('createdAt', 'desc'), limit(20));

  if (lastDoc) {
    q = query(communitiesRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(20));
  }

  const snapshot = await getDocs(q);
  const results: SearchResult[] = [];
  let lastDocument = null;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const name = data.name?.toLowerCase() || '';
    const description = data.description?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();

    if (name.includes(searchLower) || description.includes(searchLower)) {
      results.push({
        type: 'community',
        id: doc.id,
        title: data.name || 'Unknown',
        description: data.description?.substring(0, 150),
        image: data.image,
        metadata: {
          memberCount: data.memberIds?.length || 0,
          createdAt: data.createdAt,
        },
      });
    }

    if (snapshot.docs.length > 0) {
      lastDocument = snapshot.docs[snapshot.docs.length - 1];
    }
  });

  return { results, lastDoc: lastDocument };
}

/**
 * Global search across all types
 */
export async function globalSearch(
  searchTerm: string,
  filters?: SearchFilters
): Promise<SearchResult[]> {
  if (!searchTerm.trim()) return [];

  const allResults: SearchResult[] = [];

  if (!filters?.type || filters.type === 'all' || filters.type === 'post') {
    const posts = await searchPosts(searchTerm, filters);
    allResults.push(...posts.results);
  }

  if (!filters?.type || filters.type === 'all' || filters.type === 'user') {
    const users = await searchUsers(searchTerm, filters);
    allResults.push(...users.results);
  }

  if (!filters?.type || filters.type === 'all' || filters.type === 'community') {
    const communities = await searchCommunities(searchTerm, filters);
    allResults.push(...communities.results);
  }

  // Sort by relevance (simple implementation)
  return allResults.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const aMatch = aTitle.startsWith(searchLower) ? 1 : 0;
    const bMatch = bTitle.startsWith(searchLower) ? 1 : 0;

    return bMatch - aMatch;
  });
}

/**
 * Save search to history
 */
export function saveSearchHistory(searchTerm: string) {
  if (typeof window === 'undefined') return;

  try {
    const history = getSearchHistory();
    const newHistory = [
      searchTerm,
      ...history.filter((item) => item !== searchTerm),
    ].slice(0, 10); // Keep last 10 searches

    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
}

/**
 * Get search history
 */
export function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const history = localStorage.getItem('searchHistory');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to get search history:', error);
    return [];
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('searchHistory');
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
}

