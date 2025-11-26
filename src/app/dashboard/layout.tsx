
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
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import { MainNav } from '@/components/main-nav';
import { CartProvider } from '@/context/cart-context';
import { CartSheet } from '@/components/cart-sheet';
import { NotificationsNav } from '@/components/notifications-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { SearchModal } from '@/components/search-modal';
import type { Post } from '@/lib/mock-data';

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
  const [posts, setPosts] = useState<Post[]>([]);

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <header className="flex h-16 w-full items-center justify-between border-b bg-card px-4 md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger 
              className="md:hidden" 
              aria-label="Toggle sidebar"
            />
            <div className="relative hidden md:block">
              <label htmlFor="search-input" className="sr-only">
                Search
              </label>
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="search-input"
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                aria-label="Search"
                onFocus={() => setIsSearchOpen(true)}
                readOnly
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open search"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsNav />
            <CartSheet />
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6" role="main">
          {children}
        </main>
        <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      </SidebarInset>
    </SidebarProvider>
  )
}
