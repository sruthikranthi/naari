'use client';

import Link from 'next/link';
import {
  Home,
  Users,
  Store,
  Wallet,
  MessageCircle,
  Ticket,
  Shield,
  Award,
  Sparkles,
  Trophy,
  Gift,
  ClipboardCheck,
} from 'lucide-react';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { useUser } from '@/firebase';

const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID || 'ebixEzJ8UuYjIYTXrkOObW1obSw1';

// Phase 2 (hidden until release): Learning, Wellness, Upcoming, Professional Hub, Support Directory, Subscriptions
const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/communities', icon: Users, label: 'Communities' },
  { href: '/dashboard/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/dashboard/kitty-groups', icon: Wallet, label: 'Kitty Groups' },
  { href: '/dashboard/fantasy', icon: Sparkles, label: 'Naari Fantasy' },
  { href: '/dashboard/quizzes', icon: ClipboardCheck, label: 'Quizzes' },
  { href: '/dashboard/tambola', icon: Ticket, label: 'Tambola' },
  { href: '/dashboard/contests', icon: Award, label: 'Contests' },
  { href: '/dashboard/marketplace', icon: Store, label: 'Marketplace' },
  { href: '/dashboard/admin', icon: Shield, label: 'Admin Panel', adminOnly: true },
  { href: '/dashboard/fantasy#leaderboard', icon: Trophy, label: 'Leaderboard' },
  { href: '/dashboard/rewards', icon: Gift, label: 'Rewards' },
];

export function MainNav() {
  const { isMobile } = useSidebar();
  const { user } = useUser();
  const isSuperAdmin = user?.uid === SUPER_ADMIN_ID;

  // Filter nav items based on admin status
  const visibleNavItems = navItems.filter(item => {
    if (item.adminOnly && !isSuperAdmin) {
      return false;
    }
    return true;
  });

  return (
    <SidebarMenu>
      {visibleNavItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <Link 
            href={item.href} 
            className="w-full"
            aria-label={item.label}
          >
            <SidebarMenuButton
              tooltip={isMobile ? undefined : item.label}
              className="w-full justify-start focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={item.label}
            >
              <item.icon className="size-5" aria-hidden="true" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
