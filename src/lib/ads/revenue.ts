/**
 * Revenue Estimation & Calculation
 */

import type { Firestore } from 'firebase/firestore';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { AdCampaign, AdCreative, Sponsor } from './types';

export interface RevenueEstimate {
  campaignId: string;
  campaignName: string;
  estimatedRevenue: number;
  actualRevenue: number;
  impressions: number;
  clicks: number;
  ctr: number;
  revenuePerClick: number;
  revenuePerImpression: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface RevenueSummary {
  totalEstimatedRevenue: number;
  totalActualRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  overallCTR: number;
  campaigns: RevenueEstimate[];
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * Calculate revenue estimate for a campaign
 */
export async function calculateCampaignRevenue(
  firestore: Firestore,
  campaignId: string,
  startDate?: Date,
  endDate?: Date
): Promise<RevenueEstimate> {
  const campaignDoc = await getDocs(query(
    collection(firestore, 'ad_campaigns'),
    where('__name__', '==', campaignId)
  ));
  
  if (campaignDoc.empty) {
    throw new Error(`Campaign ${campaignId} not found`);
  }
  
  const campaign = { id: campaignId, ...campaignDoc.docs[0].data() } as AdCampaign;
  
  // Get impressions and clicks
  let impressionsQuery = query(
    collection(firestore, 'ad_impressions'),
    where('campaignId', '==', campaignId)
  );
  
  let clicksQuery = query(
    collection(firestore, 'ad_clicks'),
    where('campaignId', '==', campaignId)
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
  
  // Calculate revenue
  const revenuePerClick = campaign.revenuePerClick || 0;
  const revenuePerImpression = campaign.revenuePerImpression || 0;
  
  const estimatedRevenue = (impressions * revenuePerImpression) + (clicks * revenuePerClick);
  const actualRevenue = estimatedRevenue; // In a real system, this would come from payment records
  
  const period = {
    start: startDate || (campaign.startDate instanceof Date 
      ? campaign.startDate 
      : (campaign.startDate as any)?.toDate?.() || new Date()),
    end: endDate || (campaign.endDate instanceof Date 
      ? campaign.endDate 
      : (campaign.endDate as any)?.toDate?.() || new Date()),
  };
  
  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    estimatedRevenue,
    actualRevenue,
    impressions,
    clicks,
    ctr,
    revenuePerClick,
    revenuePerImpression,
    period,
  };
}

/**
 * Get revenue summary for all campaigns
 */
export async function getRevenueSummary(
  firestore: Firestore,
  startDate?: Date,
  endDate?: Date
): Promise<RevenueSummary> {
  const campaignsSnapshot = await getDocs(collection(firestore, 'ad_campaigns'));
  const campaigns = campaignsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as AdCampaign[];
  
  const campaignEstimates = await Promise.all(
    campaigns.map(campaign => 
      calculateCampaignRevenue(firestore, campaign.id, startDate, endDate)
        .catch(() => null)
    )
  );
  
  const validEstimates = campaignEstimates.filter((e): e is RevenueEstimate => e !== null);
  
  const totalEstimatedRevenue = validEstimates.reduce((sum, e) => sum + e.estimatedRevenue, 0);
  const totalActualRevenue = validEstimates.reduce((sum, e) => sum + e.actualRevenue, 0);
  const totalImpressions = validEstimates.reduce((sum, e) => sum + e.impressions, 0);
  const totalClicks = validEstimates.reduce((sum, e) => sum + e.clicks, 0);
  const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  
  return {
    totalEstimatedRevenue,
    totalActualRevenue,
    totalImpressions,
    totalClicks,
    overallCTR,
    campaigns: validEstimates,
    period: {
      start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: endDate || new Date(),
    },
  };
}

