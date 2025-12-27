'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, Check } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { COIN_REWARDS } from '@/lib/fantasy/constants';

export function ReferralCard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralLink = user?.uid
    ? `${window.location.origin}/signup?ref=${user.uid}`
    : '';

  const handleCopy = async () => {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: 'Link Copied!',
        description: 'Share this link with your friends to earn coins!',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Copy',
        description: 'Could not copy the referral link.',
      });
    }
  };

  const handleShare = async () => {
    if (!referralLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Naari Mani - Women\'s Community',
          text: `Join me on Naari Mani! Use my referral link to get started.`,
          url: referralLink,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Refer Friends
        </CardTitle>
        <CardDescription>
          Share your referral link and earn {COIN_REWARDS.REFERRAL} coins when friends join!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Referral Link</label>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="flex-1 font-mono text-xs"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleShare} className="flex-1" variant="default">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 <strong>How it works:</strong> When someone signs up using your link, you both get {COIN_REWARDS.REFERRAL} coins!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

