/**
 * Machine Learning Optimization for Ad Selection
 * 
 * Implements various ML algorithms for ad selection:
 * - Thompson Sampling (Bayesian)
 * - Upper Confidence Bound (UCB)
 * - Epsilon-Greedy
 * - Linear Regression
 */

import type { Firestore } from 'firebase/firestore';
import type { AdCreative, MLModelConfig, RealTimeCTR } from './types';
import { getCampaignRealTimeCTR } from './real-time-ctr';

/**
 * Thompson Sampling - Bayesian approach to ad selection
 * Balances exploration vs exploitation
 */
export class ThompsonSampling {
  /**
   * Select creative using Thompson Sampling
   */
  static selectCreative(
    creatives: AdCreative[],
    ctrData: Map<string, RealTimeCTR>
  ): AdCreative | null {
    if (creatives.length === 0) return null;
    
    // For each creative, sample from Beta distribution
    const samples = creatives.map((creative) => {
      const ctr = ctrData.get(creative.id);
      if (!ctr) {
        // No data yet - use uniform prior (alpha=1, beta=1)
        return { creative, sample: Math.random() };
      }
      
      // Beta distribution parameters
      // alpha = clicks + 1 (successes + prior)
      // beta = (impressions - clicks) + 1 (failures + prior)
      const alpha = ctr.clicks + 1;
      const beta = (ctr.impressions - ctr.clicks) + 1;
      
      // Sample from Beta distribution (simplified approximation)
      const sample = this.sampleBeta(alpha, beta);
      
      return { creative, sample };
    });
    
    // Select creative with highest sample
    samples.sort((a, b) => b.sample - a.sample);
    return samples[0].creative;
  }
  
  /**
   * Sample from Beta distribution (simplified)
   * In production, use proper Beta distribution library
   */
  private static sampleBeta(alpha: number, beta: number): number {
    // Simplified Beta sampling using Gamma approximation
    // For production, use: https://github.com/trevorld/r-beta
    const gamma1 = this.sampleGamma(alpha, 1);
    const gamma2 = this.sampleGamma(beta, 1);
    return gamma1 / (gamma1 + gamma2);
  }
  
  /**
   * Sample from Gamma distribution (simplified)
   */
  private static sampleGamma(shape: number, scale: number): number {
    // Simplified Gamma sampling
    // For production, use proper Gamma distribution
    let sum = 0;
    for (let i = 0; i < shape; i++) {
      sum += -Math.log(Math.random()) * scale;
    }
    return sum;
  }
}

/**
 * Upper Confidence Bound (UCB) - Optimistic approach
 */
export class UCB {
  /**
   * Select creative using UCB algorithm
   */
  static selectCreative(
    creatives: AdCreative[],
    ctrData: Map<string, RealTimeCTR>,
    confidenceLevel: number = 1.96 // 95% confidence
  ): AdCreative | null {
    if (creatives.length === 0) return null;
    
    const totalImpressions = Array.from(ctrData.values()).reduce(
      (sum, ctr) => sum + ctr.impressions,
      0
    );
    
    const scores = creatives.map((creative) => {
      const ctr = ctrData.get(creative.id);
      if (!ctr || ctr.impressions === 0) {
        // No data - high uncertainty, explore
        return { creative, score: Infinity };
      }
      
      // UCB formula: mean + confidence_bound
      const mean = ctr.ctr / 100; // Convert to 0-1
      const confidenceBound = confidenceLevel * Math.sqrt(
        Math.log(totalImpressions) / ctr.impressions
      );
      
      const score = mean + confidenceBound;
      
      return { creative, score };
    });
    
    // Select creative with highest UCB score
    scores.sort((a, b) => b.score - a.score);
    return scores[0].creative;
  }
}

/**
 * Epsilon-Greedy - Simple exploration/exploitation
 */
export class EpsilonGreedy {
  /**
   * Select creative using Epsilon-Greedy
   */
  static selectCreative(
    creatives: AdCreative[],
    ctrData: Map<string, RealTimeCTR>,
    epsilon: number = 0.1 // 10% exploration
  ): AdCreative | null {
    if (creatives.length === 0) return null;
    
    // Explore: random selection
    if (Math.random() < epsilon) {
      return creatives[Math.floor(Math.random() * creatives.length)];
    }
    
    // Exploit: select best performing
    const scores = creatives.map((creative) => {
      const ctr = ctrData.get(creative.id);
      return {
        creative,
        score: ctr ? ctr.ctr : 0,
      };
    });
    
    scores.sort((a, b) => b.score - a.score);
    return scores[0].creative;
  }
}

/**
 * Linear Regression - Predict performance based on features
 */
export class LinearRegressionModel {
  /**
   * Select creative using linear regression prediction
   */
  static selectCreative(
    creatives: AdCreative[],
    ctrData: Map<string, RealTimeCTR>,
    userFeatures?: {
      location?: string;
      language?: string;
      interests?: string[];
      coinBalance?: number;
    }
  ): AdCreative | null {
    if (creatives.length === 0) return null;
    
    // Simple linear model: predict CTR based on historical performance
    // In production, train actual ML model with more features
    const predictions = creatives.map((creative) => {
      const ctr = ctrData.get(creative.id);
      if (!ctr) {
        return { creative, predictedCTR: 0.01 }; // Default prediction
      }
      
      // Simple prediction: use current CTR as baseline
      // In production, use trained model with features
      let predictedCTR = ctr.ctr / 100;
      
      // Adjust based on user features (simplified)
      if (userFeatures) {
        // Example: users with higher coin balance might click more
        if (userFeatures.coinBalance && userFeatures.coinBalance > 1000) {
          predictedCTR *= 1.1; // 10% boost
        }
      }
      
      return { creative, predictedCTR };
    });
    
    // Select creative with highest predicted CTR
    predictions.sort((a, b) => b.predictedCTR - a.predictedCTR);
    return predictions[0].creative;
  }
}

/**
 * ML Ad Selector - Main interface for ML-based ad selection
 */
export class MLAdSelector {
  /**
   * Select creative using specified ML algorithm
   */
  static async selectCreative(
    firestore: Firestore,
    creatives: AdCreative[],
    campaignId: string,
    mlConfig: MLModelConfig,
    userFeatures?: {
      location?: string;
      language?: string;
      interests?: string[];
      coinBalance?: number;
    }
  ): Promise<AdCreative | null> {
    if (creatives.length === 0) return null;
    if (creatives.length === 1) return creatives[0];
    
    // Get real-time CTR data
    const ctrData = await getCampaignRealTimeCTR(firestore, campaignId);
    
    // Select based on ML algorithm
    switch (mlConfig.modelType) {
      case 'THOMPSON_SAMPLING':
        return ThompsonSampling.selectCreative(creatives, ctrData);
        
      case 'UCB':
        return UCB.selectCreative(
          creatives,
          ctrData,
          mlConfig.confidenceLevel || 1.96
        );
        
      case 'EPSILON_GREEDY':
        return EpsilonGreedy.selectCreative(
          creatives,
          ctrData,
          mlConfig.explorationRate || 0.1
        );
        
      case 'LINEAR_REGRESSION':
        return LinearRegressionModel.selectCreative(
          creatives,
          ctrData,
          userFeatures
        );
        
      default:
        // Fallback to performance-based
        const sorted = creatives.sort((a, b) => {
          const ctrA = ctrData.get(a.id);
          const ctrB = ctrData.get(b.id);
          return (ctrB?.ctr || 0) - (ctrA?.ctr || 0);
        });
        return sorted[0];
    }
  }
}

