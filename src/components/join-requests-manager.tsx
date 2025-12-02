'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, updateDoc, doc, arrayUnion, serverTimestamp, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Clock, Users } from 'lucide-react';
import type { TambolaGameJoinRequest, KittyGroupJoinRequest } from '@/lib/join-requests';
import { formatDistanceToNow } from 'date-fns';

type JoinRequestsManagerProps = {
  type: 'tambola' | 'kitty';
  gameOrGroupId: string;
  adminId: string;
};

export function JoinRequestsManager({ type, gameOrGroupId, adminId }: JoinRequestsManagerProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const isAdmin = user?.uid === adminId;

  // Fetch pending join requests
  const requestsQuery = useMemoFirebase(
    () => {
      if (!firestore || !isAdmin) return null;
      const collectionName = type === 'tambola' ? 'tambola_game_join_requests' : 'kitty_group_join_requests';
      const fieldName = type === 'tambola' ? 'tambolaGameId' : 'kittyGroupId';
      return query(
        collection(firestore, collectionName),
        where(fieldName, '==', gameOrGroupId),
        where('status', '==', 'pending')
      );
    },
    [firestore, isAdmin, type, gameOrGroupId]
  );

  const { data: requests, isLoading } = useCollection<TambolaGameJoinRequest | KittyGroupJoinRequest>(requestsQuery);

  const handleApproveRequest = async (request: TambolaGameJoinRequest | KittyGroupJoinRequest) => {
    if (!firestore || !user || user.uid !== adminId) {
      toast({
        variant: 'destructive',
        title: 'Unauthorized',
        description: 'Only the admin can approve requests.',
      });
      return;
    }

    setProcessingRequestId(request.id);
    try {
      const requestRef = doc(
        firestore,
        type === 'tambola' ? 'tambola_game_join_requests' : 'kitty_group_join_requests',
        request.id
      );

      // Update request status
      await updateDoc(requestRef, {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: user.uid,
      });

      // Add user to game/group
      const gameOrGroupRef = doc(
        firestore,
        type === 'tambola' ? 'tambola_games' : 'kitty_groups',
        gameOrGroupId
      );

      const gameOrGroupSnap = await getDoc(gameOrGroupRef);
      if (gameOrGroupSnap.exists()) {
        const fieldName = type === 'tambola' ? 'playerIds' : 'memberIds';
        await updateDoc(gameOrGroupRef, {
          [fieldName]: arrayUnion(request.userId),
        });
      }

      toast({
        title: 'Request Approved',
        description: `${request.userName} has been added to the ${type === 'tambola' ? 'game' : 'group'}.`,
      });
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to approve request. Please try again.',
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (request: TambolaGameJoinRequest | KittyGroupJoinRequest) => {
    if (!firestore || !user || user.uid !== adminId) {
      toast({
        variant: 'destructive',
        title: 'Unauthorized',
        description: 'Only the admin can reject requests.',
      });
      return;
    }

    setProcessingRequestId(request.id);
    try {
      const requestRef = doc(
        firestore,
        type === 'tambola' ? 'tambola_game_join_requests' : 'kitty_group_join_requests',
        request.id
      );

      await updateDoc(requestRef, {
        status: 'rejected',
        reviewedAt: serverTimestamp(),
        reviewedBy: user.uid,
      });

      toast({
        title: 'Request Rejected',
        description: `The join request from ${request.userName} has been rejected.`,
      });
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to reject request. Please try again.',
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Join Requests</CardTitle>
          <CardDescription>Loading requests...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const pendingRequests = requests || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Join Requests
            </CardTitle>
            <CardDescription>
              {pendingRequests.length === 0
                ? 'No pending join requests'
                : `${pendingRequests.length} pending request${pendingRequests.length > 1 ? 's' : ''}`}
            </CardDescription>
          </div>
          {pendingRequests.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {pendingRequests.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No pending join requests at this time.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request) => {
              let createdAt: Date;
              if (!request.createdAt) {
                createdAt = new Date();
              } else if (typeof request.createdAt === 'object' && 'toDate' in request.createdAt) {
                // Firestore Timestamp
                createdAt = request.createdAt.toDate();
              } else if (typeof request.createdAt === 'string' || typeof request.createdAt === 'number') {
                // String or number timestamp
                createdAt = new Date(request.createdAt);
              } else {
                // FieldValue or other - use current date as fallback
                createdAt = new Date();
              }

              return (
                <div
                  key={request.id}
                  className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <Avatar>
                    <AvatarImage src={request.userAvatar} alt={request.userName} />
                    <AvatarFallback>
                      {request.userName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">{request.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested {formatDistanceToNow(createdAt, { addSuffix: true })}
                    </p>
                    {request.message && (
                      <p className="text-sm text-muted-foreground italic">&quot;{request.message}&quot;</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectRequest(request)}
                      disabled={processingRequestId === request.id}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproveRequest(request)}
                      disabled={processingRequestId === request.id}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

