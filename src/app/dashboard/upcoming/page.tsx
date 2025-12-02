'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, updateDoc, arrayUnion, query, where, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Calendar, IndianRupee, Trophy, Clock, ArrowRight, UserPlus, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { KittyGroup, TambolaGame } from '@/lib/mock-data';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { TambolaGameJoinRequest, KittyGroupJoinRequest } from '@/lib/join-requests';

export default function UpcomingPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [requestingGameId, setRequestingGameId] = useState<string | null>(null);
  const [requestingGroupId, setRequestingGroupId] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());

  // Query ALL kitty groups that have been paid for (have orderId) - for discovery
  // Using '>' '' to match all non-empty orderId strings
  const allKittyGroupsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'kitty_groups'), where('orderId', '>', '')) : null),
    [firestore, user]
  );
  const { data: allKittyGroups, isLoading: areAllKittyGroupsLoading } = useCollection<KittyGroup>(allKittyGroupsQuery);

  // Query kitty groups where user is a member (for personal list)
  const userKittyGroupsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'kitty_groups'), where('memberIds', 'array-contains', user.uid)) : null),
    [firestore, user]
  );
  const { data: userKittyGroups, isLoading: areUserKittyGroupsLoading } = useCollection<KittyGroup>(userKittyGroupsQuery);

  // Query ALL tambola games that have been paid for (have orderId) - for discovery
  // IMPORTANT: Must have where clause to prevent blind list queries
  // Using '>' '' to match all non-empty orderId strings
  const allTambolaGamesQuery = useMemoFirebase(
    () => {
      if (!firestore || !user) return null;
      return query(collection(firestore, 'tambola_games'), where('orderId', '>', ''));
    },
    [firestore, user]
  );
  const { data: allTambolaGames, isLoading: areAllTambolaGamesLoading } = useCollection<TambolaGame & { orderId?: string; paymentId?: string; isConfigured?: boolean; prizes?: any; scheduledDate?: string; scheduledTime?: string }>(allTambolaGamesQuery);

  // Query tambola games where user is a player (for personal list)
  // IMPORTANT: Must have user.uid to prevent blind list queries
  const playerTambolaGamesQuery = useMemoFirebase(
    () => {
      if (!firestore || !user || !user.uid) return null;
      return query(collection(firestore, 'tambola_games'), where('playerIds', 'array-contains', user.uid));
    },
    [firestore, user, user?.uid]
  );
  const { data: playerTambolaGames, isLoading: arePlayerTambolaGamesLoading } = useCollection<TambolaGame & { orderId?: string; paymentId?: string; isConfigured?: boolean; prizes?: any; scheduledDate?: string; scheduledTime?: string }>(playerTambolaGamesQuery);

  // Query tambola games where user is admin/host (for personal list)
  // IMPORTANT: Must have user.uid to prevent blind list queries
  const adminTambolaGamesQuery = useMemoFirebase(
    () => {
      if (!firestore || !user || !user.uid) return null;
      return query(collection(firestore, 'tambola_games'), where('adminId', '==', user.uid));
    },
    [firestore, user, user?.uid]
  );
  const { data: adminTambolaGames, isLoading: areAdminTambolaGamesLoading } = useCollection<TambolaGame & { orderId?: string; paymentId?: string; isConfigured?: boolean; prizes?: any; scheduledDate?: string; scheduledTime?: string }>(adminTambolaGamesQuery);

  // Combine all tambola games (from all sources, remove duplicates)
  const combinedTambolaGames = [
    ...(allTambolaGames || []),
    ...(playerTambolaGames || []),
    ...(adminTambolaGames || [])
  ];
  const uniqueTambolaGames = Array.from(
    new Map(combinedTambolaGames.map(game => [game.id, game])).values()
  );

  // Combine all kitty groups (from all sources, remove duplicates)
  const combinedKittyGroups = [
    ...(allKittyGroups || []),
    ...(userKittyGroups || [])
  ];
  const uniqueKittyGroups = Array.from(
    new Map(combinedKittyGroups.map(group => [group.id, group])).values()
  );

  // Filter kitty groups that are not fully started (have orderId and are upcoming)
  const upcomingKittyGroups = uniqueKittyGroups.filter(group => 
    group.orderId && 
    group.orderId !== '' &&
    (!group.nextTurn || group.nextTurn === 'TBD' || group.memberIds.length < (group as any).members)
  );

  // Filter tambola games that are not started (have orderId and status: 'idle')
  const upcomingTambolaGames = uniqueTambolaGames.filter(game => 
    game.orderId && 
    game.orderId !== '' &&
    (game.status === 'idle' || !game.status)
  );

  const isLoading = areAllKittyGroupsLoading || areUserKittyGroupsLoading || areAllTambolaGamesLoading || arePlayerTambolaGamesLoading || areAdminTambolaGamesLoading;

  // Fetch pending join requests for current user
  const userTambolaRequestsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'tambola_game_join_requests'), where('userId', '==', user.uid), where('status', '==', 'pending')) : null),
    [firestore, user]
  );
  const { data: userTambolaRequests } = useCollection<TambolaGameJoinRequest>(userTambolaRequestsQuery);

  const userKittyRequestsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'kitty_group_join_requests'), where('userId', '==', user.uid), where('status', '==', 'pending')) : null),
    [firestore, user]
  );
  const { data: userKittyRequests } = useCollection<KittyGroupJoinRequest>(userKittyRequestsQuery);

  // Build set of pending request IDs
  useEffect(() => {
    const tambolaRequestIds = new Set(userTambolaRequests?.map(req => req.tambolaGameId) || []);
    const kittyRequestIds = new Set(userKittyRequests?.map(req => req.kittyGroupId) || []);
    setPendingRequests(new Set([...tambolaRequestIds, ...kittyRequestIds]));
  }, [userTambolaRequests, userKittyRequests]);

  // Handle requesting to join tambola game
  const handleRequestJoinTambola = async (gameId: string) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'Please log in to request joining the game.',
      });
      return;
    }

    // Check if request already exists
    if (pendingRequests.has(gameId)) {
      toast({
        title: 'Request Already Sent',
        description: 'You have already sent a join request for this game. Please wait for admin approval.',
      });
      return;
    }

    setRequestingGameId(gameId);
    try {
      // Check if user is already a player
      const gameRef = doc(firestore, 'tambola_games', gameId);
      const gameSnap = await getDoc(gameRef);
      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        if (gameData.playerIds?.includes(user.uid)) {
          toast({
            title: 'Already a Player',
            description: 'You are already a player in this game.',
          });
          setRequestingGameId(null);
          return;
        }
      }

      // Create join request
      await addDoc(collection(firestore, 'tambola_game_join_requests'), {
        tambolaGameId: gameId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        userAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      toast({
        title: 'Join Request Sent!',
        description: 'Your request has been sent to the game admin. You will be notified when it is approved.',
      });
      
      // Update pending requests
      setPendingRequests(prev => new Set([...prev, gameId]));
    } catch (error: any) {
      console.error('Error sending join request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send join request. Please try again.',
      });
    } finally {
      setRequestingGameId(null);
    }
  };

  // Handle requesting to join kitty group
  const handleRequestJoinKittyGroup = async (groupId: string) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'Please log in to request joining the group.',
      });
      return;
    }

    // Check if request already exists
    if (pendingRequests.has(groupId)) {
      toast({
        title: 'Request Already Sent',
        description: 'You have already sent a join request for this group. Please wait for admin approval.',
      });
      return;
    }

    setRequestingGroupId(groupId);
    try {
      // Check if user is already a member
      const groupRef = doc(firestore, 'kitty_groups', groupId);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        const groupData = groupSnap.data();
        if (groupData.memberIds?.includes(user.uid)) {
          toast({
            title: 'Already a Member',
            description: 'You are already a member of this group.',
          });
          setRequestingGroupId(null);
          return;
        }
      }

      // Create join request
      await addDoc(collection(firestore, 'kitty_group_join_requests'), {
        kittyGroupId: groupId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        userAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      toast({
        title: 'Join Request Sent!',
        description: 'Your request has been sent to the group admin. You will be notified when it is approved.',
      });
      
      // Update pending requests
      setPendingRequests(prev => new Set([...prev, groupId]));
    } catch (error: any) {
      console.error('Error sending join request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send join request. Please try again.',
      });
    } finally {
      setRequestingGroupId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upcoming Events"
        description="View all kitty groups and tambola games that have been paid for but not yet started"
      />

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({upcomingKittyGroups.length + upcomingTambolaGames.length})</TabsTrigger>
          <TabsTrigger value="kitty-groups">Kitty Groups ({upcomingKittyGroups.length})</TabsTrigger>
          <TabsTrigger value="tambola">Tambola Games ({upcomingTambolaGames.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Kitty Groups */}
          {upcomingKittyGroups.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Kitty Groups</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingKittyGroups.map((group) => (
                  <Card key={group.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <Badge variant={group.isConfigured ? 'default' : 'secondary'}>
                          {group.isConfigured ? 'Ready' : 'Pending Setup'}
                        </Badge>
                      </div>
                      <CardDescription>
                        Created {group.createdAt ? formatDistanceToNow(
                          typeof group.createdAt === 'string' 
                            ? new Date(group.createdAt) 
                            : (group.createdAt as any)?.toDate?.() || new Date(group.createdAt),
                          { addSuffix: true }
                        ) : 'recently'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{group.memberIds?.length || 0} members joined</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        <span>₹{group.contribution?.toLocaleString() || 0} per member</span>
                      </div>
                      {group.nextTurn && group.nextTurn !== 'TBD' && (
                        <div className="flex items-center gap-2 text-sm">
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                          <span>Next: {group.nextTurn}</span>
                        </div>
                      )}
                      {group.nextDate && group.nextDate !== 'TBD' && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(group.nextDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t space-y-2">
                        {user && group.memberIds?.includes(user.uid) ? (
                          <Button variant="secondary" className="w-full" size="sm" disabled>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Already Joined
                          </Button>
                        ) : (
                          <Button 
                            variant="default" 
                            className="w-full" 
                            size="sm"
                            onClick={() => handleRequestJoinKittyGroup(group.id)}
                            disabled={requestingGroupId === group.id || pendingRequests.has(group.id)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            {requestingGroupId === group.id ? 'Sending Request...' : pendingRequests.has(group.id) ? 'Request Pending' : 'Request to Join'}
                          </Button>
                        )}
                        <Link href={`/dashboard/kitty-groups/${group.id}`}>
                          <Button variant="outline" className="w-full" size="sm">
                            View Details <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Tambola Games */}
          {upcomingTambolaGames.length > 0 && (
            <div className="space-y-4 mt-6">
              <h2 className="text-xl font-semibold">Tambola Games</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingTambolaGames.map((game) => (
                  <Card key={game.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">Tambola Game</CardTitle>
                        <Badge variant={game.isConfigured ? 'default' : 'secondary'}>
                          {game.isConfigured ? 'Ready' : 'Pending Setup'}
                        </Badge>
                      </div>
                      <CardDescription>
                        Created {game.createdAt ? formatDistanceToNow((game.createdAt as any)?.toDate?.() || new Date(game.createdAt), { addSuffix: true }) : 'recently'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{game.playerIds?.length || 0} players joined</span>
                      </div>
                      {game.scheduledDate && game.scheduledTime && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(game.scheduledDate).toLocaleDateString()} at {game.scheduledTime}
                          </span>
                        </div>
                      )}
                      {game.prizes && (
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold">Prizes:</p>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {game.prizes.corners && <p>Four Corners: ₹{game.prizes.corners.toLocaleString()}</p>}
                            {game.prizes.fullHouse && <p>Full House: ₹{game.prizes.fullHouse.toLocaleString()}</p>}
                            {game.prizes.houses && game.prizes.houses.length > 0 && (
                              <p>{game.prizes.houses.length} House{game.prizes.houses.length > 1 ? 's' : ''} configured</p>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Status: {game.status || 'idle'}</span>
                      </div>
                      <div className="pt-2 border-t space-y-2">
                        {user && game.playerIds?.includes(user.uid) ? (
                          <Button variant="secondary" className="w-full" size="sm" disabled>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Already Joined
                          </Button>
                        ) : (
                          <Button 
                            variant="default" 
                            className="w-full" 
                            size="sm"
                            onClick={() => game.id && handleRequestJoinTambola(game.id)}
                            disabled={!game.id || requestingGameId === game.id || pendingRequests.has(game.id)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            {requestingGameId === game.id ? 'Sending Request...' : pendingRequests.has(game.id) ? 'Request Pending' : 'Request to Join'}
                          </Button>
                        )}
                        <Link href={`/dashboard/tambola${game.id ? `?gameId=${game.id}` : ''}`}>
                          <Button variant="outline" className="w-full" size="sm">
                            View Game <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!isLoading && upcomingKittyGroups.length === 0 && upcomingTambolaGames.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No upcoming events found.</p>
                <p className="text-sm text-muted-foreground mt-2">Create a kitty group or tambola game to get started!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="kitty-groups" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingKittyGroups.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingKittyGroups.map((group) => (
                <Card key={group.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <Badge variant={group.isConfigured ? 'default' : 'secondary'}>
                        {group.isConfigured ? 'Ready' : 'Pending Setup'}
                      </Badge>
                    </div>
                    <CardDescription>
                      Created {group.createdAt ? formatDistanceToNow(
                        typeof group.createdAt === 'string' 
                          ? new Date(group.createdAt) 
                          : (group.createdAt as any)?.toDate?.() || new Date(group.createdAt),
                        { addSuffix: true }
                      ) : 'recently'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{group.memberIds?.length || 0} members joined</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <span>₹{group.contribution?.toLocaleString() || 0} per member</span>
                    </div>
                    <div className="pt-2 border-t space-y-2">
                      {user && group.memberIds?.includes(user.uid) ? (
                        <Button variant="secondary" className="w-full" size="sm" disabled>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Already Joined
                        </Button>
                      ) : (
                        <Button 
                          variant="default" 
                          className="w-full" 
                          size="sm"
                          onClick={() => handleRequestJoinKittyGroup(group.id)}
                          disabled={requestingGroupId === group.id || pendingRequests.has(group.id)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          {requestingGroupId === group.id ? 'Sending Request...' : pendingRequests.has(group.id) ? 'Request Pending' : 'Request to Join'}
                        </Button>
                      )}
                      <Link href={`/dashboard/kitty-groups/${group.id}`}>
                        <Button variant="outline" className="w-full" size="sm">
                          View Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No upcoming kitty groups found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tambola" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingTambolaGames.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingTambolaGames.map((game) => (
                <Card key={game.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">Tambola Game</CardTitle>
                      <Badge variant={game.isConfigured ? 'default' : 'secondary'}>
                        {game.isConfigured ? 'Ready' : 'Pending Setup'}
                      </Badge>
                    </div>
                    <CardDescription>
                      Created {game.createdAt ? formatDistanceToNow((game.createdAt as any)?.toDate?.() || new Date(game.createdAt), { addSuffix: true }) : 'recently'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{game.playerIds?.length || 0} players joined</span>
                    </div>
                    {game.scheduledDate && game.scheduledTime && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(game.scheduledDate).toLocaleDateString()} at {game.scheduledTime}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t space-y-2">
                      {user && game.playerIds?.includes(user.uid) ? (
                        <Button variant="secondary" className="w-full" size="sm" disabled>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Already Joined
                        </Button>
                      ) : (
                        <Button 
                          variant="default" 
                          className="w-full" 
                          size="sm"
                          onClick={() => game.id && handleRequestJoinTambola(game.id)}
                          disabled={!game.id || requestingGameId === game.id || pendingRequests.has(game.id)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          {requestingGameId === game.id ? 'Sending Request...' : pendingRequests.has(game.id) ? 'Request Pending' : 'Request to Join'}
                        </Button>
                      )}
                      <Link href={`/dashboard/tambola${game.id ? `?gameId=${game.id}` : ''}`}>
                        <Button variant="outline" className="w-full" size="sm">
                          View Game <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No upcoming tambola games found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

