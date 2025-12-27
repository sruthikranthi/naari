'use client';

import { useState, useEffect } from 'react';
import type { Firestore } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Coins, TrendingUp, Loader, Edit, Trash2, MoreVertical } from 'lucide-react';
import {
  createSampleGoldPriceGame,
  createSampleSareePriceGame,
  createSampleMakeupPriceGame,
  createSampleKitchenBudgetGame,
  createSampleWeddingBudgetGame,
  createSampleFestivalExpenseGame,
  createSampleHomeExpenseGame,
  createSampleSareeColorTrendGame,
  createSampleJewelryTrendGame,
  createSampleBridalMakeupTrendGame,
  createSampleCelebritySareeGame,
  createSampleActressFashionGame,
} from '@/lib/fantasy/admin-utils';
import { getActiveFantasyGames, getAllFantasyGames, updateFantasyGame, deleteFantasyGame } from '@/lib/fantasy/services';
import type { FantasyGame } from '@/lib/fantasy/types';
import { FantasyGameUtils } from '@/lib/fantasy/engine';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timestamp } from 'firebase/firestore';

interface FantasyAdminTabProps {
  firestore: Firestore | null;
  user: FirebaseUser | null;
  toast: ReturnType<typeof useToast>['toast'];
}

export function FantasyAdminTab({ firestore, user, toast }: FantasyAdminTabProps) {
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [activeGames, setActiveGames] = useState<FantasyGame[]>([]);
  const [allGames, setAllGames] = useState<FantasyGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [showAllGames, setShowAllGames] = useState(false);
  const [editingGame, setEditingGame] = useState<FantasyGame | null>(null);
  const [deletingGame, setDeletingGame] = useState<string | null>(null);

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
      const [active, all] = await Promise.all([
        getActiveFantasyGames(firestore),
        getAllFantasyGames(firestore),
      ]);
      setActiveGames(active);
      setAllGames(all);
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

  const handleDeleteGame = async (gameId: string) => {
    if (!firestore) return;
    
    try {
      await deleteFantasyGame(firestore, gameId);
      toast({
        title: 'Success',
        description: 'Game deleted successfully.',
      });
      setDeletingGame(null);
      await loadGames();
    } catch (error: any) {
      console.error('Error deleting game:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete game.',
      });
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

            {/* Lifestyle & Budget Games */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Lifestyle & Budget Games</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Kitchen Budget
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Monthly kitchen expense prediction
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleCreateGame('kitchen')}
                      disabled={isCreating === 'kitchen'}
                      className="w-full"
                      size="sm"
                    >
                      {isCreating === 'kitchen' ? (
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
                      Wedding Budget
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Wedding expense prediction
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleCreateGame('wedding')}
                      disabled={isCreating === 'wedding'}
                      className="w-full"
                      size="sm"
                    >
                      {isCreating === 'wedding' ? (
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
                      Festival Expense
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Festival expense prediction
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleCreateGame('festival')}
                      disabled={isCreating === 'festival'}
                      className="w-full"
                      size="sm"
                    >
                      {isCreating === 'festival' ? (
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
                      <TrendingUp className="h-4 w-4" />
                      Home Expense
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Monthly home expense prediction
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleCreateGame('home')}
                      disabled={isCreating === 'home'}
                      className="w-full"
                      size="sm"
                    >
                      {isCreating === 'home' ? (
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

            {/* Fashion & Trend Games */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Fashion & Trend Games</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Saree Color Trend
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Predict trending saree colors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleCreateGame('saree-color')}
                      disabled={isCreating === 'saree-color'}
                      className="w-full"
                      size="sm"
                    >
                      {isCreating === 'saree-color' ? (
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
                      Jewelry Design Trend
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Predict trending jewelry designs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleCreateGame('jewelry')}
                      disabled={isCreating === 'jewelry'}
                      className="w-full"
                      size="sm"
                    >
                      {isCreating === 'jewelry' ? (
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
                      <TrendingUp className="h-4 w-4" />
                      Bridal Makeup Trend
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Predict trending bridal makeup
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleCreateGame('bridal-makeup')}
                      disabled={isCreating === 'bridal-makeup'}
                      className="w-full"
                      size="sm"
                    >
                      {isCreating === 'bridal-makeup' ? (
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

            {/* Celebrity & Style Games */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Celebrity & Style Games</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Celebrity Saree Look
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Predict viral celebrity saree looks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleCreateGame('celebrity-saree')}
                      disabled={isCreating === 'celebrity-saree'}
                      className="w-full"
                      size="sm"
                    >
                      {isCreating === 'celebrity-saree' ? (
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
                      Actress Fashion Trend
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Predict trending actress fashion
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleCreateGame('actress-fashion')}
                      disabled={isCreating === 'actress-fashion'}
                      className="w-full"
                      size="sm"
                    >
                      {isCreating === 'actress-fashion' ? (
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

      {/* Games List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{showAllGames ? 'All Games' : 'Active Games'}</CardTitle>
              <CardDescription>
                {showAllGames ? 'All fantasy games (active and inactive)' : 'Currently running fantasy games'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowAllGames(!showAllGames)}
                variant="outline"
                size="sm"
              >
                {showAllGames ? 'Show Active Only' : 'Show All Games'}
              </Button>
              <Button onClick={loadGames} variant="outline" size="sm">
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingGames ? (
            <div className="flex h-48 w-full items-center justify-center">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (showAllGames ? allGames : activeGames).length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {showAllGames ? 'No games found.' : 'No active games. Create one above!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(showAllGames ? allGames : activeGames).map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  firestore={firestore}
                  onEdit={() => setEditingGame(game)}
                  onDelete={() => setDeletingGame(game.id)}
                  onUpdate={loadGames}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Game Dialog */}
      {editingGame && (
        <EditGameDialog
          game={editingGame}
          firestore={firestore}
          onClose={() => setEditingGame(null)}
          onSuccess={() => {
            setEditingGame(null);
            loadGames();
          }}
          toast={toast}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingGame && (
        <Dialog open={!!deletingGame} onOpenChange={(open) => !open && setDeletingGame(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Game</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this game? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeletingGame(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteGame(deletingGame)}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

