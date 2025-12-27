'use client';

import { use } from 'react';
import { useParams } from 'next/navigation';
import FantasyGameClient from './fantasy-game-client';

export default function FantasyGamePage() {
  const params = useParams();
  const gameId = params.id as string;

  return <FantasyGameClient gameId={gameId} />;
}

