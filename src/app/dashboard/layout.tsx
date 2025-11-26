
'use client';
import React, { type ReactNode, useState, createContext, useContext } from 'react';
import {
  Search,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import { MainNav } from '@/components/main-nav';
import { CartProvider } from '@/context/cart-context';
import { CartSheet } from '@/components/cart-sheet';
import { NotificationsNav } from '@/components/notifications-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import type { Post } from '@/lib/mock-data';
import { posts as initialPosts } from '@/lib/mock-data';

// Create Dashboard Context
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

// Create Dashboard Provider
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


export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <DashboardProvider>
        <Layout>{children}</Layout>
      </DashboardProvider>
    </CartProvider>
  );
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 w-full items-center justify-between border-b bg-card px-4 md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsNav />
            <CartSheet />
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
