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
  UserPrediction,
  FantasyResult,
  UserWallet,
  CoinTransaction,
  UserBadge,
  Leaderboard,
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
  const gameData = {
    ...game,
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
  await updateDoc(doc(firestore, 'fantasy_games', gameId), {
    ...updates,
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
    where('gameId', '==', gameId),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FantasyQuestion[];
}

export async function createFantasyQuestion(
  firestore: Firestore,
  question: Omit<FantasyQuestion, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const questionData = {
    ...question,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(firestore, 'fantasy_questions'), questionData);
  return docRef.id;
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
  const predictionData = {
    ...prediction,
    submittedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(firestore, 'user_predictions'), predictionData);
  return docRef.id;
}

export async function updateUserPrediction(
  firestore: Firestore,
  predictionId: string,
  updates: Partial<UserPrediction>
): Promise<void> {
  await updateDoc(doc(firestore, 'user_predictions', predictionId), updates);
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

