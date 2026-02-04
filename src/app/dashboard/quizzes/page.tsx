'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser } from '@/firebase';
import { getActiveSponsoredQuizzes } from '@/lib/quizzes/services';
import type { SponsoredQuiz } from '@/lib/quizzes/types';
import { Loader, Award, Users, Building2, Video, Image as ImageIcon, ArrowRight } from 'lucide-react';

export default function QuizzesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [quizzes, setQuizzes] = useState<SponsoredQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const load = async () => {
      setLoading(true);
      try {
        const list = await getActiveSponsoredQuizzes(firestore);
        setQuizzes(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [firestore]);

  if (!user) {
    return (
      <div className="container py-8">
        <PageHeader title="Sponsored Quizzes" description="Watch a short video or image, answer 5 questions, earn coins." />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Please sign in to take quizzes.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <PageHeader
        title="Sponsored Quizzes"
        description="Watch a 10-second video or image from our sponsor, answer 5 questions, and earn coins. Prizes and participant limits vary by quiz."
      />
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : quizzes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No active quizzes right now. Check back later!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => {
            const full = quiz.maxParticipants > 0 && quiz.participantCount >= quiz.maxParticipants;
            return (
              <Card key={quiz.id} className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {quiz.mediaType === 'video' ? (
                    <video
                      src={quiz.mediaUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={quiz.mediaUrl}
                      alt={quiz.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                    {quiz.mediaType === 'video' ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                    {quiz.mediaDurationSeconds}s
                  </div>
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1">
                    {quiz.sponsorImageUrl && (
                      <img src={quiz.sponsorImageUrl} alt="" className="h-5 w-5 rounded object-cover" />
                    )}
                    <span className="text-xs font-medium text-white">{quiz.sponsorBrandName}</span>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-1 text-lg">{quiz.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{quiz.description || 'Answer 5 questions and earn coins.'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {quiz.participantCount}
                      {quiz.maxParticipants > 0 && ` / ${quiz.maxParticipants}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      {quiz.prizeType}: {quiz.prizeValue}
                    </span>
                  </div>
                  <Button asChild className="w-full" disabled={full}>
                    <Link href={`/dashboard/quizzes/${quiz.id}`}>
                      {full ? 'Full' : 'Take Quiz'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
