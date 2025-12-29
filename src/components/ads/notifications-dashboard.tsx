'use client';

import { useState, useEffect } from 'react';
import type { Firestore } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader, AlertTriangle, CheckCircle, Mail, Send } from 'lucide-react';
import { checkCampaignPerformance, sendPerformanceReport } from '@/lib/ads/notifications';
import type { CampaignPerformanceAlert } from '@/lib/ads/notifications';
import type { AdCampaign } from '@/lib/ads/types';
import { useToast } from '@/hooks/use-toast';

interface NotificationsDashboardProps {
  firestore: Firestore;
  campaigns: AdCampaign[];
  toast: ReturnType<typeof useToast>['toast'];
}

export function NotificationsDashboard({ firestore, campaigns, toast }: NotificationsDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [alerts, setAlerts] = useState<CampaignPerformanceAlert[]>([]);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const loadAlerts = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      if (selectedCampaign === 'all') {
        const allAlerts: CampaignPerformanceAlert[] = [];
        for (const campaign of campaigns) {
          try {
            const campaignAlerts = await checkCampaignPerformance(firestore, campaign.id);
            allAlerts.push(...campaignAlerts);
          } catch (error) {
            console.error(`Error checking campaign ${campaign.id}:`, error);
          }
        }
        setAlerts(allAlerts);
      } else {
        const campaignAlerts = await checkCampaignPerformance(firestore, selectedCampaign);
        setAlerts(campaignAlerts);
      }
    } catch (error: any) {
      console.error('Error loading alerts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load performance alerts.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaigns.length > 0) {
      loadAlerts();
    }
  }, [selectedCampaign, firestore, campaigns.length]);

  const handleSendReport = async () => {
    if (!email || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter an email address.',
      });
      return;
    }

    setSending(true);
    try {
      await sendPerformanceReport(
        firestore,
        email,
        selectedCampaign === 'all' ? undefined : selectedCampaign
      );
      toast({
        title: 'Success',
        description: 'Performance report sent successfully.',
      });
      setEmail('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send performance report.',
      });
    } finally {
      setSending(false);
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'LOW_CTR':
      case 'LOW_IMPRESSIONS':
      case 'LOW_REVENUE':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getAlertBadgeVariant = (alertType: string) => {
    switch (alertType) {
      case 'LOW_CTR':
      case 'LOW_IMPRESSIONS':
      case 'LOW_REVENUE':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Performance Alerts</CardTitle>
          <CardDescription>Monitor campaign performance and receive alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign</label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadAlerts} variant="outline" size="sm">
              Refresh Alerts
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex h-48 w-full items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-muted-foreground">No performance alerts. All campaigns are performing well!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.alertType)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">{alert.campaignName}</h4>
                      <Badge variant={getAlertBadgeVariant(alert.alertType)}>
                        {alert.alertType.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                    {alert.metrics && (
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {alert.metrics.impressions !== undefined && (
                          <span>Impressions: {alert.metrics.impressions.toLocaleString()}</span>
                        )}
                        {alert.metrics.clicks !== undefined && (
                          <span>Clicks: {alert.metrics.clicks.toLocaleString()}</span>
                        )}
                        {alert.metrics.ctr !== undefined && (
                          <span>CTR: {alert.metrics.ctr.toFixed(2)}%</span>
                        )}
                        {alert.metrics.revenue !== undefined && (
                          <span>Revenue: ₹{alert.metrics.revenue.toFixed(2)}</span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Send Report */}
      <Card>
        <CardHeader>
          <CardTitle>Send Performance Report</CardTitle>
          <CardDescription>Email a performance report for campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <Button
              onClick={handleSendReport}
              disabled={!email || sending}
              className="w-full"
            >
              {sending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

