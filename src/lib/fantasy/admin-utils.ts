/**
 * Naari Fantasy Zone - Admin Utilities
 * 
 * Helper functions for admins to create games and questions.
 * These can be used in the admin panel or via scripts.
 */

import type { Firestore } from 'firebase/firestore';
import { serverTimestamp, Timestamp } from 'firebase/firestore';
import {
  createFantasyGame,
  createFantasyQuestion,
  updateFantasyGame,
} from './services';
import type {
  FantasyGame,
  FantasyQuestion,
  FantasyGameType,
  PredictionType,
  FantasyCategory,
} from './types';
import { GAME_CONFIGURATIONS } from './engine';

// ============================================================================
// GAME CREATION HELPERS
// ============================================================================

/**
 * Create a price prediction game
 */
export async function createPricePredictionGame(
  firestore: Firestore,
  gameType: 'gold-ornament-price' | 'silk-saree-price' | 'makeup-beauty-price',
  options: {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    resultRevealTime: Date;
    entryCoins?: number;
    createdBy: string;
    imageUrl?: string;
    tags?: string[];
  }
): Promise<string> {
  const config = GAME_CONFIGURATIONS[gameType];
  
  const game: Omit<FantasyGame, 'id' | 'createdAt' | 'updatedAt' | 'totalParticipants' | 'totalPredictions'> = {
    title: options.title,
    description: options.description,
    category: 'price-prediction',
    gameType,
    status: 'active',
    startTime: Timestamp.fromDate(options.startTime),
    endTime: Timestamp.fromDate(options.endTime),
    resultRevealTime: Timestamp.fromDate(options.resultRevealTime),
    entryCoins: options.entryCoins || config.defaultEntryCoins,
    tags: options.tags || [gameType, 'price-prediction'],
    createdBy: options.createdBy,
    imageUrl: options.imageUrl,
  };

  return await createFantasyGame(firestore, game);
}

/**
 * Create a question for a game
 */
export async function createGameQuestion(
  firestore: Firestore,
  gameId: string,
  question: {
    question: string;
    predictionType: PredictionType;
    options?: string[];
    minValue?: number;
    maxValue?: number;
    unit?: string;
    exactMatchPoints?: number;
    nearRangePoints?: number;
    nearRangeTolerance?: number;
    order: number;
  }
): Promise<string> {
  const gameConfig = await getGameConfigForQuestion(firestore, gameId);
  
  const questionData: Omit<FantasyQuestion, 'id' | 'createdAt' | 'updatedAt'> = {
    gameId,
    question: question.question,
    predictionType: question.predictionType,
    options: question.options,
    minValue: question.minValue,
    maxValue: question.maxValue,
    unit: question.unit,
    exactMatchPoints: question.exactMatchPoints || gameConfig.defaultExactMatchPoints,
    nearRangePoints: question.nearRangePoints ?? gameConfig.defaultNearRangePoints,
    nearRangeTolerance: question.nearRangeTolerance ?? gameConfig.defaultNearRangeTolerance,
    order: question.order,
  };

  return await createFantasyQuestion(firestore, questionData);
}

async function getGameConfigForQuestion(
  firestore: Firestore,
  gameId: string
): Promise<typeof GAME_CONFIGURATIONS[keyof typeof GAME_CONFIGURATIONS]> {
  // In a real implementation, you'd fetch the game and get its config
  // For now, return a default config
  return GAME_CONFIGURATIONS['gold-ornament-price'];
}

// ============================================================================
// SAMPLE GAME CREATORS
// ============================================================================

/**
 * Create a sample Gold Ornament Price game
 */
export async function createSampleGoldPriceGame(
  firestore: Firestore,
  adminUserId: string
): Promise<string> {
  const now = new Date();
  const startTime = new Date(now);
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  const resultRevealTime = new Date(now.getTime() + 26 * 60 * 60 * 1000); // 26 hours

  const gameId = await createPricePredictionGame(firestore, 'gold-ornament-price', {
    title: 'Gold Ornament Price Prediction - Tomorrow',
    description: 'Predict tomorrow\'s gold ornament price per gram. Test your market intuition!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['gold', 'price', 'ornament', 'prediction'],
  });

  // Add questions
  await createGameQuestion(firestore, gameId, {
    question: 'Will the gold ornament price go up or down tomorrow?',
    predictionType: 'up-down',
    order: 1,
    exactMatchPoints: 100,
  });

  await createGameQuestion(firestore, gameId, {
    question: 'What will be the gold ornament price per gram tomorrow? (Range)',
    predictionType: 'range',
    minValue: 5000,
    maxValue: 7000,
    unit: '₹',
    order: 2,
    exactMatchPoints: 150,
    nearRangePoints: 75,
    nearRangeTolerance: 5, // 5% tolerance
  });

  return gameId;
}

/**
 * Create a sample Silk Saree Price game
 */
export async function createSampleSareePriceGame(
  firestore: Firestore,
  adminUserId: string
): Promise<string> {
  const now = new Date();
  const startTime = new Date(now);
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const resultRevealTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const gameId = await createPricePredictionGame(firestore, 'silk-saree-price', {
    title: 'Silk Saree Price Prediction - This Week',
    description: 'Predict the average price of a premium silk saree this week. Show your fashion market knowledge!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['saree', 'silk', 'price', 'fashion'],
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Will silk saree prices increase or decrease this week?',
    predictionType: 'up-down',
    order: 1,
    exactMatchPoints: 100,
  });

  await createGameQuestion(firestore, gameId, {
    question: 'What will be the average price range for a premium silk saree?',
    predictionType: 'range',
    minValue: 5000,
    maxValue: 50000,
    unit: '₹',
    order: 2,
    exactMatchPoints: 150,
    nearRangePoints: 75,
    nearRangeTolerance: 10,
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Which price range do you think will be most popular?',
    predictionType: 'multiple-choice',
    options: [
      '₹5,000 - ₹10,000',
      '₹10,000 - ₹20,000',
      '₹20,000 - ₹30,000',
      '₹30,000 - ₹40,000',
      '₹40,000+',
    ],
    order: 3,
    exactMatchPoints: 120,
  });

  return gameId;
}

/**
 * Create a sample Makeup & Beauty Price game
 */
export async function createSampleMakeupPriceGame(
  firestore: Firestore,
  adminUserId: string
): Promise<string> {
  const now = new Date();
  const startTime = new Date(now);
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const resultRevealTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const gameId = await createPricePredictionGame(firestore, 'makeup-beauty-price', {
    title: 'Makeup & Beauty Product Price Prediction',
    description: 'Predict the price trends for popular makeup and beauty products. Test your beauty market knowledge!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['makeup', 'beauty', 'price', 'cosmetics'],
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Will makeup product prices go up or down this month?',
    predictionType: 'up-down',
    order: 1,
    exactMatchPoints: 100,
  });

  await createGameQuestion(firestore, gameId, {
    question: 'What will be the average price of a premium lipstick?',
    predictionType: 'range',
    minValue: 200,
    maxValue: 3000,
    unit: '₹',
    order: 2,
    exactMatchPoints: 120,
    nearRangePoints: 60,
    nearRangeTolerance: 10,
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Which beauty product category will see the highest price increase?',
    predictionType: 'multiple-choice',
    options: [
      'Skincare',
      'Makeup',
      'Haircare',
      'Fragrances',
      'Wellness Products',
    ],
    order: 3,
    exactMatchPoints: 130,
  });

  return gameId;
}

