'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFirestore, useUser } from '@/firebase';
import {
  getSponsoredQuiz,
  getQuizAttempt,
  submitQuizAttempt,
} from '@/lib/quizzes/services';
import type { SponsoredQuiz, QuizQuestion } from '@/lib/quizzes/types';
import {
  Loader,
  Building2,
  Award,
  Users,
  Video,
  CheckCircle,
  Coins,
  ArrowLeft,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MEDIA_DURATION_DEFAULT = 10;

export default function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const quizId = typeof params?.id === 'string' ? params.id : '';

  const [quiz, setQuiz] = useState<SponsoredQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [step, setStep] = useState<'media' | 'questions' | 'result'>('media');
  const [mediaCountdown, setMediaCountdown] = useState(MEDIA_DURATION_DEFAULT);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | string)[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; coinsAwarded: number } | null>(null);

  const loadQuiz = useCallback(async () => {
    if (!firestore || !quizId || !user?.uid) return;
    setLoading(true);
    try {
      const [quizData, attempt] = await Promise.all([
        getSponsoredQuiz(firestore, quizId),
        getQuizAttempt(firestore, quizId, user.uid),
      ]);
      setQuiz(quizData ?? null);
      if (attempt) {
        setAlreadyAttempted(true);
        setPreviousScore(attempt.score);
        setStep('result');
        setResult({ score: attempt.score, coinsAwarded: attempt.coinsAwarded ? 15 : 0 });
      } else if (quizData) {
        const duration = quizData.mediaDurationSeconds ?? MEDIA_DURATION_DEFAULT;
        setMediaCountdown(duration);
        setAnswers(Array(quizData.questions.length).fill(''));
      }
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load quiz.' });
    } finally {
      setLoading(false);
    }
  }, [firestore, quizId, user?.uid, toast]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  useEffect(() => {
    if (step !== 'media' || !quiz || mediaCountdown <= 0) return;
    const t = setInterval(() => setMediaCountdown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [step, quiz, mediaCountdown]);

  useEffect(() => {
    if (step === 'media' && mediaCountdown === 0 && quiz) {
      setStep('questions');
    }
  }, [step, mediaCountdown, quiz]);

  const handleAnswer = (value: number | string) => {
    const next = [...answers];
    next[currentQuestionIndex] = value;
    setAnswers(next);
  };

  const handleNextQuestion = () => {
    if (!quiz) return;
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
    }
  };

  const handlePrevQuestion = () => {
    setCurrentQuestionIndex((i) => Math.max(0, i - 1));
  };

  const canSubmit = quiz && answers.every((a, i) => {
    const q = quiz.questions[i];
    if (q.type === 'text') return typeof a === 'string' && String(a).trim().length > 0;
    return a !== '' && a !== undefined;
  });

  const handleSubmit = async () => {
    if (!firestore || !user?.uid || !quiz || !canSubmit) return;
    setSubmitting(true);
    try {
      const res = await submitQuizAttempt(firestore, quizId, user.uid, answers);
      setResult({ score: res.score, coinsAwarded: res.coinsAwarded });
      setStep('result');
      toast({
        title: 'Quiz submitted!',
        description: `You scored ${res.score}/5. ${res.coinsAwarded ? `+${res.coinsAwarded} coins earned.` : ''}`,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to submit.';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container py-8">
        <PageHeader title="Quiz" description="Sign in to take this quiz." />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Please sign in to take quizzes.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !quiz) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const full = quiz.maxParticipants > 0 && quiz.participantCount >= quiz.maxParticipants;
  if (!alreadyAttempted && full) {
    return (
      <div className="container py-8">
        <PageHeader title={quiz.title} description="This quiz has reached the maximum number of participants." />
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Maximum participants reached. Try another quiz!</p>
            <Button asChild><Link href="/dashboard/quizzes">Back to Quizzes</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="container max-w-2xl py-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/quizzes"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Quizzes</Link>
        </Button>
      </div>

      {step === 'media' && (
        <>
          <PageHeader title={quiz.title} description="Watch the content below. Questions will start after the timer." />
          <Card>
            <div className="relative aspect-video bg-black">
              {quiz.mediaType === 'video' ? (
                <video
                  src={quiz.mediaUrl}
                  className="h-full w-full object-contain"
                  autoPlay
                  muted
                  playsInline
                  loop
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={quiz.mediaUrl}
                  alt={quiz.title}
                  className="h-full w-full object-contain"
                />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                <span className="text-5xl font-bold text-white tabular-nums">{mediaCountdown}</span>
                <span className="text-white/90">seconds</span>
              </div>
            </div>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  {quiz.sponsorImageUrl && (
                    <img src={quiz.sponsorImageUrl} alt="" className="h-6 w-6 rounded object-cover" />
                  )}
                  <Building2 className="h-4 w-4" />
                  {quiz.sponsorBrandName}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {quiz.participantCount}
                  {quiz.maxParticipants > 0 && ` / ${quiz.maxParticipants}`}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === 'questions' && question && (
        <>
          <div className="mb-2 text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{question.questionText}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {question.type === 'multiple_choice' && question.options && (
                <RadioGroup
                  value={String(answers[currentQuestionIndex] ?? '')}
                  onValueChange={(v) => handleAnswer(Number(v))}
                  className="space-y-2"
                >
                  {question.options.map((opt, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <RadioGroupItem value={String(i)} id={`opt-${i}`} />
                      <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer font-normal">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {question.type === 'text' && (
                <div>
                  <Label htmlFor="text-answer">Your answer</Label>
                  <Input
                    id="text-answer"
                    value={String(answers[currentQuestionIndex] ?? '')}
                    onChange={(e) => handleAnswer(e.target.value)}
                    placeholder="Type your answer"
                    className="mt-2"
                  />
                </div>
              )}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                {isLastQuestion ? (
                  <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
                    {submitting ? <Loader className="h-4 w-4 animate-spin" /> : 'Submit'}
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion}>Next</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === 'result' && result !== null && (
        <>
          <PageHeader title={quiz.title} description="Your result" />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Quiz Complete
              </CardTitle>
              <CardDescription>
                {alreadyAttempted ? 'You had already attempted this quiz. Here is your result.' : 'Thanks for participating!'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <Award className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{result.score} / {quiz.questions.length}</p>
                  <p className="text-muted-foreground">Correct answers</p>
                </div>
              </div>
              {result.coinsAwarded > 0 && (
                <div className="flex items-center gap-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                  <Coins className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-xl font-semibold text-green-700 dark:text-green-400">+{result.coinsAwarded} coins</p>
                    <p className="text-muted-foreground">Earned for completing this quiz</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Sponsored by {quiz.sponsorBrandName}
              </div>
              <Button asChild className="w-full">
                <Link href="/dashboard/quizzes">Back to Quizzes</Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
