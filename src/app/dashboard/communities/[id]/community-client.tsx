'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Plus, Calendar, User, MapPin, Check, Link as LinkIcon, FileText, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { type Community, type Post, type User as UserType } from '@/lib/mock-data';
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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CameraCapture } from '@/components/camera-capture';

type CommunityEvent = {
    id: string;
    title: string;
    date: string;
    time: string;
    platform: string;
}

type CommunityResource = {
    id: string;
    title: string;
    description: string;
    link: string;
}

type CommunityClientProps = {
    community: Community;
    communityMembers: UserType[];
    communityEvents: CommunityEvent[];
    posts: Post[];
    initialResources: CommunityResource[];
}

const resourceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  link: z.string().url("Please enter a valid URL."),
});

type ResourceFormValues = z.infer<typeof resourceSchema>;

export function CommunityClient({ community, communityMembers, communityEvents, posts, initialResources }: CommunityClientProps) {
  const { toast } = useToast();
  const [isJoined, setIsJoined] = useState(true);
  const [connectedMembers, setConnectedMembers] = useState<string[]>([]);
  const [resources, setResources] = useState(initialResources);
  const [isMeetDialogOpen, setIsMeetDialogOpen] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
  });

  const handleRsvp = (eventTitle: string) => {
    toast({
      title: 'RSVP Confirmed!',
      description: `You have successfully RSVP'd for "${eventTitle}".`,
    });
  };

  const handleConnect = (memberId: string, memberName: string) => {
    if (connectedMembers.includes(memberId)) return;
    setConnectedMembers([...connectedMembers, memberId]);
    toast({
        title: 'Connection Request Sent',
        description: `Your request to connect with ${memberName} has been sent.`,
    });
  };
  
  const handleJoinToggle = () => {
    setIsJoined(!isJoined);
    toast({
        title: isJoined ? `Left ${community.name}` : `Joined ${community.name}!`,
        description: isJoined ? `You have left the community.` : 'Welcome to the community!',
    })
  }

  const onResourceSubmit = (data: ResourceFormValues) => {
    // eslint-disable-next-line react-hooks/purity -- Date.now() is used in event handler, not during render
    const resourceId = `res${Date.now()}`;
    const newResource: CommunityResource = {
        id: resourceId,
        ...data,
    };
    setResources([newResource, ...resources]);
    toast({
        title: 'Resource Shared!',
        description: 'Your resource has been added for the community.',
    });
    reset();
  };

  const handleStartBroadcast = () => {
    setIsMeetDialogOpen(false);
    toast({
      title: 'Broadcast Started!',
      description: 'Your video seminar is now live for the community.',
    });
  };

  const handleMediaCaptured = (dataUrl: string, type: 'image' | 'video') => {
    // In a real app, you might use this for a thumbnail or preview
    console.log('Media captured for meet:', type, dataUrl.substring(0, 50));
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
        <div className="absolute top-4 right-4 flex gap-2">
            <Dialog open={isMeetDialogOpen} onOpenChange={setIsMeetDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary"><Video className="mr-2 h-4 w-4" /> Start a Meet</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Start a Live Video Seminar</DialogTitle>
                        <DialogDescription>
                            Host a live session for your community. Your camera will be used.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input placeholder="Enter a title for your seminar..." />
                        <div className='h-96'><CameraCapture onMediaCaptured={handleMediaCaptured} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsMeetDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleStartBroadcast}>Start Broadcast</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Button 
                variant={isJoined ? 'secondary' : 'default'}
                onClick={handleJoinToggle}
            >
            {isJoined ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {isJoined ? 'Joined' : 'Join'}
            </Button>
        </div>
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
              {communityMembers.map((member) => {
                const isPending = connectedMembers.includes(member.id);
                return (
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
                    <Button 
                        size="sm" 
                        variant={isPending ? 'secondary' : 'outline'} 
                        className="ml-auto" 
                        onClick={() => handleConnect(member.id, member.name)}
                        disabled={isPending}
                    >
                        {isPending ? 'Pending' : 'Connect'}
                    </Button>
                    </div>
                )
              })}
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
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
             <div className="space-y-6 md:col-span-2">
                {resources.length > 0 ? (
                    resources.map((resource) => (
                        <Card key={resource.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                {resource.title}
                                </CardTitle>
                                <CardDescription>{resource.description}</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button asChild variant="outline">
                                    <a href={resource.link} target="_blank" rel="noopener noreferrer">
                                        <LinkIcon className="mr-2 h-4 w-4" />
                                        View Resource
                                    </a>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="py-12 text-center text-muted-foreground">
                        No resources shared yet. Be the first!
                    </div>
                )}
             </div>
             <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Share a Resource</CardTitle>
                        <CardDescription>Add a helpful link for the community.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onResourceSubmit)} className="space-y-4">
                            <div>
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" {...register("title")} />
                                {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
                            </div>
                             <div>
                                <Label htmlFor="link">Link (URL)</Label>
                                <Input id="link" {...register("link")} placeholder="https://example.com" />
                                {errors.link && <p className="mt-1 text-xs text-destructive">{errors.link.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" {...register("description")} />
                                {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
                            </div>
                            <Button type="submit" className="w-full">Share</Button>
                        </form>
                    </CardContent>
                </Card>
             </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
