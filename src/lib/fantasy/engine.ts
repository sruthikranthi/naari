/**
 * Naari Fantasy Zone - Core Fantasy Engine
 * 
 * This is a pluggable, extensible fantasy game engine that supports
 * multiple game types and prediction mechanisms.
 */

import type {
  FantasyGame,
  FantasyQuestion,
  UserPrediction,
  FantasyResult,
  PredictionType,
  GameConfiguration,
  FantasyGameType,
} from './types';

// ============================================================================
// GAME CONFIGURATIONS
// ============================================================================

export const GAME_CONFIGURATIONS: Record<FantasyGameType, GameConfiguration> = {
  // Price Prediction Games
  'gold-ornament-price': {
    gameType: 'gold-ornament-price',
    defaultEntryCoins: 10,
    defaultExactMatchPoints: 100,
    defaultNearRangePoints: 50,
    defaultNearRangeTolerance: 5, // 5% tolerance
    allowedPredictionTypes: ['up-down', 'range', 'multiple-choice'],
    requiresRange: false,
    requiresOptions: false,
  },
  'silk-saree-price': {
    gameType: 'silk-saree-price',
    defaultEntryCoins: 10,
    defaultExactMatchPoints: 100,
    defaultNearRangePoints: 50,
    defaultNearRangeTolerance: 5,
    allowedPredictionTypes: ['up-down', 'range', 'multiple-choice'],
    requiresRange: false,
    requiresOptions: false,
  },
  'makeup-beauty-price': {
    gameType: 'makeup-beauty-price',
    defaultEntryCoins: 10,
    defaultExactMatchPoints: 100,
    defaultNearRangePoints: 50,
    defaultNearRangeTolerance: 5,
    allowedPredictionTypes: ['up-down', 'range', 'multiple-choice'],
    requiresRange: false,
    requiresOptions: false,
  },
  // Price Prediction Games (Additional)
  'vegetable-price': {
    gameType: 'vegetable-price',
    defaultEntryCoins: 10,
    defaultExactMatchPoints: 120,
    defaultNearRangePoints: 60,
    defaultNearRangeTolerance: 10,
    allowedPredictionTypes: ['range', 'multiple-choice'],
    requiresRange: false,
    requiresOptions: false,
  },
  'fruit-price': {
    gameType: 'fruit-price',
    defaultEntryCoins: 10,
    defaultExactMatchPoints: 120,
    defaultNearRangePoints: 60,
    defaultNearRangeTolerance: 10,
    allowedPredictionTypes: ['range', 'multiple-choice'],
    requiresRange: false,
    requiresOptions: false,
  },
  // Fashion & Trend Games
  'saree-color-trend': {
    gameType: 'saree-color-trend',
    defaultEntryCoins: 10,
    defaultExactMatchPoints: 100,
    defaultNearRangePoints: 0,
    allowedPredictionTypes: ['multiple-choice'],
    requiresRange: false,
    requiresOptions: true,
    minOptions: 3,
    maxOptions: 6,
  },
  'jewelry-design-trend': {
    gameType: 'jewelry-design-trend',
    defaultEntryCoins: 10,
    defaultExactMatchPoints: 100,
    defaultNearRangePoints: 0,
    allowedPredictionTypes: ['multiple-choice'],
    requiresRange: false,
    requiresOptions: true,
    minOptions: 3,
    maxOptions: 6,
  },
  'bridal-makeup-trend': {
    gameType: 'bridal-makeup-trend',
    defaultEntryCoins: 10,
    defaultExactMatchPoints: 100,
    defaultNearRangePoints: 0,
    allowedPredictionTypes: ['multiple-choice'],
    requiresRange: false,
    requiresOptions: true,
    minOptions: 3,
    maxOptions: 6,
  },
  // Celebrity & Style Games
  'celebrity-saree-look': {
    gameType: 'celebrity-saree-look',
    defaultEntryCoins: 10,
    defaultExactMatchPoints: 100,
    defaultNearRangePoints: 0,
    allowedPredictionTypes: ['multiple-choice'],
    requiresRange: false,
    requiresOptions: true,
    minOptions: 3,
    maxOptions: 8,
  },
  'actress-fashion-trend': {
    gameType: 'actress-fashion-trend',
    defaultEntryCoins: 10,
    defaultExactMatchPoints: 100,
    defaultNearRangePoints: 0,
    allowedPredictionTypes: ['multiple-choice'],
    requiresRange: false,
    requiresOptions: true,
    minOptions: 3,
    maxOptions: 8,
  },
  // Celebrity & Viral
  'viral-fashion-look': {
    gameType: 'viral-fashion-look',
    defaultEntryCoins: 10,
    defaultExactMatchPoints: 100,
    defaultNearRangePoints: 0,
    defaultNearRangeTolerance: 0,
    allowedPredictionTypes: ['multiple-choice'],
    requiresRange: false,
    requiresOptions: true,
    minOptions: 3,
    maxOptions: 8,
  },
  // Daily Grocery Staples
  'daily-grocery-price': {
    gameType: 'daily-grocery-price',
    defaultEntryCoins: 10,
    defaultExactMatchPoints: 120,
    defaultNearRangePoints: 60,
    defaultNearRangeTolerance: 10,
    allowedPredictionTypes: ['range'],
    requiresRange: true,
    requiresOptions: false,
  },
};

// ============================================================================
// SCORING ENGINE
// ============================================================================

export class FantasyScoringEngine {
  /**
   * Calculate points for a user prediction
   */
  static calculatePoints(
    prediction: UserPrediction,
    question: FantasyQuestion,
    result: FantasyResult
  ): number {
    if (!question.correctAnswer && !result.result) {
      return 0;
    }

    const correctValue = result.result ?? question.correctAnswer;
    const userValue = prediction.prediction;

    // Exact match
    if (this.isExactMatch(userValue, correctValue)) {
      return question.exactMatchPoints;
    }

    // Near range match (for numeric predictions)
    if (
      question.predictionType === 'range' &&
      question.nearRangePoints &&
      question.nearRangeTolerance &&
      typeof userValue === 'number' &&
      typeof correctValue === 'number'
    ) {
      const tolerance = question.nearRangeTolerance;
      const difference = Math.abs(userValue - correctValue);
      const percentageDiff = (difference / correctValue) * 100;

      if (percentageDiff <= tolerance) {
        // Calculate partial points based on how close
        const closeness = 1 - percentageDiff / tolerance;
        return Math.round(question.nearRangePoints * closeness);
      }
    }

    // Range prediction check
    if (
      prediction.rangeMin !== undefined &&
      prediction.rangeMax !== undefined &&
      typeof correctValue === 'number'
    ) {
      if (
        correctValue >= prediction.rangeMin &&
        correctValue <= prediction.rangeMax
      ) {
        return question.exactMatchPoints;
      }

      // Check if result is near the range
      if (question.nearRangePoints && question.nearRangeTolerance) {
        const minDiff = Math.abs(correctValue - prediction.rangeMin);
        const maxDiff = Math.abs(correctValue - prediction.rangeMax);
        const rangeSize = prediction.rangeMax - prediction.rangeMin;
        const tolerance = rangeSize * (question.nearRangeTolerance / 100);

        if (minDiff <= tolerance || maxDiff <= tolerance) {
          return question.nearRangePoints;
        }
      }
    }

    return 0;
  }

  /**
   * Check if two values are exactly equal
   */
  private static isExactMatch(
    userValue: string | number,
    correctValue: string | number
  ): boolean {
    if (typeof userValue === 'number' && typeof correctValue === 'number') {
      return userValue === correctValue;
    }
    return String(userValue).toLowerCase() === String(correctValue).toLowerCase();
  }
}

// ============================================================================
// VALIDATION ENGINE
// ============================================================================

export class FantasyValidationEngine {
  /**
   * Validate if a user can participate in a game
   */
  static canParticipate(
    game: FantasyGame,
    userCoins: number,
    hasParticipated: boolean
  ): { valid: boolean; reason?: string } {
    // Check game status
    if (game.status !== 'active') {
      return { valid: false, reason: 'Game is not active' };
    }

    // Check if game has ended
    const now = new Date();
    const endTime = game.endTime instanceof Date 
      ? game.endTime 
      : (game.endTime as any)?.toDate?.() || new Date();
    
    if (now > endTime) {
      return { valid: false, reason: 'Prediction deadline has passed' };
    }

    // Check coin balance
    if (userCoins < game.entryCoins) {
      return {
        valid: false,
        reason: `Insufficient coins. Need ${game.entryCoins} coins.`,
      };
    }

    // Check max participants
    if (
      game.maxParticipants &&
      game.totalParticipants >= game.maxParticipants
    ) {
      return { valid: false, reason: 'Game is full' };
    }

    return { valid: true };
  }

  /**
   * Validate a prediction value
   */
  static validatePrediction(
    prediction: string | number,
    question: FantasyQuestion
  ): { valid: boolean; reason?: string } {
    // Multiple choice validation
    if (question.predictionType === 'multiple-choice') {
      if (!question.options || question.options.length === 0) {
        return { valid: false, reason: 'Question has no options' };
      }
      if (!question.options.includes(String(prediction))) {
        return { valid: false, reason: 'Invalid option selected' };
      }
    }

    // Range validation
    if (question.predictionType === 'range') {
      if (typeof prediction !== 'number') {
        return { valid: false, reason: 'Range prediction must be a number' };
      }
      if (question.minValue !== undefined && prediction < question.minValue) {
        return {
          valid: false,
          reason: `Value must be at least ${question.minValue}`,
        };
      }
      if (question.maxValue !== undefined && prediction > question.maxValue) {
        return {
          valid: false,
          reason: `Value must be at most ${question.maxValue}`,
        };
      }
    }

    // Up/Down validation
    if (question.predictionType === 'up-down') {
      const validValues = ['up', 'down', 'Up', 'Down', 'UP', 'DOWN'];
      if (!validValues.includes(String(prediction))) {
        return { valid: false, reason: 'Must be "up" or "down"' };
      }
    }

    return { valid: true };
  }
}

// ============================================================================
// GAME UTILITIES
// ============================================================================

export class FantasyGameUtils {
  /**
   * Get game configuration for a game type
   */
  static getGameConfig(gameType: FantasyGameType): GameConfiguration {
    return GAME_CONFIGURATIONS[gameType];
  }

  /**
   * Get category display name
   */
  static getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      'price-prediction': 'Price Prediction',
      'trend-fashion': 'Trend & Fashion',
      'celebrity-viral': 'Celebrity & Viral',
      'daily-grocery': 'Daily Grocery Staples',
    };
    return names[category] || category;
  }

  /**
   * Get game type display name
   */
  static getGameTypeDisplayName(gameType: FantasyGameType): string {
    const names: Record<FantasyGameType, string> = {
      'gold-ornament-price': 'Gold Ornament Price',
      'silk-saree-price': 'Silk Saree Price',
      'makeup-beauty-price': 'Makeup & Beauty Price',
      'vegetable-price': 'Vegetable Price',
      'fruit-price': 'Fruit Price',
      'saree-color-trend': 'Saree Color Trend',
      'jewelry-design-trend': 'Jewelry Design Trend',
      'bridal-makeup-trend': 'Bridal Makeup Trend',
      'actress-fashion-trend': 'Actress Fashion Trend',
      'celebrity-saree-look': 'Celebrity Saree Look',
      'viral-fashion-look': 'Viral Fashion Look',
      'daily-grocery-price': 'Daily Grocery Price',
    };
    return names[gameType] || gameType;
  }

  /**
   * Check if game is currently active
   */
  static isGameActive(game: FantasyGame): boolean {
    if (game.status !== 'active') return false;
    
    const now = new Date();
    const startTime = game.startTime instanceof Date 
      ? game.startTime 
      : (game.startTime as any)?.toDate?.() || new Date();
    const endTime = game.endTime instanceof Date 
      ? game.endTime 
      : (game.endTime as any)?.toDate?.() || new Date();
    
    return now >= startTime && now <= endTime;
  }

  /**
   * Check if results can be revealed
   */
  static canRevealResults(game: FantasyGame): boolean {
    if (game.status === 'results-declared') return false;
    
    const now = new Date();
    const revealTime = game.resultRevealTime instanceof Date 
      ? game.resultRevealTime 
      : (game.resultRevealTime as any)?.toDate?.() || new Date();
    
    return now >= revealTime;
  }
}

