'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Calendar, IndianRupee, Trophy, Clock, ArrowRight, UserPlus, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { KittyGroup, TambolaGame } from '@/lib/mock-data';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function UpcomingPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  // Query all kitty groups (we'll filter client-side for those with orderId)
  const allKittyGroupsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'kitty_groups') : null),
    [firestore]
  );
  const { data: allKittyGroups, isLoading: areKittyGroupsLoading } = useCollection<KittyGroup>(allKittyGroupsQuery);

  // Query all tambola games (we'll filter client-side for those with orderId)
  const allTambolaGamesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'tambola_games') : null),
    [firestore]
  );
  const { data: allTambolaGames, isLoading: areTambolaGamesLoading } = useCollection<TambolaGame & { orderId?: string; paymentId?: string; isConfigured?: boolean; prizes?: any; scheduledDate?: string; scheduledTime?: string }>(allTambolaGamesQuery);

  // Filter kitty groups that are not fully started (can add more criteria)
  const upcomingKittyGroups = allKittyGroups?.filter(group => 
    group.orderId && 
    (!group.nextTurn || group.nextTurn === 'TBD' || group.memberIds.length < (group as any).members)
  ) || [];

  // Filter tambola games that are not started (status: 'idle')
  const upcomingTambolaGames = allTambolaGames?.filter(game => 
    game.orderId && 
    (game.status === 'idle' || !game.status)
  ) || [];

  const isLoading = areKittyGroupsLoading || areTambolaGamesLoading;

  // Handle joining tambola game
  const handleJoinTambola = async (gameId: string) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'Please log in to join the game.',
      });
      return;
    }

    setJoiningGameId(gameId);
    try {
      const gameRef = doc(firestore, 'tambola_games', gameId);
      await updateDoc(gameRef, {
        playerIds: arrayUnion(user.uid),
      });
      
      toast({
        title: 'Successfully Joined!',
        description: 'You have joined the Tambola game.',
      });
    } catch (error: any) {
      console.error('Error joining game:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to join the game. Please try again.',
      });
    } finally {
      setJoiningGameId(null);
    }
  };

  // Handle joining kitty group
  const handleJoinKittyGroup = async (groupId: string) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'Please log in to join the group.',
      });
      return;
    }

    setJoiningGroupId(groupId);
    try {
      const groupRef = doc(firestore, 'kitty_groups', groupId);
      await updateDoc(groupRef, {
        memberIds: arrayUnion(user.uid),
      });
      
      toast({
        title: 'Successfully Joined!',
        description: 'You have joined the kitty group.',
      });
    } catch (error: any) {
      console.error('Error joining group:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to join the group. Please try again.',
      });
    } finally {
      setJoiningGroupId(null);
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
                            onClick={() => handleJoinKittyGroup(group.id)}
                            disabled={joiningGroupId === group.id}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            {joiningGroupId === group.id ? 'Joining...' : 'Join Group'}
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
                            onClick={() => game.id && handleJoinTambola(game.id)}
                            disabled={!game.id || joiningGameId === game.id}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            {joiningGameId === game.id ? 'Joining...' : 'Join Game'}
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
                          onClick={() => handleJoinKittyGroup(group.id)}
                          disabled={joiningGroupId === group.id}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          {joiningGroupId === group.id ? 'Joining...' : 'Join Group'}
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
                          onClick={() => game.id && handleJoinTambola(game.id)}
                          disabled={!game.id || joiningGameId === game.id}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          {joiningGameId === game.id ? 'Joining...' : 'Join Game'}
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

