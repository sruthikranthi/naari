/**
 * Conversion Tracking System
 * 
 * Tracks various conversion events:
 * - Purchase
 * - Signup
 * - Download
 * - Click-through
 * - View
 * - Engagement
 */

import type { Firestore } from 'firebase/firestore';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import type { ConversionEvent } from './types';

/**
 * Record a conversion event
 */
export async function recordConversion(
  firestore: Firestore,
  conversion: Omit<ConversionEvent, 'id' | 'timestamp'>
): Promise<string> {
  const conversionData = {
    ...conversion,
    timestamp: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(firestore, 'ad_conversions'), conversionData);
  return docRef.id;
}

/**
 * Get conversion events for an ad
 */
export async function getAdConversions(
  firestore: Firestore,
  adId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ConversionEvent[]> {
  let q = query(
    collection(firestore, 'ad_conversions'),
    where('adId', '==', adId)
  );
  
  if (startDate) {
    q = query(q, where('timestamp', '>=', Timestamp.fromDate(startDate)));
  }
  
  if (endDate) {
    q = query(q, where('timestamp', '<=', Timestamp.fromDate(endDate)));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as ConversionEvent[];
}

/**
 * Get conversion rate for an ad
 */
export async function getConversionRate(
  firestore: Firestore,
  adId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  conversions: number;
  clicks: number;
  conversionRate: number;
  totalValue: number;
}> {
  const conversions = await getAdConversions(firestore, adId, startDate, endDate);
  
  // Get clicks for same period
  let clicksQuery = query(
    collection(firestore, 'ad_clicks'),
    where('adId', '==', adId)
  );
  
  if (startDate) {
    clicksQuery = query(clicksQuery, where('timestamp', '>=', Timestamp.fromDate(startDate)));
  }
  
  if (endDate) {
    clicksQuery = query(clicksQuery, where('timestamp', '<=', Timestamp.fromDate(endDate)));
  }
  
  const clicksSnapshot = await getDocs(clicksQuery);
  const clicks = clicksSnapshot.size;
  
  const conversionRate = clicks > 0 ? (conversions.length / clicks) * 100 : 0;
  const totalValue = conversions.reduce((sum, c) => sum + (c.value || 0), 0);
  
  return {
    conversions: conversions.length,
    clicks,
    conversionRate,
    totalValue,
  };
}

/**
 * Track purchase conversion
 */
export async function trackPurchase(
  firestore: Firestore,
  adId: string,
  campaignId: string,
  userId: string,
  value: number,
  metadata?: Record<string, any>
): Promise<string> {
  return recordConversion(firestore, {
    adId,
    campaignId,
    userId,
    eventType: 'PURCHASE',
    value,
    metadata,
  });
}

/**
 * Track signup conversion
 */
export async function trackSignup(
  firestore: Firestore,
  adId: string,
  campaignId: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<string> {
  return recordConversion(firestore, {
    adId,
    campaignId,
    userId,
    eventType: 'SIGNUP',
    metadata,
  });
}

/**
 * Track engagement conversion (e.g., video watch, time spent)
 */
export async function trackEngagement(
  firestore: Firestore,
  adId: string,
  campaignId: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<string> {
  return recordConversion(firestore, {
    adId,
    campaignId,
    userId,
    eventType: 'ENGAGEMENT',
    metadata,
  });
}

