'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { AdDecisionEngine, recordImpression, recordClick } from '@/lib/ads/services';
import type { AdPosition, AdCreative } from '@/lib/ads/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface InlineAdCardProps {
  position: AdPosition;
  gameId?: string;
  className?: string;
  userStats?: {
    predictionsCount?: number;
    gamesPlayed?: number;
    lastAdShown?: Date;
  };
}

export function InlineAdCard({
  position,
  gameId,
  className,
  userStats,
}: InlineAdCardProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [ad, setAd] = useState<AdCreative | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!firestore) return;

    const loadAd = async () => {
      try {
        setLoading(true);
        const decision = await AdDecisionEngine.decideAd(
          firestore,
          position,
          user?.uid || '',
          gameId,
          userStats
        );

        if (decision.show && decision.type === 'IMAGE' && decision.ad) {
          setAd(decision.ad as AdCreative);

          // Record impression
          if (user) {
            await recordImpression(firestore, {
              adId: decision.ad.id,
              campaignId: (decision.ad as AdCreative).campaignId,
              userId: user.uid,
              placement: position,
              gameId,
            });
          }
        }
      } catch (error) {
        console.error('Error loading ad:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAd();
  }, [firestore, position, gameId, user, userStats]);

  const handleClick = async () => {
    if (!ad || !firestore || !user) return;

    try {
      await recordClick(firestore, {
        adId: ad.id,
        campaignId: ad.campaignId,
        userId: user.uid,
        placement: position,
        gameId,
        clickUrl: ad.clickUrl,
      });

      window.open(ad.clickUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error recording click:', error);
    }
  };

  if (loading || !ad || dismissed) {
    return null;
  }

  return (
    <Card className={cn('relative overflow-hidden border-primary/20 bg-primary/5', className)}>
      <CardContent className="p-0">
        <div className="relative">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background h-6 w-6"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3 w-3" />
          </Button>

          {/* Ad Image */}
          <div className="relative aspect-video w-full bg-muted cursor-pointer" onClick={handleClick}>
            <Image
              src={ad.imageUrl}
              alt={ad.altText}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Ad Info */}
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-primary">Sponsored</span>
              {ad.title && (
                <span className="text-xs font-semibold truncate">{ad.title}</span>
              )}
            </div>
            {ad.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{ad.description}</p>
            )}
            <Button
              onClick={handleClick}
              size="sm"
              variant="outline"
              className="w-full text-xs"
            >
              Learn More
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

