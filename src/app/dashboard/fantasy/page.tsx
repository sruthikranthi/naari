'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  TrendingUp, 
  ShoppingBag, 
  Heart, 
  Star,
  Coins,
  Clock,
  Users,
  ArrowRight,
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { FantasyGame } from '@/lib/fantasy/types';
import type { FantasyCampaign } from '@/lib/fantasy/campaign-types';
import { FantasyGameUtils } from '@/lib/fantasy/engine';
import { LEGAL_DISCLAIMER } from '@/lib/fantasy/constants';
import { SponsorBanner } from '@/components/ads/sponsor-banner';
import { getActiveFantasyCampaigns } from '@/lib/fantasy/campaign-services';
import { getLeaderboard } from '@/lib/fantasy/services';
import { LeaderboardCard } from '@/components/fantasy/leaderboard-card';
import type { LeaderboardPeriod } from '@/lib/fantasy/types';

export default function FantasyLobbyPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedView, setSelectedView] = useState<'games' | 'campaigns' | 'leaderboard'>('games');
  const [campaigns, setCampaigns] = useState<FantasyCampaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('weekly');

  // Query active games
  const gamesQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      let q = query(
        collection(firestore, 'fantasy_games'),
        where('status', '==', 'active'),
        orderBy('startTime', 'desc')
      );
      return q;
    },
    [firestore]
  );

  const { data: games, isLoading } = useCollection<FantasyGame>(gamesQuery);

  // Load campaigns
  useEffect(() => {
    if (!firestore) return;
    const loadCampaigns = async () => {
      try {
        setLoadingCampaigns(true);
        const activeCampaigns = await getActiveFantasyCampaigns(firestore);
        setCampaigns(activeCampaigns);
      } catch (error) {
        console.error('Error loading campaigns:', error);
      } finally {
        setLoadingCampaigns(false);
      }
    };
    loadCampaigns();
  }, [firestore]);

  // Load leaderboard
  useEffect(() => {
    if (!firestore || selectedView !== 'leaderboard') return;
    const loadLeaderboard = async () => {
      try {
        setLoadingLeaderboard(true);
        const lb = await getLeaderboard(firestore, leaderboardPeriod);
        setLeaderboard(lb);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    loadLeaderboard();
  }, [firestore, selectedView, leaderboardPeriod]);

  // Filter games by category
  const filteredGames = games?.filter((game) => {
    if (selectedCategory === 'all') return true;
    return game.category === selectedCategory;
  }) || [];

  // Group games by category
  const gamesByCategory = filteredGames.reduce((acc, game) => {
    if (!acc[game.category]) {
      acc[game.category] = [];
    }
    acc[game.category].push(game);
    return acc;
  }, {} as Record<string, FantasyGame[]>);

  const categories = [
    { id: 'all', label: 'All Games', icon: Sparkles },
    { id: 'price-prediction', label: 'Price Prediction', icon: TrendingUp },
    { id: 'lifestyle-budget', label: 'Lifestyle & Budget', icon: ShoppingBag },
    { id: 'fashion-trend', label: 'Fashion & Trend', icon: Heart },
    { id: 'celebrity-style', label: 'Celebrity & Style', icon: Star },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Campaign Sponsor Banner */}
      <SponsorBanner position="LOBBY_BANNER" variant="compact" />
      
      <PageHeader
        title="Naari Fantasy Zone"
        description="Skill-based prediction games for entertainment. Test your intuition and win coins!"
      />

      {/* Legal Disclaimer */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">{LEGAL_DISCLAIMER.title}</p>
              <p className="text-xs text-muted-foreground">{LEGAL_DISCLAIMER.text}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Tabs (Games vs Campaigns vs Leaderboard) */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as 'games' | 'campaigns' | 'leaderboard')}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="games">Individual Games</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Campaigns View */}
        <TabsContent value="campaigns" className="space-y-6">
          {loadingCampaigns ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Campaigns</h3>
                <p className="text-muted-foreground">
                  Check back soon for new fantasy campaigns with prizes!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => {
                const startDate = campaign.startDate instanceof Date 
                  ? campaign.startDate 
                  : (campaign.startDate as any)?.toDate?.() || new Date();
                const endDate = campaign.endDate instanceof Date 
                  ? campaign.endDate 
                  : (campaign.endDate as any)?.toDate?.() || new Date();

                return (
                  <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                    {campaign.imageUrl && (
                      <div className="relative w-full h-32">
                        <Image
                          src={campaign.imageUrl}
                          alt={campaign.title}
                          fill
                          className="object-cover rounded-t-lg"
                          unoptimized
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{campaign.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {campaign.description || 'Fantasy campaign with prizes'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="secondary" className="capitalize">
                          {campaign.campaignType.replace('-', ' ')}
                        </Badge>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>
                          {campaign.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {campaign.prizePool && (
                          <div className="flex items-center gap-2 text-sm">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            <span className="text-muted-foreground">{campaign.prizePool}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {endDate ? `Ends: ${endDate.toLocaleDateString()}` : 'Ongoing'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{campaign.totalParticipants || 0} participants</span>
                        </div>
                        <Link href={`/dashboard/fantasy/campaigns/${campaign.id}`}>
                          <Button className="w-full" variant="default">
                            View Campaign
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Leaderboard View */}
        <TabsContent value="leaderboard" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Fantasy Leaderboard</h2>
            <Tabs value={leaderboardPeriod} onValueChange={(v) => setLeaderboardPeriod(v as LeaderboardPeriod)}>
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="all-time">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {loadingLeaderboard ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <Trophy className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ) : leaderboard && leaderboard.entries && leaderboard.entries.length > 0 ? (
            <LeaderboardCard 
              entries={leaderboard.entries} 
              period={leaderboardPeriod}
              title={`${leaderboardPeriod.charAt(0).toUpperCase() + leaderboardPeriod.slice(1)} Leaderboard`}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Leaderboard Data</h3>
                <p className="text-muted-foreground">
                  Play some games to see your ranking on the leaderboard!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Games View */}
        <TabsContent value="games">
          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-5">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Games List */}
        <div className="mt-6 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredGames.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Games</h3>
                <p className="text-muted-foreground">
                  Check back soon for new fantasy prediction games!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGames.map((game) => {
                const startTime = game.startTime instanceof Date 
                  ? game.startTime 
                  : (game.startTime as any)?.toDate?.() || new Date();
                const endTime = game.endTime instanceof Date 
                  ? game.endTime 
                  : (game.endTime as any)?.toDate?.() || new Date();
                const isActive = FantasyGameUtils.isGameActive(game);

                return (
                  <Card key={game.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{game.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {game.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="secondary">
                          {FantasyGameUtils.getCategoryDisplayName(game.category)}
                        </Badge>
                        <Badge variant="outline">
                          {FantasyGameUtils.getGameTypeDisplayName(game.gameType)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Game Stats */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Coins className="h-4 w-4" />
                            <span>{game.entryCoins} coins</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{game.totalParticipants} players</span>
                          </div>
                        </div>

                        {/* Timing */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            Ends: {endTime.toLocaleDateString()} {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Action Button */}
                        <Link href={`/dashboard/fantasy/${game.id}`}>
                          <Button 
                            className="w-full" 
                            variant={isActive ? "default" : "outline"}
                            disabled={!isActive}
                          >
                            {isActive ? (
                              <>
                                Play Now
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            ) : (
                              'Game Ended'
                            )}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}

