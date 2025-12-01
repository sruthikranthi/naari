
'use client';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Contest } from '@/lib/contests-data';
import { ContestClient } from './contest-client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export default function ContestDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { id } = params;
  const firestore = useFirestore();
  const { toast } = useToast();

  const contestRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'contests', id as string) : null),
    [firestore, id]
  );
  const { data: contest, isLoading, error } = useDoc<Contest>(contestRef);

  // Handle nomination completion after payment
  useEffect(() => {
    const nominationComplete = searchParams.get('nominationComplete');
    if (nominationComplete === 'true') {
      toast({
        title: 'Nomination Fee Paid!',
        description: 'Your nomination has been submitted successfully. Good luck!'
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, toast]);

  if (isLoading) {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="relative h-56 w-full overflow-hidden rounded-lg md:h-72 bg-muted" />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                <div className="space-y-6 md:col-span-1">
                    <div className="h-64 w-full rounded-lg bg-muted" />
                    <div className="h-48 w-full rounded-lg bg-muted" />
                    <div className="h-64 w-full rounded-lg bg-muted" />
                </div>
                <div className="space-y-6 md:col-span-3">
                    <div className="h-10 w-48 bg-muted rounded" />
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="h-80 w-full rounded-lg bg-muted" />
                        <div className="h-80 w-full rounded-lg bg-muted" />
                    </div>
                </div>
            </div>
        </div>
    );
  }

  if (error) {
    console.error("Error fetching contest:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-lg font-semibold">Error loading contest</p>
        <p className="text-sm text-muted-foreground">The contest you&apos;re looking for may not exist or has been removed.</p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  if (!contest) {
    // Show better error page instead of 404
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-lg font-semibold">Contest Not Found</p>
        <p className="text-sm text-muted-foreground">The contest you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Button onClick={() => window.location.href = '/dashboard/contests'}>View All Contests</Button>
      </div>
    );
  }

  return <ContestClient contest={contest} />;
}
