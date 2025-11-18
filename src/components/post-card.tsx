import Image from 'next/image';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import type { Post } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';

export function PostCard({ post }: { post: Post }) {
  const authorName = post.isAnonymous ? 'Anonymous Sakhi' : post.author.name;
  const authorAvatar = post.isAnonymous
    ? 'https://picsum.photos/seed/anonymous/100/100'
    : 'https://picsum.photos/seed/user1/100/100';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={authorAvatar} alt={authorName} data-ai-hint="woman portrait" />
          <AvatarFallback>
            {authorName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{authorName}</p>
          <p className="text-sm text-muted-foreground">{post.timestamp}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-2">
        <p className="whitespace-pre-wrap text-sm">{post.content}</p>
        {post.image && (
          <div className="relative aspect-video overflow-hidden rounded-lg border">
            <Image
              src={post.image}
              alt="Post image"
              fill
              className="object-cover"
              data-ai-hint="social media lifestyle"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between p-2 px-4">
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Heart className="size-4" />
          <span>{post.likes}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <MessageCircle className="size-4" />
          <span>{post.comments} Comments</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Share2 className="size-4" />
          <span>Share</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
