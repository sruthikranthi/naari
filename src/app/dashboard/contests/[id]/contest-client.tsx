
'use client';
import { useState } from 'react';
import Image from 'next/image';
import {
  Award,
  Calendar,
  Heart,
  Search,
  Trophy,
  User,
  Users,
  Plus,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type Contest, type Nominee } from '@/lib/contests-data';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useDashboard } from '../../layout';
import type { Post } from '@/lib/mock-data';
import { useUser } from '@/firebase';
import { serverTimestamp } from 'firebase/firestore';

type ContestClientProps = {
  contest: Contest;
};

export function ContestClient({ contest }: ContestClientProps) {
  const { toast } = useToast();
  const { addPost } = useDashboard();
  const { user: currentUser } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [nominees, setNominees] = useState<Nominee[]>(contest.nominees);
  const [isNominationOpen, setIsNominationOpen] = useState(false);

  const handleVote = (nomineeId: string) => {
    setNominees(
      nominees.map((n) =>
        n.id === nomineeId && !n.hasVoted
          ? { ...n, votes: n.votes + 1, hasVoted: true }
          : n
      )
    );
    if (!nominees.find(n => n.id === nomineeId)?.hasVoted) {
      toast({
        title: 'Vote Cast!',
        description: `You have successfully voted for ${
          nominees.find((n) => n.id === nomineeId)?.name
        }.`,
      });
    }
  };
  
  const handleComment = (nomineeId: string) => {
    setNominees(
      nominees.map((n) =>
        n.id === nomineeId
          ? { ...n, comments: n.comments + 1 }
          : n
      )
    );
    toast({
      title: 'Commenting coming soon!',
      description: 'You will be able to comment on nominees here.',
    });
  }
  
  const handleShare = (nomineeId: string, nomineeName: string) => {
     if (!currentUser) {
        toast({ variant: 'destructive', title: 'Please log in to share.' });
        return;
     }

     setNominees(
      nominees.map((n) =>
        n.id === nomineeId
          ? { ...n, shares: n.shares + 1 }
          : n
      )
    );
    
    const newPost: Post = {
        id: `post-${Date.now()}`,
        author: {
          id: currentUser.uid,
          name: currentUser.displayName || 'A Sakhi',
          avatar: currentUser.photoURL || `https://picsum.photos/seed/${currentUser.uid}/100/100`,
        },
        content: `I'm supporting ${nomineeName} in the "${contest.title}" contest! Show them some love! #SakhiContest`,
        timestamp: serverTimestamp(),
        likes: 0,
        comments: 0,
        isAnonymous: false,
    };
    addPost(newPost);
    
     toast({
      title: 'Shared!',
      description: `A post to support ${nomineeName} has been created on your feed.`,
    });
  }

  const handleNominate = () => {
    setIsNominationOpen(false);
    toast({
        title: 'Participation Submitted!',
        description: 'Your entry is under review. You are now a nominee! Good luck!'
    });
  }

  const filteredNominees = nominees
    .filter((n) => n.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.votes - a.votes);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative h-56 w-full overflow-hidden rounded-lg md:h-72">
        <Image
          src={contest.image}
          alt={contest.title}
          fill
          className="object-cover"
          data-ai-hint="award ceremony"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <Badge>{contest.category}</Badge>
          <h1 className="mt-2 font-headline text-3xl font-bold text-white md:text-5xl">
            {contest.title}
          </h1>
          <p className="mt-2 max-w-3xl text-white/80">{contest.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        {/* Left Sidebar */}
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Contest Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Prize</p>
                  <p className="text-muted-foreground">{contest.prize}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Ends In</p>
                  <p className="text-muted-foreground">{contest.endsIn}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Nominees</p>
                  <p className="text-muted-foreground">
                    {contest.nominees.length}
                  </p>
                </div>
              </div>
               <div className="pt-4">
                 <Dialog open={isNominationOpen} onOpenChange={setIsNominationOpen}>
                    <DialogTrigger asChild>
                       <Button className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> Participate Now
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Enter the &quot;{contest.title}&quot; Contest</DialogTitle>
                            <DialogDescription>Share your story and achievements to become a nominee. Your submission will be reviewed by the panel.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="story">Your Story / Achievement</Label>
                                <Textarea id="story" placeholder="Tell us why you should win..." rows={5} />
                            </div>
                             <div>
                                <Label htmlFor="image-upload">Upload a supporting image</Label>
                                <Input id="image-upload" type="file" accept="image/*" />
                            </div>
                            {contest.nominationFee > 0 && (
                                <div className="rounded-lg border bg-secondary/50 p-3 text-center">
                                    <p>An entry fee of <strong>₹{contest.nominationFee}</strong> will be applicable upon submission.</p>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsNominationOpen(false)}>Cancel</Button>
                            <Button onClick={handleNominate}>Submit Entry</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
               </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Jury Panel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contest.jury.map((juror) => (
                <div key={juror.name} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={juror.avatar} alt={juror.name} />
                    <AvatarFallback>
                      {juror.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{juror.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {juror.title}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Nominees */}
        <div className="space-y-6 md:col-span-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-headline text-2xl font-bold">Nominees</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search nominees..."
                className="w-full pl-9 sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {filteredNominees.map((nominee) => (
              <Dialog key={nominee.id}>
                <DialogTrigger asChild>
                  <Card className="overflow-hidden flex flex-col cursor-pointer transition-shadow hover:shadow-lg">
                    <CardHeader className="p-0">
                      <div className="relative aspect-video w-full">
                        <Image
                          src={nominee.story.image}
                          alt={nominee.name}
                          fill
                          className="object-cover"
                        />
                        <Badge className="absolute top-2 right-2 flex items-center gap-1.5 text-base">
                          <Heart className="h-4 w-4" />
                          {nominee.votes.toLocaleString()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 flex-1">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={nominee.avatar} alt={nominee.name} />
                          <AvatarFallback>
                            {nominee.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <CardTitle>{nominee.name}</CardTitle>
                      </div>
                      <CardDescription className="mt-3 line-clamp-3 h-[60px]">
                        {nominee.story.text}
                      </CardDescription>
                    </CardContent>
                    <CardFooter className="flex justify-between gap-1 p-2 bg-muted/50">
                       <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        disabled
                      >
                        <Trophy className="mr-2 h-4 w-4" />
                        Vote
                      </Button>
                       <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                         disabled
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {nominee.comments}
                      </Button>
                       <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                         disabled
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        {nominee.shares}
                      </Button>
                    </CardFooter>
                  </Card>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={nominee.avatar} alt={nominee.name} />
                                <AvatarFallback>{nominee.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                                <DialogTitle className="text-2xl">{nominee.name}</DialogTitle>
                                <DialogDescription>Nominee for &quot;{contest.title}&quot;</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                             <Image
                                src={nominee.story.image}
                                alt={nominee.name + " story image"}
                                fill
                                className="object-cover"
                                />
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold">Their Story</h3>
                            <p className="text-sm text-muted-foreground">{nominee.story.text}</p>
                            <div className="flex justify-between items-center rounded-lg border p-4 bg-secondary/50">
                                <span className="font-bold text-lg">{nominee.votes.toLocaleString()} Votes</span>
                                <Button
                                    variant={nominee.hasVoted ? "secondary" : "default"}
                                    onClick={(e) => { e.stopPropagation(); handleVote(nominee.id); }}
                                    disabled={nominee.hasVoted}
                                >
                                    <Trophy className="mr-2 h-4 w-4" />
                                    {nominee.hasVoted ? 'Voted' : 'Vote Now'}
                                </Button>
                            </div>
                        </div>
                    </div>
                     <DialogFooter className="sm:justify-start gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleComment(nominee.id); }}
                        >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Comment ({nominee.comments})
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleShare(nominee.id, nominee.name); }}
                        >
                            <Share2 className="mr-2 h-4 w-4" />
                            Share ({nominee.shares})
                        </Button>
                     </DialogFooter>
                </DialogContent>
              </Dialog>
            ))}
          </div>
          {filteredNominees.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <h3 className="text-lg font-semibold">No nominees found</h3>
              <p>Try clearing your search. Be the first to participate!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
