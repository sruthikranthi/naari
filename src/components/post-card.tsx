
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, BarChart } from 'lucide-react';
import type { Post } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Timestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

type PostFromFirestore = Omit<Post, 'timestamp'> & {
  timestamp: Timestamp | null;
};

const formatTimestamp = (timestamp: Timestamp | null): string => {
  if (!timestamp) {
    return 'Just now';
  }
  return `${formatDistanceToNow(timestamp.toDate())} ago`;
};


export function PostCard({ post }: { post: PostFromFirestore }) {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const authorName = post.isAnonymous ? 'Anonymous Sakhi' : post.author.name;
  const authorAvatar = post.isAnonymous
    ? (PlaceHolderImages.find(p => p.id === 'user-5')?.imageUrl || 'https://picsum.photos/seed/anonymous/100/100')
    : post.author.avatar;
  
  const totalVotes = post.pollOptions?.reduce((acc, option) => acc + option.votes, 0) || 0;

  const handleLike = () => {
    if (isLiked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setIsLiked(!isLiked);
    // In a real app, you would also update the document in Firestore.
  };
  
  const handleComment = () => {
    console.log('Comment button clicked for post:', post.id);
    // In a real app, this would open a comment modal or navigate to a post detail page
    toast({
        title: "Comment section coming soon!",
        description: "You'll be able to comment on posts shortly.",
    })
  }
  
  const handleShare = () => {
    const postUrl = `${window.location.origin}/dashboard/post/${post.id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
        toast({
            title: "Link Copied!",
            description: "The post link has been copied to your clipboard.",
        })
    }).catch(err => {
        console.error('Failed to copy link: ', err);
        toast({
            variant: "destructive",
            title: "Failed to copy",
            description: "Could not copy the link to your clipboard.",
        })
    });
  }

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
          <p className="text-sm text-muted-foreground">{formatTimestamp(post.timestamp)}</p>
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
        {post.pollOptions && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className='flex items-center gap-2 font-medium text-sm'>
              <BarChart className="h-4 w-4" />
              <span>Poll</span>
            </div>
            <div className="space-y-2">
            {post.pollOptions.map((option, index) => {
              const votePercentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{option.text}</span>
                    <span className="text-muted-foreground">{votePercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={votePercentage} className="h-2" />
                </div>
              );
            })}
            </div>
             <p className="text-xs text-muted-foreground">{totalVotes} votes</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between p-2 px-4">
        <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleLike}>
          <Heart className={cn("size-4", isLiked && "fill-destructive text-destructive")} />
          <span>{likeCount}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleComment}>
          <MessageCircle className="size-4" />
          <span>{post.comments} Comments</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleShare}>
          <Share2 className="size-4" />
          <span>Share</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
