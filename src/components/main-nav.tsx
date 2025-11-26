'use client';

import Link from 'next/link';
import {
  Home,
  Users,
  Store,
  Wallet,
  MessageCircle,
  HeartPulse,
  BookOpen,
  Ticket,
  HeartHandshake,
  Briefcase,
  Shield,
} from 'lucide-react';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/communities', icon: Users, label: 'Communities' },
  { href: '/dashboard/marketplace', icon: Store, label: 'Marketplace' },
  { href: '/dashboard/kitty-groups', icon: Wallet, label: 'Kitty Groups' },
  { href: '/dashboard/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/dashboard/wellness', icon: HeartPulse, label: 'Wellness' },
  { href: '/dashboard/learning', icon: BookOpen, label: 'Learning' },
  { href: '/dashboard/tambola', icon: Ticket, label: 'Tambola' },
  {
    href: '/dashboard/support-directory',
    icon: HeartHandshake,
    label: 'Support Directory',
  },
  {
    href: '/dashboard/professional-hub',
    icon: Briefcase,
    label: 'Professional Hub',
  },
   {
    href: '/dashboard/admin',
    icon: Shield,
    label: 'Admin Panel',
  },
];

export function MainNav() {
  const { isMobile } = useSidebar();
  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <Link href={item.href} className="w-full">
            <SidebarMenuButton
              tooltip={isMobile ? undefined : item.label}
              className="w-full justify-start"
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
