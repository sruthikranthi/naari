'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link 
      href="/dashboard" 
      aria-label="Go to dashboard"
      className={cn(
        'flex items-center gap-2 text-xl font-bold font-headline text-foreground cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
    >
      <Image
        src="/icon-192x192.png"
        alt="Naarimani Logo"
        width={28}
        height={28}
        className="object-contain"
        priority
      />
      <span>Naarimani</span>
    </Link>
  );
}
