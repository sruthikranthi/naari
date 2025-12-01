'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { sanitizeText } from '@/lib/validation';

type Comment = {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: Timestamp | null;
};

type NomineeCommentsDialogProps = {
  contestId: string;
  nomineeId: string;
  nomineeName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentCommentCount: number;
  onCommentAdded?: () => void;
};

export function NomineeCommentsDialog({
  contestId,
  nomineeId,
  nomineeName,
  isOpen,
  onOpenChange,
  currentCommentCount,
  onCommentAdded,
}: NomineeCommentsDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch comments for this nominee
  const commentsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'contests', contestId, 'nominees', nomineeId, 'comments'), orderBy('timestamp', 'asc'))
        : null,
    [firestore, contestId, nomineeId]
  );
  const { data: comments, isLoading: areCommentsLoading } = useCollection<Comment>(commentsQuery);

  const handleSubmitComment = async () => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to comment.',
      });
      return;
    }

    const sanitizedContent = sanitizeText(commentText.trim());
    if (!sanitizedContent || sanitizedContent.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Comment',
        description: 'Please enter a comment.',
      });
      return;
    }

    if (sanitizedContent.length > 1000) {
      toast({
        variant: 'destructive',
        title: 'Comment Too Long',
        description: 'Comments must be less than 1000 characters.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Add comment to subcollection
      const commentsRef = collection(firestore, 'contests', contestId, 'nominees', nomineeId, 'comments');
      await addDoc(commentsRef, {
        author: {
          id: user.uid,
          name: user.displayName || 'Anonymous Sakhi',
          avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
        },
        content: sanitizedContent,
        timestamp: serverTimestamp(),
      });

      // Update comment count in the contest document
      const contestRef = doc(firestore, 'contests', contestId);
      const contestDoc = await getDoc(contestRef);
      const contestData = contestDoc.data();
      
      if (contestData?.nominees) {
        const updatedNominees = contestData.nominees.map((nominee: any) =>
          nominee.id === nomineeId
            ? { ...nominee, comments: (nominee.comments || 0) + 1 }
            : nominee
        );
        await updateDoc(contestRef, {
          nominees: updatedNominees,
        });
      }

      setCommentText('');
      toast({
        title: 'Comment Added',
        description: 'Your comment has been posted.',
      });
      onCommentAdded?.();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not add comment. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp: Timestamp | null): string => {
    if (!timestamp) {
      return 'Just now';
    }
    return `${formatDistanceToNow(timestamp.toDate())} ago`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments on {nomineeName} ({currentCommentCount})</DialogTitle>
          <DialogDescription>Share your thoughts and support for this nominee.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {areCommentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments && comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                  <AvatarFallback>
                    {comment.author.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{comment.author.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(comment.timestamp)}
                    </p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>

        <div className="border-t pt-4 space-y-2">
          <Textarea
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[100px] resize-none"
            maxLength={1000}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {commentText.length}/1000 characters
            </p>
            <Button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || isSubmitting}
              size="sm"
            >
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Comment'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

