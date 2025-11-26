'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the wellness page component
const WellnessPage = dynamic(() => import('./page'), {
  loading: () => (
    <div className="space-y-6">
      <Skeleton className="h-16 w-3/4" />
      <Skeleton className="h-10 w-full" />
      <div className="space-y-6 mt-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  ),
  ssr: false,
});

export default WellnessPage;

