
'use client';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { doc, query, collection, where } from 'firebase/firestore';
import type { User, KittyGroup } from '@/lib/mock-data';
import { KittyGroupClient } from './kitty-group-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';


export default function KittyGroupDetailPage() {
  const params = useParams();
  const { id } = params;
  const firestore = useFirestore();
  const { user: currentAuthUser } = useUser();

  const groupRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'kitty_groups', id as string) : null),
    [firestore, id]
  );
  const { data: group, isLoading: isGroupLoading } = useDoc<KittyGroup>(groupRef);

  const membersQuery = useMemoFirebase(
    () => (firestore && group?.memberIds && group.memberIds.length > 0) ? query(collection(firestore, 'users'), where('id', 'in', group.memberIds)) : null,
    [firestore, group]
  );
  const { data: groupMembers, isLoading: areMembersLoading } = useCollection<User>(membersQuery);

  // Fetch current user's profile from Firestore
  const currentUserRef = useMemoFirebase(
    () => (firestore && currentAuthUser ? doc(firestore, 'users', currentAuthUser.uid) : null),
    [firestore, currentAuthUser]
  );
  const { data: currentUser, isLoading: isCurrentUserLoading } = useDoc<User>(currentUserRef);


  if (isGroupLoading || areMembersLoading || isCurrentUserLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-16 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                {[...Array(4)].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
             <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Skeleton className="lg:col-span-2 h-96 w-full" />
                <Skeleton className="lg:col-span-1 h-96 w-full" />
             </div>
        </div>
    );
  }

  if (!group || !currentUser || !currentAuthUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-lg font-semibold">Kitty Group Not Found</p>
        <p className="text-sm text-muted-foreground">
          The kitty group you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <div className="flex gap-2">
          <Button onClick={() => window.history.back()}>Go Back</Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/kitty-groups'}>
            View All Groups
          </Button>
        </div>
      </div>
    );
  }
  
  const upcomingEvent = {
      date: 'August 5, 2024',
      time: '3:00 PM - 6:00 PM',
      host: group.nextTurn,
      location: '123, Rose Villa, Bandra West, Mumbai'
  }

  return (
    <KittyGroupClient
      group={{...group, members: group.memberIds?.length || 0, memberIds: group.memberIds}}
      groupMembers={groupMembers || []}
      upcomingEvent={upcomingEvent}
      currentUser={currentUser}
      groupId={id as string}
    />
  );
}
