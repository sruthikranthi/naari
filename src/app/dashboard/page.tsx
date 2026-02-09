
'use client';

import React from 'react';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { CreatePost } from '@/components/create-post';
import { PostCard } from '@/components/post-card';
import { Stories } from '@/components/stories';
import { Suggestions } from '@/components/suggestions';
import { TrendingHashtags } from '@/components/trending-hashtags';
import { WalletCard } from '@/components/fantasy/wallet-card';
import { ReferralCard } from '@/components/fantasy/referral-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AdCard, type Ad } from '@/components/ad-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, ArrowRight, Gift, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type PostFromFirestore = {
  id: string;
  author: {
      id: string;
      name: string;
      avatar: string;
  };
  content: string;
  image?: string;
  video?: string;
  timestamp: Timestamp | null;
  likes: number;
  comments: number;
  isAnonymous: boolean;
  pollOptions?: { text: string; votes: number }[];
};


const mockAds: Ad[] = [
  {
    id: 'ad1',
    advertiser: 'Bloom Wellness',
    avatar: 'https://picsum.photos/seed/ad-logo-1/100/100',
    title: 'Your Path to Mindful Living',
    description: 'Discover our new collection of ethically-sourced yoga mats and wellness journals. Perfect for your daily practice.',
    image: 'https://picsum.photos/seed/ad-img-1/600/400',
    ctaText: 'Shop Now',
    ctaLink: 'https://example.com/shop'
  },
  {
    id: 'ad2',
    advertiser: 'SheCapital',
    avatar: 'https://picsum.photos/seed/ad-logo-2/100/100',
    title: 'Financial Planning for Women',
    description: 'Take control of your financial future. Join our free webinar on investment strategies for women.',
    image: 'https://picsum.photos/seed/ad-img-2/600/400',
    ctaText: 'Register Free',
    ctaLink: 'https://example.com/webinar'
  }
];

// Helper function to intersperse ads into the post feed
const intersperseAds = (posts: PostFromFirestore[], ads: Ad[]): (PostFromFirestore | Ad)[] => {
    const feed: (PostFromFirestore | Ad)[] = [];
    let adIndex = 0;
    const adInterval = 3; // Show an ad every 3 posts

    posts.forEach((post, index) => {
        feed.push(post);
        if ((index + 1) % adInterval === 0) {
            if (adIndex < ads.length) {
                feed.push({ ...ads[adIndex], id: `ad-${adIndex}-${index}` });
                adIndex = (adIndex + 1) % ads.length; // Cycle through ads
            }
        }
    });

    return feed;
}


function PageContent() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    const postsQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'posts'), orderBy('timestamp', 'desc')) : null,
      [firestore]
    );
    const { data: posts, isLoading: arePostsLoading } = useCollection<PostFromFirestore>(postsQuery);

    const isLoading = isUserLoading || arePostsLoading;

    // Intersperse ads into the main feed
    const allPostsFeed = posts ? intersperseAds(posts.filter(p => !p.isAnonymous), mockAds) : [];
    const anonymousPosts = posts?.filter(p => p.isAnonymous) || [];

    return (
      <div className="grid w-full max-w-full grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-8">
        {/* Main content */}
        <div className="min-w-0 w-full max-w-full space-y-4 lg:col-span-2 lg:space-y-6">
          <Stories />
          <CreatePost />
          
          {/* Wallet Card - Show on mobile first, then sidebar on desktop */}
          <div className="lg:hidden">
            <WalletCard />
          </div>
          
          <Tabs defaultValue="all-posts">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all-posts">All Posts</TabsTrigger>
              <TabsTrigger value="anonymous-support">Anonymous Support</TabsTrigger>
            </TabsList>
            <TabsContent value="all-posts" className="mt-6 space-y-6">
              {isLoading && (
                <>
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                </>
              )}
              {allPostsFeed.map((item) => {
                // Check if the item is a post or an ad
                if ('advertiser' in item) {
                  return <AdCard key={item.id} ad={item as Ad} />;
                }
                return <PostCard key={item.id} post={item as PostFromFirestore} />;
              })}
              {!isLoading && allPostsFeed.length === 0 && (
                <div className="py-20 text-center text-muted-foreground">
                    <h3 className="text-lg font-semibold">Be the first to post!</h3>
                    <p>Share what&apos;s on your mind with the community.</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="anonymous-support" className="mt-6 space-y-6">
               {isLoading && (
                <>
                  <Skeleton className="h-48 w-full" />
                </>
              )}
               {anonymousPosts.length > 0 ? (
                anonymousPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))
               ) : (
                !isLoading && (
                  <div className="py-20 text-center text-muted-foreground">
                      <h3 className="text-lg font-semibold">No anonymous posts yet</h3>
                      <p>This is a safe space to share without revealing your identity.</p>
                  </div>
                )
               )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="sticky top-20 hidden space-y-6 lg:block">
          <WalletCard />
          <ReferralCard />
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Fantasy Leaderboard
              </CardTitle>
              <CardDescription>
                See top performers in fantasy games
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/fantasy#leaderboard">
                <Button className="w-full" variant="default">
                  View Leaderboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-600" />
                Rewards Catalog
              </CardTitle>
              <CardDescription>
                Redeem your coins for vouchers, gifts & prizes!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/rewards">
                <Button className="w-full" variant="default">
                  Browse Rewards
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-amber-600" />
                Sponsored Quizzes
              </CardTitle>
              <CardDescription>
                Watch 10s video/image, answer 5 questions, earn coins!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/quizzes">
                <Button className="w-full" variant="default">
                  Take a Quiz
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Suggestions />
          <TrendingHashtags />
        </div>
      </div>
    );
}


export default function DashboardPage() {
    return <PageContent />;
}
