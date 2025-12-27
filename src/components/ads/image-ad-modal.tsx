'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { AdDecisionEngine, recordImpression, recordClick } from '@/lib/ads/services';
import type { AdPosition, AdCreative } from '@/lib/ads/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface ImageAdModalProps {
  position: AdPosition;
  gameId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userStats?: {
    predictionsCount?: number;
    gamesPlayed?: number;
    lastAdShown?: Date;
  };
}

export function ImageAdModal({
  position,
  gameId,
  open,
  onOpenChange,
  userStats,
}: ImageAdModalProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [ad, setAd] = useState<AdCreative | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !firestore) return;

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
        } else {
          // No ad to show, close modal
          onOpenChange(false);
        }
      } catch (error) {
        console.error('Error loading ad:', error);
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    };

    loadAd();
  }, [open, firestore, position, gameId, user, userStats, onOpenChange]);

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

  if (!ad) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="relative">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Ad Image */}
          <div className="relative aspect-video w-full bg-muted">
            <Image
              src={ad.imageUrl}
              alt={ad.altText}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Ad Info */}
          <div className="p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary">Sponsored</span>
                {ad.title && (
                  <span className="text-sm font-semibold">{ad.title}</span>
                )}
              </div>
              {ad.description && (
                <p className="text-xs text-muted-foreground">{ad.description}</p>
              )}
            </div>

            {/* Action Button */}
            <Button
              onClick={handleClick}
              className="w-full"
              variant="default"
            >
              Learn More
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

