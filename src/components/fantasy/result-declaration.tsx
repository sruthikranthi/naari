'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';
import type { FantasyQuestion, FantasyResult } from '@/lib/fantasy/types';
import { createFantasyResult, updateFantasyGame } from '@/lib/fantasy/services';
import type { Firestore } from 'firebase/firestore';
import { calculateGameScores, checkAndAwardBadges } from '@/lib/fantasy/scoring-service';
import type { FantasyGame } from '@/lib/fantasy/types';

interface ResultDeclarationProps {
  firestore: Firestore;
  game: FantasyGame;
  questions: FantasyQuestion[];
  adminUserId: string;
  onResultsDeclared?: () => void;
}

export function ResultDeclaration({
  firestore,
  game,
  questions,
  adminUserId,
  onResultsDeclared,
}: ResultDeclarationProps) {
  const { toast } = useToast();
  const [results, setResults] = useState<Record<string, { value: string; source?: string; notes?: string }>>({});
  const [isDeclaring, setIsDeclaring] = useState(false);
  const [isScoring, setIsScoring] = useState(false);

  const handleResultChange = (questionId: string, field: 'value' | 'source' | 'notes', value: string) => {
    setResults((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };

  const handleDeclareResults = async () => {
    // Validate all questions have results
    const missingResults = questions.filter((q) => !results[q.id]?.value);
    if (missingResults.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Missing Results',
        description: `Please provide results for all ${missingResults.length} question(s).`,
      });
      return;
    }

    setIsDeclaring(true);

    try {
      // Create result documents
      for (const question of questions) {
        const resultData = results[question.id];
        if (resultData?.value) {
          await createFantasyResult(firestore, {
            gameId: game.id,
            questionId: question.id,
            result: resultData.value,
            resultSource: resultData.source || 'Manual',
            notes: resultData.notes,
            declaredBy: adminUserId,
          });
        }
      }

      // Update game status
      await updateFantasyGame(firestore, game.id, {
        status: 'results-declared',
      });

      toast({
        title: 'Results Declared!',
        description: 'Results have been declared. Calculating scores...',
      });

      // Calculate scores
      setIsScoring(true);
      const scoringResult = await calculateGameScores(firestore, game.id);

      toast({
        title: 'Scores Calculated!',
        description: `Scored ${scoringResult.scoredPredictions} predictions. Total points awarded: ${scoringResult.totalPointsAwarded}`,
      });

      if (onResultsDeclared) {
        onResultsDeclared();
      }
    } catch (error: any) {
      console.error('Error declaring results:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to declare results. Please try again.',
      });
    } finally {
      setIsDeclaring(false);
      setIsScoring(false);
    }
  };

  const canDeclare = questions.every((q) => results[q.id]?.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Declare Results</CardTitle>
        <CardDescription>
          Enter the correct answers for each question. Scores will be calculated automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="text-base font-semibold">
                  Question {index + 1}: {question.question}
                </Label>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{question.predictionType}</Badge>
                  {question.unit && <Badge variant="outline">{question.unit}</Badge>}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor={`result-${question.id}`}>
                  Correct Answer {question.unit && `(${question.unit})`}
                </Label>
                <Input
                  id={`result-${question.id}`}
                  type={question.predictionType === 'range' ? 'number' : 'text'}
                  value={results[question.id]?.value || ''}
                  onChange={(e) => handleResultChange(question.id, 'value', e.target.value)}
                  placeholder={
                    question.predictionType === 'up-down'
                      ? 'Enter "up" or "down"'
                      : question.predictionType === 'range'
                      ? 'Enter numeric value'
                      : 'Enter the correct option'
                  }
                />
              </div>

              <div>
                <Label htmlFor={`source-${question.id}`}>Source (Optional)</Label>
                <Input
                  id={`source-${question.id}`}
                  value={results[question.id]?.source || ''}
                  onChange={(e) => handleResultChange(question.id, 'source', e.target.value)}
                  placeholder="e.g., Market Data, API, Manual Entry"
                />
              </div>

              <div>
                <Label htmlFor={`notes-${question.id}`}>Notes (Optional)</Label>
                <Textarea
                  id={`notes-${question.id}`}
                  value={results[question.id]?.notes || ''}
                  onChange={(e) => handleResultChange(question.id, 'notes', e.target.value)}
                  placeholder="Additional notes about this result"
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {canDeclare ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                All results provided
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                {questions.filter((q) => !results[q.id]?.value).length} result(s) missing
              </div>
            )}
          </div>
          <Button
            onClick={handleDeclareResults}
            disabled={!canDeclare || isDeclaring || isScoring}
            size="lg"
          >
            {isScoring ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Calculating Scores...
              </>
            ) : isDeclaring ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Declaring Results...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Declare Results & Calculate Scores
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

