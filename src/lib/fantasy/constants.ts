/**
 * Naari Fantasy Zone - Constants
 * 
 * Constants for badges, coin rewards, and other configuration.
 */

import type { BadgeType } from './types';

// ============================================================================
// BADGE DEFINITIONS
// ============================================================================

export const BADGE_DEFINITIONS: Record<
  BadgeType,
  { name: string; description: string; icon?: string }
> = {
  'gold-queen': {
    name: 'Gold Queen',
    description: 'Master of gold price predictions',
    icon: '👑',
  },
  'saree-sensei': {
    name: 'Saree Sensei',
    description: 'Expert in saree trends and prices',
    icon: '🎨',
  },
  'budget-boss': {
    name: 'Budget Boss',
    description: 'Champion of budget predictions',
    icon: '💰',
  },
  'trend-setter': {
    name: 'Trend Setter',
    description: 'Always ahead of fashion trends',
    icon: '✨',
  },
  'prediction-master': {
    name: 'Prediction Master',
    description: 'Consistently accurate predictions',
    icon: '🎯',
  },
  'fantasy-champion': {
    name: 'Fantasy Champion',
    description: 'Top performer in fantasy games',
    icon: '🏆',
  },
  'early-bird': {
    name: 'Early Bird',
    description: 'First to predict in multiple games',
    icon: '🐦',
  },
  'streak-keeper': {
    name: 'Streak Keeper',
    description: 'Maintained winning streak',
    icon: '🔥',
  },
};

// ============================================================================
// COIN REWARDS
// ============================================================================

export const COIN_REWARDS = {
  DAILY_LOGIN: 10,
  BLOG_READ: 5,
  REEL_WATCH: 3,
  QUIZ_COMPLETE: 15,
  REFERRAL: 50, // When referred user signs up
  FANTASY_WIN_EXACT: 50, // Bonus for exact match
  FANTASY_WIN_PARTIAL: 25, // Bonus for near match
  FANTASY_WEEKLY_TOP_10: 100, // Top 10 in weekly leaderboard
  FANTASY_WEEKLY_TOP_3: 200, // Top 3 in weekly leaderboard
  FANTASY_WEEKLY_WINNER: 500, // Weekly leaderboard winner
} as const;

// ============================================================================
// LEADERBOARD CONFIGURATION
// ============================================================================

export const LEADERBOARD_CONFIG = {
  DAILY_UPDATE_INTERVAL: 60 * 60 * 1000, // 1 hour
  WEEKLY_UPDATE_INTERVAL: 6 * 60 * 60 * 1000, // 6 hours
  MONTHLY_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
  MAX_ENTRIES: 100, // Top 100 users
} as const;

// ============================================================================
// GAME DEFAULTS
// ============================================================================

export const GAME_DEFAULTS = {
  MIN_ENTRY_COINS: 5,
  MAX_ENTRY_COINS: 100,
  DEFAULT_GAME_DURATION_HOURS: 24, // Default game duration
  DEFAULT_RESULT_DELAY_HOURS: 2, // Delay before results can be revealed
  MAX_PARTICIPANTS_DEFAULT: 1000,
} as const;

// ============================================================================
// LEGAL DISCLAIMER
// ============================================================================

export const LEGAL_DISCLAIMER = {
  title: 'Skill-Based Prediction Game',
  text: 'This is a skill-based prediction game for entertainment only. No real money is involved. Coins and points have no cash value and cannot be withdrawn.',
  noGambling: true,
  noBetting: true,
  transparentScoring: true,
} as const;

