
'use client';

import React from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { CreatePost } from '@/components/create-post';
import { PostCard } from '@/components/post-card';
import { Stories } from '@/components/stories';
import { Suggestions } from '@/components/suggestions';
import { TrendingHashtags } from '@/components/trending-hashtags';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

function PageContent() {
    const firestore = useFirestore();
    const postsQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'posts'), orderBy('timestamp', 'desc')) : null,
      [firestore]
    );
    const { data: posts, isLoading } = useCollection(postsQuery);

    const anonymousPosts = posts?.filter(p => p.isAnonymous) || [];

    return (
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <Stories />
          <CreatePost />
          
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
                </>
              )}
              {posts && posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {!isLoading && posts?.length === 0 && (
                <div className="py-20 text-center text-muted-foreground">
                    <h3 className="text-lg font-semibold">Be the first to post!</h3>
                    <p>Share what's on your mind with the community.</p>
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
          <Suggestions />
          <TrendingHashtags />
        </div>
      </div>
    );
}


export default function DashboardPage() {
    return <PageContent />;
}
