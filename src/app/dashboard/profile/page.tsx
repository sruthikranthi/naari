'use client';
import Image from 'next/image';
import {
  Edit,
  MapPin,
  Users,
  Heart,
  Briefcase,
  GraduationCap,
  Award,
  Star,
  Baby,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { users, posts, communities } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { PostCard } from '@/components/post-card';
import { PageHeader } from '@/components/page-header';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ProfilePage() {
  const user = users[0];
  const userPosts = posts.filter((p) => p.author.id === user.id);
  const userCommunities = communities.slice(0, 3);
  const userConnections = users.slice(1, 5);

  const userBadges = [
    { icon: Baby, label: 'Super Mom' },
    { icon: Briefcase, label: 'Top Seller' },
    { icon: Award, label: 'Kitty Leader' },
    { icon: Star, label: 'Helpful Sister' },
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full bg-muted md:h-64">
            <Image
              src="https://picsum.photos/seed/profile-banner/1200/400"
              alt="Profile banner"
              fill
              className="object-cover"
              data-ai-hint="abstract texture"
            />
          </div>
        </CardHeader>
        <CardContent className="relative p-6 pt-0">
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-end">
            <div className="-mt-20 shrink-0 md:-mt-24">
              <Avatar className="h-32 w-32 border-4 border-card md:h-40 md:w-40">
                <AvatarImage
                  src="https://picsum.photos/seed/user1/200/200"
                  alt={user.name}
                  data-ai-hint="woman portrait"
                />
                <AvatarFallback className="text-5xl">
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 text-center md:ml-6 md:text-left">
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <h1 className="font-headline text-3xl font-bold">{user.name}</h1>
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <p className="flex items-center justify-center text-muted-foreground md:justify-start">
                <MapPin className="mr-1.5 h-4 w-4" />
                {user.city}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        defaultValue={user.name}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="city" className="text-right">
                        City
                      </Label>
                      <Input
                        id="city"
                        defaultValue={user.city}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="interests" className="text-right">
                        Interests
                      </Label>
                      <Input
                        id="interests"
                        defaultValue={user.interests.join(', ')}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="submit">Save changes</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button>
                <Zap className="mr-2 h-4 w-4" /> Go Premium
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="communities">Communities</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="mt-6">
          <div className="mx-auto max-w-3xl space-y-6">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            {userPosts.length > 0 ? (
              userPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <p className="text-center text-muted-foreground">No posts yet.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="about" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>About {user.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Zap className="text-primary" />
                    Unlock Premium Features!
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Ad-free experience</li>
                    <li>Access to premium communities & courses</li>
                    <li>Advanced Kitty Party tools</li>
                  </ul>
                  <Button>Upgrade Now</Button>
                </CardContent>
              </Card>

              <div>
                <h3 className="mb-2 font-semibold">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Badges</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {userBadges.map((badge) => (
                    <div
                      key={badge.label}
                      className="flex flex-col items-center gap-2 rounded-lg bg-secondary p-4"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <badge.icon className="h-6 w-6" />
                      </div>
                      <p className="text-center text-sm font-medium">
                        {badge.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Stats</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold">{userPosts.length}</p>
                    <p className="text-sm text-muted-foreground">Posts</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold">128</p>
                    <p className="text-sm text-muted-foreground">Likes</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold">
                      {userConnections.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Connections</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-2xl font-bold">
                      {userCommunities.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Communities</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="connections" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Connections</CardTitle>
              <CardDescription>
                {user.name} is connected with {userConnections.length} people.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {userConnections.map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar>
                      <AvatarImage
                        src={`https://picsum.photos/seed/${connection.id}/100/100`}
                        alt={connection.name}
                        data-ai-hint="woman portrait"
                      />
                      <AvatarFallback>
                        {connection.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{connection.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {connection.city}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="communities" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Communities</CardTitle>
              <CardDescription>
                {user.name} is a member of {userCommunities.length} communities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userCommunities.map((community) => (
                <div
                  key={community.id}
                  className="flex items-center gap-4 rounded-lg border p-3"
                >
                  <div className="relative h-16 w-16 shrink-0">
                    <Image
                      src={community.image}
                      alt={community.name}
                      fill
                      className="rounded-md object-cover"
                      data-ai-hint="community people"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{community.name}</p>
                    <p className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-1 h-3 w-3" />
                      {community.memberCount.toLocaleString()} members
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto">
                    View
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    