/**
 * Bayesian A/B Testing with Multi-Variant Support
 * 
 * Implements Bayesian statistical methods for A/B testing:
 * - Bayesian inference for conversion rates
 * - Multi-variant testing (A/B/C/D...)
 * - Credible intervals
 * - Probability of being best
 */

import type { Firestore } from 'firebase/firestore';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { AdCreative, ConversionEvent } from './types';
import { getRealTimeCTR } from './real-time-ctr';

export interface BayesianTestResult {
  variantId: string;
  creativeId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  
  // Bayesian metrics
  posteriorMean: number; // Expected conversion rate
  credibleInterval: {
    lower: number; // 95% credible interval lower bound
    upper: number; // 95% credible interval upper bound
  };
  probabilityOfBest: number; // Probability this variant is the best
  bayesFactor?: number; // Bayes factor vs baseline
}

/**
 * Bayesian A/B Test Analysis
 */
export class BayesianABTesting {
  /**
   * Analyze A/B test using Bayesian methods
   */
  static async analyzeTest(
    firestore: Firestore,
    campaignId: string,
    baselineCreativeId?: string,
    timeWindow?: number
  ): Promise<BayesianTestResult[]> {
    // Get all creatives for this campaign
    const creativesQuery = query(
      collection(firestore, 'ad_creatives'),
      where('campaignId', '==', campaignId),
      where('active', '==', true)
    );
    
    const creativesSnapshot = await getDocs(creativesQuery);
    const creatives = creativesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AdCreative[];
    
    if (creatives.length === 0) return [];
    
    // Get performance data for each creative
    const results = await Promise.all(
      creatives.map(async (creative) => {
        const ctr = await getRealTimeCTR(firestore, creative.id, campaignId, timeWindow);
        
        // Get conversions
        const conversionsQuery = query(
          collection(firestore, 'ad_conversions'),
          where('adId', '==', creative.id),
          where('timestamp', '>=', Timestamp.fromDate(new Date(Date.now() - (timeWindow || 24 * 60 * 60 * 1000))))
        );
        const conversionsSnapshot = await getDocs(conversionsQuery);
        const conversions = conversionsSnapshot.size;
        
        // Calculate conversion rate
        const conversionRate = ctr.clicks > 0 ? (conversions / ctr.clicks) * 100 : 0;
        
        // Bayesian analysis
        const bayesianMetrics = this.calculateBayesianMetrics(
          conversions,
          ctr.clicks,
          ctr.impressions
        );
        
        return {
          variantId: creative.abTestVariant || creative.id,
          creativeId: creative.id,
          impressions: ctr.impressions,
          clicks: ctr.clicks,
          conversions,
          ctr: ctr.ctr,
          conversionRate,
          ...bayesianMetrics,
        };
      })
    );
    
    // Calculate probability of being best
    const enrichedResults = this.calculateProbabilityOfBest(results);
    
    // Calculate Bayes factors if baseline provided
    if (baselineCreativeId) {
      const baseline = enrichedResults.find(r => r.creativeId === baselineCreativeId);
      if (baseline) {
        return enrichedResults.map(result => ({
          ...result,
          bayesFactor: this.calculateBayesFactor(result, baseline),
        }));
      }
    }
    
    return enrichedResults;
  }
  
  /**
   * Calculate Bayesian metrics using Beta-Binomial model
   */
  private static calculateBayesianMetrics(
    successes: number,
    trials: number,
    impressions: number
  ): {
    posteriorMean: number;
    credibleInterval: { lower: number; upper: number };
  } {
    // Beta-Binomial conjugate prior
    // Prior: Beta(alpha=1, beta=1) - uniform prior
    const alpha = 1;
    const beta = 1;
    
    // Posterior: Beta(alpha + successes, beta + failures)
    const posteriorAlpha = alpha + successes;
    const posteriorBeta = beta + (trials - successes);
    
    // Posterior mean
    const posteriorMean = posteriorAlpha / (posteriorAlpha + posteriorBeta);
    
    // 95% credible interval (simplified approximation)
    // In production, use proper Beta distribution quantiles
    const variance = (posteriorAlpha * posteriorBeta) / 
      ((posteriorAlpha + posteriorBeta) ** 2 * (posteriorAlpha + posteriorBeta + 1));
    const stdDev = Math.sqrt(variance);
    const zScore = 1.96; // 95% confidence
    
    const lower = Math.max(0, posteriorMean - zScore * stdDev);
    const upper = Math.min(1, posteriorMean + zScore * stdDev);
    
    return {
      posteriorMean: posteriorMean * 100, // Convert to percentage
      credibleInterval: {
        lower: lower * 100,
        upper: upper * 100,
      },
    };
  }
  
  /**
   * Calculate probability that each variant is the best
   */
  private static calculateProbabilityOfBest(
    results: Omit<BayesianTestResult, 'probabilityOfBest' | 'bayesFactor'>[]
  ): BayesianTestResult[] {
    // Monte Carlo simulation to estimate probability of being best
    const simulations = 10000;
    const wins = new Map<string, number>();
    
    results.forEach(r => wins.set(r.creativeId, 0));
    
    for (let i = 0; i < simulations; i++) {
      // Sample conversion rate for each variant from posterior
      const samples = results.map(result => {
        const alpha = 1 + result.conversions;
        const beta = 1 + (result.clicks - result.conversions);
        // Simplified Beta sampling
        const sample = this.sampleBeta(alpha, beta);
        return { creativeId: result.creativeId, sample };
      });
      
      // Find winner
      samples.sort((a, b) => b.sample - a.sample);
      const winner = samples[0].creativeId;
      wins.set(winner, (wins.get(winner) || 0) + 1);
    }
    
    // Calculate probabilities
    return results.map(result => ({
      ...result,
      probabilityOfBest: (wins.get(result.creativeId) || 0) / simulations,
    }));
  }
  
  /**
   * Calculate Bayes Factor (evidence strength)
   */
  private static calculateBayesFactor(
    variant: BayesianTestResult,
    baseline: BayesianTestResult
  ): number {
    // Bayes Factor = P(Data | Variant) / P(Data | Baseline)
    // Using Beta-Binomial likelihood
    
    const variantLikelihood = this.betaBinomialLikelihood(
      variant.conversions,
      variant.clicks,
      1, 1 // Prior
    );
    
    const baselineLikelihood = this.betaBinomialLikelihood(
      baseline.conversions,
      baseline.clicks,
      1, 1 // Prior
    );
    
    if (baselineLikelihood === 0) return Infinity;
    
    return variantLikelihood / baselineLikelihood;
  }
  
  /**
   * Beta-Binomial likelihood
   */
  private static betaBinomialLikelihood(
    successes: number,
    trials: number,
    alpha: number,
    beta: number
  ): number {
    // Simplified likelihood calculation
    // In production, use proper Beta-Binomial distribution
    if (trials === 0) return 1;
    
    const posteriorAlpha = alpha + successes;
    const posteriorBeta = beta + (trials - successes);
    
    // Approximate likelihood using Beta function
    // This is a simplified version
    const mean = posteriorAlpha / (posteriorAlpha + posteriorBeta);
    return Math.pow(mean, successes) * Math.pow(1 - mean, trials - successes);
  }
  
  /**
   * Sample from Beta distribution (simplified)
   */
  private static sampleBeta(alpha: number, beta: number): number {
    // Simplified Beta sampling
    const gamma1 = this.sampleGamma(alpha, 1);
    const gamma2 = this.sampleGamma(beta, 1);
    return gamma1 / (gamma1 + gamma2);
  }
  
  /**
   * Sample from Gamma distribution (simplified)
   */
  private static sampleGamma(shape: number, scale: number): number {
    let sum = 0;
    for (let i = 0; i < shape; i++) {
      sum += -Math.log(Math.random()) * scale;
    }
    return sum;
  }
  
  /**
   * Determine if test has reached statistical significance
   */
  static isStatisticallySignificant(
    results: BayesianTestResult[],
    threshold: number = 0.95 // 95% probability
  ): boolean {
    if (results.length < 2) return false;
    
    // Check if any variant has high probability of being best
    const hasHighConfidence = results.some(r => r.probabilityOfBest >= threshold);
    
    // Check if credible intervals don't overlap significantly
    const sorted = results.sort((a, b) => b.posteriorMean - a.posteriorMean);
    const best = sorted[0];
    const second = sorted[1];
    
    // Significant if best's lower bound > second's upper bound
    const intervalsDontOverlap = 
      best.credibleInterval.lower > second.credibleInterval.upper;
    
    return hasHighConfidence && intervalsDontOverlap;
  }
}

