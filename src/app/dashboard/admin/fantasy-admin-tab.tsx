'use client';

import { useState, useEffect } from 'react';
import type { Firestore } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Coins, TrendingUp, Loader } from 'lucide-react';
import {
  createSampleGoldPriceGame,
  createSampleSareePriceGame,
  createSampleMakeupPriceGame,
} from '@/lib/fantasy/admin-utils';
import { getActiveFantasyGames } from '@/lib/fantasy/services';
import type { FantasyGame } from '@/lib/fantasy/types';
import { FantasyGameUtils } from '@/lib/fantasy/engine';
import Link from 'next/link';

interface FantasyAdminTabProps {
  firestore: Firestore | null;
  user: FirebaseUser | null;
  toast: ReturnType<typeof useToast>['toast'];
}

export function FantasyAdminTab({ firestore, user, toast }: FantasyAdminTabProps) {
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [activeGames, setActiveGames] = useState<FantasyGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  if (!firestore || !user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Please sign in to manage fantasy games.</p>
        </CardContent>
      </Card>
    );
  }

  const loadGames = async () => {
    if (!firestore) return;
    try {
      setLoadingGames(true);
      const games = await getActiveFantasyGames(firestore);
      setActiveGames(games);
    } catch (error) {
      console.error('Error loading games:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load fantasy games.',
      });
    } finally {
      setLoadingGames(false);
    }
  };

  // Load games on mount
  useEffect(() => {
    if (firestore) {
      loadGames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore]);

  const handleCreateGame = async (gameType: 'gold' | 'saree' | 'makeup') => {
    if (!firestore || !user) return;

    setIsCreating(gameType);
    try {
      let gameId: string;
      
      switch (gameType) {
        case 'gold':
          gameId = await createSampleGoldPriceGame(firestore, user.uid);
          break;
        case 'saree':
          gameId = await createSampleSareePriceGame(firestore, user.uid);
          break;
        case 'makeup':
          gameId = await createSampleMakeupPriceGame(firestore, user.uid);
          break;
      }

      toast({
        title: 'Game Created!',
        description: `Successfully created ${gameType} price prediction game.`,
      });

      // Reload games
      await loadGames();
    } catch (error: any) {
      console.error('Error creating game:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create game. Please try again.',
      });
    } finally {
      setIsCreating(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Naari Fantasy Zone - Admin
          </CardTitle>
          <CardDescription>
            Create and manage skill-based prediction games for women.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-3">Quick Create - Price Prediction Games</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Gold Price
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Create a gold ornament price prediction game
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleCreateGame('gold')}
                      disabled={isCreating === 'gold'}
                      className="w-full"
                      size="sm"
                    >
                      {isCreating === 'gold' ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Game'
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Saree Price
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Create a silk saree price prediction game
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleCreateGame('saree')}
                      disabled={isCreating === 'saree'}
                      className="w-full"
                      size="sm"
                    >
                      {isCreating === 'saree' ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Game'
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      Makeup Price
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Create a makeup & beauty price prediction game
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleCreateGame('makeup')}
                      disabled={isCreating === 'makeup'}
                      className="w-full"
                      size="sm"
                    >
                      {isCreating === 'makeup' ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Game'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Games List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Games</CardTitle>
              <CardDescription>Currently running fantasy games</CardDescription>
            </div>
            <Button onClick={loadGames} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingGames ? (
            <div className="flex h-48 w-full items-center justify-center">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeGames.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active games. Create one above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeGames.map((game) => (
                <Card key={game.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{game.title}</h3>
                          <Badge variant="secondary">
                            {FantasyGameUtils.getCategoryDisplayName(game.category)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{game.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Coins className="h-3 w-3" />
                            {game.entryCoins} coins
                          </span>
                          <span>{game.totalParticipants} participants</span>
                        </div>
                      </div>
                      <Link href={`/dashboard/fantasy/${game.id}`}>
                        <Button variant="outline" size="sm">
                          View Game
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

