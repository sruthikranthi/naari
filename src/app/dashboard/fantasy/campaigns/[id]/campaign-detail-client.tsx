'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Coins, Clock, Users, Trophy, Award, ExternalLink, IndianRupee } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { FantasyCampaign } from '@/lib/fantasy/campaign-types';
import type { FantasyGame } from '@/lib/fantasy/types';
import { getFantasyCampaign } from '@/lib/fantasy/campaign-services';
import { getAllFantasyGames } from '@/lib/fantasy/services';
import { SponsorBanner } from '@/components/ads/sponsor-banner';

interface CampaignDetailClientProps {
  campaignId: string;
}

export default function CampaignDetailClient({ campaignId }: CampaignDetailClientProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<FantasyCampaign | null>(null);
  const [games, setGames] = useState<FantasyGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !campaignId) return;

    const loadCampaign = async () => {
      try {
        setLoading(true);
        const campaignData = await getFantasyCampaign(firestore, campaignId);
        setCampaign(campaignData);

        if (campaignData?.gameIds && campaignData.gameIds.length > 0) {
          // Load all games - filter to only include games in this campaign
          const allGames = await getAllFantasyGames(firestore);
          const campaignGames = allGames.filter(game => 
            campaignData.gameIds.includes(game.id)
          );
          setGames(campaignGames);
        }
      } catch (error) {
        console.error('Error loading campaign:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load campaign details.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [firestore, campaignId, toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-6">
        <PageHeader title="Campaign Not Found" description="The campaign you're looking for doesn't exist." />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Campaign not found or has been removed.</p>
            <Link href="/dashboard/fantasy">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Fantasy Zone
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const startDate = campaign.startDate instanceof Date 
    ? campaign.startDate 
    : (campaign.startDate as any)?.toDate?.() || new Date();
  const endDate = campaign.endDate instanceof Date 
    ? campaign.endDate 
    : (campaign.endDate as any)?.toDate?.() || new Date();

  return (
    <div className="space-y-6">
      {/* Event Sponsor Banner */}
      {campaign.sponsorId && (
        <SponsorBanner position="PRE_GAME" gameId={campaign.gameIds[0]} variant="compact" />
      )}

      <div className="flex items-center gap-4">
        <Link href="/dashboard/fantasy">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={campaign.title}
          description={campaign.description || 'Fantasy campaign with prizes and rewards'}
        />
      </div>

      {/* Campaign Banner Image */}
      {campaign.imageUrl && (
        <Card className="overflow-hidden">
          <div className="relative w-full h-64">
            <Image
              src={campaign.imageUrl}
              alt={campaign.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Info */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Campaign Type</p>
                  <p className="font-medium capitalize">{campaign.campaignType.replace('-', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                    {campaign.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{startDate.toLocaleDateString()}</p>
                </div>
                {campaign.endDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{endDate.toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {campaign.sponsorName && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Sponsored By</p>
                  <div className="flex items-center gap-3">
                    {campaign.sponsorLogoUrl && (
                      <Image
                        src={campaign.sponsorLogoUrl}
                        alt={campaign.sponsorName}
                        width={40}
                        height={40}
                        className="rounded"
                        unoptimized
                      />
                    )}
                    <p className="font-medium">{campaign.sponsorName}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Games in Campaign */}
          <Card>
            <CardHeader>
              <CardTitle>Games in This Campaign</CardTitle>
              <CardDescription>
                Click on a game to play and make predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {games.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No games available in this campaign yet. Check back soon!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {games.map((game) => {
                    const gameStartTime = game.startTime instanceof Date 
                      ? game.startTime 
                      : (game.startTime as any)?.toDate?.() || new Date();
                    const gameEndTime = game.endTime instanceof Date 
                      ? game.endTime 
                      : (game.endTime as any)?.toDate?.() || new Date();
                    const isActive = new Date() >= gameStartTime && new Date() <= gameEndTime;

                    return (
                      <Card key={game.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">{game.title}</h3>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {game.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Coins className="h-4 w-4" />
                                  <span>{game.entryCoins} coins</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>{game.totalParticipants} players</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>Ends: {gameEndTime.toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <Link href={`/dashboard/fantasy/${game.id}`}>
                              <Button variant={isActive ? "default" : "outline"} disabled={!isActive}>
                                {isActive ? 'Play Game' : 'Game Ended'}
                                <ExternalLink className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Entry & Prizes */}
          <Card>
            <CardHeader>
              <CardTitle>Entry & Prizes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Entry Type</p>
                <Badge variant="outline" className="capitalize">
                  {campaign.entryType === 'free' ? 'Free Entry' : 
                   campaign.entryType === 'paid' ? `Paid - ₹${campaign.entryFee}` :
                   `Coin-Based - ${campaign.entryCoins} coins`}
                </Badge>
              </div>

              {campaign.prizePool && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prize Pool</p>
                  <p className="font-semibold text-lg">{campaign.prizePool}</p>
                </div>
              )}

              {campaign.totalPrizeValue && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Prize Value</p>
                  <p className="font-semibold text-lg">
                    {campaign.currency === 'INR' ? '₹' : '$'}
                    {campaign.totalPrizeValue.toLocaleString()}
                  </p>
                </div>
              )}

              {campaign.prizeTiers && campaign.prizeTiers.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold mb-3">Prize Tiers</p>
                  <div className="space-y-2">
                    {campaign.prizeTiers.map((tier, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">Rank {tier.rankStart}-{tier.rankEnd}:</span>
                        <span>{tier.prize}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {campaign.maxParticipants && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Max Participants</p>
                  <p className="font-medium">{campaign.maxParticipants}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Participants</span>
                <span className="font-semibold">{campaign.totalParticipants || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Entries</span>
                <span className="font-semibold">{campaign.totalEntries || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Games</span>
                <span className="font-semibold">{games.length}</span>
              </div>
            </CardContent>
          </Card>

          {campaign.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{campaign.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

