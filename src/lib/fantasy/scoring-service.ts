/**
 * Naari Fantasy Zone - Scoring Service
 * 
 * Handles automatic scoring calculation after results are declared.
 */

import type { Firestore } from 'firebase/firestore';
import { Timestamp, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import {
  getFantasyResults,
  getUserPredictions,
  updateUserPrediction,
  getFantasyQuestions,
  getFantasyGame,
  updateFantasyGame,
  createLeaderboard,
  getUserBadges as getUserBadgesService,
} from './services';
import { FantasyScoringEngine } from './engine';
import type { FantasyResult, UserPrediction, FantasyQuestion, FantasyGame } from './types';
import { addCoinTransaction, getUserWallet, createUserBadge, getUserBadges as getUserBadgesFromServices } from './services';
import { COIN_REWARDS, BADGE_DEFINITIONS } from './constants';
import type { BadgeType } from './types';

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate and update scores for all predictions in a game
 */
export async function calculateGameScores(
  firestore: Firestore,
  gameId: string
): Promise<{
  totalPredictions: number;
  scoredPredictions: number;
  totalPointsAwarded: number;
}> {
  // Get game, questions, and results
  const game = await getFantasyGame(firestore, gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  const questions = await getFantasyQuestions(firestore, gameId);
  const results = await getFantasyResults(firestore, gameId);

  // Create a map of questionId -> result
  const resultMap = new Map<string, FantasyResult>();
  results.forEach((result) => {
    resultMap.set(result.questionId, result);
  });

  // Create a map of questionId -> question
  const questionMap = new Map<string, FantasyQuestion>();
  questions.forEach((question) => {
    questionMap.set(question.id, question);
  });

  // Get all predictions for this game
  const allPredictions = await getUserPredictions(firestore, '', gameId);
  
  let scoredCount = 0;
  let totalPoints = 0;

  // Score each prediction
  for (const prediction of allPredictions) {
    const question = questionMap.get(prediction.questionId);
    const result = resultMap.get(prediction.questionId);

    if (!question || !result) {
      continue; // Skip if question or result not found
    }

    // Calculate points
    const points = FantasyScoringEngine.calculatePoints(prediction, question, result);
    const isCorrect = points === question.exactMatchPoints;

    // Update prediction with score
    await updateUserPrediction(firestore, prediction.id, {
      pointsEarned: points,
      isCorrect,
      scoredAt: Timestamp.now(),
    });

    scoredCount++;
    totalPoints += points;

    // Award coins for wins
    if (points > 0) {
      const wallet = await getUserWallet(firestore, prediction.userId);
      if (wallet) {
        const bonusCoins = isCorrect 
          ? COIN_REWARDS.FANTASY_WIN_EXACT 
          : COIN_REWARDS.FANTASY_WIN_PARTIAL;

        await addCoinTransaction(firestore, {
          userId: prediction.userId,
          type: 'fantasy-win',
          amount: bonusCoins,
          description: `Bonus coins for ${isCorrect ? 'exact' : 'close'} prediction in ${game.title}`,
          metadata: { gameId },
        });
      }
    }
  }

  // Update game stats
  await updateFantasyGame(firestore, gameId, {
    totalPredictions: allPredictions.length,
  });

  return {
    totalPredictions: allPredictions.length,
    scoredPredictions: scoredCount,
    totalPointsAwarded: totalPoints,
  };
}

/**
 * Check and award badges based on game performance
 */
export async function checkAndAwardBadges(
  firestore: Firestore,
  userId: string,
  gameId: string,
  game: FantasyGame
): Promise<BadgeType[]> {
  const awardedBadges: BadgeType[] = [];

  // Get user's predictions for this game
  const userPredictions = await getUserPredictions(firestore, userId, gameId);
  const correctPredictions = userPredictions.filter((p) => p.isCorrect).length;
  const totalPredictions = userPredictions.length;
  const totalPoints = userPredictions.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);

  // Check for Gold Queen badge (gold price games)
  if (game.gameType === 'gold-ornament-price' && correctPredictions === totalPredictions && totalPredictions > 0) {
    const badgeType: BadgeType = 'gold-queen';
    const badgeDef = BADGE_DEFINITIONS[badgeType];
    
    await createUserBadge(firestore, {
      userId,
      badgeType,
      badgeName: badgeDef.name,
      badgeDescription: badgeDef.description,
      badgeIcon: badgeDef.icon,
      gameId,
      metadata: { gameType: game.gameType, correctPredictions, totalPredictions },
    });
    
    awardedBadges.push(badgeType);
  }

  // Check for Saree Sensei badge (saree price games)
  if (game.gameType === 'silk-saree-price' && correctPredictions === totalPredictions && totalPredictions > 0) {
    const badgeType: BadgeType = 'saree-sensei';
    const badgeDef = BADGE_DEFINITIONS[badgeType];
    
    await createUserBadge(firestore, {
      userId,
      badgeType,
      badgeName: badgeDef.name,
      badgeDescription: badgeDef.description,
      badgeIcon: badgeDef.icon,
      gameId,
      metadata: { gameType: game.gameType, correctPredictions, totalPredictions },
    });
    
    awardedBadges.push(badgeType);
  }

  // Check for Prediction Master badge (high accuracy across games)
  if (totalPoints >= 300 && correctPredictions >= 2) {
    const badgeType: BadgeType = 'prediction-master';
    const badgeDef = BADGE_DEFINITIONS[badgeType];
    
    // Check if user already has this badge
    const existingBadges = await getUserBadgesFromServices(firestore, userId);
    const hasBadge = existingBadges.some((b) => b.badgeType === badgeType);
    
    if (!hasBadge) {
      await createUserBadge(firestore, {
        userId,
        badgeType,
        badgeName: badgeDef.name,
        badgeDescription: badgeDef.description,
        badgeIcon: badgeDef.icon,
        gameId,
        metadata: { totalPoints, correctPredictions },
      });
      
      awardedBadges.push(badgeType);
    }
  }

  return awardedBadges;
}

/**
 * Generate leaderboard for a specific period and category
 */
export async function generateLeaderboard(
  firestore: Firestore,
  period: 'daily' | 'weekly' | 'monthly' | 'all-time',
  category?: string,
  gameType?: string
): Promise<string> {
  // Calculate time range based on period
  const now = Timestamp.now();
  let startTime: Timestamp;
  
  switch (period) {
    case 'daily':
      startTime = Timestamp.fromMillis(now.toMillis() - 24 * 60 * 60 * 1000);
      break;
    case 'weekly':
      startTime = Timestamp.fromMillis(now.toMillis() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      startTime = Timestamp.fromMillis(now.toMillis() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'all-time':
      startTime = Timestamp.fromMillis(0);
      break;
  }
  
  // Get all games within the time range and filters
  const gamesQuery = query(
    collection(firestore, 'fantasy_games'),
    where('status', '==', 'active')
  );
  const gamesSnapshot = await getDocs(gamesQuery);
  const allGames = gamesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
  
  // Filter games by category and gameType if provided
  let filteredGames = allGames.filter(game => {
    if (category && game.category !== category) return false;
    if (gameType && game.gameType !== gameType) return false;
    const gameStartTime = game.startTime?.toDate?.() || new Date(game.startTime);
    return gameStartTime >= startTime.toDate();
  });
  
  // Get all predictions for filtered games
  const predictionsQuery = query(
    collection(firestore, 'user_predictions'),
    where('submittedAt', '>=', startTime)
  );
  const predictionsSnapshot = await getDocs(predictionsQuery);
  const allPredictions = predictionsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as any[];
  
  // Filter predictions by game
  const gameIds = new Set(filteredGames.map(g => g.id));
  const relevantPredictions = allPredictions.filter(p => gameIds.has(p.gameId));
  
  // Aggregate stats by user
  const userStatsMap = new Map<string, {
    userId: string;
    totalPoints: number;
    gamesPlayed: Set<string>;
    gamesWon: Set<string>;
    predictions: any[];
  }>();
  
  for (const prediction of relevantPredictions) {
    if (!prediction.userId) continue;
    
    if (!userStatsMap.has(prediction.userId)) {
      userStatsMap.set(prediction.userId, {
        userId: prediction.userId,
        totalPoints: 0,
        gamesPlayed: new Set(),
        gamesWon: new Set(),
        predictions: [],
      });
    }
    
    const stats = userStatsMap.get(prediction.userId)!;
    stats.predictions.push(prediction);
    stats.gamesPlayed.add(prediction.gameId);
    stats.totalPoints += prediction.pointsEarned || 0;
    
    // Check if user won the game (has at least one correct prediction)
    if (prediction.isCorrect) {
      stats.gamesWon.add(prediction.gameId);
    }
  }
  
  // Get user profiles for names and avatars
  const userIds = Array.from(userStatsMap.keys());
  const userProfilesMap = new Map<string, { name: string; avatar: string }>();
  
  // Fetch user profiles in batches (Firestore 'in' query limit is 10)
  for (let i = 0; i < userIds.length; i += 10) {
    const batch = userIds.slice(i, i + 10);
    const usersQuery = query(
      collection(firestore, 'users'),
      where('id', 'in', batch)
    );
    const usersSnapshot = await getDocs(usersQuery);
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      userProfilesMap.set(userData.id, {
        name: userData.name || 'Anonymous User',
        avatar: userData.avatar || `https://picsum.photos/seed/${userData.id}/100/100`,
      });
    });
  }
  
  // Build leaderboard entries
  const entries: any[] = [];
  
  for (const [userId, stats] of userStatsMap.entries()) {
    const profile = userProfilesMap.get(userId) || {
      name: 'Anonymous User',
      avatar: `https://picsum.photos/seed/${userId}/100/100`,
    };
    
    // Get user badges
    const badges = await getUserBadgesService(firestore, userId);
    const badgeTypes = badges.map(b => b.badgeType);
    
    const gamesPlayedCount = stats.gamesPlayed.size;
    const gamesWonCount = stats.gamesWon.size;
    const winRate = gamesPlayedCount > 0 ? (gamesWonCount / gamesPlayedCount) * 100 : 0;
    
    entries.push({
      userId,
      userName: profile.name,
      userAvatar: profile.avatar,
      totalPoints: stats.totalPoints,
      gamesPlayed: gamesPlayedCount,
      gamesWon: gamesWonCount,
      winRate,
      badges: badgeTypes,
      lastUpdated: Timestamp.now(),
    });
  }
  
  // Sort by total points (descending) and assign ranks
  entries.sort((a, b) => b.totalPoints - a.totalPoints);
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  // Keep only top 100
  const topEntries = entries.slice(0, 100);
  
  // Calculate validUntil timestamp
  let validUntil: Timestamp;
  switch (period) {
    case 'daily':
      validUntil = Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000);
      break;
    case 'weekly':
      validUntil = Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      validUntil = Timestamp.fromMillis(now.toMillis() + 30 * 24 * 60 * 60 * 1000);
      break;
    case 'all-time':
      validUntil = Timestamp.fromMillis(now.toMillis() + 365 * 24 * 60 * 60 * 1000);
      break;
  }
  
  // Create leaderboard document
  const leaderboardId = await createLeaderboard(firestore, {
    period,
    gameType: gameType as any, // Type assertion needed due to optional parameter
    category: category as any, // Type assertion needed due to optional parameter
    entries: topEntries,
    validUntil,
  });
  
  return leaderboardId;
}

