
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
import { motion } from 'framer-motion';
import { CommentsDialog } from '@/components/comments-dialog';
import { useFirestore, useUser } from '@/firebase';
import { awardBlogReadCoins, awardReelWatchCoins } from '@/lib/fantasy/coin-rewards';

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
  const firestore = useFirestore();
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [hasAwardedRead, setHasAwardedRead] = useState(false);
  const [hasAwardedWatch, setHasAwardedWatch] = useState(false);

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
    setIsCommentsOpen(true);
  }

  const handleCommentAdded = () => {
    setCommentCount(commentCount + 1);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="hover-lift"
    >
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
        <p 
          className="whitespace-pre-wrap text-sm"
          onMouseEnter={async () => {
            // Award coins when user reads post (on hover/engagement)
            if (firestore && user && !hasAwardedRead && post.content.length > 100) {
              // Only award if post has substantial content (like a blog)
              setHasAwardedRead(true);
              const result = await awardBlogReadCoins(
                firestore,
                user.uid,
                post.id,
                post.content.substring(0, 50)
              );
              if (result.awarded) {
                toast({
                  title: 'Coins Earned!',
                  description: `You earned ${result.coins} coins for reading this post!`,
                });
              }
            }
          }}
        >
          {post.content}
        </p>
        {post.image && (
          <div className="relative aspect-video overflow-hidden rounded-lg border">
            <Image
              src={post.image}
              alt="Post image"
              fill
              className="object-cover"
              data-ai-hint="social media lifestyle"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        {post.video && (
          <div className="relative aspect-video overflow-hidden rounded-lg border bg-black">
            <video
              src={post.video}
              controls
              className="w-full h-full object-contain"
              preload="metadata"
              playsInline
              onPlay={async () => {
                // Award coins when user starts watching video
                if (firestore && user && !hasAwardedWatch) {
                  setHasAwardedWatch(true);
                  const result = await awardReelWatchCoins(
                    firestore,
                    user.uid,
                    post.id,
                    post.content.substring(0, 50)
                  );
                  if (result.awarded) {
                    toast({
                      title: 'Coins Earned!',
                      description: `You earned ${result.coins} coins for watching this video!`,
                    });
                  }
                }
              }}
            >
              <source src={post.video} type="video/mp4" />
              <source src={post.video} type="video/webm" />
              Your browser does not support the video tag.
            </video>
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
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2 min-h-[44px] min-w-[44px] touch-manipulation scale-on-click" 
            onClick={handleLike}
            aria-label={isLiked ? 'Unlike post' : 'Like post'}
            aria-pressed={isLiked}
          >
            <motion.div
              animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart className={cn("size-4", isLiked && "fill-destructive text-destructive")} aria-hidden="true" />
            </motion.div>
            <span>{likeCount}</span>
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2 min-h-[44px] min-w-[44px] touch-manipulation scale-on-click" 
            onClick={handleComment}
            aria-label={`Comment on post by ${authorName}. ${post.comments} comments`}
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            <span>{commentCount} Comments</span>
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2 min-h-[44px] min-w-[44px] touch-manipulation scale-on-click" 
            onClick={handleShare}
            aria-label="Share post"
          >
            <Share2 className="size-4" aria-hidden="true" />
            <span>Share</span>
          </Button>
        </motion.div>
      </CardFooter>
      <CommentsDialog
        postId={post.id}
        isOpen={isCommentsOpen}
        onOpenChange={setIsCommentsOpen}
        currentCommentCount={commentCount}
        onCommentAdded={handleCommentAdded}
      />
    </Card>
    </motion.div>
  );
}
