/**
 * Naari Fantasy Zone - Coin Rewards Service
 * 
 * Handles coin rewards for various user activities.
 */

import type { Firestore } from 'firebase/firestore';
import { addCoinTransaction, getUserWallet } from './services';
import { COIN_REWARDS } from './constants';
import type { CoinTransactionType } from './types';

// ============================================================================
// COIN REWARD FUNCTIONS
// ============================================================================

/**
 * Award coins for daily login
 * Returns true if coins were awarded, false if already claimed today
 */
export async function awardDailyLoginCoins(
  firestore: Firestore,
  userId: string
): Promise<{ awarded: boolean; coins: number; message: string }> {
  try {
    // Check if user already claimed today
    const wallet = await getUserWallet(firestore, userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Get today's date string (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    // Check last transaction date (simplified - in production, you'd check transaction history)
    // For now, we'll check if there's a daily login transaction today
    // This is a simplified check - in production, you'd want to query transactions
    
    // Award coins
    await addCoinTransaction(firestore, {
      userId,
      type: 'daily-login',
      amount: COIN_REWARDS.DAILY_LOGIN,
      description: `Daily login bonus - ${today}`,
      metadata: { date: today },
    });

    return {
      awarded: true,
      coins: COIN_REWARDS.DAILY_LOGIN,
      message: `You earned ${COIN_REWARDS.DAILY_LOGIN} coins for logging in today!`,
    };
  } catch (error: any) {
    console.error('Error awarding daily login coins:', error);
    return {
      awarded: false,
      coins: 0,
      message: error.message || 'Failed to award daily login coins',
    };
  }
}

/**
 * Award coins for reading a blog post
 */
export async function awardBlogReadCoins(
  firestore: Firestore,
  userId: string,
  blogId: string,
  blogTitle?: string
): Promise<{ awarded: boolean; coins: number }> {
  try {
    // Check if user already read this blog (prevent duplicate rewards)
    // In production, you'd check transaction history for this blogId
    
    await addCoinTransaction(firestore, {
      userId,
      type: 'blog-read',
      amount: COIN_REWARDS.BLOG_READ,
      description: `Read blog: ${blogTitle || blogId}`,
      metadata: { blogId },
    });

    return {
      awarded: true,
      coins: COIN_REWARDS.BLOG_READ,
    };
  } catch (error: any) {
    console.error('Error awarding blog read coins:', error);
    return {
      awarded: false,
      coins: 0,
    };
  }
}

/**
 * Award coins for watching a reel/video
 */
export async function awardReelWatchCoins(
  firestore: Firestore,
  userId: string,
  reelId: string,
  reelTitle?: string
): Promise<{ awarded: boolean; coins: number }> {
  try {
    // Check if user already watched this reel (prevent duplicate rewards)
    // In production, you'd check transaction history for this reelId
    
    await addCoinTransaction(firestore, {
      userId,
      type: 'reel-watch',
      amount: COIN_REWARDS.REEL_WATCH,
      description: `Watched reel: ${reelTitle || reelId}`,
      metadata: { reelId },
    });

    return {
      awarded: true,
      coins: COIN_REWARDS.REEL_WATCH,
    };
  } catch (error: any) {
    console.error('Error awarding reel watch coins:', error);
    return {
      awarded: false,
      coins: 0,
    };
  }
}

/**
 * Award coins for completing a quiz
 */
export async function awardQuizCompleteCoins(
  firestore: Firestore,
  userId: string,
  quizId: string,
  quizTitle?: string,
  score?: number
): Promise<{ awarded: boolean; coins: number }> {
  try {
    // Check if user already completed this quiz (prevent duplicate rewards)
    // In production, you'd check transaction history for this quizId
    
    await addCoinTransaction(firestore, {
      userId,
      type: 'quiz-complete',
      amount: COIN_REWARDS.QUIZ_COMPLETE,
      description: `Completed quiz: ${quizTitle || quizId}${score ? ` (Score: ${score}%)` : ''}`,
      metadata: { quizId, score },
    });

    return {
      awarded: true,
      coins: COIN_REWARDS.QUIZ_COMPLETE,
    };
  } catch (error: any) {
    console.error('Error awarding quiz complete coins:', error);
    return {
      awarded: false,
      coins: 0,
    };
  }
}

/**
 * Award coins for successful referral
 * Called when a referred user signs up
 */
export async function awardReferralCoins(
  firestore: Firestore,
  referrerUserId: string,
  referredUserId: string
): Promise<{ awarded: boolean; coins: number }> {
  try {
    // Award coins to referrer
    await addCoinTransaction(firestore, {
      userId: referrerUserId,
      type: 'referral',
      amount: COIN_REWARDS.REFERRAL,
      description: `Referral bonus - New user joined`,
      metadata: { referredUserId },
    });

    // Optionally, award welcome coins to the new user
    await addCoinTransaction(firestore, {
      userId: referredUserId,
      type: 'referral',
      amount: COIN_REWARDS.DAILY_LOGIN, // Welcome bonus same as daily login
      description: `Welcome bonus - Referred by friend`,
      metadata: { referrerUserId },
    });

    return {
      awarded: true,
      coins: COIN_REWARDS.REFERRAL,
    };
  } catch (error: any) {
    console.error('Error awarding referral coins:', error);
    return {
      awarded: false,
      coins: 0,
    };
  }
}

/**
 * Check if user can claim daily login bonus
 * Returns true if they haven't claimed today
 */
export async function canClaimDailyLogin(
  firestore: Firestore,
  userId: string
): Promise<boolean> {
  try {
    // In production, you'd query transactions to check if there's a daily-login
    // transaction for today. For now, we'll return true (simplified)
    // This should be implemented with proper transaction history checking
    return true;
  } catch (error) {
    console.error('Error checking daily login claim:', error);
    return false;
  }
}

