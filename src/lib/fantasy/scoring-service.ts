/**
 * Naari Fantasy Zone - Scoring Service
 * 
 * Handles automatic scoring calculation after results are declared.
 */

import type { Firestore } from 'firebase/firestore';
import {
  getFantasyResults,
  getUserPredictions,
  updateUserPrediction,
  getFantasyQuestions,
  getFantasyGame,
  updateFantasyGame,
} from './services';
import { FantasyScoringEngine } from './engine';
import type { FantasyResult, UserPrediction, FantasyQuestion, FantasyGame } from './types';
import { addCoinTransaction, getUserWallet, createUserBadge, getUserBadges } from './services';
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
      scoredAt: new Date(),
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
          metadata: { gameId, questionId: question.id },
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
    const existingBadges = await getUserBadges(firestore, userId);
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
): Promise<void> {
  // Get all users with predictions
  // This is a simplified version - in production, you'd use aggregation queries
  
  // For now, we'll calculate from user predictions
  // In a real implementation, you'd want to use Cloud Functions for this
  
  // This is a placeholder - full implementation would require:
  // 1. Aggregating scores by user
  // 2. Calculating win rates
  // 3. Getting badge counts
  // 4. Ranking users
  // 5. Storing in leaderboard collection
  
  console.log(`Generating ${period} leaderboard for category: ${category}, gameType: ${gameType}`);
}

