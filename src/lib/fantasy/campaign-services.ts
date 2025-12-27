/**
 * Fantasy Campaign Services
 * 
 * Handles CRUD operations for fantasy campaigns
 */

import type { Firestore } from 'firebase/firestore';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { FantasyCampaign, CampaignStatus, CampaignType } from './campaign-types';

// ============================================================================
// CAMPAIGN SERVICES
// ============================================================================

export async function createFantasyCampaign(
  firestore: Firestore,
  campaign: Omit<FantasyCampaign, 'id' | 'createdAt' | 'updatedAt' | 'totalParticipants' | 'totalEntries'>
): Promise<string> {
  // Filter out undefined values
  const cleanedCampaign = Object.fromEntries(
    Object.entries(campaign).filter(([_, value]) => value !== undefined)
  ) as Omit<FantasyCampaign, 'id' | 'createdAt' | 'updatedAt' | 'totalParticipants' | 'totalEntries'>;
  
  const campaignData = {
    ...cleanedCampaign,
    totalParticipants: 0,
    totalEntries: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(firestore, 'fantasy_campaigns'), campaignData);
  return docRef.id;
}

export async function getFantasyCampaign(
  firestore: Firestore,
  campaignId: string
): Promise<FantasyCampaign | null> {
  const docRef = doc(firestore, 'fantasy_campaigns', campaignId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as FantasyCampaign;
}

export async function getAllFantasyCampaigns(
  firestore: Firestore
): Promise<FantasyCampaign[]> {
  try {
    const snapshot = await getDocs(
      query(
        collection(firestore, 'fantasy_campaigns'),
        orderBy('createdAt', 'desc')
      )
    );
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FantasyCampaign[];
  } catch (error: any) {
    // If collection doesn't exist or query fails, return empty array
    console.error('Error loading fantasy campaigns:', error);
    // Check if it's a missing index error
    if (error?.code === 'failed-precondition') {
      console.warn('Firestore index may be missing for fantasy_campaigns. Please create the index.');
    }
    return [];
  }
}

export async function getActiveFantasyCampaigns(
  firestore: Firestore
): Promise<FantasyCampaign[]> {
  try {
    const snapshot = await getDocs(
      query(
        collection(firestore, 'fantasy_campaigns'),
        where('status', 'in', ['upcoming', 'active']),
        orderBy('startDate', 'desc')
      )
    );
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FantasyCampaign[];
  } catch (error: any) {
    // If collection doesn't exist or query fails, return empty array
    console.error('Error loading active fantasy campaigns:', error);
    // Check if it's a missing index error
    if (error?.code === 'failed-precondition') {
      console.warn('Firestore index may be missing for fantasy_campaigns. Please create the index.');
    }
    return [];
  }
}

export async function updateFantasyCampaign(
  firestore: Firestore,
  campaignId: string,
  updates: Partial<FantasyCampaign>
): Promise<void> {
  // Filter out undefined values
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  ) as Partial<FantasyCampaign>;
  
  await updateDoc(doc(firestore, 'fantasy_campaigns', campaignId), {
    ...cleanedUpdates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFantasyCampaign(
  firestore: Firestore,
  campaignId: string
): Promise<void> {
  await deleteDoc(doc(firestore, 'fantasy_campaigns', campaignId));
}

