
'use client';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, where, orderBy } from 'firebase/firestore';

import { CommunityClient } from './community-client';
import type { Community, Post, User as UserType } from '@/lib/mock-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const communityEvents = [
  {
    id: 'e1',
    title: 'Virtual Meetup: Summer Goals',
    date: 'July 30, 2024',
    time: '7:00 PM',
    platform: 'Zoom',
  },
  {
    id: 'e2',
    title: 'Workshop: Financial Planning for Beginners',
    date: 'August 12, 2024',
    time: '5:00 PM',
    platform: 'Google Meet',
  },
];

const communityResources = [
    {
        id: 'res1',
        title: 'Startup Funding Guide',
        description: 'A comprehensive guide on how to secure funding for your new venture.',
        link: 'https://www.forbes.com/advisor/business/startup-funding/'
    },
    {
        id: 'res2',
        title: 'Effective Marketing Strategies',
        description: 'Learn about the most effective marketing strategies for small businesses in 2024.',
        link: 'https://neilpatel.com/blog/marketing-strategies/'
    }
];


function CommunityDetailPageContent() {
    const params = useParams();
    const { id } = params;
    const firestore = useFirestore();

    const communityRef = useMemoFirebase(
        () => (firestore && id ? doc(firestore, 'communities', id as string) : null),
        [firestore, id]
    );

    const { data: community, isLoading: isCommunityLoading, error: communityError } = useDoc<Community>(communityRef);

    const postsQuery = useMemoFirebase(
      () => (firestore ? query(collection(firestore, 'posts'), orderBy('timestamp', 'desc')) : null),
      [firestore]
    );
    const { data: posts, isLoading: arePostsLoading } = useCollection<Post>(postsQuery);

    const membersQuery = useMemoFirebase(
      () => (firestore && community?.memberIds && community.memberIds.length > 0) ? query(collection(firestore, 'users'), where('id', 'in', community.memberIds)) : null,
      [firestore, community]
    );
    const { data: communityMembers, isLoading: areMembersLoading } = useCollection<UserType>(membersQuery);


    if (isCommunityLoading || arePostsLoading || areMembersLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-64 w-full" />
                <div className="mx-auto max-w-3xl space-y-6">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        );
    }
    
    if (communityError) {
        console.error("Error fetching community:", communityError);
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <p className="text-lg font-semibold">Error Loading Community</p>
            <p className="text-sm text-muted-foreground">
              There was an error loading the community. Please try again later.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => window.history.back()}>Go Back</Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard/communities'}>
                View All Communities
              </Button>
            </div>
          </div>
        );
    }

    if (!community) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <p className="text-lg font-semibold">Community Not Found</p>
            <p className="text-sm text-muted-foreground">
              The community you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => window.history.back()}>Go Back</Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard/communities'}>
                View All Communities
              </Button>
            </div>
          </div>
        );
    }

    // For now, we show all posts. Filtering by community would be a future step.
    const displayPosts = posts || [];
    const displayMembers = communityMembers || [];

    return (
        <CommunityClient 
            community={community}
            communityMembers={displayMembers}
            communityEvents={communityEvents}
            posts={displayPosts}
            initialResources={community.id === 'comm3' ? communityResources : []}
        />
    );
}

export default function CommunityDetailPage() {
  return <CommunityDetailPageContent />;
}
