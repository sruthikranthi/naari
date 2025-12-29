'use client';

import { useState, useEffect } from 'react';
import type { Firestore } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader, Target, TrendingUp, DollarSign } from 'lucide-react';
import { getAdConversions, getConversionRate } from '@/lib/ads/conversion-tracking';
import type { AdCreative } from '@/lib/ads/types';
import type { ConversionEvent } from '@/lib/ads/types';

interface ConversionsDashboardProps {
  firestore: Firestore;
  creatives: AdCreative[];
}

export function ConversionsDashboard({ firestore, creatives }: ConversionsDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<string>('');
  const [conversions, setConversions] = useState<ConversionEvent[]>([]);
  const [conversionRate, setConversionRate] = useState<{
    conversions: number;
    clicks: number;
    conversionRate: number;
    totalValue: number;
  } | null>(null);

  const loadConversions = async () => {
    if (!selectedCreative || !firestore) return;
    setLoading(true);
    try {
      const [conversionEvents, rate] = await Promise.all([
        getAdConversions(firestore, selectedCreative),
        getConversionRate(firestore, selectedCreative),
      ]);
      setConversions(conversionEvents);
      setConversionRate(rate);
    } catch (error: any) {
      console.error('Error loading conversions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCreative) {
      loadConversions();
    } else {
      setConversions([]);
      setConversionRate(null);
    }
  }, [selectedCreative, firestore]);

  const getEventTypeBadge = (eventType: string) => {
    const colors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PURCHASE: 'default',
      SIGNUP: 'secondary',
      DOWNLOAD: 'outline',
      CLICK_THROUGH: 'outline',
      VIEW: 'outline',
      ENGAGEMENT: 'secondary',
    };
    return colors[eventType] || 'outline';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Conversion Tracking</CardTitle>
          <CardDescription>Track and analyze ad conversion events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Ad Creative</label>
            <Select value={selectedCreative} onValueChange={setSelectedCreative}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an ad creative" />
              </SelectTrigger>
              <SelectContent>
                {creatives.length === 0 ? (
                  <SelectItem value="none" disabled>No creatives available</SelectItem>
                ) : (
                  creatives.map((creative) => (
                    <SelectItem key={creative.id} value={creative.id}>
                      {creative.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedCreative && conversionRate && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate.conversions}</div>
              <p className="text-xs text-muted-foreground">Total conversions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate.conversionRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">From {conversionRate.clicks} clicks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{conversionRate.totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total conversion value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clicks</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate.clicks}</div>
              <p className="text-xs text-muted-foreground">Total ad clicks</p>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedCreative && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Events</CardTitle>
            <CardDescription>Detailed conversion event history</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-48 w-full items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : conversions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No conversion events recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {conversions.map((conversion) => (
                  <div key={conversion.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getEventTypeBadge(conversion.eventType)}>
                            {conversion.eventType}
                          </Badge>
                          {conversion.value && (
                            <span className="font-semibold">₹{conversion.value.toFixed(2)}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          User: {conversion.userId.slice(0, 12)}...
                        </p>
                        {conversion.timestamp && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {conversion.timestamp instanceof Date
                              ? conversion.timestamp.toLocaleString()
                              : (conversion.timestamp as any)?.toDate?.()?.toLocaleString() || 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                    {conversion.metadata && Object.keys(conversion.metadata).length > 0 && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <p className="font-semibold mb-1">Metadata:</p>
                        <pre className="text-xs">{JSON.stringify(conversion.metadata, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

