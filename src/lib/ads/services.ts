/**
 * Naari Ad & Sponsorship Engine - Services
 * 
 * Handles ad decision logic, fetching, and tracking.
 */

import type { Firestore } from 'firebase/firestore';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  type Query,
} from 'firebase/firestore';
import type {
  AdCampaign,
  AdCreative,
  AdPlacementRule,
  Sponsor,
  AdImpression,
  AdClick,
  AdDecision,
  AdPosition,
  AdCampaignType,
} from './types';

// ============================================================================
// AD CAMPAIGN SERVICES
// ============================================================================

export async function getActiveCampaigns(
  firestore: Firestore,
  type?: AdCampaignType
): Promise<AdCampaign[]> {
  let q: Query = query(
    collection(firestore, 'ad_campaigns'),
    where('active', '==', true),
    orderBy('priority', 'desc'),
    orderBy('startDate', 'desc')
  );
  
  if (type) {
    q = query(q, where('type', '==', type));
  }
  
  const snapshot = await getDocs(q);
  const now = new Date();
  
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as AdCampaign))
    .filter((campaign) => {
      const startDate = campaign.startDate instanceof Date 
        ? campaign.startDate 
        : (campaign.startDate as any)?.toDate?.() || new Date();
      const endDate = campaign.endDate instanceof Date 
        ? campaign.endDate 
        : (campaign.endDate as any)?.toDate?.() || new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      
      return now >= startDate && now <= endDate;
    });
}

export async function getAdCreatives(
  firestore: Firestore,
  campaignId: string
): Promise<AdCreative[]> {
  const q = query(
    collection(firestore, 'ad_creatives'),
    where('campaignId', '==', campaignId),
    where('active', '==', true),
    orderBy('order', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AdCreative[];
}

export async function getPlacementRules(
  firestore: Firestore,
  campaignId: string,
  position?: AdPosition
): Promise<AdPlacementRule[]> {
  let q: Query = query(
    collection(firestore, 'ad_placement_rules'),
    where('campaignId', '==', campaignId),
    where('active', '==', true)
  );
  
  if (position) {
    q = query(q, where('position', '==', position));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AdPlacementRule[];
}

// ============================================================================
// SPONSOR SERVICES
// ============================================================================

export async function getActiveSponsors(
  firestore: Firestore,
  type?: 'OVERALL' | 'EVENT',
  gameId?: string
): Promise<Sponsor[]> {
  let q: Query = query(
    collection(firestore, 'sponsors'),
    where('active', '==', true),
    orderBy('priority', 'desc')
  );
  
  if (type) {
    q = query(q, where('sponsorshipType', '==', type));
  }
  
  const snapshot = await getDocs(q);
  const now = new Date();
  
  const sponsors = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as Sponsor))
    .filter((sponsor) => {
      // Check date range if set
      if (sponsor.startDate) {
        const startDate = sponsor.startDate instanceof Date 
          ? sponsor.startDate 
          : (sponsor.startDate as any)?.toDate?.() || new Date();
        if (now < startDate) return false;
      }
      
      if (sponsor.endDate) {
        const endDate = sponsor.endDate instanceof Date 
          ? sponsor.endDate 
          : (sponsor.endDate as any)?.toDate?.() || new Date();
        if (now > endDate) return false;
      }
      
      // For EVENT sponsors, check if linked to this game
      if (gameId && sponsor.sponsorshipType === 'EVENT') {
        return sponsor.linkedGameIds?.includes(gameId) || false;
      }
      
      return true;
    });
  
  return sponsors;
}

// ============================================================================
// AD DECISION ENGINE
// ============================================================================

export class AdDecisionEngine {
  /**
   * Decide which ad to show at a given position
   */
  static async decideAd(
    firestore: Firestore,
    position: AdPosition,
    userId: string,
    gameId?: string,
    userStats?: {
      predictionsCount?: number;
      gamesPlayed?: number;
      lastAdShown?: Date;
    }
  ): Promise<AdDecision> {
    // Priority 1: Overall Campaign Sponsors (for LOBBY_BANNER, LEADERBOARD_BANNER, PROFILE_BANNER)
    if (['LOBBY_BANNER', 'LEADERBOARD_BANNER', 'PROFILE_BANNER'].includes(position)) {
      const overallSponsors = await getActiveSponsors(firestore, 'OVERALL');
      if (overallSponsors.length > 0) {
        // Rotate sponsors (simple: pick first for now, can enhance with rotation logic)
        return {
          show: true,
          ad: overallSponsors[0],
          type: 'SPONSOR',
          placement: position,
        };
      }
    }
    
    // Priority 2: Event/Game Level Sponsors (for game-specific positions)
    if (gameId && ['PRE_GAME', 'MID_GAME', 'POST_GAME'].includes(position)) {
      const eventSponsors = await getActiveSponsors(firestore, 'EVENT', gameId);
      if (eventSponsors.length > 0) {
        return {
          show: true,
          ad: eventSponsors[0],
          type: 'SPONSOR',
          placement: position,
        };
      }
    }
    
    // Priority 3: Image Ads (check placement rules and frequency)
    const imageCampaigns = await getActiveCampaigns(firestore, 'IMAGE');
    
    for (const campaign of imageCampaigns) {
      const rules = await getPlacementRules(firestore, campaign.id, position);
      
      for (const rule of rules) {
        // Check if rule applies to this game
        if (rule.applicableGames && gameId && !rule.applicableGames.includes(gameId)) {
          continue;
        }
        
        // Check frequency rules
        if (await this.checkFrequencyRule(rule, userId, userStats)) {
          const creatives = await getAdCreatives(firestore, campaign.id);
          if (creatives.length > 0) {
            // Rotate: pick first for now (can enhance with rotation)
            return {
              show: true,
              ad: creatives[0],
              type: 'IMAGE',
              placement: position,
            };
          }
        }
      }
    }
    
    return {
      show: false,
      placement: position,
      reason: 'No ads available for this position',
    };
  }
  
  /**
   * Check if frequency rule allows showing ad
   */
  private static async checkFrequencyRule(
    rule: AdPlacementRule,
    userId: string,
    userStats?: {
      predictionsCount?: number;
      gamesPlayed?: number;
      lastAdShown?: Date;
    }
  ): Promise<boolean> {
    if (!userStats) return true; // Default: allow if no stats
    
    switch (rule.frequencyType) {
      case 'ONCE_PER_SESSION':
        // Check session (simplified: check if shown today)
        if (userStats.lastAdShown) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return userStats.lastAdShown < today;
        }
        return true;
        
      case 'AFTER_N_PREDICTIONS':
        if (!rule.frequencyValue) return true;
        return (userStats.predictionsCount || 0) >= rule.frequencyValue;
        
      case 'AFTER_N_GAMES':
        if (!rule.frequencyValue) return true;
        return (userStats.gamesPlayed || 0) >= rule.frequencyValue;
        
      case 'ONCE_PER_DAY':
        if (userStats.lastAdShown) {
          const now = new Date();
          const lastShown = userStats.lastAdShown;
          const diffHours = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60);
          return diffHours >= 24;
        }
        return true;
        
      case 'CAMPAIGN_DATES_ONLY':
        // Already filtered by active campaigns
        return true;
        
      default:
        return true;
    }
  }
}

// ============================================================================
// TRACKING SERVICES
// ============================================================================

export async function recordImpression(
  firestore: Firestore,
  impression: Omit<AdImpression, 'id' | 'timestamp'>
): Promise<string> {
  const impressionData = {
    ...impression,
    timestamp: serverTimestamp(),
  };
  const docRef = await addDoc(collection(firestore, 'ad_impressions'), impressionData);
  return docRef.id;
}

export async function recordClick(
  firestore: Firestore,
  click: Omit<AdClick, 'id' | 'timestamp'>
): Promise<string> {
  const clickData = {
    ...click,
    timestamp: serverTimestamp(),
  };
  const docRef = await addDoc(collection(firestore, 'ad_clicks'), clickData);
  return docRef.id;
}

export async function getAdStats(
  firestore: Firestore,
  adId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate
}> {
  let impressionsQuery: Query = query(
    collection(firestore, 'ad_impressions'),
    where('adId', '==', adId)
  );
  
  let clicksQuery: Query = query(
    collection(firestore, 'ad_clicks'),
    where('adId', '==', adId)
  );
  
  if (startDate) {
    impressionsQuery = query(impressionsQuery, where('timestamp', '>=', Timestamp.fromDate(startDate)));
    clicksQuery = query(clicksQuery, where('timestamp', '>=', Timestamp.fromDate(startDate)));
  }
  
  if (endDate) {
    impressionsQuery = query(impressionsQuery, where('timestamp', '<=', Timestamp.fromDate(endDate)));
    clicksQuery = query(clicksQuery, where('timestamp', '<=', Timestamp.fromDate(endDate)));
  }
  
  const impressionsSnapshot = await getDocs(impressionsQuery);
  const clicksSnapshot = await getDocs(clicksQuery);
  
  const impressions = impressionsSnapshot.size;
  const clicks = clicksSnapshot.size;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  
  return { impressions, clicks, ctr };
}

