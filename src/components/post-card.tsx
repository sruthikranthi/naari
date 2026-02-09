
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, BarChart, CheckCircle2 } from 'lucide-react';
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
import { Timestamp, collection, query, where, getDocs, addDoc, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
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
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [pollOptions, setPollOptions] = useState(post.pollOptions || []);
  const [isVoting, setIsVoting] = useState(false);

  const authorName = post.isAnonymous ? 'Anonymous Sakhi' : post.author.name;
  const authorAvatar = post.isAnonymous
    ? (PlaceHolderImages.find(p => p.id === 'user-5')?.imageUrl || 'https://picsum.photos/seed/anonymous/100/100')
    : post.author.avatar;
  
  const totalVotes = pollOptions?.reduce((acc, option) => acc + option.votes, 0) || 0;

  // Check if user has already voted
  useEffect(() => {
    if (!firestore || !user?.uid || !post.pollOptions) return;

    const checkVote = async () => {
      try {
        const votesRef = collection(firestore, 'posts', post.id, 'poll_votes');
        const voteQuery = query(votesRef, where('userId', '==', user.uid));
        const voteSnapshot = await getDocs(voteQuery);
        
        if (!voteSnapshot.empty) {
          const voteDoc = voteSnapshot.docs[0];
          const voteData = voteDoc.data();
          setHasVoted(true);
          setSelectedOptionIndex(voteData.optionIndex);
        }
      } catch (error) {
        console.error('Error checking vote:', error);
      }
    };

    checkVote();
  }, [firestore, user?.uid, post.id, post.pollOptions]);

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

  const handleVote = async (optionIndex: number) => {
    if (!firestore || !user?.uid || hasVoted || isVoting || !post.pollOptions) {
      if (hasVoted) {
        toast({
          variant: 'destructive',
          title: 'Already Voted',
          description: 'You have already voted on this poll.',
        });
      }
      return;
    }

    setIsVoting(true);
    try {
      // Record the vote in subcollection
      const votesRef = collection(firestore, 'posts', post.id, 'poll_votes');
      await addDoc(votesRef, {
        userId: user.uid,
        optionIndex,
        timestamp: serverTimestamp(),
      });

      // Update the poll option vote count in the post document
      const postRef = doc(firestore, 'posts', post.id);
      const updatedOptions = [...pollOptions];
      updatedOptions[optionIndex] = {
        ...updatedOptions[optionIndex],
        votes: (updatedOptions[optionIndex].votes || 0) + 1,
      };

      await updateDoc(postRef, {
        pollOptions: updatedOptions,
      });

      // Update local state
      setPollOptions(updatedOptions);
      setHasVoted(true);
      setSelectedOptionIndex(optionIndex);

      toast({
        title: 'Vote Cast!',
        description: 'Your vote has been recorded.',
      });
    } catch (error: any) {
      console.error('Error voting:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to cast vote. Please try again.',
      });
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="hover-lift w-full min-w-0 max-w-full"
    >
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="flex flex-row items-start gap-3 p-3 sm:gap-4 sm:p-4">
        <Avatar className="h-9 w-9 shrink-0 sm:h-10 sm:w-10">
          <AvatarImage src={authorAvatar} alt={authorName} data-ai-hint="woman portrait" />
          <AvatarFallback>
            {authorName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{authorName}</p>
          <p className="text-xs text-muted-foreground sm:text-sm">{formatTimestamp(post.timestamp)}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-3 pb-2 sm:px-4">
        <p 
          className="whitespace-pre-wrap break-words text-sm"
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
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
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
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black">
            <video
              src={post.video}
              controls
              className="h-full w-full object-contain"
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
        {pollOptions && pollOptions.length > 0 && (
          <div className="space-y-3 rounded-lg border p-3 sm:p-4">
            <div className='flex items-center gap-2 font-medium text-sm'>
              <BarChart className="h-4 w-4" />
              <span>Poll</span>
            </div>
            <div className="space-y-2">
            {pollOptions.map((option, index) => {
              const votePercentage = totalVotes > 0 ? ((option.votes || 0) / totalVotes) * 100 : 0;
              const isSelected = hasVoted && selectedOptionIndex === index;
              const isClickable = !hasVoted && !isVoting && user?.uid;
              
              return (
                <div key={index} className="space-y-1">
                  {hasVoted ? (
                    // Show results after voting
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.text}</span>
                          {isSelected && (
                            <CheckCircle2 className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <span className="text-muted-foreground">
                          {votePercentage.toFixed(0)}% ({option.votes || 0} votes)
                        </span>
                      </div>
                      <Progress 
                        value={votePercentage} 
                        className={cn("h-2", isSelected && "bg-primary")} 
                      />
                    </>
                  ) : (
                    // Show clickable buttons before voting
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start h-auto py-3 px-4",
                        isClickable && "hover:bg-primary/5 hover:border-primary cursor-pointer",
                        isVoting && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => handleVote(index)}
                      disabled={!isClickable || isVoting}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-sm">{option.text}</span>
                        {totalVotes > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {votePercentage.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </Button>
                  )}
                </div>
              );
            })}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
              {hasVoted && ' • You voted'}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-2 p-2 px-3 sm:px-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="shrink-0"
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1.5 min-h-[44px] touch-manipulation scale-on-click sm:min-w-[44px] sm:gap-2" 
            onClick={handleLike}
            aria-label={isLiked ? 'Unlike post' : 'Like post'}
            aria-pressed={isLiked}
          >
            <motion.div
              animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart className={cn("size-4 shrink-0", isLiked && "fill-destructive text-destructive")} aria-hidden="true" />
            </motion.div>
            <span>{likeCount}</span>
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="shrink-0"
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1.5 min-h-[44px] touch-manipulation scale-on-click sm:min-w-[44px] sm:gap-2" 
            onClick={handleComment}
            aria-label={`Comment on post by ${authorName}. ${post.comments} comments`}
          >
            <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{commentCount} Comments</span>
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="shrink-0"
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1.5 min-h-[44px] touch-manipulation scale-on-click sm:min-w-[44px] sm:gap-2" 
            onClick={handleShare}
            aria-label="Share post"
          >
            <Share2 className="size-4 shrink-0" aria-hidden="true" />
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
