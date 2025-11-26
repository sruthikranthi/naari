
import { notFound } from 'next/navigation';
import { kittyGroups, users } from '@/lib/mock-data';
import { KittyGroupClient } from './kitty-group-client';


export default function KittyGroupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const group = kittyGroups.find((g) => g.id === id);
  const groupMembers = users.slice(0, group?.members);
  const currentUser = users[0]; // Assuming u1 is the current user

  if (!group) {
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
      group={group}
      groupMembers={groupMembers}
      upcomingEvent={upcomingEvent}
      currentUser={currentUser}
    />
  );
}
