
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

type ContestClientProps = {
  contest: Contest;
};

export function ContestClient({ contest }: ContestClientProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [nominees, setNominees] = useState<Nominee[]>(contest.nominees);
  const [isNominationOpen, setIsNominationOpen] = useState(false);

  const handleVote = (nomineeId: string) => {
    setNominees(
      nominees.map((n) =>
        n.id === nomineeId
          ? { ...n, votes: (n.votes || 0) + 1, hasVoted: true }
          : n
      )
    );
    toast({
      title: 'Vote Cast!',
      description: `You have successfully voted for ${
        nominees.find((n) => n.id === nomineeId)?.name
      }.`,
    });
  };
  
  const handleComment = () => {
    toast({
      title: 'Commenting coming soon!',
      description: 'You will be able to comment on nominees here.',
    });
  }
  
  const handleShare = (nomineeName: string) => {
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
    .sort((a, b) => (b.votes || 0) - (a.votes || 0));

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
                            <DialogTitle>Enter the "{contest.title}" Contest</DialogTitle>
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
              <Card key={nominee.id} className="overflow-hidden flex flex-col">
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
                      {(nominee.votes || 0).toLocaleString()}
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
                <CardFooter className="flex justify-between gap-2 p-2">
                   <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleVote(nominee.id)}
                    disabled={nominee.hasVoted}
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    {nominee.hasVoted ? 'Voted' : 'Vote'}
                  </Button>
                   <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={handleComment}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Comment
                  </Button>
                   <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleShare(nominee.name)}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </CardFooter>
              </Card>
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
