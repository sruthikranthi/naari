
'use client';
import { notFound, useParams } from 'next/navigation';
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { doc, query, collection, where } from 'firebase/firestore';
import type { User, KittyGroup } from '@/lib/mock-data';
import { KittyGroupClient } from './kitty-group-client';
import { Skeleton } from '@/components/ui/skeleton';


export default function KittyGroupDetailPage() {
  const params = useParams();
  const { id } = params;
  const firestore = useFirestore();
  const { user: currentUser } = useUser();

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


  if (isGroupLoading || areMembersLoading) {
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

  if (!group || !currentUser) {
    notFound();
  }
  
  const upcomingEvent = {
      date: 'August 5, 2024',
      time: '3:00 PM - 6:00 PM',
      host: group.nextTurn,
      location: '123, Rose Villa, Bandra West, Mumbai'
  }

  return (
    <KittyGroupClient
      group={{...group, members: group.memberIds?.length || 0}}
      groupMembers={groupMembers || []}
      upcomingEvent={upcomingEvent}
      currentUser={currentUser}
    />
  );
}
