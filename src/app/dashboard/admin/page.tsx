
'use client';
import { useState, useMemo } from 'react';
import {
  Shield,
  Users,
  Briefcase,
  BookOpen,
  IndianRupee,
  MoreVertical,
  CheckCircle,
  XCircle,
  Filter,
  Megaphone,
  AreaChart,
  Server,
  Hammer,
  Award,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  users as allUsers,
  directory as allProfessionals,
  communities,
  kittyGroups,
  type User,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type UserWithRole = User & { role: 'User' | 'Professional' | 'Creator'; status: 'Active' | 'Inactive' | 'Pending' };

const initialUsers: UserWithRole[] = allUsers.map(u => ({
    ...u,
    role: u.id === 'u1' || u.id === 'u3' ? 'Creator' : (allProfessionals.some(p => p.id.includes(u.id)) ? 'Professional' : 'User'),
    status: 'Active'
}));

initialUsers.push({
    id: 'u-new',
    name: 'New Professional',
    avatar: 'https://picsum.photos/seed/new-prof/100/100',
    city: 'Pune',
    interests: ['Wellness'],
    role: 'Professional',
    status: 'Pending'
});

const allContests = [
    { id: 'c1', name: 'NAARIMANI of the Year', participants: 1250, status: 'Live', fee: 'Free' },
    { id: 'c2', name: 'Woman Entrepreneur of The Year', participants: 480, status: 'Live', fee: '₹500' },
    { id: 'cc1', name: 'Best Home Chef', participants: 120, status: 'Community-run', fee: '₹100' },
    { id: 'prop1', name: 'Pune Baking Championship', participants: 0, status: 'Pending Approval', fee: '₹200' }
];

export default function AdminPanelPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>(initialUsers);
  const [filterRole, setFilterRole] = useState('All');
  const [commissions, setCommissions] = useState({
    marketplace: 10,
    consultations: 15,
    courses: 20,
  });
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    if (filterRole === 'All') return users;
    if (filterRole === 'Pending') return users.filter(u => u.status === 'Pending');
    return users.filter(u => u.role === filterRole && u.status !== 'Pending');
  }, [users, filterRole]);

  const handleUserStatusChange = (userId: string, newStatus: UserWithRole['status']) => {
    setUsers(prev => prev.map(u => u.id === userId ? {...u, status: newStatus} : u));
    toast({
        title: 'User Updated',
        description: `User status has been changed to ${newStatus}.`
    });
  }

  const handleCommissionChange = (key: keyof typeof commissions, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setCommissions(prev => ({...prev, [key]: numValue}));
    }
  }

  const getStatusVariant = (status: UserWithRole['status'] | string) => {
    switch (status) {
      case 'Active':
      case 'Live':
         return 'default';
      case 'Inactive': 
      case 'Pending Approval':
        return 'secondary';
      case 'Pending': 
      case 'Community-run':
        return 'outline';
      case 'Overdue': return 'destructive';
    }
  }

  const stats = {
      totalUsers: users.length,
      totalProfessionals: users.filter(u => u.role === 'Professional' && u.status === 'Active').length,
      totalCreators: users.filter(u => u.role === 'Creator').length,
      totalRevenue: '₹1,50,000'
  }

  const handleBroadcast = () => {
    setIsBroadcastOpen(false);
    toast({
        title: 'Message Broadcast Sent!',
        description: 'Your announcement has been sent to all users.'
    })
  }
  
  const handleManageContest = (contestName: string) => {
      toast({
          title: `Managing: ${contestName}`,
          description: "From here, an admin could assign a jury panel, monitor voting, and declare the winner."
      })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Panel"
        description="Manage users, content, and settings for the entire platform."
      />

      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="contests">Contests</TabsTrigger>
        </TabsList>
        
        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.totalUsers}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Verified Professionals</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.totalProfessionals}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Content Creators</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.totalCreators}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.totalRevenue}</div></CardContent>
                </Card>
            </div>
             <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
                        <DialogTrigger asChild>
                            <Button><Megaphone className="mr-2 h-4 w-4"/>Broadcast Message</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Broadcast a Message</DialogTitle>
                                <DialogDescription>This message will be sent as a notification to all users on the platform.</DialogDescription>
                            </DialogHeader>
                            <Textarea placeholder="Type your announcement here..." rows={5} />
                            <DialogFooter>
                                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                                <Button onClick={handleBroadcast}>Send Broadcast</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" onClick={() => toast({ title: 'Viewing Reports', description: 'Generating and displaying financial and user reports.'})}><AreaChart className="mr-2 h-4 w-4"/>View Reports</Button>
                    <Button variant="outline" onClick={() => toast({ title: 'System Health', description: 'Displaying server status, database connections, and API latency.'})}><Server className="mr-2 h-4 w-4"/>System Health</Button>
                    <Button variant="destructive" onClick={() => toast({ variant: 'destructive', title: 'Maintenance Mode Activated', description: 'The platform is now in maintenance mode. Only admins can access it.'})}><Hammer className="mr-2 h-4 w-4"/>Trigger Maintenance</Button>
                </CardContent>
            </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View, approve, and manage all users on the platform.</CardDescription>
              <div className="flex items-center gap-4 pt-4">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Roles</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Creator">Creator</SelectItem>
                    <SelectItem value="Pending">Pending Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={`https://picsum.photos/seed/${user.id}/100/100`} />
                            <AvatarFallback>{user.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.city}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(user.status)}>{user.status}</Badge></TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {user.status === 'Pending' && <DropdownMenuItem onClick={() => handleUserStatusChange(user.id, 'Active')}><CheckCircle className="mr-2 h-4 w-4" />Approve</DropdownMenuItem>}
                                {user.status === 'Active' && <DropdownMenuItem className="text-destructive" onClick={() => handleUserStatusChange(user.id, 'Inactive')}><XCircle className="mr-2 h-4 w-4" />Deactivate</DropdownMenuItem>}
                                {user.status === 'Inactive' && <DropdownMenuItem onClick={() => handleUserStatusChange(user.id, 'Active')}><CheckCircle className="mr-2 h-4 w-4" />Re-activate</DropdownMenuItem>}
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
               {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  No users found for this filter.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="mt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Marketplace Commission</CardTitle>
                        <CardDescription>Set the percentage the platform takes from each sale.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Label htmlFor="marketplace-commission">Commission Rate</Label>
                        <div className="relative mt-1">
                            <Input id="marketplace-commission" type="number" value={commissions.marketplace} onChange={(e) => handleCommissionChange('marketplace', e.target.value)} />
                            <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Consultation Commission</CardTitle>
                        <CardDescription>Set the percentage for professional sessions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Label htmlFor="consultation-commission">Commission Rate</Label>
                        <div className="relative mt-1">
                            <Input id="consultation-commission" type="number" value={commissions.consultations} onChange={(e) => handleCommissionChange('consultations', e.target.value)} />
                             <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Learning Commission</CardTitle>
                        <CardDescription>Set the percentage for paid course enrollments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Label htmlFor="courses-commission">Commission Rate</Label>
                        <div className="relative mt-1">
                            <Input id="courses-commission" type="number" value={commissions.courses} onChange={(e) => handleCommissionChange('courses', e.target.value)} />
                             <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
             <div className="mt-6 flex justify-end">
                <Button onClick={() => toast({ title: "Commissions Updated!", description: "The new commission rates have been saved." })}>
                    Save Commission Rates
                </Button>
            </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="mt-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                     <CardHeader><CardTitle>Communities</CardTitle></CardHeader>
                     <CardContent>
                         <Table>
                             <TableHeader>
                                 <TableRow>
                                     <TableHead>Name</TableHead>
                                     <TableHead>Members</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                 </TableRow>
                             </TableHeader>
                             <TableBody>
                                 {communities.map(c => (
                                     <TableRow key={c.id}>
                                         <TableCell>{c.name}</TableCell>
                                         <TableCell>{c.memberCount.toLocaleString()}</TableCell>
                                         <TableCell className="text-right"><Button variant="ghost" size="sm">Manage</Button></TableCell>
                                     </TableRow>
                                 ))}
                             </TableBody>
                         </Table>
                     </CardContent>
                 </Card>
                  <Card>
                     <CardHeader><CardTitle>Kitty Groups</CardTitle></CardHeader>
                     <CardContent>
                         <Table>
                             <TableHeader>
                                 <TableRow>
                                     <TableHead>Name</TableHead>
                                     <TableHead>Members</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                 </TableRow>
                             </TableHeader>
                             <TableBody>
                                 {kittyGroups.map(k => (
                                     <TableRow key={k.id}>
                                         <TableCell>{k.name}</TableCell>
                                         <TableCell>{k.members.toLocaleString()}</TableCell>
                                          <TableCell className="text-right"><Button variant="ghost" size="sm">Manage</Button></TableCell>
                                     </TableRow>
                                 ))}
                             </TableBody>
                         </Table>
                     </CardContent>
                 </Card>
             </div>
        </TabsContent>

        {/* Contests Tab */}
        <TabsContent value="contests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contest Management</CardTitle>
              <CardDescription>Oversee all contests and awards on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contest Name</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Entry Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allContests.map((contest) => (
                    <TableRow key={contest.id}>
                      <TableCell className="font-medium">{contest.name}</TableCell>
                      <TableCell>{contest.participants.toLocaleString()}</TableCell>
                      <TableCell>{contest.fee}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(contest.status)}>{contest.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleManageContest(contest.name)}>
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
