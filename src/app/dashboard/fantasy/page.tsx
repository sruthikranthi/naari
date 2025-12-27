'use client';

import { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import type { FantasyGame } from '@/lib/fantasy/types';
import { FantasyGameUtils } from '@/lib/fantasy/engine';
import { LEGAL_DISCLAIMER } from '@/lib/fantasy/constants';
import { SponsorBanner } from '@/components/ads/sponsor-banner';

export default function FantasyLobbyPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
    </div>
  );
}

