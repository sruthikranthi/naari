
'use client';
import { notFound, useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Contest } from '@/lib/contests-data';
import { ContestClient } from './contest-client';
import { Skeleton } from '@/components/ui/skeleton';

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
    return <p>Error loading contest.</p>;
  }

  if (!contest) {
    notFound();
  }

  return <ContestClient contest={contest} />;
}
