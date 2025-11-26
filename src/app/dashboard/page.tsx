
'use client';

import React, { useState, createContext, useContext } from 'react';
import { CreatePost } from '@/components/create-post';
import { PostCard } from '@/components/post-card';
import { Stories } from '@/components/stories';
import { Suggestions } from '@/components/suggestions';
import { TrendingHashtags } from '@/components/trending-hashtags';
import { posts as initialPosts } from '@/lib/mock-data';
import type { Post } from '@/lib/mock-data';

type DashboardContextType = {
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
    <DashboardContext.Provider value={{ addPost }}>
      {children}
    </DashboardContext.Provider>
  );
}

function PageContent() {
  const { posts, addPost } = useDashboardWithPosts();

  return (
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <Stories />
          <CreatePost onPostCreated={addPost} />
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="sticky top-20 hidden space-y-6 lg:block">
          <Suggestions />
          <TrendingHashtags />
        </div>
      </div>
  );
}

// A new hook that also exposes posts
const useDashboardWithPosts = () => {
    const context = useContext(DashboardContext);
    if (!context) {
      throw new Error('useDashboard must be used within a DashboardProvider');
    }
    // We need to manage posts state here now for the main page
    const [posts, setPosts] = useState<Post[]>(initialPosts);

    const addPost = (newPost: Post) => {
        setPosts(prevPosts => [newPost, ...prevPosts]);
        context.addPost(newPost); // Also call the context's addPost if it has its own logic
    };

    return { posts, addPost };
}

export default function DashboardPage() {
    return <PageContent />;
}
