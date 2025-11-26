
'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import {
  Users,
  Wallet,
  Calendar,
  IndianRupee,
  Trophy,
  ClipboardList,
  Cake,
  Plus,
  Video,
  BookOpen,
} from 'lucide-react';
import type { KittyGroup as KittyGroupType } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Controller } from 'react-hook-form';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { users as mockUsers } from '@/lib/mock-data';


const tools = [
  { 
    id: 'winner-selection', 
    icon: Trophy, 
    name: 'Winner Selection' 
  },
  {
    id: 'contribution-tracker',
    icon: ClipboardList,
    name: 'Contribution Tracker',
  },
  { id: 'expense-tracking', icon: IndianRupee, name: 'Expense Tracking' },
  { id: 'event-planning', icon: Cake, name: 'Event Planning' },
];

const kittyGroupSchema = z.object({
  name: z.string().min(3, 'Group name must be at least 3 characters.'),
  contribution: z.coerce.number().min(1, 'Contribution must be at least 1.'),
  members: z.coerce.number().min(2, 'Group must have at least 2 members.'),
  frequency: z.string().nonempty('Please select a frequency.'),
});

type KittyGroupFormValues = z.infer<typeof kittyGroupSchema>;

export default function KittyGroupsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const kittyGroupsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'kitty_groups'), where('memberIds', 'array-contains', user.uid)) : null),
    [firestore, user]
  );
  const { data: kittyGroups, isLoading: areGroupsLoading } = useCollection<KittyGroupType>(kittyGroupsQuery);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<KittyGroupFormValues>({
    resolver: zodResolver(kittyGroupSchema),
    defaultValues: {
      name: '',
      contribution: undefined,
      members: undefined,
      frequency: '',
    }
  });

  const onSubmit = async (data: KittyGroupFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }

    const newGroup = {
      name: data.name,
      contribution: data.contribution,
      nextTurn: 'TBD',
      nextDate: 'TBD',
      memberIds: [user.uid], // Creator is the first member
      // 'members' field from mock data is now derived from memberIds.length
    };

    try {
        await addDoc(collection(firestore, 'kitty_groups'), newGroup);
        toast({
          title: 'Kitty Group Created!',
          description: `The group "${data.name}" has been successfully created.`,
        });
        reset();
        setIsDialogOpen(false);
    } catch(e) {
        console.error("Error creating kitty group: ", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not create kitty group.' });
    }
  };
  
  const handleToolClick = (toolId: string) => {
    if (toolId === 'winner-selection') {
      const allMembers = mockUsers.map(u => u.name);
      const winner = allMembers[Math.floor(Math.random() * allMembers.length)];
      toast({
        title: '🎉 And the Winner is...',
        description: `${winner}! Congratulations!`,
        duration: 5000,
      });
    } else {
      toast({
        title: 'Feature Coming Soon!',
        description: `The tool you selected will be available soon.`,
      });
    }
  };
  
  const isLoading = isUserLoading || areGroupsLoading;

  return (
    <div>
      <PageHeader
        title="Kitty Groups"
        description="Manage your digital kitty parties with ease."
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <h2 className="text-2xl font-bold font-headline">Your Groups</h2>
          {isLoading && (
             [...Array(2)].map((_, i) => (
                <Card key={i}>
                    <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-10 w-full" />)}
                        </div>
                        <Separator />
                        <div className="flex justify-end">
                            <Skeleton className="h-10 w-28" />
                        </div>
                    </CardContent>
                </Card>
             ))
          )}
          {!isLoading && kittyGroups && kittyGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle className="font-headline">{group.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{group.memberIds?.length || 1}</p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">
                        ₹{group.contribution.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Contribution
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{group.nextTurn}</p>
                      <p className="text-xs text-muted-foreground">Next Turn</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{group.nextDate}</p>
                      <p className="text-xs text-muted-foreground">Next Date</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button asChild>
                    <Link href={`/dashboard/kitty-groups/${group.id}`}>Manage Group</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
           {!isLoading && kittyGroups?.length === 0 && (
                <div className="py-20 text-center text-muted-foreground rounded-lg border-2 border-dashed">
                    <h3 className="text-lg font-semibold">No Kitty Groups Joined</h3>
                    <p className="mt-1">Create or join a group to see it here.</p>
                </div>
            )}
        </div>
        <div className="space-y-6 lg:col-span-1">
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Create New Kitty Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>Create New Kitty Group</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="name"
                        placeholder="e.g., Sakhi's Monthly Meet"
                        {...register('name')}
                      />
                      {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contribution" className="text-right">
                      Contribution
                    </Label>
                    <div className="relative col-span-3">
                       <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        id="contribution"
                        type="number"
                        placeholder="2000"
                        className="pl-7"
                        {...register('contribution')}
                      />
                      {errors.contribution && <p className="mt-1 text-xs text-destructive">{errors.contribution.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="members" className="text-right">
                      Max Members
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="members"
                        type="number"
                        placeholder="12"
                        {...register('members')}
                      />
                      {errors.members && <p className="mt-1 text-xs text-destructive">{errors.members.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="frequency" className="text-right">
                      Frequency
                    </Label>
                    <div className="col-span-3">
                      <Controller
                          name="frequency"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      {errors.frequency && <p className="mt-1 text-xs text-destructive">{errors.frequency.message}</p>}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Create Group</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="text-primary" />How-To Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div>
                    <h4 className="font-semibold flex items-center gap-2"><Video className="h-4 w-4"/>For Online Kitty Parties</h4>
                    <ul className="list-disc pl-5 mt-2 text-muted-foreground space-y-1">
                        <li>The designated host starts a "Virtual Party" from the group page.</li>
                        <li>Members receive a notification and can join the live video stream.</li>
                        <li>Interact with everyone using the live chat and send fun reactions.</li>
                        <li>The lucky draw can be held live for full transparency!</li>
                    </ul>
                </div>
                <Separator />
                 <div>
                    <h4 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4"/>For Offline (In-Person) Parties</h4>
                    <ul className="list-disc pl-5 mt-2 text-muted-foreground space-y-1">
                        <li>Use the app as your digital diary for the kitty group.</li>
                        <li>Track member contributions easily with "Payment Status".</li>
                        <li>Use the "Members" tab to manage your group and send reminders.</li>
                        <li>Keep a record of hosts and event dates all in one place.</li>
                    </ul>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-headline">Kitty Tools</CardTitle>
              <CardDescription>Handy tools to manage your group.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {tools.map((tool) => (
                  <Button
                    key={tool.id}
                    variant="outline"
                    className="flex h-24 flex-col items-center justify-center gap-2 p-2"
                    onClick={() => handleToolClick(tool.id)}
                  >
                    <tool.icon className="h-6 w-6 text-primary" />
                    <span className="text-center text-xs">{tool.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
