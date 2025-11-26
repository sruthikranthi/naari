
'use client';
import { useState, useMemo } from 'react';
import {
  Users,
  BookOpen,
  DollarSign,
  Eye,
  UserPlus,
  Star,
  Check,
  X,
  Calendar,
  MoreVertical,
  Loader,
} from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Professional } from '@/lib/directory';
import type { Course, User } from '@/lib/mock-data';
import { Skeleton } from '@/components/ui/skeleton';

type IncomingRequest = {
  user: User;
  message: string;
};

type Client = {
  user: User;
  sessionDate: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
};

export default function ProfessionalHubPage() {
  const { toast } = useToast();
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date | undefined>();

  const firestore = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();

  const directoryQuery = useMemoFirebase(
    () => (firestore && currentUser ? collection(firestore, 'directory') : null),
    [firestore, currentUser]
  );
  const { data: professionals, isLoading: areProfessionalsLoading } = useCollection<Professional>(directoryQuery);

  const coursesQuery = useMemoFirebase(
    () => (firestore && currentUser ? collection(firestore, 'courses') : null),
    [firestore, currentUser]
  );
  const { data: courses, isLoading: areCoursesLoading } = useCollection<Course>(coursesQuery);

  const usersQuery = useMemoFirebase(
    () => (firestore && currentUser ? collection(firestore, 'users') : null),
    [firestore, currentUser]
  );
  const { data: users, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  const professional = useMemo(() => professionals?.[0], [professionals]);
  
  const { courseCreator, creatorCourses } = useMemo(() => {
    if (!courses || !users) return { courseCreator: null, creatorCourses: [] };
    const creator = users.find(u => u.id === 'u3'); // Mocking: finding a specific user as creator
    if (!creator) return { courseCreator: null, creatorCourses: [] };
    
    const created = courses.filter(c => c.instructorId === creator.id);
    return { courseCreator: creator, creatorCourses: created };
  }, [courses, users]);

  // Set up mock requests and clients once users are loaded
  useState(() => {
    if (users && users.length > 3) {
      setIncomingRequests([
        { user: users[1], message: "Hi Dr. Gupta, I'd like to book a session." },
        { user: users[3], message: 'Looking for guidance on stress management.' },
      ]);
      setClients([
        { user: users[4], sessionDate: 'July 28, 2024', status: 'Upcoming' },
        { user: users[2], sessionDate: 'July 15, 2024', status: 'Completed' },
      ]);
    }
  });

  const handleRequest = (request: IncomingRequest, accepted: boolean) => {
    setIncomingRequests((prev) =>
      prev.filter((req) => req.user.id !== request.user.id)
    );

    toast({
      title: `Request ${accepted ? 'Accepted' : 'Declined'}`,
      description: `You have ${
        accepted ? 'connected with' : 'declined'
      } ${request.user.name}.`,
    });

    if (accepted) {
      const newClient: Client = {
        user: request.user,
        sessionDate: 'August 5, 2024', // Example date
        status: 'Upcoming',
      };
      setClients((prev) => [newClient, ...prev]);
    }
  };

  const handleViewAnalytics = (courseTitle: string) => {
    toast({
      title: 'Analytics Coming Soon',
      description: `Detailed analytics for "${courseTitle}" will be available here.`,
    });
  };

  const getStatusVariant = (status: Client['status']) => {
    switch (status) {
      case 'Completed':
        return 'default';
      case 'Upcoming':
        return 'secondary';
      case 'Cancelled':
        return 'destructive';
    }
  };

  const updateClientStatus = (clientId: string, newStatus: Client['status']) => {
    setClients(prevClients =>
      prevClients.map(client =>
        client.user.id === clientId ? { ...client, status: newStatus } : client
      )
    );
    toast({
        title: 'Status Updated!',
        description: `Session has been marked as ${newStatus}.`,
    });
  };

  const handleReschedule = (client: Client) => {
    setSelectedClient(client);
    setIsRescheduleOpen(true);
  };
  
  const handleConfirmReschedule = () => {
    if(selectedClient && newDate) {
        setClients(prevClients =>
            prevClients.map(client =>
                client.user.id === selectedClient.user.id ? { ...client, sessionDate: newDate.toLocaleDateString() } : client
            )
        );
        toast({
            title: 'Session Rescheduled!',
            description: `Session with ${selectedClient.user.name} moved to ${newDate.toLocaleDateString()}`,
        });
        setIsRescheduleOpen(false);
        setSelectedClient(null);
        setNewDate(undefined);
    }
  }

  const isLoading = isUserLoading || areProfessionalsLoading || areCoursesLoading || areUsersLoading;

  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-6 mt-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    )
  }

  if (!professional || !courseCreator) {
    return (
        <div className="text-center py-10">
            <p>Could not load professional or creator data.</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Professional & Creator Hub"
        description="Manage your professional activities and content."
      />
      <Tabs defaultValue="professional">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="professional">
            <Users className="mr-2 h-4 w-4" /> Professional View
          </TabsTrigger>
          <TabsTrigger value="creator">
            <BookOpen className="mr-2 h-4 w-4" /> Creator View
          </TabsTrigger>
        </TabsList>
        <TabsContent value="professional" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {professional.name}</CardTitle>
              <CardDescription>
                Here's a summary of your activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card className="bg-secondary/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Profile Views
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,250</div>
                  <p className="text-xs text-muted-foreground">
                    +15% from last month
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Connection Requests
                  </CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {incomingRequests.length} New
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Waiting for your response
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Earnings
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹25,500</div>
                  <p className="text-xs text-muted-foreground">
                    This month so far
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Tabs defaultValue="requests" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="requests">Incoming Requests ({incomingRequests.length})</TabsTrigger>
              <TabsTrigger value="clients">My Clients ({clients.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="requests" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Incoming Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {incomingRequests.length > 0 ? (
                    incomingRequests.map((req) => (
                      <div
                        key={req.user.id}
                        className="flex items-center gap-4 rounded-lg border p-4"
                      >
                        <Avatar>
                          <AvatarImage
                            src={req.user.avatar}
                          />
                          <AvatarFallback>
                            {req.user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{req.user.name}</p>
                          <p className="text-sm text-muted-foreground italic">
                            "{req.message}"
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleRequest(req, false)}
                          >
                            <X className="mr-2 h-4 w-4" /> Decline
                          </Button>
                          <Button onClick={() => handleRequest(req, true)}>
                            <Check className="mr-2 h-4 w-4" /> Accept
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No new requests.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="clients" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>My Clients</CardTitle>
                        <CardDescription>A list of your accepted connections and their session status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Session Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.map((client) => (
                                    <TableRow key={client.user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={client.user.avatar} alt={client.user.name} />
                                                    <AvatarFallback>{client.user.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{client.user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{client.user.city}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{client.sessionDate}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(client.status)}>{client.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                        <span className="sr-only">Client Actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => updateClientStatus(client.user.id, 'Completed')}>
                                                        Mark as Complete
                                                    </DropdownMenuItem>
                                                     <DropdownMenuItem onClick={() => handleReschedule(client)}>
                                                        Reschedule
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => updateClientStatus(client.user.id, 'Cancelled')}>
                                                        Cancel Session
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {clients.length === 0 && (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                You have no clients yet.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="creator" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {courseCreator.name}</CardTitle>
              <CardDescription>
                Here's a summary of your course performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card className="bg-secondary/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Enrollments
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">852</div>
                  <p className="text-xs text-muted-foreground">
                    Across {creatorCourses.length} courses
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Rating
                  </CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.8</div>
                  <p className="text-xs text-muted-foreground">
                    Based on 120 reviews
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Earnings
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹42,800</div>
                  <p className="text-xs text-muted-foreground">
                    This month so far
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Courses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {creatorCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{course.title}</h3>
                    <div className="mt-2 grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium">250</p>
                        <p>Enrollments</p>
                      </div>
                      <div>
                        <p className="font-medium">85%</p>
                        <p>Completion Rate</p>
                      </div>
                      <div>
                        <p className="font-medium">
                          ₹{((course.price || 0) * 250).toLocaleString()}
                        </p>
                        <p>Revenue</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleViewAnalytics(course.title)}
                  >
                    View Analytics
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reschedule Session</DialogTitle>
                <DialogDescription>
                    Select a new date for your session with {selectedClient?.user.name}.
                </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
                <CalendarComponent
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                    disabled={(date) => date < new Date()}
                />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button onClick={handleConfirmReschedule} disabled={!newDate}>Confirm New Date</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    