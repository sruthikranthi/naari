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
  Share2,
  Copy,
  Check,
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
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { CameraCapture } from '@/components/camera-capture';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { searchUsers } from '@/lib/search';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

//
// 🔥 REAL FIRESTORE USER TYPE (working with your Firestore schema)
//
type FirestoreUser = {
  id: string;
  name: string;
  avatar?: string;
  city?: string;
  kittyScore?: number;
  paymentStatus?: 'Paid' | 'Unpaid' | 'Overdue';
  interests?: string[];
};

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
  groupMembers: FirestoreUser[];
  upcomingEvent: UpcomingEvent;
  currentUser: FirestoreUser;
  groupId: string; // Add groupId to update Firestore
};

type LiveChatMessage = {
  id: string;
  author: string;
  text: string;
};

const initialMessages: LiveChatMessage[] = [
  { id: 'msg1', author: 'Sneha Patel', text: 'Hey everyone! Excited for the party!' },
  { id: 'msg2', author: 'Meera Das', text: 'Looking good, Anjali! 🎉' }
];

export function KittyGroupClient({ group, groupMembers, upcomingEvent, currentUser, groupId }: KittyGroupClientProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const [isPartyDialogOpen, setIsPartyDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [liveMessages, setLiveMessages] = useState<LiveChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FirestoreUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState<string | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const isHost = currentUser.name === group.nextTurn;
  const isGroupAdmin = group.memberIds && group.memberIds.length > 0 && group.memberIds[0] === currentUser.id;

  const shareLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/dashboard/kitty-groups/join?groupId=${groupId}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      toast({
        title: 'Link Copied!',
        description: 'Share this link via WhatsApp or any other platform to invite members.',
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: 'Failed to Copy',
        description: 'Could not copy the link to your clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleShareWhatsApp = () => {
    const message = `Join my Kitty Group "${group.name}" on Naarimani!\n\n${shareLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

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
    console.log('Media captured:', type, dataUrl.substring(0, 50));
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const msg: LiveChatMessage = {
        id: `msg${Date.now()}`,
        author: currentUser.name,
        text: newMessage.trim(),
      };
      setLiveMessages([...liveMessages, msg]);
      setNewMessage('');
    }
  };

  const sendReaction = (reaction: string) => {
    setActiveReaction(reaction);
    toast({ title: `You sent a ${reaction}!` });
    setTimeout(() => setActiveReaction(null), 500);
  };

  // Search for users to invite
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { results } = await searchUsers(searchTerm);
        // Filter out users who are already members
        const existingMemberIds = new Set(group.memberIds || []);
        const filteredResults = results
          .filter(result => result.type === 'user' && !existingMemberIds.has(result.id))
          .map(result => ({
            id: result.id,
            name: result.title,
            avatar: result.image || '',
            city: result.metadata?.city || '',
          } as FirestoreUser));
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Error searching users:', error);
        toast({
          title: 'Search Error',
          description: 'Failed to search for users',
          variant: 'destructive',
        });
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchTerm, group.memberIds, toast]);

  const handleAddMember = async (userId: string, userName: string) => {
    if (!firestore || !groupId) {
      toast({
        title: 'Error',
        description: 'Unable to add member. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingMember(userId);
    try {
      const groupRef = doc(firestore, 'kitty_groups', groupId);
      await updateDoc(groupRef, {
        memberIds: arrayUnion(userId),
      });
      
      toast({
        title: 'Member Added!',
        description: `${userName} has been added to the group.`,
      });
      
      // Remove from search results
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      setSearchTerm('');
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add member. You may not have permission.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingMember(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={group.name} description="Let the fun begin!" />
        <div className="flex items-center gap-2">
          {isGroupAdmin && (
            <>
              <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Share2 className="mr-2 h-4 w-4" /> Share Link
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Share Kitty Group</DialogTitle>
                    <DialogDescription>
                      Share this link to invite members. Anyone with this link can join your group.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center gap-2">
                      <Input
                        value={shareLink}
                        readOnly
                        className="flex-1 font-mono text-sm"
                      />
                      <Button
                        onClick={handleCopyLink}
                        variant={linkCopied ? 'default' : 'outline'}
                        size="icon"
                      >
                        {linkCopied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleShareWhatsApp} className="flex-1" variant="outline">
                        <Share2 className="mr-2 h-4 w-4" /> Share via WhatsApp
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: Share this link on WhatsApp, social media, or any platform. Members can join instantly by clicking the link!
                    </p>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Invite Members
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Invite Members to {group.name}</DialogTitle>
                  <DialogDescription>
                    Search for users by name or city to add them to your kitty group.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or city..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {isSearching && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {!isSearching && searchResults.length > 0 && (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                {user.city && (
                                  <p className="text-xs text-muted-foreground">{user.city}</p>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddMember(user.id, user.name)}
                              disabled={isAddingMember === user.id}
                            >
                              {isAddingMember === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Add
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {!isSearching && searchTerm && searchResults.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No users found matching &quot;{searchTerm}&quot;</p>
                      <p className="text-xs mt-2">Try searching by name or city</p>
                    </div>
                  )}

                  {!isSearching && !searchTerm && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Start typing to search for users</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }

          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              handleAction('Settings Opened', 'You can edit group settings.')
            }
          >
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

        {/* ====================== OVERVIEW TAB ===================== */}
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
                <CardTitle className="text-sm font-medium">Contribution</CardTitle>
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
                <CardTitle className="text-sm font-medium">Next Turn</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{group.nextTurn}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Meet</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{group.nextDate}</div>
              </CardContent>
            </Card>
          </div>

          {/* LIVE PARTY SECTION */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className={cn('lg:col-span-2', isLive && 'flex flex-col')}>
              {isLive ? (
                <div className="flex flex-col h-full">
                  <div className="relative w-full bg-black flex-1 p-2 rounded-t-lg">
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-destructive px-3 py-1 text-white text-sm">
                      <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      LIVE
                    </div>

                    <div className="grid grid-cols-2 gap-2 h-full">
                      <div className="relative rounded-md overflow-hidden bg-secondary">
                        <div className="h-full">
                          <CameraCapture onMediaCaptured={() => {}} showControls={false} />
                        </div>
                        <div className="absolute bottom-2 left-2 text-white text-sm font-medium bg-black/50 px-2 py-1 rounded-md">
                          {currentUser.name} (You)
                        </div>
                      </div>

                      {groupMembers.slice(1, 4).map((member) => (
                        <div
                          key={member.id}
                          className="relative rounded-md overflow-hidden bg-secondary flex items-center justify-center"
                        >
                          <Avatar className="h-16 w-16">
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

                          <div className="absolute bottom-2 left-2 text-white text-sm font-medium bg-black/50 px-2 py-1 rounded-md">
                            {member.name}
                          </div>
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

                    {isHost && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsLive(false)}
                      >
                        End Party
                      </Button>
                    )}
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
                      <Button
                        onClick={() =>
                          handleAction(
                            'RSVP Confirmed!',
                            `You are attending the next Kitty Party hosted by ${upcomingEvent.host}.`
                          )
                        }
                      >
                        RSVP
                      </Button>

                      {isHost && (
                        <Dialog open={isPartyDialogOpen} onOpenChange={setIsPartyDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              <Video className="mr-2 h-4 w-4" /> Start Virtual Party
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Start a Virtual Kitty Party</DialogTitle>
                              <DialogDescription>
                                Get ready to host your kitty party live!
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              <Input
                                placeholder="Enter a title..."
                                defaultValue={`${group.name} - Live!`}
                              />

                              <div className="h-96">
                                <CameraCapture onMediaCaptured={handleMediaCaptured} />
                              </div>
                            </div>

                            <DialogFooter>
                              <Button variant="ghost" onClick={() => setIsPartyDialogOpen(false)}>
                                Cancel
                              </Button>
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

            {/* RIGHT SIDE PANEL */}
            <Card className="lg:col-span-1">
              {isLive ? (
                <>
                  <CardHeader>
                    <CardTitle>Live Chat</CardTitle>
                  </CardHeader>

                  <CardContent className="flex flex-col h-96">
                    <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                      {liveMessages.map((msg) => (
                        <div key={msg.id}>
                          <span className="font-semibold text-sm">{msg.author}: </span>
                          <span className="text-sm text-muted-foreground">{msg.text}</span>
                        </div>
                      ))}
                    </div>

                    <form className="mt-4 flex gap-2" onSubmit={handleSendChatMessage}>
                      <Input
                        placeholder="Say something..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </CardContent>
                </>
              ) : (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      Secure Kitty System
                    </CardTitle>
                    <CardDescription>
                      This group is protected by Sakhi&apos;s Secure Kitty System.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Security Deposit:</span>
                      <span className="font-semibold">₹1,000 (Refundable)</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Late Payment Penalty:</span>
                      <span className="font-semibold">₹100 per day</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Group Insurance:</span>
                      <span className="font-semibold">Active</span>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* ====================== MEMBERS TAB ===================== */}
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
                            <p className="text-xs text-muted-foreground">{member.city}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star
                            className={cn(
                              'h-4 w-4',
                              (member.kittyScore || 0) > 80
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-muted-foreground/50'
                            )}
                          />
                          <span className="font-semibold">{member.kittyScore || 'N/A'}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={getStatusVariant(member.paymentStatus)}>
                          {member.paymentStatus || 'N/A'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleAction(
                              'Message Sent!',
                              `Your message to ${member.name} has been sent.`
                            )
                          }
                        >
                          <Mail className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(member.paymentStatus === 'Paid' && 'hidden')}
                          onClick={() =>
                            handleAction(
                              'Payment Reminder Sent',
                              `A reminder has been sent to ${member.name}.`
                            )
                          }
                        >
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

        {/* ====================== TRANSACTIONS TAB ===================== */}
        <TabsContent value="transactions" className="mt-6 text-center text-muted-foreground py-12">
          <p>Transaction history will be shown here.</p>
        </TabsContent>

        {/* ====================== EVENTS TAB ===================== */}
        <TabsContent value="events" className="mt-6 text-center text-muted-foreground py-12">
          <p>Past and upcoming events will be shown here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
