
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
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
  FileText,
  UserCheck,
  GraduationCap,
  Users2,
  CalendarClock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type Contest, type Nominee, type Nomination } from '@/lib/contests-data';
import { useFirestore, useStorage } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { query, where } from 'firebase/firestore';
import { NominationCongratulations } from '@/components/nomination-congratulations';

type ContestClientProps = {
  contest: Contest;
};

export function ContestClient({ contest }: ContestClientProps) {
  const { toast } = useToast();
  const { addPost } = useDashboard();
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [nominees, setNominees] = useState<Nominee[]>(contest.nominees || []);
  const [isNominationOpen, setIsNominationOpen] = useState(false);
  const [nominationStory, setNominationStory] = useState('');
  const [nominationImage, setNominationImage] = useState<File | null>(null);
  const [nominationImagePreview, setNominationImagePreview] = useState<string | null>(null);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const prevContestIdRef = useRef<string | undefined>(contest.id);

  // Check if user has an approved nomination
  const userNominationsQuery = useMemoFirebase(
    () => (firestore && currentUser ? query(collection(firestore, 'nominations'), where('contestId', '==', contest.id), where('userId', '==', currentUser.uid), where('status', '==', 'approved')) : null),
    [firestore, currentUser, contest.id]
  );
  const { data: userNominations } = useCollection<Nomination>(userNominationsQuery);

  // Show congratulations if user has approved nomination and hasn't seen it yet
  useEffect(() => {
    if (userNominations && userNominations.length > 0) {
      const hasSeenCongratulations = localStorage.getItem(`congratulations_seen_${contest.id}_${currentUser?.uid}`);
      if (!hasSeenCongratulations) {
        setShowCongratulations(true);
        localStorage.setItem(`congratulations_seen_${contest.id}_${currentUser?.uid}`, 'true');
      }
    }
  }, [userNominations, contest.id, currentUser?.uid]);

  // Sync nominees when contest ID changes (not just the nominees array)
  useEffect(() => {
    if (prevContestIdRef.current !== contest.id) {
      prevContestIdRef.current = contest.id;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Need to sync local state when contest changes
      setNominees(contest.nominees || []);
    }
  }, [contest.id, contest.nominees]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const submitNomination = useCallback(async (paymentOrderId?: string, paymentId?: string, storyText?: string, imageData?: string) => {
    if (!currentUser || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Unable to submit nomination. Please try again.'
      });
      return;
    }

    try {
      // Upload image if provided
      let imageUrl = '';
      const storyToUse = storyText || nominationStory;
      
      if (imageData || nominationImage) {
        if (!storage) {
          throw new Error('Storage not available');
        }
        
        const timestamp = Date.now();
        const fileName = `nominations/${contest.id}/${currentUser.uid}/${timestamp}.jpg`;
        const storageRef = ref(storage, fileName);
        
        // Convert base64 to blob if needed
        let blob: Blob;
        if (nominationImage) {
          blob = nominationImage;
        } else if (imageData) {
          // It's base64 data
          const response = await fetch(imageData);
          blob = await response.blob();
        } else {
          throw new Error('No image data provided');
        }
        
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      // Create nomination document
      const nominationData: Omit<Nomination, 'id'> = {
        contestId: contest.id,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'User',
        userAvatar: currentUser.photoURL || `https://picsum.photos/seed/${currentUser.uid}/100/100`,
        story: {
          text: storyToUse || 'No story provided',
          image: imageUrl || undefined,
        },
        status: 'pending',
        createdAt: serverTimestamp(),
        ...(paymentOrderId && { orderId: paymentOrderId }),
        ...(paymentId && { paymentId }),
      };

      await addDoc(collection(firestore, 'nominations'), nominationData);

      setIsNominationOpen(false);
      setNominationStory('');
      setNominationImage(null);
      setNominationImagePreview(null);
      
      toast({
        title: 'Nomination Submitted!',
        description: 'Your nomination has been sent for approval. You will be notified once it\'s reviewed.'
      });
    } catch (error: any) {
      console.error('Error submitting nomination:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit nomination. Please try again.'
      });
    }
  }, [currentUser, firestore, storage, contest.id, nominationStory, nominationImage, toast]);

  // Handle pending nomination submission after payment
  useEffect(() => {
    if (!currentUser || !firestore) return;
    
    const pendingSubmit = localStorage.getItem('pending_nomination_submit');
    if (pendingSubmit) {
      try {
        const { contestId, orderId, paymentId, story, imageFile } = JSON.parse(pendingSubmit);
        if (contestId === contest.id) {
          // Submit the nomination
          submitNomination(orderId, paymentId, story, imageFile).then(() => {
            localStorage.removeItem('pending_nomination_submit');
          });
        }
      } catch (e) {
        console.error('Error processing pending nomination submit:', e);
      }
    }
  }, [currentUser, firestore, contest.id, submitNomination]);

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

  const handleNominate = async () => {
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to participate in contests.'
      });
      return;
    }

    // If there's a nomination fee, redirect to payment
    if (contest.nominationFee > 0) {
      try {
        // Get Firebase Auth token
        const { getAuth } = await import('firebase/auth');
        const { initializeFirebase } = await import('@/firebase');
        const auth = initializeFirebase().auth;
        let authToken: string | null = null;
        
        if (auth.currentUser) {
          authToken = await auth.currentUser.getIdToken();
        }

        // Create payment order
        const { processCashfreePayment } = await import('@/lib/payments');
        const paymentResponse = await processCashfreePayment(
          contest.nominationFee,
          'INR',
          `Contest Nomination Fee - ${contest.title}`,
          currentUser.uid,
          {
            name: currentUser.displayName || 'User',
            email: currentUser.email || '',
            phone: '9999999999',
          },
          {
            type: 'contest_nomination',
            contestId: contest.id,
            contestTitle: contest.title,
          },
          authToken || undefined
        );

        // Store pending nomination in localStorage with story data
        if (typeof window !== 'undefined') {
          localStorage.setItem('pending_contest_nomination', JSON.stringify({
            orderId: paymentResponse.orderId,
            paymentId: paymentResponse.paymentId,
            contestId: contest.id,
            story: nominationStory,
            imageFile: nominationImage ? await fileToBase64(nominationImage) : null,
          }));
        }

        // Redirect to payment URL if available
        if (paymentResponse.paymentUrl) {
          window.location.href = paymentResponse.paymentUrl;
          return;
        }

        // If payment session ID is available, use Cashfree Checkout.js
        if (paymentResponse.paymentSessionId) {
          // Load Cashfree SDK and redirect
          const script = document.createElement('script');
          script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
          script.async = true;
          script.onload = () => {
            const isProduction = process.env.NODE_ENV === 'production' || 
                                window.location.hostname !== 'localhost';
            const cashfree = new (window as any).Cashfree({ 
              mode: isProduction ? 'production' : 'sandbox' 
            });
            cashfree.checkout({
              paymentSessionId: paymentResponse.paymentSessionId,
              redirectTarget: '_self',
            });
          };
          document.body.appendChild(script);
          return;
        }

        toast({
          variant: 'destructive',
          title: 'Payment Error',
          description: 'Payment URL not available. Please try again.'
        });
      } catch (error: any) {
        console.error('Error initiating payment:', error);
        // Extract more detailed error message
        let errorMessage = 'Failed to initiate payment. Please try again.';
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = error.error;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        toast({
          variant: 'destructive',
          title: 'Payment Error',
          description: errorMessage
        });
      }
      return;
    }

    // If no fee, submit the nomination directly
    await submitNomination();
  }

  const filteredNominees = nominees
    .filter((n) => n.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.votes - a.votes);

  return (
    <>
      {showCongratulations && (
        <NominationCongratulations 
          contest={contest} 
          onClose={() => setShowCongratulations(false)}
        />
      )}
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
              {contest.nominationFee > 0 && (
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Entry Fee</p>
                    <p className="text-muted-foreground">₹{contest.nominationFee}</p>
                  </div>
                </div>
              )}
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
                                <Textarea 
                                  id="story" 
                                  placeholder="Tell us why you should win..." 
                                  rows={5}
                                  value={nominationStory}
                                  onChange={(e) => setNominationStory(e.target.value)}
                                />
                            </div>
                             <div>
                                <Label htmlFor="image-upload">Upload a supporting image</Label>
                                <Input 
                                  id="image-upload" 
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setNominationImage(file);
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setNominationImagePreview(reader.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                                {nominationImagePreview && (
                                  <div className="mt-2 relative w-full h-48 rounded-lg overflow-hidden">
                                    <Image
                                      src={nominationImagePreview}
                                      alt="Preview"
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                            </div>
                            {contest.nominationFee > 0 && (
                                <div className="rounded-lg border bg-secondary/50 p-3 text-center">
                                    <p>An entry fee of <strong>₹{contest.nominationFee}</strong> will be applicable upon submission.</p>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => {
                              setIsNominationOpen(false);
                              setNominationStory('');
                              setNominationImage(null);
                              setNominationImagePreview(null);
                            }}>Cancel</Button>
                            <Button onClick={handleNominate} disabled={!nominationStory.trim()}>Submit Entry</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
               </div>
            </CardContent>
          </Card>
          
          {/* Contest Rules and Eligibility */}
          {(contest.rules || contest.eligibility || contest.ageRange || contest.education || contest.maxNominees || contest.nominationEndDate) && (
            <Card>
              <CardHeader>
                <CardTitle>Rules & Eligibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {contest.rules && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">Rules</p>
                      <p className="text-muted-foreground whitespace-pre-wrap">{contest.rules}</p>
                    </div>
                  </div>
                )}
                {contest.eligibility && (
                  <div className="flex items-start gap-3">
                    <UserCheck className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">Eligibility</p>
                      <p className="text-muted-foreground whitespace-pre-wrap">{contest.eligibility}</p>
                    </div>
                  </div>
                )}
                {contest.ageRange && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Age Range</p>
                      <p className="text-muted-foreground">{contest.ageRange}</p>
                    </div>
                  </div>
                )}
                {contest.education && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Education</p>
                      <p className="text-muted-foreground">{contest.education}</p>
                    </div>
                  </div>
                )}
                {contest.maxNominees && (
                  <div className="flex items-center gap-3">
                    <Users2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Max Nominees</p>
                      <p className="text-muted-foreground">
                        {contest.maxNominees === 'Unlimited' ? 'Unlimited' : contest.maxNominees}
                      </p>
                    </div>
                  </div>
                )}
                {contest.nominationEndDate && (
                  <div className="flex items-center gap-3">
                    <CalendarClock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Nomination Deadline</p>
                      <p className="text-muted-foreground">{contest.nominationEndDate}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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
    </>
  );
}
