'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Twitter, Facebook, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import type { Contest } from '@/lib/contests-data';

type NominationCongratulationsProps = {
  contest: Contest;
  onClose: () => void;
};

export function NominationCongratulations({ contest, onClose }: NominationCongratulationsProps) {
  const { toast } = useToast();

  const shareText = `🎉 Exciting News! I've been nominated for the "${contest.title}" contest on Naarimani! 🏆\n\nSupport me by voting and sharing! 💕\n\n#Naarimani #Contest #WomenEmpowerment`;
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard/contests/${contest.id}` : '';

  const handleShare = (platform: 'whatsapp' | 'twitter' | 'facebook' | 'copy') => {
    switch (platform) {
      case 'whatsapp':
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
        window.open(whatsappUrl, '_blank');
        break;
      case 'twitter':
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank');
        break;
      case 'facebook':
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(facebookUrl, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(shareText + '\n\n' + shareUrl);
        toast({
          title: 'Link Copied!',
          description: 'The link has been copied to your clipboard.'
        });
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
            🎉
          </div>
          <CardTitle className="text-3xl">Congratulations!</CardTitle>
          <CardDescription className="text-lg">
            You have been nominated for the <strong>{contest.title}</strong> contest!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-secondary/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Start sharing your nomination with friends and family to get more votes and support!
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Share on Social Media:</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleShare('whatsapp')}
              >
                <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleShare('twitter')}
              >
                <Twitter className="mr-2 h-4 w-4 text-blue-400" />
                Twitter
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleShare('facebook')}
              >
                <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                Facebook
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleShare('copy')}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button className="flex-1" onClick={() => window.location.href = `/dashboard/contests/${contest.id}`}>
              View Contest
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

