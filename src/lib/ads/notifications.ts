/**
 * Email Notifications for Campaign Performance
 */

import type { Firestore } from 'firebase/firestore';
import { collection, query, where, getDocs, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import type { AdCampaign } from './types';
import { calculateCampaignRevenue, getRevenueSummary } from './revenue';
import { getABTestResults } from './ab-testing';

export interface NotificationConfig {
  campaignId: string;
  email: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'THRESHOLD';
  thresholds?: {
    minImpressions?: number;
    minClicks?: number;
    minCTR?: number;
    minRevenue?: number;
  };
  enabled: boolean;
}

export interface CampaignPerformanceAlert {
  campaignId: string;
  campaignName: string;
  alertType: 'LOW_CTR' | 'LOW_IMPRESSIONS' | 'LOW_REVENUE' | 'AB_TEST_READY' | 'CAMPAIGN_ENDING';
  message: string;
  metrics: {
    impressions?: number;
    clicks?: number;
    ctr?: number;
    revenue?: number;
  };
  timestamp: Date;
}

/**
 * Check campaign performance and generate alerts
 */
export async function checkCampaignPerformance(
  firestore: Firestore,
  campaignId: string
): Promise<CampaignPerformanceAlert[]> {
  const alerts: CampaignPerformanceAlert[] = [];
  
  // Get campaign
  const campaignDoc = await getDocs(query(
    collection(firestore, 'ad_campaigns'),
    where('__name__', '==', campaignId)
  ));
  
  if (campaignDoc.empty) return alerts;
  
  const campaign = { id: campaignId, ...campaignDoc.docs[0].data() } as AdCampaign;
  
  // Get revenue estimate
  const revenue = await calculateCampaignRevenue(firestore, campaignId);
  
  // Check thresholds
  if (revenue.ctr < 1.0 && revenue.impressions > 100) {
    alerts.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      alertType: 'LOW_CTR',
      message: `Campaign "${campaign.name}" has low CTR: ${revenue.ctr.toFixed(2)}%`,
      metrics: {
        impressions: revenue.impressions,
        clicks: revenue.clicks,
        ctr: revenue.ctr,
      },
      timestamp: new Date(),
    });
  }
  
  if (revenue.impressions < 50) {
    alerts.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      alertType: 'LOW_IMPRESSIONS',
      message: `Campaign "${campaign.name}" has low impressions: ${revenue.impressions}`,
      metrics: {
        impressions: revenue.impressions,
      },
      timestamp: new Date(),
    });
  }
  
  if (revenue.estimatedRevenue < 100 && revenue.impressions > 1000) {
    alerts.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      alertType: 'LOW_REVENUE',
      message: `Campaign "${campaign.name}" has low revenue: ₹${revenue.estimatedRevenue.toFixed(2)}`,
      metrics: {
        revenue: revenue.estimatedRevenue,
        impressions: revenue.impressions,
      },
      timestamp: new Date(),
    });
  }
  
  // Check if A/B test is ready
  if (campaign.abTestEnabled) {
    const abResults = await getABTestResults(firestore, campaignId);
    const hasWinner = abResults.some(r => r.confidence && r.confidence > 80);
    
    if (hasWinner) {
      const winner = abResults.find(r => r.isWinner);
      alerts.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        alertType: 'AB_TEST_READY',
        message: `A/B test for "${campaign.name}" has a winner with ${winner?.confidence?.toFixed(0)}% confidence`,
        metrics: {
          ctr: winner?.ctr,
        },
        timestamp: new Date(),
      });
    }
  }
  
  // Check if campaign is ending soon
  const endDate = campaign.endDate instanceof Date 
    ? campaign.endDate 
    : (campaign.endDate as any)?.toDate?.() || new Date();
  const daysUntilEnd = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  
  if (daysUntilEnd <= 3 && daysUntilEnd > 0) {
    alerts.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      alertType: 'CAMPAIGN_ENDING',
      message: `Campaign "${campaign.name}" is ending in ${Math.ceil(daysUntilEnd)} days`,
      metrics: {
        impressions: revenue.impressions,
        clicks: revenue.clicks,
        revenue: revenue.estimatedRevenue,
      },
      timestamp: new Date(),
    });
  }
  
  return alerts;
}

/**
 * Send email notification (placeholder - integrate with email service)
 */
export async function sendCampaignNotification(
  firestore: Firestore,
  email: string,
  subject: string,
  body: string
): Promise<void> {
  // Store notification in database
  await addDoc(collection(firestore, 'ad_notifications'), {
    email,
    subject,
    body,
    sent: false, // Will be sent by a background job
    createdAt: serverTimestamp(),
  });
  
  // In production, integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`[Email Notification] To: ${email}, Subject: ${subject}`);
}

/**
 * Generate and send performance report
 */
export async function sendPerformanceReport(
  firestore: Firestore,
  email: string,
  campaignId?: string
): Promise<void> {
  if (campaignId) {
    // Single campaign report
    const revenue = await calculateCampaignRevenue(firestore, campaignId);
    const alerts = await checkCampaignPerformance(firestore, campaignId);
    
    const subject = `Campaign Performance Report: ${revenue.campaignName}`;
    const body = `
Campaign Performance Report

Campaign: ${revenue.campaignName}
Period: ${revenue.period.start.toLocaleDateString()} - ${revenue.period.end.toLocaleDateString()}

Metrics:
- Impressions: ${revenue.impressions.toLocaleString()}
- Clicks: ${revenue.clicks.toLocaleString()}
- CTR: ${revenue.ctr.toFixed(2)}%
- Estimated Revenue: ₹${revenue.estimatedRevenue.toFixed(2)}

${alerts.length > 0 ? `\nAlerts:\n${alerts.map(a => `- ${a.message}`).join('\n')}` : ''}
    `;
    
    await sendCampaignNotification(firestore, email, subject, body);
  } else {
    // Overall summary report
    const summary = await getRevenueSummary(firestore);
    
    const subject = 'Ad Campaign Performance Summary';
    const body = `
Ad Campaign Performance Summary

Period: ${summary.period.start.toLocaleDateString()} - ${summary.period.end.toLocaleDateString()}

Overall Metrics:
- Total Impressions: ${summary.totalImpressions.toLocaleString()}
- Total Clicks: ${summary.totalClicks.toLocaleString()}
- Overall CTR: ${summary.overallCTR.toFixed(2)}%
- Total Estimated Revenue: ₹${summary.totalEstimatedRevenue.toFixed(2)}

Campaigns: ${summary.campaigns.length}
    `;
    
    await sendCampaignNotification(firestore, email, subject, body);
  }
}

