'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Users, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function JoinTambolaGamePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'joining' | 'success' | 'error' | 'already-player'>('loading');
  const [gameId, setGameId] = useState<string>('');

  const gameIdParam = searchParams.get('gameId');

  useEffect(() => {
    const joinGame = async () => {
      if (!gameIdParam || !user || !firestore) {
        setStatus('error');
        return;
      }

      try {
        // Check if game exists
        const gameRef = doc(firestore, 'tambola_games', gameIdParam);
        const gameSnap = await getDoc(gameRef);

        if (!gameSnap.exists()) {
          toast({
            title: 'Game Not Found',
            description: 'This Tambola game does not exist or has been deleted.',
            variant: 'destructive',
          });
          setStatus('error');
          return;
        }

        const gameData = gameSnap.data();
        setGameId(gameIdParam);

        // Check if user is already a player
        if (gameData.playerIds && gameData.playerIds.includes(user.uid)) {
          setStatus('already-player');
          return;
        }

        // Add user to game
        setStatus('joining');
        await updateDoc(gameRef, {
          playerIds: arrayUnion(user.uid),
        });

        setStatus('success');
        toast({
          title: 'Successfully Joined!',
          description: 'You have joined the Tambola game. Get ready to play!',
        });

        // Redirect to game page after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/tambola');
        }, 2000);
      } catch (error: any) {
        console.error('Error joining game:', error);
        toast({
          title: 'Error Joining Game',
          description: error.message || 'Failed to join the game. Please try again.',
          variant: 'destructive',
        });
        setStatus('error');
      }
    };

    if (gameIdParam && user && firestore) {
      joinGame();
    } else if (!user) {
      // User not logged in, redirect to login
      router.push('/login?redirect=/dashboard/tambola/join?gameId=' + gameIdParam);
    }
  }, [gameIdParam, user, firestore, toast, router]);

  if (status === 'loading' || status === 'joining') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              {status === 'loading' ? 'Loading game...' : 'Joining game...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Successfully Joined!
            </CardTitle>
            <CardDescription>
              You have been added to the Tambola game. Get ready to play!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Redirecting you to the game...
            </p>
            <Button asChild>
              <Link href="/dashboard/tambola">Go to Game</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'already-player') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Already a Player
            </CardTitle>
            <CardDescription>
              You are already part of this Tambola game.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild>
              <Link href="/dashboard/tambola">Go to Game</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Unable to Join
          </CardTitle>
          <CardDescription>
            There was an error joining the game.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild>
            <Link href="/dashboard/tambola">Back to Tambola</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

