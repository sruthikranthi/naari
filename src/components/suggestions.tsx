
'use client';
import Link from 'next/link';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, limit, query, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus } from 'lucide-react';
import Image from 'next/image';
import type { User, Community } from '@/lib/mock-data';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export function Suggestions() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'users'), limit(3)) : null),
    [firestore, user]
  );
  const { data: suggestedUsers, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  const handleFollow = async (targetUserId: string, targetUserName: string) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to follow users.',
      });
      return;
    }

    // Don't allow following yourself
    if (targetUserId === user.uid) {
      return;
    }

    try {
      const currentUserRef = doc(firestore, 'users', user.uid);
      const targetUserRef = doc(firestore, 'users', targetUserId);

      // Add target to current user's following list
      await updateDoc(currentUserRef, { followingIds: arrayUnion(targetUserId) });
      // Add current user to target's followers list
      await updateDoc(targetUserRef, { followerIds: arrayUnion(user.uid) });
      
      toast({ 
        title: 'Connected!', 
        description: `You are now following ${targetUserName}.` 
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Could not follow user. Please try again.' 
      });
    }
  };
  
  const communitiesQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'communities'), limit(2)) : null),
    [firestore, user]
  );
  const { data: suggestedCommunities, isLoading: areCommunitiesLoading } = useCollection<Community>(communitiesQuery);

  const isLoading = isUserLoading || areUsersLoading || areCommunitiesLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">People to Connect With</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && [...Array(3)].map((_, i) => (
             <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
                 <Skeleton className="h-8 w-8" />
            </div>
          ))}
          {!isLoading && suggestedUsers?.filter(u => u.id !== user?.uid).map((suggestedUser) => {
            const isFollowing = user?.followingIds?.includes(suggestedUser.id);
            return (
              <div key={suggestedUser.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={suggestedUser.avatar}
                      alt={suggestedUser.name}
                      data-ai-hint="woman portrait"
                    />
                    <AvatarFallback>
                      {suggestedUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{suggestedUser.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Suggested for you
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="px-2"
                  onClick={() => handleFollow(suggestedUser.id, suggestedUser.name)}
                  disabled={isFollowing}
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Communities to Join</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           {isLoading && [...Array(2)].map((_, i) => (
             <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
                 <Skeleton className="h-8 w-16" />
            </div>
          ))}
          {!isLoading && suggestedCommunities?.map((community) => (
            <div key={community.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 relative overflow-hidden rounded-md">
                        <Image src={community.image} alt={community.name} fill className="object-cover" />
                    </div>
                    <div>
                        <p className="font-semibold">{community.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {community.memberCount.toLocaleString()} members
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm">
                    Join
                </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
