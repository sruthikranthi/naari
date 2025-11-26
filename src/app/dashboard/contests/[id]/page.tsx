
import { notFound } from 'next/navigation';
import { allContestsData } from '@/lib/contests-data';
import { ContestClient } from './contest-client';

export default function ContestDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const contest = allContestsData.find((c) => c.id === id);

  if (!contest) {
    notFound();
  }

  return <ContestClient contest={contest} />;
}
