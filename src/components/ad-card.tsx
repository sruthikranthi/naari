
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
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={ad.avatar} alt={ad.advertiser} data-ai-hint="company logo" />
          <AvatarFallback>{ad.advertiser.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{ad.advertiser}</p>
          <p className="text-sm text-muted-foreground">Sponsored</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-2">
        <p className="whitespace-pre-wrap text-sm">{ad.description}</p>
        <div className="relative aspect-video overflow-hidden rounded-lg border">
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
