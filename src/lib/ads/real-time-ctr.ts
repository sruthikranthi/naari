/**
 * Real-Time CTR Tracking & Performance Monitoring
 */

import type { Firestore } from 'firebase/firestore';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import type { RealTimeCTR, AdCreative } from './types';

// Cache for real-time CTR data (in-memory cache, refresh periodically)
const ctrCache = new Map<string, RealTimeCTR>();
let lastCacheUpdate = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get real-time CTR for a creative
 */
export async function getRealTimeCTR(
  firestore: Firestore,
  creativeId: string,
  campaignId: string,
  timeWindow?: number // Minutes to look back (default: last 24 hours)
): Promise<RealTimeCTR> {
  const cacheKey = `${campaignId}:${creativeId}`;
  const now = Date.now();
  
  // Check cache first
  if (ctrCache.has(cacheKey) && (now - lastCacheUpdate) < CACHE_TTL) {
    return ctrCache.get(cacheKey)!;
  }
  
  // Calculate time window
  const windowMinutes = timeWindow || 24 * 60; // Default: 24 hours
  const startTime = new Date(now - windowMinutes * 60 * 1000);
  
  // Get impressions
  const impressionsQuery = query(
    collection(firestore, 'ad_impressions'),
    where('adId', '==', creativeId),
    where('timestamp', '>=', Timestamp.fromDate(startTime))
  );
  
  // Get clicks
  const clicksQuery = query(
    collection(firestore, 'ad_clicks'),
    where('adId', '==', creativeId),
    where('timestamp', '>=', Timestamp.fromDate(startTime))
  );
  
  // Get conversions
  const conversionsQuery = query(
    collection(firestore, 'ad_conversions'),
    where('adId', '==', creativeId),
    where('timestamp', '>=', Timestamp.fromDate(startTime))
  );
  
  const [impressionsSnapshot, clicksSnapshot, conversionsSnapshot] = await Promise.all([
    getDocs(impressionsQuery),
    getDocs(clicksQuery),
    getDocs(conversionsQuery),
  ]);
  
  const impressions = impressionsSnapshot.size;
  const clicks = clicksSnapshot.size;
  const conversions = conversionsSnapshot.size;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  
  // Calculate performance score (weighted combination of CTR and conversion rate)
  const performanceScore = calculatePerformanceScore(ctr, conversionRate, impressions);
  
  const realTimeCTR: RealTimeCTR = {
    creativeId,
    campaignId,
    impressions,
    clicks,
    ctr,
    conversions,
    conversionRate,
    lastUpdated: serverTimestamp(),
    performanceScore,
  };
  
  // Update cache
  ctrCache.set(cacheKey, realTimeCTR);
  lastCacheUpdate = now;
  
  // Store in Firestore for historical tracking
  await setDoc(
    doc(firestore, 'ad_real_time_ctr', `${campaignId}_${creativeId}`),
    {
      ...realTimeCTR,
      lastUpdated: serverTimestamp(),
    },
    { merge: true }
  );
  
  return realTimeCTR;
}

/**
 * Get real-time CTR for all creatives in a campaign
 */
export async function getCampaignRealTimeCTR(
  firestore: Firestore,
  campaignId: string,
  timeWindow?: number
): Promise<Map<string, RealTimeCTR>> {
  // Get all creatives for this campaign
  const creativesQuery = query(
    collection(firestore, 'ad_creatives'),
    where('campaignId', '==', campaignId),
    where('active', '==', true)
  );
  
  const creativesSnapshot = await getDocs(creativesQuery);
  const creatives = creativesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as AdCreative[];
  
  const ctrMap = new Map<string, RealTimeCTR>();
  
  await Promise.all(
    creatives.map(async (creative) => {
      const ctr = await getRealTimeCTR(firestore, creative.id, campaignId, timeWindow);
      ctrMap.set(creative.id, ctr);
    })
  );
  
  return ctrMap;
}

/**
 * Calculate performance score for ML optimization
 * Higher score = better performance
 */
function calculatePerformanceScore(
  ctr: number,
  conversionRate: number,
  impressions: number
): number {
  // Base score from CTR (0-100 scale, normalized)
  const ctrScore = Math.min(100, ctr * 10); // 10% CTR = 100 points
  
  // Conversion rate bonus (0-50 scale)
  const conversionScore = Math.min(50, conversionRate * 5); // 10% conversion = 50 points
  
  // Sample size confidence (0-20 scale)
  // More impressions = higher confidence
  const confidenceScore = Math.min(20, impressions / 10); // 200 impressions = 20 points
  
  // Weighted combination
  const totalScore = (ctrScore * 0.6) + (conversionScore * 0.3) + (confidenceScore * 0.1);
  
  return Math.round(totalScore * 100) / 100; // Round to 2 decimals
}

/**
 * Update dynamic weights based on real-time performance
 */
export async function updateDynamicWeights(
  firestore: Firestore,
  campaignId: string
): Promise<void> {
  const ctrMap = await getCampaignRealTimeCTR(firestore, campaignId);
  
  if (ctrMap.size === 0) return;
  
  // Calculate total performance score
  const totalScore = Array.from(ctrMap.values()).reduce(
    (sum, ctr) => sum + ctr.performanceScore,
    0
  );
  
  if (totalScore === 0) return; // No performance data yet
  
  // Update weights proportionally to performance
  const updates = Array.from(ctrMap.entries()).map(async ([creativeId, ctr]) => {
    // New weight = (performance score / total score) * 100
    // Minimum weight of 5 to ensure all creatives get some traffic
    const newWeight = Math.max(5, Math.round((ctr.performanceScore / totalScore) * 100));
    
    await setDoc(
      doc(firestore, 'ad_creatives', creativeId),
      {
        weight: newWeight,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
  
  await Promise.all(updates);
}

