/**
 * Question Selection & Rotation Engine
 * 
 * Handles intelligent selection of questions from the question pool
 * for game sessions. Supports filtering by tags, difficulty, events, etc.
 */

import type { Firestore } from 'firebase/firestore';
import type { FantasyQuestion, QuestionDifficulty } from './types';
import { getFantasyQuestionsByGame, getActiveFantasyEvents, getFantasyEvent } from './services';

// ============================================================================
// QUESTION SELECTION OPTIONS
// ============================================================================

export type QuestionSelectionOptions = {
  /**
   * Number of questions to select (default: 3)
   */
  count?: number;
  
  /**
   * Minimum number of questions (if not enough available, returns what's available)
   */
  minCount?: number;
  
  /**
   * Filter by difficulty levels
   */
  difficulties?: QuestionDifficulty[];
  
  /**
   * Filter by tags (questions must have at least one matching tag)
   */
  tags?: string[];
  
  /**
   * Filter by source
   */
  source?: 'market' | 'trend' | 'celebrity' | 'admin' | 'system';
  
  /**
   * Event ID - if provided, only select questions from this event
   */
  eventId?: string;
  
  /**
   * Whether to prioritize seasonal questions based on current date
   */
  prioritizeSeasonal?: boolean;
  
  /**
   * Exclude question IDs (to avoid duplicates)
   */
  excludeQuestionIds?: string[];
  
  /**
   * Random seed for reproducible selection (optional)
   */
  seed?: number;
};

// ============================================================================
// QUESTION SELECTION FUNCTIONS
// ============================================================================

/**
 * Select questions for a game session from the question pool
 * 
 * @param firestore Firestore instance
 * @param gameId Game ID
 * @param options Selection options
 * @returns Selected questions (2-3 by default)
 */
export async function selectQuestionsForGame(
  firestore: Firestore,
  gameId: string,
  options: QuestionSelectionOptions = {}
): Promise<FantasyQuestion[]> {
  const {
    count = 3,
    minCount = 2,
    difficulties,
    tags,
    source,
    eventId,
    prioritizeSeasonal = true,
    excludeQuestionIds = [],
    seed,
  } = options;

  // Step 1: Get questions from event if eventId provided
  let candidateQuestions: FantasyQuestion[] = [];
  
  if (eventId) {
    const event = await getActiveFantasyEvents(firestore, gameId).then(events =>
      events.find(e => e.id === eventId)
    );
    
    if (event && event.questionIds.length > 0) {
      // Fetch questions by IDs from event
      const eventQuestions = await getFantasyQuestionsByGame(firestore, gameId, {
        isActive: true,
        source,
      });
      
      candidateQuestions = eventQuestions.filter(q =>
        event.questionIds.includes(q.id) &&
        !excludeQuestionIds.includes(q.id)
      );
    }
  } else {
    // Step 2: Get all active questions for this game
    candidateQuestions = await getFantasyQuestionsByGame(firestore, gameId, {
      isActive: true,
      source,
      difficulty: difficulties?.[0], // Firestore query limitation - can only filter by one difficulty
    });
  }

  // Step 3: Apply client-side filters
  let filteredQuestions = candidateQuestions.filter(q => {
    // Exclude specified question IDs
    if (excludeQuestionIds.includes(q.id)) {
      return false;
    }

    // Filter by difficulty (if multiple specified)
    if (difficulties && difficulties.length > 0) {
      if (!q.difficulty || !difficulties.includes(q.difficulty)) {
        return false;
      }
    }

    // Filter by tags (question must have at least one matching tag)
    if (tags && tags.length > 0) {
      if (!q.tags || q.tags.length === 0) {
        return false;
      }
      const hasMatchingTag = tags.some(tag => q.tags!.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }

    return true;
  });

  // Step 4: Prioritize seasonal questions if enabled
  if (prioritizeSeasonal && filteredQuestions.length > count) {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    
    // Determine current season/period
    const isWeddingSeason = month >= 10 || month <= 2; // Nov-Feb
    const isFestivalSeason = month >= 8 && month <= 10; // Sep-Nov (Diwali, etc.)
    
    const seasonalQuestions = filteredQuestions.filter(q => {
      if (!q.tags) return false;
      if (isWeddingSeason && q.tags.includes('wedding')) return true;
      if (isFestivalSeason && q.tags.includes('festival')) return true;
      if (q.tags.includes('seasonal')) return true;
      return false;
    });

    // If we have seasonal questions, prioritize them
    if (seasonalQuestions.length > 0) {
      const nonSeasonal = filteredQuestions.filter(q => !seasonalQuestions.includes(q));
      // Mix: 50% seasonal, 50% regular (if available)
      const seasonalCount = Math.min(
        Math.ceil(count / 2),
        seasonalQuestions.length
      );
      const regularCount = count - seasonalCount;
      
      const selectedSeasonal = shuffleArray(seasonalQuestions, seed).slice(0, seasonalCount);
      const selectedRegular = shuffleArray(nonSeasonal, seed).slice(0, regularCount);
      
      filteredQuestions = [...selectedSeasonal, ...selectedRegular];
    }
  }

  // Step 5: Shuffle and select
  const shuffled = shuffleArray(filteredQuestions, seed);
  
  // Select requested count, but ensure we have at least minCount
  const selectedCount = Math.max(
    Math.min(count, shuffled.length),
    Math.min(minCount, shuffled.length)
  );

  return shuffled.slice(0, selectedCount);
}

/**
 * Select questions with balanced difficulty distribution
 * 
 * Tries to select a mix of easy, medium, and hard questions
 */
export async function selectBalancedQuestions(
  firestore: Firestore,
  gameId: string,
  options: QuestionSelectionOptions = {}
): Promise<FantasyQuestion[]> {
  const { count = 3, minCount = 2, tags, source, excludeQuestionIds = [], seed } = options;

  // Get all active questions
  const allQuestions = await getFantasyQuestionsByGame(firestore, gameId, {
    isActive: true,
    source,
  });

  // Filter by tags and exclusions
  let filtered = allQuestions.filter(q => {
    if (excludeQuestionIds.includes(q.id)) return false;
    if (tags && tags.length > 0) {
      if (!q.tags || !tags.some(tag => q.tags!.includes(tag))) {
        return false;
      }
    }
    return true;
  });

  // Group by difficulty
  const byDifficulty: Record<QuestionDifficulty | 'none', FantasyQuestion[]> = {
    easy: [],
    medium: [],
    hard: [],
    none: [],
  };

  filtered.forEach(q => {
    const difficulty = q.difficulty || 'none';
    byDifficulty[difficulty].push(q);
  });

  // Try to get balanced distribution
  const selected: FantasyQuestion[] = [];
  const targetCount = Math.max(count, minCount);
  
  // Calculate distribution: 40% easy, 40% medium, 20% hard
  const easyCount = Math.ceil(targetCount * 0.4);
  const mediumCount = Math.ceil(targetCount * 0.4);
  const hardCount = targetCount - easyCount - mediumCount;

  // Select from each difficulty level
  if (byDifficulty.easy.length > 0) {
    selected.push(...shuffleArray(byDifficulty.easy, seed).slice(0, easyCount));
  }
  if (byDifficulty.medium.length > 0 && selected.length < targetCount) {
    selected.push(...shuffleArray(byDifficulty.medium, seed).slice(0, mediumCount));
  }
  if (byDifficulty.hard.length > 0 && selected.length < targetCount) {
    selected.push(...shuffleArray(byDifficulty.hard, seed).slice(0, hardCount));
  }
  
  // Fill remaining slots with any available questions
  if (selected.length < targetCount) {
    const remaining = filtered.filter(q => !selected.includes(q));
    selected.push(...shuffleArray(remaining, seed).slice(0, targetCount - selected.length));
  }

  return selected.slice(0, targetCount);
}

/**
 * Select questions for daily rotation
 * 
 * Prioritizes questions tagged with 'daily' and rotates based on date
 */
export async function selectDailyQuestions(
  firestore: Firestore,
  gameId: string,
  options: Omit<QuestionSelectionOptions, 'tags' | 'prioritizeSeasonal'> = {}
): Promise<FantasyQuestion[]> {
  return selectQuestionsForGame(firestore, gameId, {
    ...options,
    tags: ['daily'],
    prioritizeSeasonal: false,
  });
}

/**
 * Select questions for weekly rotation
 * 
 * Uses week number as seed for consistent weekly rotation
 */
export async function selectWeeklyQuestions(
  firestore: Firestore,
  gameId: string,
  options: Omit<QuestionSelectionOptions, 'seed'> = {}
): Promise<FantasyQuestion[]> {
  // Calculate week number (ISO week)
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return selectQuestionsForGame(firestore, gameId, {
    ...options,
    seed: weekNumber,
  });
}

/**
 * Select questions for a specific event
 */
export async function selectEventQuestions(
  firestore: Firestore,
  gameId: string,
  eventId: string,
  options: Omit<QuestionSelectionOptions, 'eventId'> = {}
): Promise<FantasyQuestion[]> {
  return selectQuestionsForGame(firestore, gameId, {
    ...options,
    eventId,
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Shuffle array using Fisher-Yates algorithm
 * Supports optional seed for reproducible shuffling
 */
function shuffleArray<T>(array: T[], seed?: number): T[] {
  const shuffled = [...array];
  
  if (seed !== undefined) {
    // Seeded random number generator
    let rng = seedRandom(seed);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  } else {
    // Standard random shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  }
  
  return shuffled;
}

/**
 * Simple seeded random number generator
 */
function seedRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

/**
 * Get available question count for a game
 */
export async function getAvailableQuestionCount(
  firestore: Firestore,
  gameId: string,
  options?: {
    tags?: string[];
    difficulty?: QuestionDifficulty;
    source?: string;
  }
): Promise<number> {
  const questions = await getFantasyQuestionsByGame(firestore, gameId, {
    isActive: true,
    source: options?.source,
    difficulty: options?.difficulty,
  });

  if (options?.tags && options.tags.length > 0) {
    return questions.filter(q => {
      if (!q.tags || q.tags.length === 0) return false;
      return options.tags!.some(tag => q.tags!.includes(tag));
    }).length;
  }

  return questions.length;
}

