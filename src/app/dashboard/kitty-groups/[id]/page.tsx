'use client';

import { notFound } from 'next/navigation';
import { kittyGroups, users } from '@/lib/mock-data';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Users,
  Wallet,
  Calendar,
  IndianRupee,
  Trophy,
  Plus,
  Settings,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';


export default function KittyGroupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { toast } = useToast();
  const group = kittyGroups.find((g) => g.id === params.id);
  const groupMembers = users.slice(0, group?.members);

  if (!group) {
    notFound();
  }
  
  const upcomingEvent = {
      date: 'August 5, 2024',
      time: '3:00 PM - 6:00 PM',
      host: group.nextTurn,
      location: '123, Rose Villa, Bandra West, Mumbai'
  }

  const handleAction = (title: string, description: string) => {
    toast({ title, description });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={group.name} description="Let the fun begin!" />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleAction('Feature Coming Soon', 'The ability to invite new members is on its way!')}>
            <Plus className="mr-2 h-4 w-4" /> Invite
          </Button>
          <Button variant="outline" size="icon" onClick={() => handleAction('Feature Coming Soon', 'Group settings will be available shortly.')}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{group.members}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Contribution
                </CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{group.contribution.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Next Turn
                </CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{group.nextTurn}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Next Meet
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{group.nextDate}</div>
              </CardContent>
            </Card>
          </div>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Upcoming Kitty Party</CardTitle>
            </CardHeader>
            <CardContent>
                <p><strong>Host:</strong> {upcomingEvent.host}</p>
                <p><strong>Date:</strong> {upcomingEvent.date}</p>
                <p><strong>Time:</strong> {upcomingEvent.time}</p>
                <p><strong>Location:</strong> {upcomingEvent.location}</p>
                <div className="mt-4 flex gap-2">
                    <Button onClick={() => handleAction('RSVP Confirmed!', `You are attending the next Kitty Party hosted by ${upcomingEvent.host}.`)}>RSVP</Button>
                    <Button variant="outline" onClick={() => handleAction('Feature Coming Soon', 'Detailed event view will be available shortly.')}>View Details</Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Group Members</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={`https://picsum.photos/seed/${member.id}/100/100`}
                              alt={member.name}
                            />
                            <AvatarFallback>
                              {member.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{member.city}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleAction('Feature Coming Soon', `Messaging ${member.name} will be available soon.`)}>
                          <Mail className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="transactions" className="mt-6 text-center text-muted-foreground py-12">
            <p>Transaction history will be shown here.</p>
        </TabsContent>
         <TabsContent value="events" className="mt-6 text-center text-muted-foreground py-12">
            <p>Past and upcoming events will be shown here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
