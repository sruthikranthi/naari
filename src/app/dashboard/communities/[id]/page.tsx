'use client';

import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Plus, Calendar, User, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  params: { id },
}: {
  params: { id: string };
}) {
  const { toast } = useToast();
  const community = communities.find((c) => c.id === id);
  const communityMembers = users.slice(0, 4);

  if (!community) {
    notFound();
  }

  const handleRsvp = (eventTitle: string) => {
    toast({
      title: 'RSVP Confirmed!',
      description: `You have successfully RSVP'd for "${eventTitle}".`,
    });
  };

  const handleConnect = (userName: string) => {
    toast({
        title: 'Connection Request Sent',
        description: `Your request to connect with ${userName} has been sent.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="relative h-48 w-full overflow-hidden rounded-lg md:h-64">
        <Image
          src={community.bannerImage}
          alt={`${community.name} banner`}
          fill
          className="object-cover"
          data-ai-hint="community event"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
        <div className="absolute inset-0 flex flex-col items-start justify-end p-6">
          <h1 className="font-headline text-3xl font-bold text-white md:text-4xl">
            {community.name}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-white/80">
            {community.description}
          </p>
        </div>
        <Button className="absolute top-4 right-4" variant="secondary">
          <Plus className="mr-2 h-4 w-4" />
          Joined
        </Button>
      </div>

      <Tabs defaultValue="discussions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        <TabsContent value="discussions" className="mt-6">
          <div className="mx-auto max-w-3xl space-y-6">
            <CreatePost />
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Community Members ({community.memberCount})</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {communityMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <Avatar>
                    <AvatarImage
                      src={`https://picsum.photos/seed/${member.id}/100/100`}
                      alt={member.name}
                      data-ai-hint="woman portrait"
                    />
                    <AvatarFallback>
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="mr-1 h-3 w-3" />
                      {member.city}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="ml-auto" onClick={() => handleConnect(member.name)}>
                    Connect
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="events" className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {communityEvents.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4 pt-2">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      {event.platform}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <p className="font-semibold">{event.time}</p>
                  <Button onClick={() => handleRsvp(event.title)}>RSVP</Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {communityEvents.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No upcoming events.
            </div>
          )}
        </TabsContent>
        <TabsContent value="resources" className="mt-6">
          <div className="py-12 text-center text-muted-foreground">
            Shared resources and files will be shown here.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
