import Image from 'next/image';
import { Edit, MapPin, Users, Heart } from 'lucide-react';
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
import { PostCard } from '@/components/post-card';
import { PageHeader } from '@/components/page-header';

export default function ProfilePage() {
  const user = users[0];
  const userPosts = posts.filter((p) => p.author.id === user.id);
  const userCommunities = communities.slice(0, 2);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full bg-muted">
            <Image
              src="https://picsum.photos/seed/profile-banner/1200/400"
              alt="Profile banner"
              fill
              className="object-cover"
              data-ai-hint="abstract texture"
            />
          </div>
        </CardHeader>
        <CardContent className="relative p-6">
          <div className="absolute -top-16 left-6">
            <Avatar className="h-32 w-32 border-4 border-card">
              <AvatarImage src="https://picsum.photos/seed/user1/200/200" alt={user.name} data-ai-hint="woman portrait" />
              <AvatarFallback className="text-4xl">
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex justify-end">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          </div>
          <div className="pt-16">
            <CardTitle className="font-headline text-3xl">{user.name}</CardTitle>
            <p className="flex items-center text-muted-foreground">
              <MapPin className="mr-1.5 h-4 w-4" />
              {user.city}
            </p>
          </div>

          <div className="mt-4">
            <h3 className="mb-2 font-semibold">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <Badge key={interest} variant="secondary">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PageHeader title="Recent Activity" description="Posts and comments from the user." />
          <div className="space-y-6">
            {userPosts.length > 0 ? (
              userPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <p>No posts yet.</p>
            )}
          </div>
        </div>
        <div className="space-y-6 lg:col-span-1">
           <PageHeader title="About" description="Stats and communities." />
          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{userPosts.length}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">128</p>
                <p className="text-sm text-muted-foreground">Likes Given</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Communities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userCommunities.map((community) => (
                <div key={community.id} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0">
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
                      {community.memberCount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
