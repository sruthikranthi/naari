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
 * Create a fantasy game (generic function for all game types)
 */
export async function createPricePredictionGame(
  firestore: Firestore,
  gameType: FantasyGameType,
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
    category?: FantasyCategory;
  }
): Promise<string> {
  const config = GAME_CONFIGURATIONS[gameType];
  
  // Determine category based on game type if not provided
  let category: FantasyCategory = options.category || 'price-prediction';
  if (!options.category) {
    if (gameType.includes('budget') || gameType.includes('expense')) {
      category = 'lifestyle-budget';
    } else if (gameType.includes('trend') || gameType.includes('color') || gameType.includes('design') || gameType.includes('makeup')) {
      category = 'fashion-trend';
    } else if (gameType.includes('celebrity') || gameType.includes('actress')) {
      category = 'celebrity-style';
    }
  }
  
  const game: Omit<FantasyGame, 'id' | 'createdAt' | 'updatedAt' | 'totalParticipants' | 'totalPredictions'> = {
    title: options.title,
    description: options.description,
    category,
    gameType,
    status: 'active',
    startTime: Timestamp.fromDate(options.startTime),
    endTime: Timestamp.fromDate(options.endTime),
    resultRevealTime: Timestamp.fromDate(options.resultRevealTime),
    entryCoins: options.entryCoins || config.defaultEntryCoins,
    tags: options.tags || [gameType, category],
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

// ============================================================================
// LIFESTYLE & BUDGET GAMES
// ============================================================================

/**
 * Create a Kitchen Budget Fantasy game
 */
export async function createSampleKitchenBudgetGame(
  firestore: Firestore,
  adminUserId: string
): Promise<string> {
  const now = new Date();
  const startTime = new Date(now);
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const resultRevealTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const gameId = await createPricePredictionGame(firestore, 'kitchen-budget', {
    title: 'Kitchen Budget Prediction - This Month',
    description: 'Predict your monthly kitchen expenses. Test your budgeting skills!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 15,
    createdBy: adminUserId,
    tags: ['kitchen', 'budget', 'expense', 'lifestyle'],
  });

  await createGameQuestion(firestore, gameId, {
    question: 'What will be your total kitchen budget for this month?',
    predictionType: 'range',
    minValue: 2000,
    maxValue: 20000,
    unit: '₹',
    order: 1,
    exactMatchPoints: 150,
    nearRangePoints: 75,
    nearRangeTolerance: 10,
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Which category will have the highest expense?',
    predictionType: 'multiple-choice',
    options: [
      'Groceries & Vegetables',
      'Spices & Condiments',
      'Dairy Products',
      'Cooking Oil & Ghee',
      'Snacks & Beverages',
    ],
    order: 2,
    exactMatchPoints: 120,
  });

  return gameId;
}

/**
 * Create a Wedding Budget Fantasy game
 */
export async function createSampleWeddingBudgetGame(
  firestore: Firestore,
  adminUserId: string
): Promise<string> {
  const now = new Date();
  const startTime = new Date(now);
  const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const resultRevealTime = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

  const gameId = await createPricePredictionGame(firestore, 'wedding-budget', {
    title: 'Wedding Budget Prediction',
    description: 'Predict wedding expenses for a typical Indian wedding. Show your planning expertise!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 20,
    createdBy: adminUserId,
    tags: ['wedding', 'budget', 'expense', 'lifestyle'],
  });

  await createGameQuestion(firestore, gameId, {
    question: 'What will be the total wedding budget range?',
    predictionType: 'range',
    minValue: 50000,
    maxValue: 5000000,
    unit: '₹',
    order: 1,
    exactMatchPoints: 200,
    nearRangePoints: 100,
    nearRangeTolerance: 10,
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Which wedding expense category will be the highest?',
    predictionType: 'multiple-choice',
    options: [
      'Venue & Catering',
      'Bridal Outfit & Jewelry',
      'Photography & Videography',
      'Decoration & Flowers',
      'Entertainment & Music',
    ],
    order: 2,
    exactMatchPoints: 150,
  });

  return gameId;
}

/**
 * Create a Festival Expense Fantasy game
 */
export async function createSampleFestivalExpenseGame(
  firestore: Firestore,
  adminUserId: string
): Promise<string> {
  const now = new Date();
  const startTime = new Date(now);
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const resultRevealTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const gameId = await createPricePredictionGame(firestore, 'festival-expense', {
    title: 'Festival Expense Prediction - Diwali',
    description: 'Predict your Diwali festival expenses. Test your festival planning skills!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 15,
    createdBy: adminUserId,
    tags: ['festival', 'diwali', 'expense', 'lifestyle'],
  });

  await createGameQuestion(firestore, gameId, {
    question: 'What will be your total Diwali expense?',
    predictionType: 'range',
    minValue: 5000,
    maxValue: 100000,
    unit: '₹',
    order: 1,
    exactMatchPoints: 150,
    nearRangePoints: 75,
    nearRangeTolerance: 10,
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Which Diwali expense will be highest?',
    predictionType: 'multiple-choice',
    options: [
      'Sweets & Snacks',
      'Fireworks & Crackers',
      'New Clothes & Jewelry',
      'Home Decoration',
      'Gifts & Pooja Items',
    ],
    order: 2,
    exactMatchPoints: 120,
  });

  return gameId;
}

/**
 * Create a Home Monthly Expense Fantasy game
 */
export async function createSampleHomeExpenseGame(
  firestore: Firestore,
  adminUserId: string
): Promise<string> {
  const now = new Date();
  const startTime = new Date(now);
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const resultRevealTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const gameId = await createPricePredictionGame(firestore, 'home-monthly-expense', {
    title: 'Home Monthly Expense Prediction',
    description: 'Predict your total monthly home expenses. Show your household management skills!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 15,
    createdBy: adminUserId,
    tags: ['home', 'expense', 'budget', 'lifestyle'],
  });

  await createGameQuestion(firestore, gameId, {
    question: 'What will be your total monthly home expense?',
    predictionType: 'range',
    minValue: 10000,
    maxValue: 100000,
    unit: '₹',
    order: 1,
    exactMatchPoints: 150,
    nearRangePoints: 75,
    nearRangeTolerance: 10,
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Which home expense category will be the highest this month?',
    predictionType: 'multiple-choice',
    options: [
      'Groceries & Food',
      'Utilities (Electricity, Water, Gas)',
      'Rent or EMI',
      'Education & Children',
      'Healthcare & Medicines',
    ],
    order: 2,
    exactMatchPoints: 120,
  });

  return gameId;
}

// ============================================================================
// FASHION & TREND GAMES
// ============================================================================

/**
 * Create a Saree Color Trend Fantasy game
 */
export async function createSampleSareeColorTrendGame(
  firestore: Firestore,
  adminUserId: string
): Promise<string> {
  const now = new Date();
  const startTime = new Date(now);
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const resultRevealTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const gameId = await createPricePredictionGame(firestore, 'saree-color-trend', {
    title: 'Saree Color Trend Prediction - This Season',
    description: 'Predict the most popular saree color this season. Show your fashion sense!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['saree', 'color', 'trend', 'fashion'],
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Which saree color will be most popular this season?',
    predictionType: 'multiple-choice',
    options: [
      'Red & Maroon',
      'Blue & Navy',
      'Green & Emerald',
      'Pink & Rose',
      'Yellow & Gold',
      'Purple & Lavender',
    ],
    order: 1,
    exactMatchPoints: 100,
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Which saree fabric will trend the most?',
    predictionType: 'multiple-choice',
    options: [
      'Silk',
      'Cotton',
      'Georgette',
      'Chiffon',
      'Linen',
      'Organza',
    ],
    order: 2,
    exactMatchPoints: 100,
  });

  return gameId;
}

/**
 * Create a Jewelry Design Trend Fantasy game
 */
export async function createSampleJewelryTrendGame(
  firestore: Firestore,
  adminUserId: string
): Promise<string> {
  const now = new Date();
  const startTime = new Date(now);
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const resultRevealTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const gameId = await createPricePredictionGame(firestore, 'jewelry-design-trend', {
    title: 'Jewelry Design Trend Prediction',
    description: 'Predict the trending jewelry designs. Show your style expertise!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['jewelry', 'design', 'trend', 'fashion'],
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Which jewelry design style will be most popular?',
    predictionType: 'multiple-choice',
    options: [
      'Traditional Kundan',
      'Modern Minimalist',
      'Antique & Vintage',
      'Contemporary Fusion',
      'Temple Jewelry',
      'Polki & Jadau',
    ],
    order: 1,
    exactMatchPoints: 100,
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Which jewelry piece will trend the most?',
    predictionType: 'multiple-choice',
    options: [
      'Necklace & Choker',
      'Earrings & Jhumkas',
      'Bangles & Bracelets',
      'Rings & Finger Rings',
      'Maang Tikka & Matha Patti',
      'Nose Ring & Nath',
    ],
    order: 2,
    exactMatchPoints: 100,
  });

  return gameId;
}

/**
 * Create a Bridal Makeup Trend Fantasy game
 */
export async function createSampleBridalMakeupTrendGame(
  firestore: Firestore,
  adminUserId: string
): Promise<string> {
  const now = new Date();
  const startTime = new Date(now);
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const resultRevealTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const gameId = await createPricePredictionGame(firestore, 'bridal-makeup-trend', {
    title: 'Bridal Makeup Trend Prediction',
    description: 'Predict the trending bridal makeup styles. Show your beauty expertise!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['bridal', 'makeup', 'trend', 'beauty'],
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Which bridal makeup look will be most popular?',
    predictionType: 'multiple-choice',
    options: [
      'Natural & Dewy',
      'Glamorous & Bold',
      'Traditional & Classic',
      'Modern & Minimal',
      'Smoky & Dramatic',
      'Soft & Romantic',
    ],
    order: 1,
    exactMatchPoints: 100,
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Which lip color will trend for brides?',
    predictionType: 'multiple-choice',
    options: [
      'Classic Red',
      'Pink & Rose',
      'Coral & Peach',
      'Berry & Wine',
      'Nude & Brown',
      'Fuchsia & Magenta',
    ],
    order: 2,
    exactMatchPoints: 100,
  });

  return gameId;
}

// ============================================================================
// CELEBRITY & STYLE GAMES
// ============================================================================

/**
 * Create a Celebrity Saree Look Fantasy game
 */
export async function createSampleCelebritySareeGame(
  firestore: Firestore,
  adminUserId: string
): Promise<string> {
  const now = new Date();
  const startTime = new Date(now);
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const resultRevealTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const gameId = await createPricePredictionGame(firestore, 'celebrity-saree-look', {
    title: 'Celebrity Saree Look Prediction',
    description: 'Predict which celebrity saree look will go viral. Show your celebrity style knowledge!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['celebrity', 'saree', 'style', 'fashion'],
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Which celebrity saree look will be most talked about?',
    predictionType: 'multiple-choice',
    options: [
      'Deepika Padukone',
      'Priyanka Chopra',
      'Alia Bhatt',
      'Anushka Sharma',
      'Kareena Kapoor',
      'Katrina Kaif',
      'Sonam Kapoor',
      'Other Celebrity',
    ],
    order: 1,
    exactMatchPoints: 100,
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Which saree style will celebrities wear most?',
    predictionType: 'multiple-choice',
    options: [
      'Traditional Silk Saree',
      'Modern Designer Saree',
      'Lehenga Style Saree',
      'Pre-Draped Saree',
      'Saree Gown',
      'Contemporary Saree',
    ],
    order: 2,
    exactMatchPoints: 100,
  });

  return gameId;
}

/**
 * Create an Actress Fashion Trend Fantasy game
 */
export async function createSampleActressFashionGame(
  firestore: Firestore,
  adminUserId: string
): Promise<string> {
  const now = new Date();
  const startTime = new Date(now);
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const resultRevealTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const gameId = await createPricePredictionGame(firestore, 'actress-fashion-trend', {
    title: 'Actress Fashion Trend Prediction',
    description: 'Predict the trending actress fashion styles. Show your celebrity fashion knowledge!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['actress', 'fashion', 'trend', 'celebrity'],
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Which actress fashion style will trend the most?',
    predictionType: 'multiple-choice',
    options: [
      'Ethnic & Traditional',
      'Western & Modern',
      'Fusion & Indo-Western',
      'Minimalist & Chic',
      'Bold & Statement',
      'Vintage & Retro',
    ],
    order: 1,
    exactMatchPoints: 100,
  });

  await createGameQuestion(firestore, gameId, {
    question: 'Which fashion accessory will be most popular?',
    predictionType: 'multiple-choice',
    options: [
      'Statement Jewelry',
      'Designer Handbags',
      'Trendy Footwear',
      'Sunglasses & Eyewear',
      'Hair Accessories',
      'Belts & Waist Chains',
    ],
    order: 2,
    exactMatchPoints: 100,
  });

  return gameId;
}

