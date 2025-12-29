'use client';

import { useState, useEffect } from 'react';
import type { Firestore } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader, Brain, TrendingUp, Zap } from 'lucide-react';
import { getCampaignRealTimeCTR, updateDynamicWeights } from '@/lib/ads/real-time-ctr';
import { BayesianABTesting } from '@/lib/ads/bayesian-ab-testing';
import type { AdCampaign } from '@/lib/ads/types';
import { useToast } from '@/hooks/use-toast';

interface MLPerformanceDashboardProps {
  firestore: Firestore;
  campaigns: AdCampaign[];
  toast: ReturnType<typeof useToast>['toast'];
  onUpdate: () => void;
}

export function MLPerformanceDashboard({ firestore, campaigns, toast, onUpdate }: MLPerformanceDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [ctrData, setCtrData] = useState<any>(null);
  const [bayesianResults, setBayesianResults] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);

  const loadMLData = async () => {
    if (!selectedCampaign || !firestore) return;
    setLoading(true);
    try {
      const [ctrMap, bayesian] = await Promise.all([
        getCampaignRealTimeCTR(firestore, selectedCampaign, 24).catch(() => new Map()),
        BayesianABTesting.analyzeTest(firestore, selectedCampaign).catch(() => []),
      ]);
      // Get first creative's CTR data for display
      const firstCtr = ctrMap.size > 0 ? Array.from(ctrMap.values())[0] : null;
      setCtrData(firstCtr);
      setBayesianResults(bayesian);
    } catch (error: any) {
      console.error('Error loading ML data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load ML performance data.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCampaign) {
      loadMLData();
    } else {
      setCtrData(null);
      setBayesianResults([]);
    }
  }, [selectedCampaign, firestore]);

  const handleUpdateWeights = async () => {
    if (!selectedCampaign || !firestore) return;
    setUpdating(true);
    try {
      await updateDynamicWeights(firestore, selectedCampaign);
      toast({
        title: 'Success',
        description: 'Dynamic weights updated successfully.',
      });
      onUpdate();
      loadMLData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update dynamic weights.',
      });
    } finally {
      setUpdating(false);
    }
  };

  const mlEnabledCampaigns = campaigns.filter(c => c.mlConfig || c.dynamicWeightsEnabled);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>ML & Performance Optimization</CardTitle>
          <CardDescription>Machine learning-powered ad performance and optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Campaign</label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a campaign with ML enabled" />
                </SelectTrigger>
                <SelectContent>
                  {mlEnabledCampaigns.length === 0 ? (
                    <SelectItem value="none" disabled>No campaigns with ML enabled</SelectItem>
                  ) : (
                    mlEnabledCampaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {mlEnabledCampaigns.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Enable ML optimization on a campaign to see performance data here.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedCampaign && (
        <>
          {/* Real-time CTR */}
          {ctrData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Real-time CTR</CardTitle>
                    <CardDescription>Last 24 hours performance</CardDescription>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Impressions</p>
                    <p className="text-2xl font-bold">{ctrData.impressions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Clicks</p>
                    <p className="text-2xl font-bold">{ctrData.clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CTR</p>
                    <p className="text-2xl font-bold flex items-center gap-1">
                      {ctrData.ctr.toFixed(2)}%
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bayesian Analysis */}
          {bayesianResults.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Bayesian A/B Test Analysis</CardTitle>
                    <CardDescription>Statistical analysis using Bayesian methods</CardDescription>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    ML-Powered
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex h-48 w-full items-center justify-center">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bayesianResults.map((result) => (
                      <div key={result.creativeId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Variant: {result.variantId}</h4>
                          {result.probabilityBest && (
                            <Badge variant={result.probabilityBest > 0.7 ? 'default' : 'outline'}>
                              {Math.round(result.probabilityBest * 100)}% chance best
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">CTR</p>
                            <p className="font-semibold">{result.ctr.toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Conversions</p>
                            <p className="font-semibold">{result.conversions}</p>
                          </div>
                          {result.bayesFactor && (
                            <div>
                              <p className="text-muted-foreground">Bayes Factor</p>
                              <p className="font-semibold">{result.bayesFactor.toFixed(2)}</p>
                            </div>
                          )}
                          {result.expectedValue && (
                            <div>
                              <p className="text-muted-foreground">Expected Value</p>
                              <p className="font-semibold">{result.expectedValue.toFixed(2)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dynamic Weights */}
          {campaigns.find(c => c.id === selectedCampaign)?.dynamicWeightsEnabled && (
            <Card>
              <CardHeader>
                <CardTitle>Dynamic Weight Optimization</CardTitle>
                <CardDescription>Automatically adjust ad weights based on performance</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleUpdateWeights}
                  disabled={updating}
                  className="w-full"
                >
                  {updating ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Update Dynamic Weights
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  This will recalculate and update ad weights based on recent performance data.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

