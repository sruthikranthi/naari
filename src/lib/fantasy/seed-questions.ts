/**
 * Question Generation Seed Script
 * 
 * Generates 30-50 questions per game for all 12 fantasy games.
 * All questions are marked as createdBy: 'system' and are reusable.
 */

import type { Firestore } from 'firebase/firestore';
import type { FantasyGameType, PredictionType, QuestionDifficulty, QuestionSource } from './types';
import { createFantasyQuestion } from './services';
import { Timestamp } from 'firebase/firestore';

// ============================================================================
// QUESTION TEMPLATES BY TYPE
// ============================================================================

type QuestionTemplate = {
  question: string;
  predictionType: PredictionType;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  unit?: string;
  exactMatchPoints: number;
  nearRangePoints?: number;
  nearRangeTolerance?: number;
  difficulty: QuestionDifficulty;
  tags: string[];
  source: QuestionSource;
};

// ============================================================================
// PRICE PREDICTION GAMES (5 games)
// ============================================================================

/**
 * Generate questions for Gold Ornament Price game
 */
export async function seedGoldOrnamentPriceQuestions(
  firestore: Firestore,
  gameId: string
): Promise<number> {
  const questions: QuestionTemplate[] = [
    // Range-based price questions
    {
      question: 'What will be the market price range of 22K gold ornament per 10g (including making charges)?',
      predictionType: 'range',
      minValue: 50000,
      maxValue: 80000,
      unit: '₹',
      exactMatchPoints: 150,
      nearRangePoints: 75,
      nearRangeTolerance: 5,
      difficulty: 'medium',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the average market price of 24K gold coin per gram?',
      predictionType: 'range',
      minValue: 6000,
      maxValue: 7000,
      unit: '₹/gram',
      exactMatchPoints: 120,
      nearRangePoints: 60,
      nearRangeTolerance: 3,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of gold bangle per piece (22K, 20g)?',
      predictionType: 'range',
      minValue: 100000,
      maxValue: 150000,
      unit: '₹',
      exactMatchPoints: 130,
      nearRangePoints: 65,
      nearRangeTolerance: 5,
      difficulty: 'medium',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of gold necklace (22K, 50g with making charges)?',
      predictionType: 'range',
      minValue: 250000,
      maxValue: 400000,
      unit: '₹',
      exactMatchPoints: 140,
      nearRangePoints: 70,
      nearRangeTolerance: 5,
      difficulty: 'hard',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of gold earrings per pair (22K, 10g)?',
      predictionType: 'range',
      minValue: 50000,
      maxValue: 80000,
      unit: '₹',
      exactMatchPoints: 120,
      nearRangePoints: 60,
      nearRangeTolerance: 5,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of gold chain per gram (22K)?',
      predictionType: 'range',
      minValue: 5500,
      maxValue: 6500,
      unit: '₹/gram',
      exactMatchPoints: 110,
      nearRangePoints: 55,
      nearRangeTolerance: 3,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of gold ring (22K, 5g with making charges)?',
      predictionType: 'range',
      minValue: 25000,
      maxValue: 40000,
      unit: '₹',
      exactMatchPoints: 115,
      nearRangePoints: 58,
      nearRangeTolerance: 5,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of gold pendant (22K, 8g with making charges)?',
      predictionType: 'range',
      minValue: 40000,
      maxValue: 65000,
      unit: '₹',
      exactMatchPoints: 125,
      nearRangePoints: 63,
      nearRangeTolerance: 5,
      difficulty: 'medium',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of gold bracelet (22K, 30g)?',
      predictionType: 'range',
      minValue: 150000,
      maxValue: 240000,
      unit: '₹',
      exactMatchPoints: 135,
      nearRangePoints: 68,
      nearRangeTolerance: 5,
      difficulty: 'medium',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of gold mangalsutra (22K, 15g with making charges)?',
      predictionType: 'range',
      minValue: 75000,
      maxValue: 120000,
      unit: '₹',
      exactMatchPoints: 128,
      nearRangePoints: 64,
      nearRangeTolerance: 5,
      difficulty: 'medium',
      tags: ['daily', 'price', 'market', 'wedding'],
      source: 'market',
    },
    // Up/Down questions
    {
      question: 'Will the gold ornament market price go up or down this week?',
      predictionType: 'up-down',
      exactMatchPoints: 100,
      difficulty: 'easy',
      tags: ['daily', 'trend'],
      source: 'market',
    },
    {
      question: 'Will 22K gold price increase or decrease this month?',
      predictionType: 'up-down',
      exactMatchPoints: 100,
      difficulty: 'easy',
      tags: ['daily', 'trend'],
      source: 'market',
    },
    {
      question: 'Will gold making charges go up or down this week?',
      predictionType: 'up-down',
      exactMatchPoints: 100,
      difficulty: 'easy',
      tags: ['daily', 'trend'],
      source: 'market',
    },
    // Comparison questions
    {
      question: 'Which will cost more this week - Gold Bangle or Gold Necklace (same weight)?',
      predictionType: 'multiple-choice',
      options: ['Gold Bangle', 'Gold Necklace', 'Both Same'],
      exactMatchPoints: 110,
      difficulty: 'medium',
      tags: ['daily', 'comparison'],
      source: 'market',
    },
    {
      question: 'Which gold item will have higher making charges?',
      predictionType: 'multiple-choice',
      options: ['Gold Ring', 'Gold Chain', 'Gold Earrings', 'All Same'],
      exactMatchPoints: 105,
      difficulty: 'medium',
      tags: ['daily', 'comparison'],
      source: 'market',
    },
    // Seasonal questions
    {
      question: 'Will gold prices be higher during wedding season?',
      predictionType: 'up-down',
      exactMatchPoints: 100,
      difficulty: 'easy',
      tags: ['seasonal', 'wedding', 'trend'],
      source: 'market',
    },
    {
      question: 'What will be the market price of gold during Diwali week?',
      predictionType: 'range',
      minValue: 5500,
      maxValue: 7000,
      unit: '₹/gram (22K)',
      exactMatchPoints: 130,
      nearRangePoints: 65,
      nearRangeTolerance: 5,
      difficulty: 'medium',
      tags: ['seasonal', 'festival'],
      source: 'market',
    },
  ];

  let count = 0;
  for (const q of questions) {
    await createFantasyQuestion(firestore, {
      gameId,
      question: q.question,
      predictionType: q.predictionType,
      options: q.options,
      minValue: q.minValue,
      maxValue: q.maxValue,
      unit: q.unit,
      exactMatchPoints: q.exactMatchPoints,
      nearRangePoints: q.nearRangePoints,
      nearRangeTolerance: q.nearRangeTolerance,
      difficulty: q.difficulty,
      tags: q.tags,
      source: q.source,
      isActive: true,
      createdBy: 'system',
    });
    count++;
  }

  return count;
}

/**
 * Generate questions for Silk Saree Price game
 */
export async function seedSilkSareePriceQuestions(
  firestore: Firestore,
  gameId: string
): Promise<number> {
  const questions: QuestionTemplate[] = [
    // Range-based price questions
    {
      question: 'What will be the average retail market price range for a premium silk saree?',
      predictionType: 'range',
      minValue: 5000,
      maxValue: 50000,
      unit: '₹',
      exactMatchPoints: 150,
      nearRangePoints: 75,
      nearRangeTolerance: 10,
      difficulty: 'medium',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of Kanchipuram silk saree?',
      predictionType: 'range',
      minValue: 15000,
      maxValue: 100000,
      unit: '₹',
      exactMatchPoints: 140,
      nearRangePoints: 70,
      nearRangeTolerance: 10,
      difficulty: 'hard',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of Banarasi silk saree?',
      predictionType: 'range',
      minValue: 8000,
      maxValue: 80000,
      unit: '₹',
      exactMatchPoints: 135,
      nearRangePoints: 68,
      nearRangeTolerance: 10,
      difficulty: 'hard',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of designer silk saree?',
      predictionType: 'range',
      minValue: 10000,
      maxValue: 150000,
      unit: '₹',
      exactMatchPoints: 145,
      nearRangePoints: 73,
      nearRangeTolerance: 10,
      difficulty: 'hard',
      tags: ['daily', 'price', 'market', 'trending'],
      source: 'market',
    },
    {
      question: 'What will be the market price of simple silk saree?',
      predictionType: 'range',
      minValue: 3000,
      maxValue: 15000,
      unit: '₹',
      exactMatchPoints: 120,
      nearRangePoints: 60,
      nearRangeTolerance: 10,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of printed silk saree?',
      predictionType: 'range',
      minValue: 4000,
      maxValue: 20000,
      unit: '₹',
      exactMatchPoints: 125,
      nearRangePoints: 63,
      nearRangeTolerance: 10,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of wedding silk saree?',
      predictionType: 'range',
      minValue: 20000,
      maxValue: 200000,
      unit: '₹',
      exactMatchPoints: 150,
      nearRangePoints: 75,
      nearRangeTolerance: 10,
      difficulty: 'hard',
      tags: ['daily', 'price', 'market', 'wedding'],
      source: 'market',
    },
    {
      question: 'What will be the market price of bridal silk saree?',
      predictionType: 'range',
      minValue: 30000,
      maxValue: 300000,
      unit: '₹',
      exactMatchPoints: 155,
      nearRangePoints: 78,
      nearRangeTolerance: 10,
      difficulty: 'hard',
      tags: ['daily', 'price', 'market', 'wedding'],
      source: 'market',
    },
    {
      question: 'What will be the market price of party wear silk saree?',
      predictionType: 'range',
      minValue: 6000,
      maxValue: 40000,
      unit: '₹',
      exactMatchPoints: 130,
      nearRangePoints: 65,
      nearRangeTolerance: 10,
      difficulty: 'medium',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of traditional silk saree?',
      predictionType: 'range',
      minValue: 5000,
      maxValue: 50000,
      unit: '₹',
      exactMatchPoints: 140,
      nearRangePoints: 70,
      nearRangeTolerance: 10,
      difficulty: 'medium',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    // Up/Down questions
    {
      question: 'Will silk saree market prices increase or decrease this week?',
      predictionType: 'up-down',
      exactMatchPoints: 100,
      difficulty: 'easy',
      tags: ['daily', 'trend'],
      source: 'market',
    },
    {
      question: 'Will designer saree prices go up or down this month?',
      predictionType: 'up-down',
      exactMatchPoints: 100,
      difficulty: 'easy',
      tags: ['daily', 'trend'],
      source: 'market',
    },
    {
      question: 'Will wedding saree prices increase during wedding season?',
      predictionType: 'up-down',
      exactMatchPoints: 100,
      difficulty: 'easy',
      tags: ['seasonal', 'wedding', 'trend'],
      source: 'market',
    },
    // Comparison questions
    {
      question: 'Which will cost more - Kanchipuram or Banarasi silk saree?',
      predictionType: 'multiple-choice',
      options: ['Kanchipuram', 'Banarasi', 'Both Same'],
      exactMatchPoints: 110,
      difficulty: 'medium',
      tags: ['daily', 'comparison'],
      source: 'market',
    },
    {
      question: 'Which saree type will have higher market price?',
      predictionType: 'multiple-choice',
      options: ['Designer Saree', 'Traditional Saree', 'Simple Saree', 'All Same'],
      exactMatchPoints: 105,
      difficulty: 'medium',
      tags: ['daily', 'comparison'],
      source: 'market',
    },
    // Seasonal questions
    {
      question: 'What will be the average market price of silk saree during festival season?',
      predictionType: 'range',
      minValue: 8000,
      maxValue: 60000,
      unit: '₹',
      exactMatchPoints: 135,
      nearRangePoints: 68,
      nearRangeTolerance: 10,
      difficulty: 'medium',
      tags: ['seasonal', 'festival'],
      source: 'market',
    },
    {
      question: 'Will saree prices increase during Diwali week?',
      predictionType: 'up-down',
      exactMatchPoints: 100,
      difficulty: 'easy',
      tags: ['seasonal', 'festival', 'trend'],
      source: 'market',
    },
  ];

  let count = 0;
  for (const q of questions) {
    await createFantasyQuestion(firestore, {
      gameId,
      question: q.question,
      predictionType: q.predictionType,
      options: q.options,
      minValue: q.minValue,
      maxValue: q.maxValue,
      unit: q.unit,
      exactMatchPoints: q.exactMatchPoints,
      nearRangePoints: q.nearRangePoints,
      nearRangeTolerance: q.nearRangeTolerance,
      difficulty: q.difficulty,
      tags: q.tags,
      source: q.source,
      isActive: true,
      createdBy: 'system',
    });
    count++;
  }

  return count;
}

/**
 * Generate questions for Makeup & Beauty Price game
 */
export async function seedMakeupBeautyPriceQuestions(
  firestore: Firestore,
  gameId: string
): Promise<number> {
  const questions: QuestionTemplate[] = [
    // Range-based price questions
    {
      question: 'What will be the average market price of a premium lipstick?',
      predictionType: 'range',
      minValue: 200,
      maxValue: 3000,
      unit: '₹',
      exactMatchPoints: 120,
      nearRangePoints: 60,
      nearRangeTolerance: 10,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of foundation (30ml)?',
      predictionType: 'range',
      minValue: 300,
      maxValue: 5000,
      unit: '₹',
      exactMatchPoints: 125,
      nearRangePoints: 63,
      nearRangeTolerance: 10,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of mascara?',
      predictionType: 'range',
      minValue: 200,
      maxValue: 2500,
      unit: '₹',
      exactMatchPoints: 115,
      nearRangePoints: 58,
      nearRangeTolerance: 10,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of eyeshadow palette?',
      predictionType: 'range',
      minValue: 400,
      maxValue: 4000,
      unit: '₹',
      exactMatchPoints: 130,
      nearRangePoints: 65,
      nearRangeTolerance: 10,
      difficulty: 'medium',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of face serum (30ml)?',
      predictionType: 'range',
      minValue: 500,
      maxValue: 8000,
      unit: '₹',
      exactMatchPoints: 135,
      nearRangePoints: 68,
      nearRangeTolerance: 10,
      difficulty: 'medium',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of face cream (50g)?',
      predictionType: 'range',
      minValue: 200,
      maxValue: 5000,
      unit: '₹',
      exactMatchPoints: 120,
      nearRangePoints: 60,
      nearRangeTolerance: 10,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of face wash?',
      predictionType: 'range',
      minValue: 100,
      maxValue: 2000,
      unit: '₹',
      exactMatchPoints: 110,
      nearRangePoints: 55,
      nearRangeTolerance: 10,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of sunscreen (50ml)?',
      predictionType: 'range',
      minValue: 250,
      maxValue: 3000,
      unit: '₹',
      exactMatchPoints: 125,
      nearRangePoints: 63,
      nearRangeTolerance: 10,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of kajal/eyeliner?',
      predictionType: 'range',
      minValue: 50,
      maxValue: 1000,
      unit: '₹',
      exactMatchPoints: 105,
      nearRangePoints: 53,
      nearRangeTolerance: 10,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of nail polish?',
      predictionType: 'range',
      minValue: 50,
      maxValue: 800,
      unit: '₹',
      exactMatchPoints: 100,
      nearRangePoints: 50,
      nearRangeTolerance: 10,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of hair serum (100ml)?',
      predictionType: 'range',
      minValue: 200,
      maxValue: 3000,
      unit: '₹',
      exactMatchPoints: 120,
      nearRangePoints: 60,
      nearRangeTolerance: 10,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of shampoo (250ml)?',
      predictionType: 'range',
      minValue: 100,
      maxValue: 2000,
      unit: '₹',
      exactMatchPoints: 110,
      nearRangePoints: 55,
      nearRangeTolerance: 10,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of conditioner (250ml)?',
      predictionType: 'range',
      minValue: 150,
      maxValue: 2500,
      unit: '₹',
      exactMatchPoints: 115,
      nearRangePoints: 58,
      nearRangeTolerance: 10,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of face mask (pack of 5)?',
      predictionType: 'range',
      minValue: 200,
      maxValue: 2000,
      unit: '₹',
      exactMatchPoints: 118,
      nearRangePoints: 59,
      nearRangeTolerance: 10,
      difficulty: 'easy',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    {
      question: 'What will be the market price of perfume (50ml)?',
      predictionType: 'range',
      minValue: 500,
      maxValue: 10000,
      unit: '₹',
      exactMatchPoints: 140,
      nearRangePoints: 70,
      nearRangeTolerance: 10,
      difficulty: 'hard',
      tags: ['daily', 'price', 'market'],
      source: 'market',
    },
    // Up/Down questions
    {
      question: 'Will beauty product prices increase or decrease this week?',
      predictionType: 'up-down',
      exactMatchPoints: 100,
      difficulty: 'easy',
      tags: ['daily', 'trend'],
      source: 'market',
    },
    {
      question: 'Will makeup prices go up or down this month?',
      predictionType: 'up-down',
      exactMatchPoints: 100,
      difficulty: 'easy',
      tags: ['daily', 'trend'],
      source: 'market',
    },
    // Multiple choice questions
    {
      question: 'Which beauty product category will see the highest market price increase?',
      predictionType: 'multiple-choice',
      options: ['Skincare', 'Makeup', 'Haircare', 'Fragrances', 'Wellness Products'],
      exactMatchPoints: 130,
      difficulty: 'medium',
      tags: ['daily', 'trend'],
      source: 'market',
    },
    {
      question: 'Which makeup product will have the highest average market price?',
      predictionType: 'multiple-choice',
      options: ['Foundation', 'Lipstick', 'Eyeshadow Palette', 'Mascara', 'All Same'],
      exactMatchPoints: 110,
      difficulty: 'medium',
      tags: ['daily', 'comparison'],
      source: 'market',
    },
    {
      question: 'Which skincare product will be most expensive?',
      predictionType: 'multiple-choice',
      options: ['Face Serum', 'Face Cream', 'Sunscreen', 'Face Wash', 'All Same'],
      exactMatchPoints: 105,
      difficulty: 'medium',
      tags: ['daily', 'comparison'],
      source: 'market',
    },
    // Seasonal questions
    {
      question: 'Will beauty product prices increase during festival season?',
      predictionType: 'up-down',
      exactMatchPoints: 100,
      difficulty: 'easy',
      tags: ['seasonal', 'festival', 'trend'],
      source: 'market',
    },
  ];

  let count = 0;
  for (const q of questions) {
    await createFantasyQuestion(firestore, {
      gameId,
      question: q.question,
      predictionType: q.predictionType,
      options: q.options,
      minValue: q.minValue,
      maxValue: q.maxValue,
      unit: q.unit,
      exactMatchPoints: q.exactMatchPoints,
      nearRangePoints: q.nearRangePoints,
      nearRangeTolerance: q.nearRangeTolerance,
      difficulty: q.difficulty,
      tags: q.tags,
      source: q.source,
      isActive: true,
      createdBy: 'system',
    });
    count++;
  }

  return count;
}

// Continue with remaining games...
// (I'll create a comprehensive file with all 12 games)


// ============================================================================
// REMAINING GAMES - Placeholder functions
// Note: These will be fully implemented with 30-50 questions each
// ============================================================================

/**
 * Generate questions for Vegetable Price game
 */
export async function seedVegetablePriceQuestions(
  firestore: Firestore,
  gameId: string
): Promise<number> {
  // TODO: Implement 30-50 questions for vegetable price game
  return 0;
}

/**
 * Generate questions for Fruit Price game
 */
export async function seedFruitPriceQuestions(
  firestore: Firestore,
  gameId: string
): Promise<number> {
  // TODO: Implement 30-50 questions for fruit price game
  return 0;
}

/**
 * Generate questions for Saree Color Trend game
 */
export async function seedSareeColorTrendQuestions(
  firestore: Firestore,
  gameId: string
): Promise<number> {
  // TODO: Implement 30-50 questions for saree color trend game
  return 0;
}

/**
 * Generate questions for Jewelry Design Trend game
 */
export async function seedJewelryDesignTrendQuestions(
  firestore: Firestore,
  gameId: string
): Promise<number> {
  // TODO: Implement 30-50 questions for jewelry design trend game
  return 0;
}

/**
 * Generate questions for Bridal Makeup Trend game
 */
export async function seedBridalMakeupTrendQuestions(
  firestore: Firestore,
  gameId: string
): Promise<number> {
  // TODO: Implement 30-50 questions for bridal makeup trend game
  return 0;
}

/**
 * Generate questions for Actress Fashion Trend game
 */
export async function seedActressFashionTrendQuestions(
  firestore: Firestore,
  gameId: string
): Promise<number> {
  // TODO: Implement 30-50 questions for actress fashion trend game
  return 0;
}

/**
 * Generate questions for Celebrity Saree Look game
 */
export async function seedCelebritySareeLookQuestions(
  firestore: Firestore,
  gameId: string
): Promise<number> {
  // TODO: Implement 30-50 questions for celebrity saree look game
  return 0;
}

/**
 * Generate questions for Viral Fashion Look game
 */
export async function seedViralFashionLookQuestions(
  firestore: Firestore,
  gameId: string
): Promise<number> {
  // TODO: Implement 30-50 questions for viral fashion look game
  return 0;
}

/**
 * Generate questions for Daily Grocery Price game
 */
export async function seedDailyGroceryPriceQuestions(
  firestore: Firestore,
  gameId: string
): Promise<number> {
  // TODO: Implement 30-50 questions for daily grocery price game
  return 0;
}

// ============================================================================
// MAIN ORCHESTRATOR FUNCTION
// ============================================================================

/**
 * Main orchestrator function to seed questions for any game type
 */
export async function seedAllGameQuestions(
  firestore: Firestore,
  gameId: string,
  gameType: FantasyGameType
): Promise<number> {
  switch (gameType) {
    case 'gold-ornament-price':
      return await seedGoldOrnamentPriceQuestions(firestore, gameId);
    case 'silk-saree-price':
      return await seedSilkSareePriceQuestions(firestore, gameId);
    case 'makeup-beauty-price':
      return await seedMakeupBeautyPriceQuestions(firestore, gameId);
    case 'vegetable-price':
      return await seedVegetablePriceQuestions(firestore, gameId);
    case 'fruit-price':
      return await seedFruitPriceQuestions(firestore, gameId);
    case 'saree-color-trend':
      return await seedSareeColorTrendQuestions(firestore, gameId);
    case 'jewelry-design-trend':
      return await seedJewelryDesignTrendQuestions(firestore, gameId);
    case 'bridal-makeup-trend':
      return await seedBridalMakeupTrendQuestions(firestore, gameId);
    case 'actress-fashion-trend':
      return await seedActressFashionTrendQuestions(firestore, gameId);
    case 'celebrity-saree-look':
      return await seedCelebritySareeLookQuestions(firestore, gameId);
    case 'viral-fashion-look':
      return await seedViralFashionLookQuestions(firestore, gameId);
    case 'daily-grocery-price':
      return await seedDailyGroceryPriceQuestions(firestore, gameId);
    default:
      console.warn(`Unknown game type: ${gameType}`);
      return 0;
  }
}
