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
import { ArrowLeft, Coins, Clock, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { FantasyGame, FantasyQuestion } from '@/lib/fantasy/types';
import { getFantasyQuestions } from '@/lib/fantasy/services';
import { FantasyGameUtils, FantasyValidationEngine } from '@/lib/fantasy/engine';
import { getUserWallet } from '@/lib/fantasy/services';

interface FantasyGameClientProps {
  gameId: string;
}

export default function FantasyGameClient({ gameId }: FantasyGameClientProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<FantasyQuestion[]>([]);
  const [userCoins, setUserCoins] = useState<number>(0);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadingWallet, setLoadingWallet] = useState(true);

  const gameQuery = useMemoFirebase(
    () => firestore ? doc(firestore, 'fantasy_games', gameId) : null,
    [firestore, gameId]
  );

  const { data: game, isLoading: isLoadingGame } = useDoc<FantasyGame>(gameQuery);

  // Load questions
  useEffect(() => {
    if (!firestore || !gameId) return;
    
    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const fetchedQuestions = await getFantasyQuestions(firestore, gameId);
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error('Error loading questions:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load game questions.',
        });
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, [firestore, gameId, toast]);

  // Load user wallet
  useEffect(() => {
    if (!firestore || !user?.uid) return;
    
    const loadWallet = async () => {
      try {
        setLoadingWallet(true);
        const wallet = await getUserWallet(firestore, user.uid);
        setUserCoins(wallet?.balance || 0);
      } catch (error) {
        console.error('Error loading wallet:', error);
      } finally {
        setLoadingWallet(false);
      }
    };

    loadWallet();
  }, [firestore, user?.uid]);

  if (isLoadingGame || loadingQuestions || loadingWallet) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="space-y-6">
        <PageHeader title="Game Not Found" />
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Game Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The fantasy game you're looking for doesn't exist or has been removed.
            </p>
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

  const isActive = FantasyGameUtils.isGameActive(game);
  const canParticipate = user 
    ? FantasyValidationEngine.canParticipate(game, userCoins, false)
    : { valid: false, reason: 'Please sign in to participate' };

  const startTime = game.startTime instanceof Date 
    ? game.startTime 
    : (game.startTime as any)?.toDate?.() || new Date();
  const endTime = game.endTime instanceof Date 
    ? game.endTime 
    : (game.endTime as any)?.toDate?.() || new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/fantasy">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={game.title}
          description={game.description}
        />
      </div>

      {/* Game Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{game.title}</CardTitle>
              <CardDescription className="mt-2">{game.description}</CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              <Badge variant="secondary">
                {FantasyGameUtils.getCategoryDisplayName(game.category)}
              </Badge>
              <Badge variant="outline">
                {FantasyGameUtils.getGameTypeDisplayName(game.gameType)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Entry Fee</p>
                <p className="text-xs text-muted-foreground">{game.entryCoins} coins</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Participants</p>
                <p className="text-xs text-muted-foreground">{game.totalParticipants} players</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Deadline</p>
                <p className="text-xs text-muted-foreground">
                  {endTime.toLocaleDateString()} {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          {/* User Coin Balance */}
          {user && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Your Coins</p>
                  <p className="text-xs text-muted-foreground">Available balance</p>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  <span className="text-lg font-bold">{userCoins}</span>
                </div>
              </div>
            </div>
          )}

          {/* Participation Status */}
          {!isActive && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                This game is no longer accepting predictions.
              </p>
            </div>
          )}

          {isActive && !canParticipate.valid && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                {canParticipate.reason}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Prediction Questions</CardTitle>
          <CardDescription>
            {questions.length > 0 
              ? `Answer ${questions.length} question${questions.length > 1 ? 's' : ''} to participate`
              : 'No questions available yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Questions will be available soon. Check back later!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Prediction interface will be implemented in Phase 2.
              </p>
              {/* TODO: Implement prediction UI in Phase 2 */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

