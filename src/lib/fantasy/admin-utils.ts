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
import { seedAllGameQuestions } from './seed-questions';
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
    if (gameType.includes('vegetable') || gameType.includes('fruit') || gameType.includes('gold') || gameType.includes('saree-price') || gameType.includes('makeup-beauty-price')) {
      category = 'price-prediction';
    } else if (gameType.includes('trend') || gameType.includes('color') || gameType.includes('design') || gameType.includes('makeup-trend') || gameType.includes('actress-fashion-trend')) {
      category = 'trend-fashion';
    } else if (gameType.includes('celebrity') || gameType.includes('viral')) {
      category = 'celebrity-viral';
    } else if (gameType.includes('daily-grocery')) {
      category = 'daily-grocery';
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
    // Only include imageUrl if it's defined (Firestore doesn't allow undefined)
    ...(options.imageUrl !== undefined && { imageUrl: options.imageUrl }),
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
  },
  adminUserId: string
): Promise<string> {
  const gameConfig = await getGameConfigForQuestion(firestore, gameId);
  
  // Build question data, only including defined fields
  // For options, ensure it's a valid array (filter out undefined elements)
  const options = question.options 
    ? question.options.filter(opt => opt !== undefined && opt !== null && opt !== '')
    : undefined;
  
  const questionData: Omit<FantasyQuestion, 'id' | 'createdAt' | 'updatedAt'> = {
    gameId,
    question: question.question,
    predictionType: question.predictionType,
    exactMatchPoints: question.exactMatchPoints || gameConfig.defaultExactMatchPoints,
    nearRangePoints: question.nearRangePoints ?? gameConfig.defaultNearRangePoints,
    nearRangeTolerance: question.nearRangeTolerance ?? gameConfig.defaultNearRangeTolerance,
    order: question.order,
    // Question pool fields - default values for admin-created questions
    source: 'admin',
    isActive: true,
    createdBy: adminUserId,
    // Only include optional fields if they're defined
    ...(options !== undefined && options.length > 0 && { options }),
    ...(question.minValue !== undefined && { minValue: question.minValue }),
    ...(question.maxValue !== undefined && { maxValue: question.maxValue }),
    ...(question.unit !== undefined && question.unit !== '' && { unit: question.unit }),
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
    title: 'Gold Ornament Price Prediction',
    description: 'Predict the market price range of 22K gold ornament (per 10g) including making charges. Test your market intuition!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['gold', 'price', 'ornament', 'prediction', 'market'],
  });

  // Add questions
  await createGameQuestion(firestore, gameId, {
    question: 'What will be the market price range of 22K gold ornament per 10g (including making charges)?',
    predictionType: 'range',
    minValue: 50000,
    maxValue: 80000,
    unit: '₹',
    order: 1,
    exactMatchPoints: 150,
    nearRangePoints: 75,
    nearRangeTolerance: 5, // 5% tolerance
  }, adminUserId);

  await createGameQuestion(firestore, gameId, {
    question: 'Will the gold ornament market price go up or down this week?',
    predictionType: 'up-down',
    order: 2,
    exactMatchPoints: 100,
  }, adminUserId);

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
    title: 'Silk Saree Price Prediction',
    description: 'Predict the average retail market price of a premium silk saree. Show your fashion market knowledge!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['saree', 'silk', 'price', 'fashion', 'market'],
  });

  // Seed questions from pool
  try {
    const questionCount = await seedAllGameQuestions(firestore, gameId, 'silk-saree-price');
    console.log(`✅ Seeded ${questionCount} questions for silk-saree-price game`);
  } catch (error) {
    console.error('Error seeding questions, falling back to manual creation:', error);
    // Fallback
    await createGameQuestion(firestore, gameId, {
      question: 'What will be the average retail market price range for a premium silk saree?',
      predictionType: 'range',
      minValue: 5000,
      maxValue: 50000,
      unit: '₹',
      order: 1,
      exactMatchPoints: 150,
      nearRangePoints: 75,
      nearRangeTolerance: 10,
    }, adminUserId);

    await createGameQuestion(firestore, gameId, {
      question: 'Will silk saree market prices increase or decrease this week?',
      predictionType: 'up-down',
      order: 2,
      exactMatchPoints: 100,
    }, adminUserId);
  }

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
    description: 'Predict the market price of popular makeup and beauty products. Test your beauty market knowledge!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['makeup', 'beauty', 'price', 'cosmetics', 'market'],
  });

  // Seed questions from pool
  try {
    const questionCount = await seedAllGameQuestions(firestore, gameId, 'makeup-beauty-price');
    console.log(`✅ Seeded ${questionCount} questions for makeup-beauty-price game`);
  } catch (error) {
    console.error('Error seeding questions, falling back to manual creation:', error);
    // Fallback
    await createGameQuestion(firestore, gameId, {
      question: 'What will be the average market price of a premium lipstick?',
      predictionType: 'range',
      minValue: 200,
      maxValue: 3000,
      unit: '₹',
      order: 1,
      exactMatchPoints: 120,
      nearRangePoints: 60,
      nearRangeTolerance: 10,
    }, adminUserId);

    await createGameQuestion(firestore, gameId, {
      question: 'Which beauty product category will see the highest market price increase?',
      predictionType: 'multiple-choice',
      options: [
        'Skincare',
        'Makeup',
        'Haircare',
        'Fragrances',
        'Wellness Products',
      ],
      order: 2,
      exactMatchPoints: 130,
    }, adminUserId);
  }

  return gameId;
}

// ============================================================================
// PRICE PREDICTION GAMES (Additional)
// ============================================================================

/**
 * Create a Vegetable Price Prediction game
 */
export async function createSampleVegetablePriceGame(
  firestore: Firestore,
  adminUserId: string
): Promise<string> {
  const now = new Date();
  const startTime = new Date(now);
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const resultRevealTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const gameId = await createPricePredictionGame(firestore, 'vegetable-price', {
    title: 'Vegetable Price Prediction',
    description: 'Predict the market price per kg for popular vegetables. Test your market knowledge!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['vegetable', 'price', 'market', 'prediction'],
  });

  // Seed questions from pool
  try {
    const questionCount = await seedAllGameQuestions(firestore, gameId, 'vegetable-price');
    console.log(`✅ Seeded ${questionCount} questions for vegetable-price game`);
  } catch (error) {
    console.error('Error seeding questions, falling back to manual creation:', error);
    // Fallback
    await createGameQuestion(firestore, gameId, {
      question: 'What will be the market price per kg of tomatoes?',
      predictionType: 'range',
      minValue: 20,
      maxValue: 150,
      unit: '₹/kg',
      order: 1,
      exactMatchPoints: 120,
      nearRangePoints: 60,
      nearRangeTolerance: 10,
    }, adminUserId);

    await createGameQuestion(firestore, gameId, {
      question: 'What will be the market price per kg of onions?',
      predictionType: 'range',
      minValue: 15,
      maxValue: 100,
      unit: '₹/kg',
      order: 2,
      exactMatchPoints: 120,
      nearRangePoints: 60,
      nearRangeTolerance: 10,
    }, adminUserId);

    await createGameQuestion(firestore, gameId, {
      question: 'Which vegetable will have the highest market price this week?',
      predictionType: 'multiple-choice',
      options: [
        'Tomato',
        'Onion',
        'Potato',
        'Green Chillies',
        'Brinjal',
      ],
      order: 3,
      exactMatchPoints: 100,
    }, adminUserId);
  }

  return gameId;
}

/**
 * Create a Fruit Price Prediction game
 */
export async function createSampleFruitPriceGame(
  firestore: Firestore,
  adminUserId: string
): Promise<string> {
  const now = new Date();
  const startTime = new Date(now);
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const resultRevealTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const gameId = await createPricePredictionGame(firestore, 'fruit-price', {
    title: 'Fruit Price Prediction',
    description: 'Predict the market price per kg for popular fruits. Test your market knowledge!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['fruit', 'price', 'market', 'prediction', 'seasonal'],
  });

  // Seed questions from pool
  try {
    const questionCount = await seedAllGameQuestions(firestore, gameId, 'fruit-price');
    console.log(`✅ Seeded ${questionCount} questions for fruit-price game`);
  } catch (error) {
    console.error('Error seeding questions, falling back to manual creation:', error);
    // Fallback
    await createGameQuestion(firestore, gameId, {
      question: 'What will be the market price per kg of apples?',
      predictionType: 'range',
      minValue: 80,
      maxValue: 300,
      unit: '₹/kg',
      order: 1,
      exactMatchPoints: 120,
      nearRangePoints: 60,
      nearRangeTolerance: 10,
    }, adminUserId);

    await createGameQuestion(firestore, gameId, {
      question: 'What will be the market price per kg of bananas?',
      predictionType: 'range',
      minValue: 30,
      maxValue: 100,
      unit: '₹/kg',
      order: 2,
      exactMatchPoints: 120,
      nearRangePoints: 60,
      nearRangeTolerance: 10,
    }, adminUserId);

    await createGameQuestion(firestore, gameId, {
      question: 'Which fruit will have the highest market price this week?',
      predictionType: 'multiple-choice',
      options: [
        'Apple',
        'Banana',
        'Mango (seasonal)',
        'Orange',
        'Grapes',
      ],
      order: 3,
      exactMatchPoints: 100,
    }, adminUserId);
  }

  return gameId;
}

// ============================================================================
// TREND & FASHION GAMES
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
    title: 'Saree Color Trend Prediction',
    description: 'Predict trending saree colors for the current season. Show your fashion sense!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['saree', 'color', 'trend', 'fashion'],
  });

  // Seed questions from pool
  try {
    const questionCount = await seedAllGameQuestions(firestore, gameId, 'saree-color-trend');
    console.log(`✅ Seeded ${questionCount} questions for saree-color-trend game`);
  } catch (error) {
    console.error('Error seeding questions, falling back to manual creation:', error);
    // Fallback
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
    }, adminUserId);

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
    }, adminUserId);
  }

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

  // Seed questions from pool
  try {
    const questionCount = await seedAllGameQuestions(firestore, gameId, 'jewelry-design-trend');
    console.log(`✅ Seeded ${questionCount} questions for jewelry-design-trend game`);
  } catch (error) {
    console.error('Error seeding questions, falling back to manual creation:', error);
    // Fallback
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
    }, adminUserId);

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
    }, adminUserId);
  }

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

  // Seed questions from pool
  try {
    const questionCount = await seedAllGameQuestions(firestore, gameId, 'bridal-makeup-trend');
    console.log(`✅ Seeded ${questionCount} questions for bridal-makeup-trend game`);
  } catch (error) {
    console.error('Error seeding questions, falling back to manual creation:', error);
    // Fallback
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
    }, adminUserId);

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
    }, adminUserId);
  }

  return gameId;
}

// ============================================================================
// CELEBRITY & VIRAL GAMES
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

  // Seed questions from pool
  try {
    const questionCount = await seedAllGameQuestions(firestore, gameId, 'celebrity-saree-look');
    console.log(`✅ Seeded ${questionCount} questions for celebrity-saree-look game`);
  } catch (error) {
    console.error('Error seeding questions, falling back to manual creation:', error);
    // Fallback
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
    }, adminUserId);

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
    }, adminUserId);
  }

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
    description: 'Predict which fashion style worn by actresses will trend. Show your celebrity fashion knowledge!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['actress', 'fashion', 'trend', 'celebrity'],
  });

  // Seed questions from pool
  try {
    const questionCount = await seedAllGameQuestions(firestore, gameId, 'actress-fashion-trend');
    console.log(`✅ Seeded ${questionCount} questions for actress-fashion-trend game`);
  } catch (error) {
    console.error('Error seeding questions, falling back to manual creation:', error);
    // Fallback
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
    }, adminUserId);

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
    }, adminUserId);
  }

  return gameId;
}

/**
 * Create a Viral Fashion Look Fantasy game
 */
export async function createSampleViralFashionLookGame(
  firestore: Firestore,
  adminUserId: string
): Promise<string> {
  const now = new Date();
  const startTime = new Date(now);
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const resultRevealTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const gameId = await createPricePredictionGame(firestore, 'viral-fashion-look', {
    title: 'Viral Fashion Look Prediction',
    description: 'Predict the most shared and liked fashion look. Show your trend-spotting skills!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['viral', 'fashion', 'trend', 'social'],
  });

  // Seed questions from pool
  try {
    const questionCount = await seedAllGameQuestions(firestore, gameId, 'viral-fashion-look');
    console.log(`✅ Seeded ${questionCount} questions for viral-fashion-look game`);
  } catch (error) {
    console.error('Error seeding questions, falling back to manual creation:', error);
    // Fallback
    await createGameQuestion(firestore, gameId, {
      question: 'Which fashion look will be most shared on social media?',
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
    }, adminUserId);

    await createGameQuestion(firestore, gameId, {
      question: 'Which fashion item will go viral this week?',
      predictionType: 'multiple-choice',
      options: [
        'Designer Saree',
        'Statement Jewelry',
        'Trendy Handbag',
        'Celebrity Outfit',
        'Vintage Accessories',
        'Traditional Wear',
      ],
      order: 2,
      exactMatchPoints: 100,
    }, adminUserId);
  }

  return gameId;
}

// ============================================================================
// DAILY GROCERY STAPLES
// ============================================================================

/**
 * Create a Daily Grocery Price Prediction game
 */
export async function createSampleDailyGroceryPriceGame(
  firestore: Firestore,
  adminUserId: string
): Promise<string> {
  const now = new Date();
  const startTime = new Date(now);
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const resultRevealTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const gameId = await createPricePredictionGame(firestore, 'daily-grocery-price', {
    title: 'Daily Grocery Price Prediction',
    description: 'Predict India average retail market price for daily grocery staples. Test your market knowledge!',
    startTime,
    endTime,
    resultRevealTime,
    entryCoins: 10,
    createdBy: adminUserId,
    tags: ['grocery', 'price', 'market', 'staples', 'daily'],
  });

  // Seed questions from pool
  try {
    const questionCount = await seedAllGameQuestions(firestore, gameId, 'daily-grocery-price');
    console.log(`✅ Seeded ${questionCount} questions for daily-grocery-price game`);
  } catch (error) {
    console.error('Error seeding questions, falling back to manual creation:', error);
    // Fallback
    await createGameQuestion(firestore, gameId, {
      question: 'What will be the average retail market price per kg of rice?',
      predictionType: 'range',
      minValue: 30,
      maxValue: 150,
      unit: '₹/kg',
      order: 1,
      exactMatchPoints: 120,
      nearRangePoints: 60,
      nearRangeTolerance: 10,
    }, adminUserId);
  }

  await createGameQuestion(firestore, gameId, {
    question: 'What will be the average retail market price per kg of wheat flour?',
    predictionType: 'range',
    minValue: 25,
    maxValue: 80,
    unit: '₹/kg',
    order: 2,
    exactMatchPoints: 120,
    nearRangePoints: 60,
    nearRangeTolerance: 10,
  }, adminUserId);

  await createGameQuestion(firestore, gameId, {
    question: 'What will be the average retail market price per kg of sugar?',
    predictionType: 'range',
    minValue: 35,
    maxValue: 80,
    unit: '₹/kg',
    order: 3,
    exactMatchPoints: 120,
    nearRangePoints: 60,
    nearRangeTolerance: 10,
  }, adminUserId);

  await createGameQuestion(firestore, gameId, {
    question: 'What will be the average retail market price per liter of cooking oil?',
    predictionType: 'range',
    minValue: 100,
    maxValue: 250,
    unit: '₹/liter',
    order: 4,
    exactMatchPoints: 120,
    nearRangePoints: 60,
    nearRangeTolerance: 10,
  }, adminUserId);

  return gameId;
}

