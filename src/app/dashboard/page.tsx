
'use client';

import React, { useState, createContext, useContext } from 'react';
import { CreatePost } from '@/components/create-post';
import { PostCard } from '@/components/post-card';
import { Stories } from '@/components/stories';
import { Suggestions } from '@/components/suggestions';
import { TrendingHashtags } from '@/components/trending-hashtags';
import { posts as initialPosts } from '@/lib/mock-data';
import type { Post } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type DashboardContextType = {
  posts: Post[];
  addPost: (newPost: Post) => void;
};

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const addPost = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const value = { posts, addPost };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

function PageContent() {
    const { posts, addPost } = useDashboard();
    const anonymousPosts = posts.filter(p => p.isAnonymous);

    return (
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <Stories />
          <CreatePost onPostCreated={addPost} />
          
          <Tabs defaultValue="all-posts">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all-posts">All Posts</TabsTrigger>
              <TabsTrigger value="anonymous-support">Anonymous Support</TabsTrigger>
            </TabsList>
            <TabsContent value="all-posts" className="mt-6 space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </TabsContent>
            <TabsContent value="anonymous-support" className="mt-6 space-y-6">
               {anonymousPosts.length > 0 ? (
                anonymousPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))
               ) : (
                <div className="py-20 text-center text-muted-foreground">
                    <h3 className="text-lg font-semibold">No anonymous posts yet</h3>
                    <p>This is a safe space to share without revealing your identity.</p>
                </div>
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
