/**
 * A/B Testing for Ad Creatives
 */

import type { Firestore } from 'firebase/firestore';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import type { AdCreative, ABTestVariant } from './types';

export interface ABTestResult {
  variantId: string;
  creativeId: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversionRate?: number;
  isWinner?: boolean;
  confidence?: number; // Statistical confidence level
}

/**
 * Get A/B test results for a campaign
 */
export async function getABTestResults(
  firestore: Firestore,
  campaignId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ABTestResult[]> {
  // Get all creatives for this campaign
  const creativesQuery = query(
    collection(firestore, 'ad_creatives'),
    where('campaignId', '==', campaignId)
  );
  const creativesSnapshot = await getDocs(creativesQuery);
  const creatives = creativesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as AdCreative[];
  
  // Get impressions and clicks for each creative
  const results = await Promise.all(
    creatives.map(async (creative) => {
      let impressionsQuery = query(
        collection(firestore, 'ad_impressions'),
        where('adId', '==', creative.id)
      );
      
      let clicksQuery = query(
        collection(firestore, 'ad_clicks'),
        where('adId', '==', creative.id)
      );
      
      if (startDate) {
        impressionsQuery = query(impressionsQuery, where('timestamp', '>=', Timestamp.fromDate(startDate)));
        clicksQuery = query(clicksQuery, where('timestamp', '>=', Timestamp.fromDate(startDate)));
      }
      
      if (endDate) {
        impressionsQuery = query(impressionsQuery, where('timestamp', '<=', Timestamp.fromDate(endDate)));
        clicksQuery = query(clicksQuery, where('timestamp', '<=', Timestamp.fromDate(endDate)));
      }
      
      const [impressionsSnapshot, clicksSnapshot] = await Promise.all([
        getDocs(impressionsQuery),
        getDocs(clicksQuery),
      ]);
      
      const impressions = impressionsSnapshot.size;
      const clicks = clicksSnapshot.size;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      
      return {
        variantId: creative.abTestVariant || creative.id,
        creativeId: creative.id,
        impressions,
        clicks,
        ctr,
      };
    })
  );
  
  // Determine winner (highest CTR)
  const sortedResults = results.sort((a, b) => b.ctr - a.ctr);
  const winner = sortedResults[0];
  
  // Calculate statistical confidence (simplified)
  const enrichedResults = results.map((result, index) => {
    const isWinner = result.creativeId === winner.creativeId;
    const confidence = calculateConfidence(result, sortedResults);
    
    return {
      ...result,
      isWinner,
      confidence,
    };
  });
  
  return enrichedResults;
}

/**
 * Calculate statistical confidence for A/B test
 * Simplified version - in production, use proper statistical tests
 */
function calculateConfidence(
  variant: ABTestResult,
  allVariants: ABTestResult[]
): number {
  if (variant.impressions < 100) return 0; // Need minimum sample size
  
  const winner = allVariants[0];
  if (variant.creativeId === winner.creativeId) {
    // Winner confidence based on sample size and difference
    const diff = variant.ctr - (allVariants[1]?.ctr || 0);
    const baseConfidence = Math.min(95, 50 + (diff * 2));
    const sampleConfidence = Math.min(20, variant.impressions / 10);
    return Math.min(95, baseConfidence + sampleConfidence);
  }
  
  return 0;
}

/**
 * Mark winning variant for a campaign
 */
export async function markWinningVariant(
  firestore: Firestore,
  campaignId: string,
  winningCreativeId: string
): Promise<void> {
  // Update campaign to disable A/B testing and use winning creative
  const campaignDoc = doc(firestore, 'ad_campaigns', campaignId);
  await updateDoc(campaignDoc, {
    abTestEnabled: false,
    updatedAt: Timestamp.now(),
  });
  
  // Optionally, deactivate losing creatives
  const creativesQuery = query(
    collection(firestore, 'ad_creatives'),
    where('campaignId', '==', campaignId)
  );
  const creativesSnapshot = await getDocs(creativesQuery);
  
  await Promise.all(
    creativesSnapshot.docs.map(async (doc) => {
      if (doc.id !== winningCreativeId) {
        await updateDoc(doc.ref, {
          active: false,
          updatedAt: Timestamp.now(),
        });
      }
    })
  );
}

