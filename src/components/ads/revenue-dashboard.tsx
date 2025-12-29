'use client';

import { useState, useEffect } from 'react';
import type { Firestore } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader, TrendingUp, IndianRupee, Eye, MousePointerClick } from 'lucide-react';
import { getRevenueSummary, calculateCampaignRevenue } from '@/lib/ads/revenue';
import type { RevenueSummary, RevenueEstimate } from '@/lib/ads/revenue';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RevenueDashboardProps {
  firestore: Firestore;
}

export function RevenueDashboard({ firestore }: RevenueDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const loadRevenue = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const revenueSummary = await getRevenueSummary(
        firestore,
        new Date(startDate),
        new Date(endDate)
      );
      setSummary(revenueSummary);
    } catch (error) {
      console.error('Error loading revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenue();
  }, [firestore, startDate, endDate]);

  if (loading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No revenue data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summary.totalEstimatedRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Estimated revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Ad views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">User clicks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall CTR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.overallCTR.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Click-through rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Revenue breakdown by campaign</CardDescription>
        </CardHeader>
        <CardContent>
          {summary.campaigns.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No campaign data available.</p>
          ) : (
            <div className="space-y-4">
              {summary.campaigns.map((campaign) => (
                <div key={campaign.campaignId} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{campaign.campaignName}</h4>
                      <p className="text-xs text-muted-foreground">
                        {campaign.period.start.toLocaleDateString()} - {campaign.period.end.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-lg">
                      ₹{campaign.estimatedRevenue.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Impressions</p>
                      <p className="font-semibold">{campaign.impressions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Clicks</p>
                      <p className="font-semibold">{campaign.clicks.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CTR</p>
                      <p className="font-semibold">{campaign.ctr.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Revenue/Click</p>
                      <p className="font-semibold">₹{campaign.revenuePerClick.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

