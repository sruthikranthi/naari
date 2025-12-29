'use client';

import { useState, useEffect } from 'react';
import type { Firestore } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader, Trophy, TrendingUp } from 'lucide-react';
import { getABTestResults, markWinningVariant } from '@/lib/ads/ab-testing';
import type { ABTestResult } from '@/lib/ads/ab-testing';
import type { AdCampaign } from '@/lib/ads/types';
import { useToast } from '@/hooks/use-toast';

interface ABTestingDashboardProps {
  firestore: Firestore;
  campaigns: AdCampaign[];
  toast: ReturnType<typeof useToast>['toast'];
  onUpdate: () => void;
}

export function ABTestingDashboard({ firestore, campaigns, toast, onUpdate }: ABTestingDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [results, setResults] = useState<ABTestResult[]>([]);
  const [markingWinner, setMarkingWinner] = useState<string | null>(null);

  const loadResults = async () => {
    if (!selectedCampaign || !firestore) return;
    setLoading(true);
    try {
      const testResults = await getABTestResults(firestore, selectedCampaign);
      setResults(testResults);
    } catch (error: any) {
      console.error('Error loading A/B test results:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load A/B test results.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCampaign) {
      loadResults();
    } else {
      setResults([]);
    }
  }, [selectedCampaign, firestore]);

  const handleMarkWinner = async (creativeId: string) => {
    if (!selectedCampaign || !firestore) return;
    setMarkingWinner(creativeId);
    try {
      await markWinningVariant(firestore, selectedCampaign, creativeId);
      toast({
        title: 'Success',
        description: 'Winning variant marked. A/B test disabled.',
      });
      onUpdate();
      loadResults();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to mark winning variant.',
      });
    } finally {
      setMarkingWinner(null);
    }
  };

  const abTestCampaigns = campaigns.filter(c => c.abTestEnabled);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>A/B Testing Dashboard</CardTitle>
          <CardDescription>Compare ad creative performance and identify winners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Campaign</label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a campaign with A/B testing enabled" />
                </SelectTrigger>
                <SelectContent>
                  {abTestCampaigns.length === 0 ? (
                    <SelectItem value="none" disabled>No campaigns with A/B testing enabled</SelectItem>
                  ) : (
                    abTestCampaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {abTestCampaigns.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Enable A/B testing on a campaign to see test results here.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedCampaign && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Performance comparison of ad variants</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-48 w-full items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : results.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No test results available. Make sure the campaign has multiple active creatives.
              </p>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={result.creativeId}
                    className={`border rounded-lg p-4 ${
                      result.isWinner ? 'bg-primary/5 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">Variant {index + 1}</h4>
                        {result.isWinner && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            Winner
                          </Badge>
                        )}
                        {result.confidence !== undefined && result.confidence > 0 && (
                          <Badge variant="outline">
                            {result.confidence.toFixed(0)}% confidence
                          </Badge>
                        )}
                      </div>
                      {result.isWinner && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkWinner(result.creativeId)}
                          disabled={markingWinner === result.creativeId}
                        >
                          {markingWinner === result.creativeId ? (
                            <>
                              <Loader className="mr-2 h-4 w-4 animate-spin" />
                              Marking...
                            </>
                          ) : (
                            'Mark as Winner & End Test'
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Impressions</p>
                        <p className="font-semibold">{result.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Clicks</p>
                        <p className="font-semibold">{result.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">CTR</p>
                        <p className="font-semibold flex items-center gap-1">
                          {result.ctr.toFixed(2)}%
                          {result.isWinner && <TrendingUp className="h-3 w-3 text-green-500" />}
                        </p>
                      </div>
                      {result.conversionRate !== undefined && (
                        <div>
                          <p className="text-muted-foreground">Conversion Rate</p>
                          <p className="font-semibold">{result.conversionRate.toFixed(2)}%</p>
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
    </div>
  );
}

