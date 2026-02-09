
'use client';

import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from './ui/badge';

export type Ad = {
  id: string;
  advertiser: string;
  avatar: string;
  title: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
};

type AdCardProps = {
  ad: Ad;
};

export function AdCard({ ad }: AdCardProps) {
  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-3 p-3 sm:gap-4 sm:p-4">
        <Avatar className="h-9 w-9 shrink-0 sm:h-10 sm:w-10">
          <AvatarImage src={ad.avatar} alt={ad.advertiser} data-ai-hint="company logo" />
          <AvatarFallback>{ad.advertiser.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{ad.advertiser}</p>
          <p className="text-xs text-muted-foreground sm:text-sm">Sponsored</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-3 pb-2 sm:px-4">
        <p className="whitespace-pre-wrap break-words text-sm">{ad.description}</p>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
          <Image
            src={ad.image}
            alt={ad.title}
            fill
            className="object-cover"
            data-ai-hint="advertisement product"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between p-4 pt-2">
        <div>
            <h4 className="font-semibold">{ad.title}</h4>
            <p className="text-xs text-muted-foreground">{new URL(ad.ctaLink).hostname}</p>
        </div>
        <Button asChild variant="outline">
          <a href={ad.ctaLink} target="_blank" rel="noopener noreferrer">
            {ad.ctaText}
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
