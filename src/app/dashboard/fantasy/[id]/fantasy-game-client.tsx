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
import { ArrowLeft, ArrowRight, Coins, Clock, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { FantasyGame, FantasyQuestion, UserPrediction } from '@/lib/fantasy/types';
import { 
  getFantasyQuestions, 
  getUserWallet, 
  getUserPredictions,
  createUserPrediction,
  updateUserPrediction,
  addCoinTransaction,
  updateFantasyGame,
  getActiveFantasyEvents,
} from '@/lib/fantasy/services';
import { selectQuestionsForGame } from '@/lib/fantasy/question-selector';
import { FantasyGameUtils, FantasyValidationEngine } from '@/lib/fantasy/engine';
import { PredictionForm } from '@/components/fantasy/prediction-form';
import { ResultDeclaration } from '@/components/fantasy/result-declaration';
import { getFantasyResults } from '@/lib/fantasy/services';
import { Trophy, Award, CheckCircle2 } from 'lucide-react';
import { SponsorBanner } from '@/components/ads/sponsor-banner';
import { ImageAdModal } from '@/components/ads/image-ad-modal';
import { InlineAdCard } from '@/components/ads/inline-ad-card';
import { getLeaderboard } from '@/lib/fantasy/services';
import { LeaderboardCard } from '@/components/fantasy/leaderboard-card';
import type { LeaderboardPeriod } from '@/lib/fantasy/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FantasyGameClientProps {
  gameId: string;
}

export default function FantasyGameClient({ gameId }: FantasyGameClientProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<FantasyQuestion[]>([]);
  const [userCoins, setUserCoins] = useState<number>(0);
  const [userPredictions, setUserPredictions] = useState<Map<string, UserPrediction>>(new Map());
  const [results, setResults] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [submittingPrediction, setSubmittingPrediction] = useState<string | null>(null);
  const [showPreGameAd, setShowPreGameAd] = useState(false);
  const [showPostGameAd, setShowPostGameAd] = useState(false);
  const [userStats, setUserStats] = useState({ predictionsCount: 0, gamesPlayed: 0 });
  const [gameLeaderboard, setGameLeaderboard] = useState<any>(null);
  const [loadingGameLeaderboard, setLoadingGameLeaderboard] = useState(false);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('weekly');

  const gameQuery = useMemoFirebase(
    () => firestore ? doc(firestore, 'fantasy_games', gameId) : null,
    [firestore, gameId]
  );

  const { data: game, isLoading: isLoadingGame } = useDoc<FantasyGame>(gameQuery);

  // Load questions from pool (using question selection logic)
  useEffect(() => {
    if (!firestore || !gameId || !game) return;
    
    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        
        // Check if there's an active event for this game
        const activeEvents = await getActiveFantasyEvents(firestore, gameId);
        const activeEvent = activeEvents.length > 0 ? activeEvents[0] : null;
        
        // Use question selector to get 2-3 questions from pool
        // If there's an active event, use its questions; otherwise use general pool
        const selectedQuestions = await selectQuestionsForGame(firestore, gameId, {
          count: 3,
          minCount: 2,
          eventId: activeEvent?.id,
          prioritizeSeasonal: true,
        });
        
        // If no questions from pool, fallback to all questions (backward compatibility)
        if (selectedQuestions.length === 0) {
          const allQuestions = await getFantasyQuestions(firestore, gameId);
          setQuestions(allQuestions);
        } else {
          setQuestions(selectedQuestions);
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        // Fallback to old method for backward compatibility
        try {
          const fetchedQuestions = await getFantasyQuestions(firestore, gameId);
          setQuestions(fetchedQuestions);
        } catch (fallbackError) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load game questions.',
          });
        }
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, [firestore, gameId, game, toast]);

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

  // Load user predictions
  useEffect(() => {
    if (!firestore || !user?.uid || !gameId) return;
    
    const loadPredictions = async () => {
      try {
        setLoadingPredictions(true);
        const predictions = await getUserPredictions(firestore, user.uid, gameId);
        const predictionsMap = new Map<string, UserPrediction>();
        predictions.forEach((pred) => {
          predictionsMap.set(pred.questionId, pred);
        });
        setUserPredictions(predictionsMap);
      } catch (error) {
        console.error('Error loading predictions:', error);
      } finally {
        setLoadingPredictions(false);
      }
    };

    loadPredictions();
  }, [firestore, user?.uid, gameId]);

  // Load results when game status is results-declared
  useEffect(() => {
    if (!firestore || !gameId || !game || game.status !== 'results-declared') return;
    
    const loadResults = async () => {
      try {
        setLoadingResults(true);
        const fetchedResults = await getFantasyResults(firestore, gameId);
        setResults(fetchedResults);
      } catch (error) {
        console.error('Error loading results:', error);
      } finally {
        setLoadingResults(false);
      }
    };

    loadResults();
  }, [firestore, gameId, game?.status]);

  // Load leaderboard for this game
  useEffect(() => {
    if (!firestore || !game) return;
    
    const loadGameLeaderboard = async () => {
      try {
        setLoadingGameLeaderboard(true);
        const lb = await getLeaderboard(firestore, leaderboardPeriod, game.gameType, game.category);
        setGameLeaderboard(lb);
      } catch (error) {
        console.error('Error loading game leaderboard:', error);
      } finally {
        setLoadingGameLeaderboard(false);
      }
    };
    
    loadGameLeaderboard();
  }, [firestore, game, leaderboardPeriod]);

  // Handle prediction submission
  const handlePredictionSubmit = async (
    questionId: string,
    prediction: string | number,
    rangeMin?: number,
    rangeMax?: number
  ) => {
    if (!firestore || !user || !game) return;

    const question = questions.find((q) => q.id === questionId);
    if (!question) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Question not found.',
      });
      return;
    }

    // Validate prediction
    const validation = FantasyValidationEngine.validatePrediction(prediction, question);
    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: 'Invalid Prediction',
        description: validation.reason,
      });
      return;
    }

    setSubmittingPrediction(questionId);

    try {
      const existingPred = userPredictions.get(questionId);
      const isFirstPrediction = !existingPred && userPredictions.size === 0;

      // If this is the first prediction for this game, deduct entry coins
      if (isFirstPrediction) {
        // Check if user has enough coins
        if (userCoins < game.entryCoins) {
          toast({
            variant: 'destructive',
            title: 'Insufficient Coins',
            description: `You need ${game.entryCoins} coins to enter this game.`,
          });
          setSubmittingPrediction(null);
          return;
        }

        // Deduct entry coins
        await addCoinTransaction(firestore, {
          userId: user.uid,
          type: 'fantasy-entry',
          amount: -game.entryCoins,
          description: `Entry fee for ${game.title}`,
          metadata: { gameId: game.id },
        });

        // Update wallet balance locally
        setUserCoins((prev) => prev - game.entryCoins);

        // Update game participant count
        await updateFantasyGame(firestore, game.id, {
          totalParticipants: game.totalParticipants + 1,
        });
      }

      // Create or update prediction
      if (existingPred) {
        // Update existing prediction
        await updateUserPrediction(firestore, existingPred.id, {
          prediction,
          rangeMin,
          rangeMax,
        });
        toast({
          title: 'Prediction Updated',
          description: 'Your prediction has been updated successfully.',
        });
      } else {
        // Create new prediction
        await createUserPrediction(firestore, {
          gameId: game.id,
          questionId,
          userId: user.uid,
          prediction,
          rangeMin,
          rangeMax,
        });
        toast({
          title: isFirstPrediction ? 'Entry Successful!' : 'Prediction Submitted',
          description: isFirstPrediction
            ? `You've entered the game! ${game.entryCoins} coins deducted.`
            : 'Your prediction has been submitted successfully.',
        });
      }

      // Reload predictions
      const updatedPredictions = await getUserPredictions(firestore, user.uid, game.id);
      const predictionsMap = new Map<string, UserPrediction>();
      updatedPredictions.forEach((pred) => {
        predictionsMap.set(pred.questionId, pred);
      });
      setUserPredictions(predictionsMap);

      // Reload wallet
      const wallet = await getUserWallet(firestore, user.uid);
      setUserCoins(wallet?.balance || 0);
    } catch (error: any) {
      console.error('Error submitting prediction:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit prediction. Please try again.',
      });
    } finally {
      setSubmittingPrediction(null);
    }
  };

  if (isLoadingGame || loadingQuestions || loadingWallet || loadingPredictions) {
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
        <PageHeader title="Game Not Found" description="The fantasy game you&apos;re looking for doesn&apos;t exist or has been removed." />
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Game Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The fantasy game you&apos;re looking for doesn&apos;t exist or has been removed.
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
      {/* Event Sponsor Banner */}
      {game && <SponsorBanner position="PRE_GAME" gameId={game.id} variant="compact" />}
      
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
            <div className="space-y-6">
              {questions.map((question, index) => {
                const existingPred = userPredictions.get(question.id);
                const hasPredicted = !!existingPred;
                
                return (
                  <div key={question.id} className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold">
                        Question {index + 1} of {questions.length}
                      </h3>
                      {hasPredicted && (
                        <Badge variant="default" className="bg-green-500">
                          ✓ Predicted
                        </Badge>
                      )}
                    </div>
                    <PredictionForm
                      question={question}
                      onSubmit={(pred, rangeMin, rangeMax) =>
                        handlePredictionSubmit(question.id, pred, rangeMin, rangeMax)
                      }
                      isSubmitting={submittingPrediction === question.id}
                      existingPrediction={existingPred?.prediction}
                      existingRange={{
                        min: existingPred?.rangeMin,
                        max: existingPred?.rangeMax,
                      }}
                    />
                  </div>
                );
              })}
              
              {/* Summary */}
              {userPredictions.size > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          Predictions Submitted: {userPredictions.size} / {questions.length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {userPredictions.size === questions.length
                            ? 'All questions answered! Good luck! 🍀'
                            : 'Complete all questions to finalize your entry.'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results & Scores Section */}
      {game.status === 'results-declared' && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Results & Your Score
            </CardTitle>
            <CardDescription>
              Game results have been declared. Check your performance!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* User Score Summary */}
              {user && (() => {
                const userTotalPoints = Array.from(userPredictions.values()).reduce(
                  (sum, pred) => sum + (pred.pointsEarned || 0),
                  0
                );
                return (
                  <div className="p-4 bg-background rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Your Total Points</span>
                      <span className="text-2xl font-bold text-primary">{userTotalPoints}</span>
                    </div>
                    {game.totalParticipants > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {game.totalParticipants} participants
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Results for each question */}
              <div className="space-y-3">
                {questions.map((question, index) => {
                  const result = results.find((r) => r.questionId === question.id);
                  const userPred = userPredictions.get(question.id);
                  const points = userPred?.pointsEarned || 0;
                  const isCorrect = userPred?.isCorrect || false;

                  return (
                    <div key={question.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">
                            Question {index + 1}: {question.question}
                          </h4>
                        </div>
                        {isCorrect && (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Correct
                          </Badge>
                        )}
                      </div>
                      
                      {result && (
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Correct Answer:</span>
                            <span className="font-semibold">{result.result} {question.unit || ''}</span>
                          </div>
                          {userPred && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Your Prediction:</span>
                              <span>{userPred.prediction} {question.unit || ''}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-muted-foreground">Points Earned:</span>
                            <span className="font-bold text-primary">{points} pts</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Game Leaderboard
              </CardTitle>
              <CardDescription>
                Top performers for this game
              </CardDescription>
            </div>
            <Link href="/dashboard/fantasy#leaderboard">
              <Button variant="outline" size="sm">
                View Full Leaderboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={leaderboardPeriod} onValueChange={(v) => setLeaderboardPeriod(v as LeaderboardPeriod)}>
            <TabsList className="mb-4">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="all-time">All Time</TabsTrigger>
            </TabsList>
            {loadingGameLeaderboard ? (
              <div className="py-8 text-center">
                <Trophy className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
              </div>
            ) : gameLeaderboard && gameLeaderboard.entries && gameLeaderboard.entries.length > 0 ? (
              <LeaderboardCard 
                entries={gameLeaderboard.entries.slice(0, 10)} 
                period={leaderboardPeriod}
                title={`${leaderboardPeriod.charAt(0).toUpperCase() + leaderboardPeriod.slice(1)} Top Players`}
              />
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Leaderboard Data</h3>
                <p>Play games to see rankings!</p>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Admin: Result Declaration */}
      {user && game.createdBy === user.uid && game.status === 'active' && FantasyGameUtils.canRevealResults(game) && (
        <ResultDeclaration
          firestore={firestore}
          game={game}
          questions={questions}
          adminUserId={user?.uid || ''}
          onResultsDeclared={async () => {
            // Reload game to get updated status
            window.location.reload();
          }}
        />
      )}

      {/* Ad Modals */}
      <ImageAdModal
        position="PRE_GAME"
        gameId={game.id}
        open={showPreGameAd}
        onOpenChange={setShowPreGameAd}
        userStats={userStats}
      />
      
      <ImageAdModal
        position="POST_GAME"
        gameId={game.id}
        open={showPostGameAd}
        onOpenChange={setShowPostGameAd}
        userStats={userStats}
      />
    </div>
  );
}

