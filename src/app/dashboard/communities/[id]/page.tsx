import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Plus } from 'lucide-react';

import { communities, posts } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { CreatePost } from '@/components/create-post';
import { PostCard } from '@/components/post-card';

export default function CommunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const community = communities.find((c) => c.id === params.id);

  if (!community) {
    notFound();
  }

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
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-start justify-end p-6">
          <h1 className="font-headline text-3xl font-bold text-white md:text-4xl">
            {community.name}
          </h1>
          <p className="text-sm text-white/80">
            {community.memberCount.toLocaleString()} members
          </p>
        </div>
        <Button className="absolute top-4 right-4">
          <Plus className="mr-2 h-4 w-4" />
          Join Community
        </Button>
      </div>

      <Tabs defaultValue="discussions" className="w-full">
        <TabsList>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="discussions" className="mt-6">
          <div className="mx-auto max-w-3xl space-y-6">
            <CreatePost />
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="events">
          <div className="text-center text-muted-foreground">
            Upcoming events will be shown here.
          </div>
        </TabsContent>
        <TabsContent value="resources">
          <div className="text-center text-muted-foreground">
            Shared resources and files will be shown here.
          </div>
        </TabsContent>
        <TabsContent value="members">
          <div className="text-center text-muted-foreground">
            A list of community members will be shown here.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
