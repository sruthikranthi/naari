'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { getActiveSponsors, recordImpression, recordClick } from '@/lib/ads/services';
import type { Sponsor, AdPosition } from '@/lib/ads/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface SponsorBannerProps {
  position: AdPosition;
  gameId?: string;
  className?: string;
  onClose?: () => void;
  variant?: 'compact' | 'full';
}

export function SponsorBanner({
  position,
  gameId,
  className,
  onClose,
  variant = 'compact',
}: SponsorBannerProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!firestore) return;

    const loadSponsor = async () => {
      try {
        setLoading(true);
        const type = ['LOBBY_BANNER', 'LEADERBOARD_BANNER', 'PROFILE_BANNER'].includes(position)
          ? 'OVERALL'
          : 'EVENT';
        
        const sponsors = await getActiveSponsors(firestore, type, gameId);
        
        if (sponsors.length > 0) {
          const selectedSponsor = sponsors[0]; // Rotate: pick first for now
          setSponsor(selectedSponsor);
          
          // Record impression
          if (user) {
            await recordImpression(firestore, {
              adId: selectedSponsor.id,
              campaignId: selectedSponsor.id, // Using sponsor ID as campaign ID
              userId: user.uid,
              placement: position,
              gameId,
            });
          }
        }
      } catch (error) {
        console.error('Error loading sponsor:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSponsor();
  }, [firestore, position, gameId, user]);

  const handleClick = async () => {
    if (!sponsor || !firestore || !user) return;

    try {
      await recordClick(firestore, {
        adId: sponsor.id,
        campaignId: sponsor.id,
        userId: user.uid,
        placement: position,
        gameId,
        clickUrl: sponsor.websiteUrl || '#',
      });

      if (sponsor.websiteUrl) {
        window.open(sponsor.websiteUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error recording click:', error);
    }
  };

  if (loading || !sponsor || dismissed) {
    return null;
  }

  return (
    <Card className={cn('relative overflow-hidden border-primary/20 bg-primary/5', className)}>
      <div className="flex items-center gap-3 p-3">
        <div className="flex-shrink-0">
          <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-background border">
            {sponsor.logoUrl && (
              <Image
                src={sponsor.logoUrl}
                alt={sponsor.name}
                fill
                className="object-contain p-1"
                unoptimized
              />
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-primary">Sponsored</span>
            <span className="text-xs text-muted-foreground truncate">{sponsor.name}</span>
          </div>
          {variant === 'full' && sponsor.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{sponsor.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {sponsor.websiteUrl && (
            <Button
              onClick={handleClick}
              size="sm"
              variant="outline"
              className="h-8 text-xs"
            >
              Visit
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          )}
          {onClose && (
            <Button
              onClick={() => {
                setDismissed(true);
                onClose();
              }}
              size="icon"
              variant="ghost"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

