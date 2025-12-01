
'use client';
import { notFound, useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Contest } from '@/lib/contests-data';
import { ContestClient } from './contest-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function ContestDetailPage() {
  const params = useParams();
  const { id } = params;
  const firestore = useFirestore();

  const contestRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'contests', id as string) : null),
    [firestore, id]
  );
  const { data: contest, isLoading, error } = useDoc<Contest>(contestRef);

  if (isLoading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-72 w-full rounded-lg" />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                <div className="space-y-6 md:col-span-1">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <div className="space-y-6 md:col-span-3">
                    <Skeleton className="h-10 w-48" />
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <Skeleton className="h-80 w-full" />
                        <Skeleton className="h-80 w-full" />
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
