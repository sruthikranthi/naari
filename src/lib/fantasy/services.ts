/**
 * Naari Fantasy Zone - Firebase Services
 * 
 * Service functions for CRUD operations on fantasy collections.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  type Firestore,
  type Query,
} from 'firebase/firestore';
import type {
  FantasyGame,
  FantasyQuestion,
  FantasyEvent,
  UserPrediction,
  FantasyResult,
  UserWallet,
  CoinTransaction,
  UserBadge,
  Leaderboard,
  RedeemableItem,
  UserRedemption,
  RedemptionStatus,
} from './types';

// ============================================================================
// FANTASY GAMES
// ============================================================================

export async function getFantasyGame(
  firestore: Firestore,
  gameId: string
): Promise<FantasyGame | null> {
  const gameDoc = await getDoc(doc(firestore, 'fantasy_games', gameId));
  if (!gameDoc.exists()) return null;
  return { id: gameDoc.id, ...gameDoc.data() } as FantasyGame;
}

export async function getActiveFantasyGames(
  firestore: Firestore,
  category?: string
): Promise<FantasyGame[]> {
  let q: Query = query(
    collection(firestore, 'fantasy_games'),
    where('status', '==', 'active'),
    orderBy('startTime', 'desc')
  );
  
  if (category) {
    q = query(q, where('category', '==', category));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FantasyGame[];
}

export async function createFantasyGame(
  firestore: Firestore,
  game: Omit<FantasyGame, 'id' | 'createdAt' | 'updatedAt' | 'totalParticipants' | 'totalPredictions'>
): Promise<string> {
  // Filter out undefined values (Firestore doesn't allow undefined)
  const cleanedGame = Object.fromEntries(
    Object.entries(game).filter(([_, value]) => value !== undefined)
  ) as Omit<FantasyGame, 'id' | 'createdAt' | 'updatedAt' | 'totalParticipants' | 'totalPredictions'>;
  
  const gameData = {
    ...cleanedGame,
    totalParticipants: 0,
    totalPredictions: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(firestore, 'fantasy_games'), gameData);
  return docRef.id;
}

export async function updateFantasyGame(
  firestore: Firestore,
  gameId: string,
  updates: Partial<FantasyGame>
): Promise<void> {
  // Filter out undefined values (Firestore doesn't allow undefined)
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  ) as Partial<FantasyGame>;
  await updateDoc(doc(firestore, 'fantasy_games', gameId), {
    ...cleanedUpdates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFantasyGame(
  firestore: Firestore,
  gameId: string
): Promise<void> {
  await deleteDoc(doc(firestore, 'fantasy_games', gameId));
}

export async function getAllFantasyGames(
  firestore: Firestore
): Promise<FantasyGame[]> {
  const snapshot = await getDocs(
    query(
      collection(firestore, 'fantasy_games'),
      orderBy('createdAt', 'desc')
    )
  );
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FantasyGame[];
}

// ============================================================================
// FANTASY QUESTIONS
// ============================================================================

export async function getFantasyQuestions(
  firestore: Firestore,
  gameId: string
): Promise<FantasyQuestion[]> {
  const q = query(
    collection(firestore, 'fantasy_questions'),
    where('gameId', '==', gameId)
  );
  const snapshot = await getDocs(q);
  const questions = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FantasyQuestion[];
  
  // Sort by order if available, otherwise by createdAt
  questions.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return 0;
  });
  
  return questions;
}

export async function createFantasyQuestion(
  firestore: Firestore,
  question: Omit<FantasyQuestion, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  // Filter out undefined values (Firestore doesn't allow undefined)
  // Clean arrays to remove undefined/null elements
  const cleanedQuestion: any = {};
  
  for (const [key, value] of Object.entries(question)) {
    if (value === undefined) {
      // Skip undefined values entirely
      continue;
    }
    
    if (Array.isArray(value)) {
      // Filter out undefined/null/empty string elements from arrays
      const cleanedArray = value.filter(item => item !== undefined && item !== null && item !== '');
      // Include array if it has elements (empty arrays are valid in Firestore, but we skip for options)
      if (key === 'options') {
        // For options, only include if it has valid elements
        if (cleanedArray.length > 0) {
          cleanedQuestion[key] = cleanedArray;
        }
      } else {
        // For other arrays, include even if empty
        cleanedQuestion[key] = cleanedArray;
      }
    } else {
      cleanedQuestion[key] = value;
    }
  }
  
  const questionData = {
    ...cleanedQuestion,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(firestore, 'fantasy_questions'), questionData);
  return docRef.id;
}

export async function updateFantasyQuestion(
  firestore: Firestore,
  questionId: string,
  updates: Partial<FantasyQuestion>
): Promise<void> {
  // Filter out undefined values (Firestore doesn't allow undefined)
  const cleanedUpdates: any = {};
  
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      continue;
    }
    
    if (Array.isArray(value)) {
      const cleanedArray = value.filter(item => item !== undefined && item !== null && item !== '');
      if (key === 'options') {
        if (cleanedArray.length > 0) {
          cleanedUpdates[key] = cleanedArray;
        }
      } else {
        cleanedUpdates[key] = cleanedArray;
      }
    } else {
      cleanedUpdates[key] = value;
    }
  }
  
  await updateDoc(doc(firestore, 'fantasy_questions', questionId), {
    ...cleanedUpdates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFantasyQuestion(
  firestore: Firestore,
  questionId: string
): Promise<void> {
  await deleteDoc(doc(firestore, 'fantasy_questions', questionId));
}

// Get questions by game with filtering
export async function getFantasyQuestionsByGame(
  firestore: Firestore,
  gameId: string,
  options?: {
    isActive?: boolean;
    tags?: string[];
    source?: string;
    difficulty?: string;
    limit?: number;
  }
): Promise<FantasyQuestion[]> {
  let q: Query = query(
    collection(firestore, 'fantasy_questions'),
    where('gameId', '==', gameId)
  );

  if (options?.isActive !== undefined) {
    q = query(q, where('isActive', '==', options.isActive));
  }

  if (options?.source) {
    q = query(q, where('source', '==', options.source));
  }

  if (options?.difficulty) {
    q = query(q, where('difficulty', '==', options.difficulty));
  }

  if (options?.limit) {
    q = query(q, limit(options.limit));
  }

  const snapshot = await getDocs(q);
  let questions = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FantasyQuestion[];

  // Filter by tags if provided (client-side since Firestore doesn't support array-contains-any easily)
  if (options?.tags && options.tags.length > 0) {
    questions = questions.filter((q) => {
      if (!q.tags || q.tags.length === 0) return false;
      return options.tags!.some((tag) => q.tags!.includes(tag));
    });
  }

  // Sort by order if available, otherwise by createdAt
  questions.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return 0;
  });

  return questions;
}

// ============================================================================
// FANTASY EVENTS
// ============================================================================

export async function createFantasyEvent(
  firestore: Firestore,
  event: Omit<FantasyEvent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const eventData = {
    ...event,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(firestore, 'fantasy_events'), eventData);
  return docRef.id;
}

export async function getFantasyEvent(
  firestore: Firestore,
  eventId: string
): Promise<FantasyEvent | null> {
  const eventDoc = await getDoc(doc(firestore, 'fantasy_events', eventId));
  if (!eventDoc.exists()) return null;
  return { id: eventDoc.id, ...eventDoc.data() } as FantasyEvent;
}

export async function getFantasyEventsByGame(
  firestore: Firestore,
  gameId: string
): Promise<FantasyEvent[]> {
  const q = query(
    collection(firestore, 'fantasy_events'),
    where('gameId', '==', gameId),
    orderBy('startTime', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FantasyEvent[];
}

export async function getActiveFantasyEvents(
  firestore: Firestore,
  gameId?: string
): Promise<FantasyEvent[]> {
  const now = Timestamp.now();
  let q: Query = query(
    collection(firestore, 'fantasy_events'),
    where('isActive', '==', true),
    where('startTime', '<=', now),
    where('endTime', '>=', now)
  );

  if (gameId) {
    q = query(q, where('gameId', '==', gameId));
  }

  q = query(q, orderBy('startTime', 'asc'));

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FantasyEvent[];
  } catch (error: any) {
    // Handle missing index gracefully
    if (error.code === 9) {
      console.warn('Firestore index missing for active events query. Returning empty array.');
      return [];
    }
    throw error;
  }
}

export async function updateFantasyEvent(
  firestore: Firestore,
  eventId: string,
  updates: Partial<FantasyEvent>
): Promise<void> {
  await updateDoc(doc(firestore, 'fantasy_events', eventId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFantasyEvent(
  firestore: Firestore,
  eventId: string
): Promise<void> {
  await deleteDoc(doc(firestore, 'fantasy_events', eventId));
}

// ============================================================================
// USER PREDICTIONS
// ============================================================================

export async function getUserPredictions(
  firestore: Firestore,
  userId: string,
  gameId?: string
): Promise<UserPrediction[]> {
  let q: Query = query(
    collection(firestore, 'user_predictions'),
    where('userId', '==', userId),
    orderBy('submittedAt', 'desc')
  );
  
  if (gameId) {
    q = query(q, where('gameId', '==', gameId));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as UserPrediction[];
}

export async function createUserPrediction(
  firestore: Firestore,
  prediction: Omit<UserPrediction, 'id' | 'submittedAt'>
): Promise<string> {
  // Filter out undefined values - Firestore doesn't allow them
  const predictionData: Record<string, any> = {
    gameId: prediction.gameId,
    questionId: prediction.questionId,
    userId: prediction.userId,
    prediction: prediction.prediction,
    submittedAt: serverTimestamp(),
  };
  
  // Only include optional fields if they are defined
  if (prediction.rangeMin !== undefined) {
    predictionData.rangeMin = prediction.rangeMin;
  }
  if (prediction.rangeMax !== undefined) {
    predictionData.rangeMax = prediction.rangeMax;
  }
  
  const docRef = await addDoc(collection(firestore, 'user_predictions'), predictionData);
  return docRef.id;
}

export async function updateUserPrediction(
  firestore: Firestore,
  predictionId: string,
  updates: Partial<UserPrediction>
): Promise<void> {
  // Filter out undefined values - Firestore doesn't allow them
  const updateData: Record<string, any> = {};
  
  // Only include fields that are defined
  if (updates.prediction !== undefined) {
    updateData.prediction = updates.prediction;
  }
  if (updates.rangeMin !== undefined) {
    updateData.rangeMin = updates.rangeMin;
  }
  if (updates.rangeMax !== undefined) {
    updateData.rangeMax = updates.rangeMax;
  }
  if (updates.pointsEarned !== undefined) {
    updateData.pointsEarned = updates.pointsEarned;
  }
  if (updates.isCorrect !== undefined) {
    updateData.isCorrect = updates.isCorrect;
  }
  if (updates.scoredAt !== undefined) {
    updateData.scoredAt = updates.scoredAt;
  }
  
  await updateDoc(doc(firestore, 'user_predictions', predictionId), updateData);
}

// ============================================================================
// FANTASY RESULTS
// ============================================================================

export async function getFantasyResults(
  firestore: Firestore,
  gameId: string
): Promise<FantasyResult[]> {
  const q = query(
    collection(firestore, 'fantasy_results'),
    where('gameId', '==', gameId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FantasyResult[];
}

export async function createFantasyResult(
  firestore: Firestore,
  result: Omit<FantasyResult, 'id' | 'declaredAt'>
): Promise<string> {
  const resultData = {
    ...result,
    declaredAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(firestore, 'fantasy_results'), resultData);
  return docRef.id;
}

// ============================================================================
// USER WALLET (COINS)
// ============================================================================

export async function getUserWallet(
  firestore: Firestore,
  userId: string
): Promise<UserWallet | null> {
  const walletRef = doc(firestore, 'user_wallets', userId);
  const walletDoc = await getDoc(walletRef);
  if (!walletDoc.exists()) {
    // Create default wallet if doesn't exist
    const defaultWallet: UserWallet = {
      id: userId,
      userId,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      lastUpdated: serverTimestamp(),
    };
    await setDoc(walletRef, defaultWallet);
    return defaultWallet;
  }
  return { id: walletDoc.id, ...walletDoc.data() } as UserWallet;
}

export async function updateUserWallet(
  firestore: Firestore,
  userId: string,
  updates: Partial<UserWallet>
): Promise<void> {
  await updateDoc(doc(firestore, 'user_wallets', userId), {
    ...updates,
    lastUpdated: serverTimestamp(),
  });
}

export async function addCoinTransaction(
  firestore: Firestore,
  transaction: Omit<CoinTransaction, 'id' | 'createdAt'>
): Promise<string> {
  const transactionData = {
    ...transaction,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(firestore, 'coin_transactions'), transactionData);
  
  // Update wallet balance
  const wallet = await getUserWallet(firestore, transaction.userId);
  if (wallet) {
    await updateUserWallet(firestore, transaction.userId, {
      balance: wallet.balance + transaction.amount,
      totalEarned: transaction.amount > 0 
        ? wallet.totalEarned + transaction.amount 
        : wallet.totalEarned,
      totalSpent: transaction.amount < 0 
        ? wallet.totalSpent + Math.abs(transaction.amount) 
        : wallet.totalSpent,
    });
  }
  
  return docRef.id;
}

export async function getCoinTransactions(
  firestore: Firestore,
  userId: string,
  limitCount?: number
): Promise<CoinTransaction[]> {
  let q: Query = query(
    collection(firestore, 'coin_transactions'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  if (limitCount) {
    q = query(q, limit(limitCount));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CoinTransaction[];
}

// ============================================================================
// USER BADGES
// ============================================================================

export async function getUserBadges(
  firestore: Firestore,
  userId: string
): Promise<UserBadge[]> {
  const q = query(
    collection(firestore, 'user_badges'),
    where('userId', '==', userId),
    orderBy('earnedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as UserBadge[];
}

export async function createUserBadge(
  firestore: Firestore,
  badge: Omit<UserBadge, 'id' | 'earnedAt'>
): Promise<string> {
  const badgeData = {
    ...badge,
    earnedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(firestore, 'user_badges'), badgeData);
  return docRef.id;
}

export async function awardBadge(
  firestore: Firestore,
  userId: string,
  badgeType: string
): Promise<string> {
  const { BADGE_DEFINITIONS } = await import('./constants');
  const badgeDef = BADGE_DEFINITIONS[badgeType as keyof typeof BADGE_DEFINITIONS];
  
  if (!badgeDef) {
    throw new Error(`Badge type ${badgeType} not found`);
  }

  return await createUserBadge(firestore, {
    userId,
    badgeType: badgeType as any,
    badgeName: badgeDef.name,
    badgeDescription: badgeDef.description,
    badgeIcon: badgeDef.icon,
  });
}

// ============================================================================
// REDEEMABLE ITEMS (REWARDS CATALOG)
// ============================================================================

export async function createRedeemableItem(
  firestore: Firestore,
  item: Omit<RedeemableItem, 'id' | 'createdAt' | 'updatedAt'> & { createdBy?: string }
): Promise<string> {
  const itemData = {
    ...item,
    createdBy: item.createdBy || 'system',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(firestore, 'redeemable_items'), itemData);
  return docRef.id;
}

export async function updateRedeemableItem(
  firestore: Firestore,
  itemId: string,
  updates: Partial<Omit<RedeemableItem, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  const updateData = {
    ...updates,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(doc(firestore, 'redeemable_items', itemId), updateData);
}

export async function deleteRedeemableItem(
  firestore: Firestore,
  itemId: string
): Promise<void> {
  await deleteDoc(doc(firestore, 'redeemable_items', itemId));
}

export async function getRedeemableItems(
  firestore: Firestore,
  options?: { activeOnly?: boolean; category?: string }
): Promise<RedeemableItem[]> {
  try {
    let q: Query;
    
    // Build query based on filters
    if (options?.activeOnly && options?.category) {
      // Both filters - need composite index
      q = query(
        collection(firestore, 'redeemable_items'),
        where('isActive', '==', true),
        where('category', '==', options.category),
        orderBy('priority', 'desc')
      );
    } else if (options?.activeOnly) {
      // Only active filter
      q = query(
        collection(firestore, 'redeemable_items'),
        where('isActive', '==', true),
        orderBy('priority', 'desc')
      );
    } else if (options?.category) {
      // Only category filter
      q = query(
        collection(firestore, 'redeemable_items'),
        where('category', '==', options.category),
        orderBy('priority', 'desc')
      );
    } else {
      // No filters - just order by priority
      q = query(
        collection(firestore, 'redeemable_items'),
        orderBy('priority', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RedeemableItem[];
    
    // Sort by createdAt if we have it (client-side fallback)
    return items.sort((a, b) => {
      const aTime = a.createdAt instanceof Date 
        ? a.createdAt.getTime()
        : (a.createdAt as any)?.toDate?.()?.getTime() || 0;
      const bTime = b.createdAt instanceof Date 
        ? b.createdAt.getTime()
        : (b.createdAt as any)?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });
  } catch (error: any) {
    // If query fails (e.g., missing index), try simpler query
    if (error.code === 9 || error.code === 'failed-precondition') {
      console.warn('Firestore index missing for redeemable_items query. Using simpler query.');
      try {
        let q: Query;
        
        if (options?.activeOnly) {
          // Use where clause + orderBy to satisfy rules
          q = query(
            collection(firestore, 'redeemable_items'),
            where('isActive', '==', true),
            orderBy('priority', 'desc')
          );
        } else {
          // Use orderBy to satisfy rules (must have orderBy, where, or limit)
          q = query(
            collection(firestore, 'redeemable_items'),
            orderBy('priority', 'desc')
          );
        }
        
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as RedeemableItem[];
        
        // Client-side sorting for category filter if needed
        let filteredItems = items;
        if (options?.category) {
          filteredItems = items.filter(item => item.category === options.category);
        }
        
        // Client-side sorting
        return filteredItems.sort((a, b) => {
          const aPriority = a.priority || 0;
          const bPriority = b.priority || 0;
          if (bPriority !== aPriority) return bPriority - aPriority;
          
          const aTime = a.createdAt instanceof Date 
            ? a.createdAt.getTime()
            : (a.createdAt as any)?.toDate?.()?.getTime() || 0;
          const bTime = b.createdAt instanceof Date 
            ? b.createdAt.getTime()
            : (b.createdAt as any)?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        });
      } catch (fallbackError) {
        console.error('Error loading redeemable items (fallback):', fallbackError);
        throw fallbackError;
      }
    }
    console.error('Error loading redeemable items:', error);
    throw error;
  }
}

export async function getRedeemableItem(
  firestore: Firestore,
  itemId: string
): Promise<RedeemableItem | null> {
  const docRef = doc(firestore, 'redeemable_items', itemId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  return { id: docSnap.id, ...docSnap.data() } as RedeemableItem;
}

// ============================================================================
// USER REDEMPTIONS
// ============================================================================

export async function redeemItem(
  firestore: Firestore,
  userId: string,
  itemId: string
): Promise<{ success: boolean; redemptionId?: string; error?: string }> {
  try {
    // Get item
    const item = await getRedeemableItem(firestore, itemId);
    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    if (!item.isActive) {
      return { success: false, error: 'Item is not available' };
    }

    // Check stock
    if (item.stock !== undefined && item.stock <= 0) {
      return { success: false, error: 'Item is out of stock' };
    }

    // Get user wallet
    const wallet = await getUserWallet(firestore, userId);
    if (!wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    if (wallet.balance < item.coinCost) {
      return { success: false, error: `Insufficient coins. Need ${item.coinCost} coins.` };
    }

    // Create redemption
    const expiryDate = item.expiryDays
      ? Timestamp.fromDate(new Date(Date.now() + item.expiryDays * 24 * 60 * 60 * 1000))
      : undefined;

    const redemptionData: Omit<UserRedemption, 'id'> = {
      userId,
      itemId,
      itemName: item.name,
      coinCost: item.coinCost,
      status: 'pending',
      redeemedAt: serverTimestamp(),
      expiryDate,
      metadata: {},
    };

    const redemptionRef = await addDoc(collection(firestore, 'user_redemptions'), redemptionData);

    // Deduct coins
    await addCoinTransaction(firestore, {
      userId,
      type: 'redemption',
      amount: -item.coinCost,
      description: `Redeemed: ${item.name}`,
      metadata: { itemId, redemptionId: redemptionRef.id },
    });

    // Update stock if limited
    if (item.stock !== undefined) {
      await updateRedeemableItem(firestore, itemId, {
        stock: item.stock - 1,
      });
    }

    return { success: true, redemptionId: redemptionRef.id };
  } catch (error: any) {
    console.error('Error redeeming item:', error);
    return { success: false, error: error.message || 'Failed to redeem item' };
  }
}

export async function getUserRedemptions(
  firestore: Firestore,
  userId: string
): Promise<UserRedemption[]> {
  const q = query(
    collection(firestore, 'user_redemptions'),
    where('userId', '==', userId),
    orderBy('redeemedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as UserRedemption[];
}

export async function updateRedemptionStatus(
  firestore: Firestore,
  redemptionId: string,
  status: RedemptionStatus,
  voucherCode?: string,
  notes?: string
): Promise<void> {
  const updateData: Partial<UserRedemption> = {
    status,
  };

  if (status === 'fulfilled') {
    updateData.fulfilledAt = serverTimestamp();
  }

  if (voucherCode) {
    updateData.voucherCode = voucherCode;
  }

  if (notes) {
    updateData.notes = notes;
  }

  await updateDoc(doc(firestore, 'user_redemptions', redemptionId), updateData);
}

export async function getAllRedemptions(
  firestore: Firestore,
  options?: { status?: RedemptionStatus; limit?: number }
): Promise<UserRedemption[]> {
  let q: Query = query(
    collection(firestore, 'user_redemptions'),
    orderBy('redeemedAt', 'desc')
  );

  if (options?.status) {
    q = query(q, where('status', '==', options.status));
  }

  if (options?.limit) {
    q = query(q, limit(options.limit));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as UserRedemption[];
}

export async function updateUserWalletBalance(
  firestore: Firestore,
  userId: string,
  amount: number,
  type: CoinTransaction['type'],
  description: string
): Promise<void> {
  await addCoinTransaction(firestore, {
    userId,
    type,
    amount,
    description,
  });
}

// ============================================================================
// LEADERBOARDS
// ============================================================================

export async function getLeaderboard(
  firestore: Firestore,
  period: string,
  gameType?: string,
  category?: string
): Promise<Leaderboard | null> {
  let q: Query = query(
    collection(firestore, 'leaderboards'),
    where('period', '==', period)
  );
  
  if (gameType) {
    q = query(q, where('gameType', '==', gameType));
  }
  if (category) {
    q = query(q, where('category', '==', category));
  }
  
  q = query(q, orderBy('generatedAt', 'desc'), limit(1));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Leaderboard;
}

export async function createLeaderboard(
  firestore: Firestore,
  leaderboard: Omit<Leaderboard, 'id' | 'generatedAt'>
): Promise<string> {
  const leaderboardData = {
    ...leaderboard,
    generatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(firestore, 'leaderboards'), leaderboardData);
  return docRef.id;
}

