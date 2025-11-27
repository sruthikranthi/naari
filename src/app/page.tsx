'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SplashScreen } from '@/components/splash-screen';

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  const handleSplashComplete = () => {
    setShowSplash(false);
    router.push('/login');
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return null;
}

