
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Plus, Calendar, User, MapPin } from 'lucide-react';

import { communities, posts, users } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { CreatePost } from '@/components/create-post';
import { PostCard } from '@/components/post-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CommunityClient } from './community-client';

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

export default function CommunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const community = communities.find((c) => c.id === id);
  const communityMembers = users.slice(0, 4);

  if (!community) {
    notFound();
  }

  return (
    <CommunityClient 
        community={community}
        communityMembers={communityMembers}
        communityEvents={communityEvents}
        posts={posts}
    />
  );
}
