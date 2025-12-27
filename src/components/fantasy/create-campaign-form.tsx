'use client';

import { useState, useEffect } from 'react';
import type { Firestore } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Loader } from 'lucide-react';
import { createFantasyCampaign } from '@/lib/fantasy/campaign-services';
import { getAllFantasyGames } from '@/lib/fantasy/services';
import { getAllSponsors } from '@/lib/ads/services';
import type { FantasyGame } from '@/lib/fantasy/types';
import type { Sponsor } from '@/lib/ads/types';
import type { FantasyCampaign, CampaignType, CampaignStatus, CampaignVisibility, EntryType, Currency, PrizeTier } from '@/lib/fantasy/campaign-types';
import { Timestamp } from 'firebase/firestore';

interface CreateCampaignFormProps {
  firestore: Firestore;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
  toast: (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
}

export function CreateCampaignForm({ firestore, userId, onSuccess, onCancel, toast }: CreateCampaignFormProps) {
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<FantasyGame[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    campaignType: 'single-game' as CampaignType,
    gameIds: [] as string[],
    category: '',
    language: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'upcoming' as CampaignStatus,
    visibility: 'public' as CampaignVisibility,
    maxParticipants: '',
    sponsorName: '',
    sponsorLogoUrl: '',
    sponsorId: '',
    entryType: 'free' as EntryType,
    entryFee: '',
    entryCoins: '',
    prizePool: '',
    totalPrizeValue: '',
    currency: 'INR' as Currency,
    notes: '',
  });

  const [prizeTiers, setPrizeTiers] = useState<PrizeTier[]>([]);

  // Load games and sponsors
  useEffect(() => {
    const loadData = async () => {
      try {
        const [allGames, allSponsors] = await Promise.all([
          getAllFantasyGames(firestore).catch(() => []),
          getAllSponsors(firestore).catch(() => []),
        ]);
        setGames(allGames);
        setSponsors(allSponsors);
      } catch (error) {
        console.error('Error loading data:', error);
        // Set empty arrays on error to prevent crashes
        setGames([]);
        setSponsors([]);
      }
    };
    if (firestore) {
      loadData();
    }
  }, [firestore]);

  const handleAddPrizeTier = () => {
    setPrizeTiers([
      ...prizeTiers,
      {
        rankStart: prizeTiers.length + 1,
        rankEnd: prizeTiers.length + 1,
        prize: '',
        currency: 'INR',
      },
    ]);
  };

  const handleRemovePrizeTier = (index: number) => {
    setPrizeTiers(prizeTiers.filter((_, i) => i !== index));
  };

  const handleUpdatePrizeTier = (index: number, updates: Partial<PrizeTier>) => {
    const newTiers = [...prizeTiers];
    newTiers[index] = { ...newTiers[index], ...updates };
    setPrizeTiers(newTiers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (campaignForm.campaignType === 'single-game' && campaignForm.gameIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select at least one game.',
      });
      return;
    }

    setLoading(true);
    try {
      const campaignData: Omit<FantasyCampaign, 'id' | 'createdAt' | 'updatedAt' | 'totalParticipants' | 'totalEntries'> = {
        title: campaignForm.title,
        campaignType: campaignForm.campaignType,
        gameIds: campaignForm.gameIds,
        status: campaignForm.status,
        visibility: campaignForm.visibility,
        entryType: campaignForm.entryType,
        currency: campaignForm.currency,
        startDate: Timestamp.fromDate(new Date(campaignForm.startDate)),
        createdBy: userId,
        ...(campaignForm.category && { category: campaignForm.category }),
        ...(campaignForm.language && { language: campaignForm.language }),
        ...(campaignForm.description && { description: campaignForm.description }),
        ...(campaignForm.endDate && { endDate: Timestamp.fromDate(new Date(campaignForm.endDate)) }),
        ...(campaignForm.maxParticipants && { maxParticipants: parseInt(campaignForm.maxParticipants) }),
        ...(campaignForm.sponsorName && { sponsorName: campaignForm.sponsorName }),
        ...(campaignForm.sponsorLogoUrl && { sponsorLogoUrl: campaignForm.sponsorLogoUrl }),
        ...(campaignForm.sponsorId && { sponsorId: campaignForm.sponsorId }),
        ...(campaignForm.entryType === 'paid' && campaignForm.entryFee && { entryFee: parseFloat(campaignForm.entryFee) }),
        ...(campaignForm.entryType === 'coin-based' && campaignForm.entryCoins && { entryCoins: parseInt(campaignForm.entryCoins) }),
        ...(campaignForm.prizePool && { prizePool: campaignForm.prizePool }),
        ...(campaignForm.totalPrizeValue && { totalPrizeValue: parseFloat(campaignForm.totalPrizeValue) }),
        ...(prizeTiers.length > 0 && { prizeTiers }),
        ...(campaignForm.notes && { notes: campaignForm.notes }),
      };

      await createFantasyCampaign(firestore, campaignData);

      toast({
        title: 'Campaign Created!',
        description: 'Fantasy campaign created successfully.',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create campaign.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[90vh] overflow-y-auto p-1">
      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Basic information about the fantasy campaign</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title *</Label>
            <Input
              id="title"
              value={campaignForm.title}
              onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
              required
              placeholder="e.g., Weekend Fantasy – Pan India"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaignType">Campaign Type *</Label>
              <Select
                value={campaignForm.campaignType}
                onValueChange={(value) => setCampaignForm({ ...campaignForm, campaignType: value as CampaignType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single-game">Single Game</SelectItem>
                  <SelectItem value="multi-game">Multi Game</SelectItem>
                  <SelectItem value="category-based">Category Based</SelectItem>
                  <SelectItem value="sponsor-based">Sponsor Based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={campaignForm.language}
                onValueChange={(value) => setCampaignForm({ ...campaignForm, language: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Languages</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
                  <SelectItem value="Telugu">Telugu</SelectItem>
                  <SelectItem value="Tamil">Tamil</SelectItem>
                  <SelectItem value="Kannada">Kannada</SelectItem>
                  <SelectItem value="Malayalam">Malayalam</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Game Selection */}
          <div className="space-y-2">
            <Label>Game(s) *</Label>
            <Select
              value={campaignForm.gameIds[0] || ''}
              onValueChange={(value) => {
                if (campaignForm.campaignType === 'single-game') {
                  setCampaignForm({ ...campaignForm, gameIds: [value] });
                } else {
                  if (!campaignForm.gameIds.includes(value)) {
                    setCampaignForm({ ...campaignForm, gameIds: [...campaignForm.gameIds, value] });
                  }
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a game" />
              </SelectTrigger>
              <SelectContent>
                {games.map((game) => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {campaignForm.gameIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {campaignForm.gameIds.map((gameId) => {
                  const game = games.find(g => g.id === gameId);
                  return (
                    <Badge key={gameId} variant="secondary" className="flex items-center gap-1">
                      {game?.title || gameId}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setCampaignForm({
                            ...campaignForm,
                            gameIds: campaignForm.gameIds.filter(id => id !== gameId),
                          });
                        }}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={campaignForm.description}
              onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
              rows={3}
              placeholder="Campaign description"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={campaignForm.startDate}
                onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={campaignForm.endDate}
                onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={campaignForm.status}
                onValueChange={(value) => setCampaignForm({ ...campaignForm, status: value as CampaignStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility *</Label>
              <Select
                value={campaignForm.visibility}
                onValueChange={(value) => setCampaignForm({ ...campaignForm, visibility: value as CampaignVisibility })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="invite-only">Invite Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants (Optional)</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                value={campaignForm.maxParticipants}
                onChange={(e) => setCampaignForm({ ...campaignForm, maxParticipants: e.target.value })}
                placeholder="e.g., 1000"
              />
            </div>
          </div>

          {/* Sponsor Section */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold">Sponsor Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sponsorName">Sponsor Name (Optional)</Label>
                <Input
                  id="sponsorName"
                  value={campaignForm.sponsorName}
                  onChange={(e) => setCampaignForm({ ...campaignForm, sponsorName: e.target.value })}
                  placeholder="e.g., Kingfisher"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sponsorId">Select Sponsor (Optional)</Label>
                <Select
                  value={campaignForm.sponsorId}
                  onValueChange={(value) => setCampaignForm({ ...campaignForm, sponsorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select from existing sponsors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Sponsor</SelectItem>
                    {sponsors.map((sponsor) => (
                      <SelectItem key={sponsor.id} value={sponsor.id}>
                        {sponsor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sponsorLogoUrl">Sponsor Logo URL (Optional)</Label>
              <Input
                id="sponsorLogoUrl"
                value={campaignForm.sponsorLogoUrl}
                onChange={(e) => setCampaignForm({ ...campaignForm, sponsorLogoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entry Fee & Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>Entry Fee & Rewards</CardTitle>
          <CardDescription>Configure entry requirements and prize distribution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryType">Entry Type *</Label>
              <Select
                value={campaignForm.entryType}
                onValueChange={(value) => setCampaignForm({ ...campaignForm, entryType: value as EntryType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Entry</SelectItem>
                  <SelectItem value="paid">Paid Entry</SelectItem>
                  <SelectItem value="coin-based">Coin Based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {campaignForm.entryType === 'paid' && (
              <div className="space-y-2">
                <Label htmlFor="entryFee">Entry Fee (₹) *</Label>
                <Input
                  id="entryFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={campaignForm.entryFee}
                  onChange={(e) => setCampaignForm({ ...campaignForm, entryFee: e.target.value })}
                  required={campaignForm.entryType === 'paid'}
                  placeholder="e.g., 50"
                />
              </div>
            )}

            {campaignForm.entryType === 'coin-based' && (
              <div className="space-y-2">
                <Label htmlFor="entryCoins">Entry Coins *</Label>
                <Input
                  id="entryCoins"
                  type="number"
                  min="1"
                  value={campaignForm.entryCoins}
                  onChange={(e) => setCampaignForm({ ...campaignForm, entryCoins: e.target.value })}
                  required={campaignForm.entryType === 'coin-based'}
                  placeholder="e.g., 10"
                />
              </div>
            )}
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Prize Distribution (Optional)</h4>
                <p className="text-sm text-muted-foreground">
                  Configure prize tiers based on rankings. Prizes will be distributed based on final leaderboard positions.
                </p>
              </div>
              <Button type="button" onClick={handleAddPrizeTier} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Tier
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prizePool">Prize Pool (Optional)</Label>
              <Input
                id="prizePool"
                value={campaignForm.prizePool}
                onChange={(e) => setCampaignForm({ ...campaignForm, prizePool: e.target.value })}
                placeholder="e.g., Vouchers & 1,00,000 Coins"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalPrizeValue">Total Prize Pool Value (Optional)</Label>
                <Input
                  id="totalPrizeValue"
                  type="number"
                  min="0"
                  value={campaignForm.totalPrizeValue}
                  onChange={(e) => setCampaignForm({ ...campaignForm, totalPrizeValue: e.target.value })}
                  placeholder="e.g., 1000000"
                />
                <p className="text-xs text-muted-foreground">
                  Total value of all prizes combined (for display purposes)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  value={campaignForm.currency}
                  onValueChange={(value) => setCampaignForm({ ...campaignForm, currency: value as Currency })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {prizeTiers.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  No prize tiers configured. Click "Add Tier" to add prize distribution tiers.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {prizeTiers.map((tier, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-4">
                        <h5 className="font-semibold">Tier {index + 1}</h5>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePrizeTier(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Rank Start</Label>
                          <Input
                            type="number"
                            min="1"
                            value={tier.rankStart}
                            onChange={(e) => handleUpdatePrizeTier(index, { rankStart: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rank End</Label>
                          <Input
                            type="number"
                            min="1"
                            value={tier.rankEnd}
                            onChange={(e) => handleUpdatePrizeTier(index, { rankEnd: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Prize *</Label>
                          <Input
                            value={tier.prize}
                            onChange={(e) => handleUpdatePrizeTier(index, { prize: e.target.value })}
                            required
                            placeholder="e.g., ₹10,000 + 1000 Coins"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={campaignForm.notes}
              onChange={(e) => setCampaignForm({ ...campaignForm, notes: e.target.value })}
              rows={2}
              placeholder="e.g., Prizes will be distributed within 30 days of campaign completion"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Campaign'
          )}
        </Button>
      </div>
    </form>
  );
}

