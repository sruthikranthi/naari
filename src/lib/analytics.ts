/**
 * Analytics and insights utilities
 * User engagement metrics, content performance tracking
 */

import { collection, query, where, getDocs, orderBy, limit, Timestamp, Firestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Get Firestore instance
function getDb(): Firestore {
  const { firestore } = initializeFirebase();
  return firestore;
}

export interface UserEngagementMetrics {
  userId: string;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalFollowers: number;
  totalFollowing: number;
  engagementRate: number;
  averageLikesPerPost: number;
  averageCommentsPerPost: number;
}

export interface ContentPerformance {
  postId: string;
  authorId: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  engagementRate: number;
  createdAt: Timestamp;
}

export interface AdminDashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalCommunities: number;
  totalMarketplaceListings: number;
  totalRevenue: number;
  growthMetrics: {
    newUsersThisWeek: number;
    newPostsThisWeek: number;
    revenueThisWeek: number;
  };
}

/**
 * Get user engagement metrics
 */
export async function getUserEngagementMetrics(userId: string): Promise<UserEngagementMetrics> {
  const db = getDb();
  // Get user's posts
  const postsRef = collection(db, 'posts');
  const postsQuery = query(postsRef, where('author.id', '==', userId));
  const postsSnapshot = await getDocs(postsQuery);
  
  const posts = postsSnapshot.docs.map(doc => doc.data());
  const totalPosts = posts.length;
  
  // Calculate total likes and comments
  const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);
  
  // Get followers/following (assuming these collections exist)
  const followersRef = collection(db, 'follows');
  const followersQuery = query(followersRef, where('followingId', '==', userId));
  const followersSnapshot = await getDocs(followersQuery);
  const totalFollowers = followersSnapshot.size;
  
  const followingQuery = query(followersRef, where('followerId', '==', userId));
  const followingSnapshot = await getDocs(followingQuery);
  const totalFollowing = followingSnapshot.size;
  
  // Calculate engagement rate
  const totalEngagements = totalLikes + totalComments;
  const engagementRate = totalPosts > 0 
    ? (totalEngagements / (totalPosts * 100)) * 100 
    : 0;
  
  return {
    userId,
    totalPosts,
    totalLikes,
    totalComments,
    totalFollowers,
    totalFollowing,
    engagementRate: Math.round(engagementRate * 100) / 100,
    averageLikesPerPost: totalPosts > 0 ? Math.round((totalLikes / totalPosts) * 100) / 100 : 0,
    averageCommentsPerPost: totalPosts > 0 ? Math.round((totalComments / totalPosts) * 100) / 100 : 0,
  };
}

/**
 * Get content performance for a post
 */
export async function getContentPerformance(postId: string): Promise<ContentPerformance | null> {
  const db = getDb();
  const postRef = collection(db, 'posts');
  const postDoc = await getDocs(query(postRef, where('__name__', '==', postId)));
  
  if (postDoc.empty) return null;
  
  const postData = postDoc.docs[0].data();
  const likes = postData.likes || 0;
  const comments = postData.comments || 0;
  const shares = postData.shares || 0;
  const views = postData.views || 0;
  
  const totalEngagements = likes + comments + shares;
  const engagementRate = views > 0 ? (totalEngagements / views) * 100 : 0;
  
  return {
    postId,
    authorId: postData.author?.id || '',
    likes,
    comments,
    shares,
    views,
    engagementRate: Math.round(engagementRate * 100) / 100,
    createdAt: postData.timestamp || Timestamp.now(),
  };
}

/**
 * Get top performing posts
 */
export async function getTopPerformingPosts(limitCount: number = 10): Promise<ContentPerformance[]> {
  const db = getDb();
  const postsRef = collection(db, 'posts');
  const postsQuery = query(
    postsRef,
    orderBy('likes', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(postsQuery);
  const performances: ContentPerformance[] = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const likes = data.likes || 0;
    const comments = data.comments || 0;
    const shares = data.shares || 0;
    const views = data.views || 0;
    const totalEngagements = likes + comments + shares;
    const engagementRate = views > 0 ? (totalEngagements / views) * 100 : 0;
    
    performances.push({
      postId: doc.id,
      authorId: data.author?.id || '',
      likes,
      comments,
      shares,
      views,
      engagementRate: Math.round(engagementRate * 100) / 100,
      createdAt: data.timestamp || Timestamp.now(),
    });
  }
  
  return performances;
}

/**
 * Get admin dashboard metrics
 */
export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const db = getDb();
  // Get total users
  const usersRef = collection(db, 'users');
  const usersSnapshot = await getDocs(usersRef);
  const totalUsers = usersSnapshot.size;
  
  // Get active users (users who posted in last 7 days)
  const weekAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const postsRef = collection(db, 'posts');
  const recentPostsQuery = query(
    postsRef,
    where('timestamp', '>=', weekAgo)
  );
  const recentPostsSnapshot = await getDocs(recentPostsQuery);
  const activeUserIds = new Set(
    recentPostsSnapshot.docs.map(doc => doc.data().author?.id).filter(Boolean)
  );
  const activeUsers = activeUserIds.size;
  
  // Get total posts
  const allPostsSnapshot = await getDocs(postsRef);
  const totalPosts = allPostsSnapshot.size;
  
  // Get total communities
  const communitiesRef = collection(db, 'communities');
  const communitiesSnapshot = await getDocs(communitiesRef);
  const totalCommunities = communitiesSnapshot.size;
  
  // Get marketplace listings
  const marketplaceRef = collection(db, 'marketplace_listings');
  const marketplaceSnapshot = await getDocs(marketplaceRef);
  const totalMarketplaceListings = marketplaceSnapshot.size;
  
  // Calculate revenue (from payments collection if exists)
  const paymentsRef = collection(db, 'payments');
  const paymentsSnapshot = await getDocs(paymentsRef);
  const totalRevenue = paymentsSnapshot.docs.reduce((sum, doc) => {
    const data = doc.data();
    return sum + (data.amount || 0);
  }, 0);
  
  // Get growth metrics
  const newUsersThisWeek = usersSnapshot.docs.filter(doc => {
    const createdAt = doc.data().createdAt;
    if (!createdAt) return false;
    return createdAt.toDate() >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }).length;
  
  const newPostsThisWeek = recentPostsSnapshot.size;
  
  const revenueThisWeek = paymentsSnapshot.docs
    .filter(doc => {
      const createdAt = doc.data().createdAt;
      if (!createdAt) return false;
      return createdAt.toDate() >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    })
    .reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
  
  return {
    totalUsers,
    activeUsers,
    totalPosts,
    totalCommunities,
    totalMarketplaceListings,
    totalRevenue,
    growthMetrics: {
      newUsersThisWeek,
      newPostsThisWeek,
      revenueThisWeek,
    },
  };
}

