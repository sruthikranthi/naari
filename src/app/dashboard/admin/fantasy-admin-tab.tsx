'use client';

import { useState, useEffect } from 'react';
import type { Firestore } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Coins, TrendingUp, Loader, Edit, Trash2, MoreVertical, Plus } from 'lucide-react';
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
import { CreateGameForm } from '@/components/fantasy/create-game-form';
import { CreateCampaignForm } from '@/components/fantasy/create-campaign-form';

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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);

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
    if (firestore && user) {
      loadGames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, user]);

  if (!firestore || !user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Please sign in to manage fantasy games.</p>
        </CardContent>
      </Card>
    );
  }

  const handleCreateGame = async (gameType: string) => {
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
        case 'kitchen':
          gameId = await createSampleKitchenBudgetGame(firestore, user.uid);
          break;
        case 'wedding':
          gameId = await createSampleWeddingBudgetGame(firestore, user.uid);
          break;
        case 'festival':
          gameId = await createSampleFestivalExpenseGame(firestore, user.uid);
          break;
        case 'home':
          gameId = await createSampleHomeExpenseGame(firestore, user.uid);
          break;
        case 'saree-color':
          gameId = await createSampleSareeColorTrendGame(firestore, user.uid);
          break;
        case 'jewelry':
          gameId = await createSampleJewelryTrendGame(firestore, user.uid);
          break;
        case 'bridal-makeup':
          gameId = await createSampleBridalMakeupTrendGame(firestore, user.uid);
          break;
        case 'celebrity-saree':
          gameId = await createSampleCelebritySareeGame(firestore, user.uid);
          break;
        case 'actress-fashion':
          gameId = await createSampleActressFashionGame(firestore, user.uid);
          break;
        default:
          throw new Error(`Unknown game type: ${gameType}`);
      }

      toast({
        title: 'Game Created!',
        description: `Successfully created ${gameType} game.`,
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Create New Game or Campaign</h3>
                <p className="text-sm text-muted-foreground">
                  Create comprehensive games with 10-18 events, sponsors, and image-based questions
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowCreateCampaign(true)} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Custom Game
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Quick Create - Sample Games</h3>
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

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Create Fantasy Campaign</DialogTitle>
            <DialogDescription>
              Create a campaign with prizes, sponsors, and entry fees (similar to movie fantasy campaigns)
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
            {firestore && user && (
              <CreateCampaignForm
                firestore={firestore}
                userId={user.uid}
                onSuccess={async () => {
                  setShowCreateCampaign(false);
                  await loadGames();
                }}
                onCancel={() => setShowCreateCampaign(false)}
                toast={toast}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Game Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Create New Fantasy Game</DialogTitle>
            <DialogDescription>
              Create a comprehensive fantasy game with 10-18 events, sponsors, and image-based questions
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
            {firestore && user && (
              <CreateGameForm
                firestore={firestore}
                userId={user.uid}
                onSuccess={async () => {
                  setShowCreateForm(false);
                  await loadGames();
                }}
                onCancel={() => setShowCreateForm(false)}
                toast={toast}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

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

// Game Card Component with Edit/Delete
function GameCard({
  game,
  firestore,
  onEdit,
  onDelete,
  onUpdate,
}: {
  game: FantasyGame;
  firestore: Firestore;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}) {
  const handleToggleStatus = async () => {
    if (!firestore) return;
    
    try {
      await updateFantasyGame(firestore, game.id, {
        status: (game.status === 'active' ? 'completed' : 'active') as any,
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating game status:', error);
    }
  };

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{game.title}</h3>
              <Badge variant={game.status === 'active' ? 'default' : 'secondary'}>
                {game.status}
              </Badge>
              <Badge variant="outline">
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
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/fantasy/${game.id}`}>
              <Button variant="outline" size="sm">
                View
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleStatus}>
                  {game.status === 'active' ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Edit Game Dialog
function EditGameDialog({
  game,
  firestore,
  onClose,
  onSuccess,
  toast,
}: {
  game: FantasyGame;
  firestore: Firestore;
  onClose: () => void;
  onSuccess: () => void;
  toast: ReturnType<typeof useToast>['toast'];
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: game.title,
    description: game.description,
    entryCoins: game.entryCoins,
    status: game.status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateFantasyGame(firestore, game.id, {
        title: formData.title,
        description: formData.description,
        entryCoins: formData.entryCoins,
        status: formData.status as any,
      });

      toast({
        title: 'Success',
        description: 'Game updated successfully!',
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error updating game:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update game.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!game} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Fantasy Game</DialogTitle>
          <DialogDescription>
            Update game details and settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Game Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryCoins">Entry Coins</Label>
              <Input
                id="entryCoins"
                type="number"
                min="0"
                value={formData.entryCoins}
                onChange={(e) => setFormData({ ...formData, entryCoins: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Game'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

