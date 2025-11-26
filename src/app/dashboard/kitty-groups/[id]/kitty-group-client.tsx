
'use client';
import {
  Users,
  Wallet,
  Calendar,
  IndianRupee,
  Trophy,
  Plus,
  Settings,
  Mail,
  ShieldCheck,
  FileWarning,
  Star,
  Video,
  Heart,
  ThumbsUp,
  Laugh,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { User as UserType } from '@/lib/mock-data';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { CameraCapture } from '@/components/camera-capture';


type KittyGroup = {
  id: string;
  name: string;
  members: number;
  nextTurn: string;
  contribution: number;
  nextDate: string;
};

type UpcomingEvent = {
  date: string;
  time: string;
  host: string;
  location: string;
};

type KittyGroupClientProps = {
  group: KittyGroup;
  groupMembers: UserType[];
  upcomingEvent: UpcomingEvent;
  currentUser: UserType;
};

type LiveChatMessage = {
    id: string;
    author: string;
    text: string;
}

const initialMessages: LiveChatMessage[] = [
    { id: 'msg1', author: 'Sneha Patel', text: 'Hey everyone! Excited for the party!' },
    { id: 'msg2', author: 'Meera Das', text: 'Looking good, Anjali! 🎉' }
];

export function KittyGroupClient({ group, groupMembers, upcomingEvent, currentUser }: KittyGroupClientProps) {
  const { toast } = useToast();
  const [isPartyDialogOpen, setIsPartyDialogOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [liveMessages, setLiveMessages] = useState<LiveChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const isHost = currentUser.name === group.nextTurn;

  const handleAction = (title: string, description: string) => {
    toast({ title, description });
  };
  
  const getStatusVariant = (status?: 'Paid' | 'Unpaid' | 'Overdue') => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Unpaid':
        return 'secondary';
      case 'Overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleStartParty = () => {
    setIsPartyDialogOpen(false);
    setIsLive(true);
    toast({
      title: 'You are now live!',
      description: 'Your virtual kitty party has started.',
    });
  };

  const handleMediaCaptured = (dataUrl: string, type: 'image' | 'video') => {
    // In a real app, you might use this for a thumbnail or preview
    console.log('Media captured for party:', type, dataUrl.substring(0, 50));
  };
  
  const handleSendChatMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if(newMessage.trim()){
          const msg: LiveChatMessage = {
              id: `msg${Date.now()}`,
              author: currentUser.name,
              text: newMessage.trim(),
          }
          setLiveMessages([...liveMessages, msg]);
          setNewMessage('');
      }
  }
  
  const sendReaction = (reaction: string) => {
      setActiveReaction(reaction);
      toast({
        title: `You sent a ${reaction}!`,
      });
      setTimeout(() => {
        setActiveReaction(null);
      }, 500); // Corresponds to animation duration
  }


  return (
    <div className="space-y-6">
    <div className="flex items-center justify-between">
      <PageHeader title={group.name} description="Let the fun begin!" />
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => handleAction('Invite Sent!', 'An invitation link has been sent to your friend.')}>
          <Plus className="mr-2 h-4 w-4" /> Invite
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleAction('Settings Opened', 'You can now edit your group settings.')}>
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
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
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className={cn('lg:col-span-2', isLive && 'flex flex-col')}>
              {isLive ? (
                  <div className='flex flex-col h-full'>
                      <div className="relative w-full bg-black flex-1 p-2 rounded-t-lg">
                          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-destructive px-3 py-1 text-white text-sm"><div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>LIVE</div>
                          <div className="grid grid-cols-2 gap-2 h-full">
                            <div className="relative rounded-md overflow-hidden bg-secondary">
                               <div className='h-full'><CameraCapture onMediaCaptured={() => {}} showControls={false} /></div>
                               <div className="absolute bottom-2 left-2 text-white text-sm font-medium bg-black/50 px-2 py-1 rounded-md">{currentUser.name} (You)</div>
                            </div>
                            {groupMembers.slice(1,4).map(member => (
                                <div key={member.id} className="relative rounded-md overflow-hidden bg-secondary flex items-center justify-center">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={`https://picsum.photos/seed/${member.id}/100/100`} alt={member.name} />
                                        <AvatarFallback>{member.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div className="absolute bottom-2 left-2 text-white text-sm font-medium bg-black/50 px-2 py-1 rounded-md">{member.name}</div>
                                </div>
                            ))}
                          </div>
                      </div>
                      <CardContent className="p-4 flex justify-center gap-2 mt-auto bg-card rounded-b-lg">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => sendReaction('heart')}
                            className={cn('transition-transform', activeReaction === 'heart' && 'animate-in zoom-in-150')}
                        >
                            <Heart className="text-red-500 fill-red-500" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => sendReaction('like')}
                             className={cn('transition-transform', activeReaction === 'like' && 'animate-in zoom-in-150')}
                        >
                            <ThumbsUp className="text-blue-500 fill-blue-500" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => sendReaction('laugh')}
                             className={cn('transition-transform', activeReaction === 'laugh' && 'animate-in zoom-in-150')}
                        >
                            <Laugh className="text-yellow-500 fill-yellow-500" />
                        </Button>
                         {isHost && <Button variant="destructive" size="sm" onClick={() => setIsLive(false)}>End Party</Button>}
                      </CardContent>
                  </div>
              ) : (
                <>
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
                        {isHost && (
                            <Dialog open={isPartyDialogOpen} onOpenChange={setIsPartyDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline"><Video className="mr-2 h-4 w-4" /> Start Virtual Party</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Start a Virtual Kitty Party</DialogTitle>
                                        <DialogDescription>
                                            Get ready to host your kitty party live! Your camera will be used.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <Input placeholder="Enter a title for your party..." defaultValue={`${group.name} - Live!`} />
                                        <div className="h-96"><CameraCapture onMediaCaptured={handleMediaCaptured} /></div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsPartyDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleStartParty}>Go Live</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </CardContent>
                </>
              )}
          </Card>
          <Card className='lg:col-span-1'>
              {isLive ? (
                  <>
                    <CardHeader>
                        <CardTitle>Live Chat</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col h-96">
                        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                            {liveMessages.map(msg => (
                                <div key={msg.id}>
                                    <span className="font-semibold text-sm">{msg.author}: </span>
                                    <span className="text-sm text-muted-foreground">{msg.text}</span>
                                </div>
                            ))}
                        </div>
                        <form className="mt-4 flex gap-2" onSubmit={handleSendChatMessage}>
                            <Input placeholder="Say something..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                            <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
                        </form>
                    </CardContent>
                  </>
              ) : (
                <>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Secure Kitty System
                    </CardTitle>
                    <CardDescription>
                        This group is protected by Sakhi&apos;s Secure Kitty System.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Security Deposit:</span>
                        <span className='font-semibold'>₹1,000 (Refundable)</span>
                    </div>
                    <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Late Payment Penalty:</span>
                        <span className='font-semibold'>₹100 per day</span>
                    </div>
                    <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Group Insurance:</span>
                        <span className='font-semibold'>Active</span>
                    </div>
                </CardContent>
                </>
              )}
          </Card>
        </div>
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
                  <TableHead>Kitty Score</TableHead>
                  <TableHead>Payment Status</TableHead>
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
                        <div>
                          <span className="font-medium">{member.name}</span>
                          <p className='text-xs text-muted-foreground'>{member.city}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                          <Star className={cn("h-4 w-4", (member.kittyScore || 0) > 80 ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/50')}/>
                          <span className='font-semibold'>{member.kittyScore || 'N/A'}</span>
                      </div>
                    </TableCell>
                     <TableCell>
                      <Badge variant={getStatusVariant(member.paymentStatus)}>
                        {member.paymentStatus || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleAction('Message Sent!', `Your message to ${member.name} has been sent.`)}>
                        <Mail className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="icon" className={cn(member.paymentStatus === 'Paid' && 'hidden')} onClick={() => handleAction('Payment Reminder Sent', `A reminder has been sent to ${member.name}.`)}>
                        <FileWarning className="h-4 w-4 text-destructive" />
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
