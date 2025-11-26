
'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  Award,
  Trophy,
  Plus,
  Users,
  IndianRupee,
  MessageSquare,
  Share2,
  Heart,
  Loader,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

import { PageHeader } from '@/components/page-header';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useState, useMemo } from 'react';
import { useDashboard } from '../layout';
import type { Post } from '@/lib/mock-data';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Contest } from '@/lib/contests-data';
import { Skeleton } from '@/components/ui/skeleton';

const contestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(10, 'Description is required.'),
  prize: z.string().min(3, 'Prize details are required.'),
  category: z.string().nonempty('Please select a category.'),
  nominationFee: z.coerce.number().min(0, "Fee can't be negative.").optional(),
});

type ContestFormValues = z.infer<typeof contestSchema>;

export default function ContestsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { addPost } = useDashboard();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const contestsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'contests') : null),
    [firestore, user]
  );
  const { data: contests, isLoading: areContestsLoading } = useCollection<Contest>(contestsQuery);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<ContestFormValues>({
    resolver: zodResolver(contestSchema),
  });
  
  const handleCreateContest = async (data: ContestFormValues) => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not Authenticated',
            description: 'You must be logged in to propose a contest.',
        });
        return;
    }
    
    const newContest = {
      title: data.title,
      description: data.description,
      prize: data.prize,
      category: data.category,
      nominationFee: data.nominationFee || 0,
      endsIn: '30 days',
      image: `https://picsum.photos/seed/contest${Date.now()}/800/600`,
      status: 'Pending Approval',
      nominees: [],
      jury: [],
      createdAt: serverTimestamp(),
      likes: 0,
      commentCount: 0,
    };

    try {
        await addDoc(collection(firestore, 'contests'), newContest);
        toast({
          title: 'Contest Submitted for Review!',
          description: `Your contest "${data.title}" will be live after admin approval.`,
        });
        reset();
        setIsDialogOpen(false);
    } catch (e) {
        console.error("Error creating contest:", e);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not submit your contest proposal. Please try again.',
        });
    }
  };
  
  const handleShareContest = (contestTitle: string) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Please log in to share.' });
        return;
    }
    const newPost: Post = {
        id: `post-${Date.now()}`,
        author: {
          id: user.uid,
          name: user.displayName || 'A Sakhi',
          avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
        },
        content: `Check out the "${contestTitle}" contest! So many inspiring women to support. #SakhiContests`,
        timestamp: serverTimestamp(),
        likes: 0,
        comments: 0,
        isAnonymous: false,
    };
    addPost(newPost);
    toast({
      title: 'Contest Shared!',
      description: `A post about "${contestTitle}" has been added to your feed.`,
    });
  }

  const { featuredContests, communityContests } = useMemo(() => {
    if (!contests) return { featuredContests: [], communityContests: [] };
    const featured = contests.filter(c => ['Annual Award', 'Business Award', 'Community Award'].includes(c.category));
    const community = contests.filter(c => !['Annual Award', 'Business Award', 'Community Award'].includes(c.category));
    return { featuredContests: featured, communityContests: community };
  }, [contests]);

  const isLoading = isUserLoading || areContestsLoading;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Contests & Awards"
        description="Celebrate achievements and showcase your talents in the community."
      />

      <div className="flex items-center justify-between">
        <h2 className="font-headline text-2xl font-bold">Featured Awards</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Propose a Contest
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit(handleCreateContest)}>
              <DialogHeader>
                <DialogTitle>Propose a New Community Contest</DialogTitle>
                <DialogDescription>
                  Fill in the details to propose a new contest. All submissions are subject to admin review.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="title">Contest Title</Label>
                  <Input id="title" {...register('title')} />
                  {errors.title && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register('description')} />
                  {errors.description && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prize">Prize Details</Label>
                    <Input
                      id="prize"
                      placeholder="e.g., ₹500 Voucher"
                      {...register('prize')}
                    />
                    {errors.prize && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.prize.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cooking">Cooking</SelectItem>
                            <SelectItem value="art">Art & Craft</SelectItem>
                            <SelectItem value="writing">Writing</SelectItem>
                            <SelectItem value="photography">
                              Photography
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                     {errors.category && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.category.message}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="nominationFee">Nomination Fee (₹) (Optional)</Label>
                  <Input
                    id="nominationFee"
                    type="number"
                    placeholder="e.g. 50 or leave blank for free"
                    {...register('nominationFee')}
                  />
                  {errors.nominationFee && <p className="text-destructive text-xs mt-1">{errors.nominationFee.message}</p>}
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Submit for Review</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {isLoading ? (
            [...Array(3)].map((_,i) => <Skeleton key={i} className="w-full h-[500px]" />)
        ) : (
            featuredContests.map((contest) => (
                <Card
                key={contest.id}
                className="flex flex-col overflow-hidden transition-all hover:shadow-lg"
                >
                <CardHeader className="p-0">
                    <div className="relative aspect-video w-full">
                    <Image
                        src={contest.image}
                        alt={contest.title}
                        fill
                        className="object-cover"
                        data-ai-hint="award ceremony"
                    />
                    <Badge className="absolute top-3 left-3">{contest.category}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col p-4">
                    <CardTitle className="font-headline text-xl">
                    {contest.title}
                    </CardTitle>
                    <CardDescription className="mt-2 flex-grow">
                    {contest.description}
                    </CardDescription>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                        <p className="font-bold">{contest.prize}</p>
                        <p className="text-xs text-muted-foreground">Prize</p>
                    </div>
                    <div>
                        <p className="font-bold">{contest.endsIn}</p>
                        <p className="text-xs text-muted-foreground">Ends In</p>
                    </div>
                    <div>
                        <p className="font-bold">
                        {contest.nominees.length.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                        Nominees
                        </p>
                    </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-2 p-4 pt-0">
                    <Button asChild className="w-full">
                    <Link href={`/dashboard/contests/${contest.id}`}>
                        <Trophy className="mr-2 h-4 w-4" />
                        View Contest & Nominees
                    </Link>
                    </Button>
                    <div className="flex justify-around">
                        <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground">
                            <Heart className="mr-2 h-4 w-4" /> {contest.likes || 0}
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground">
                            <MessageSquare className="mr-2 h-4 w-4" /> {contest.commentCount || 0}
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground" onClick={() => handleShareContest(contest.title)}>
                            <Share2 className="mr-2 h-4 w-4" /> Share
                        </Button>
                    </div>
                </CardFooter>
                </Card>
            ))
        )}
      </div>

      <Separator />

      <div>
        <h2 className="font-headline text-2xl font-bold mb-4">Ongoing Community Contests</h2>
         {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_,i) => <Skeleton key={i} className="w-full h-48" />)}
             </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communityContests.map(contest => (
                    <Card key={contest.id}>
                        <CardHeader>
                            <CardTitle className="text-lg">{contest.title}</CardTitle>
                            <CardDescription>{contest.category}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-between items-center text-sm">
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5 text-muted-foreground"><Award className="h-4 w-4" /> {contest.prize}</p>
                                <p className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4" /> {contest.nominees.length.toLocaleString()} nominees</p>
                                <p className="flex items-center gap-1.5 text-muted-foreground"><IndianRupee className="h-4 w-4" /> {contest.nominationFee > 0 ? `${contest.nominationFee} entry fee` : 'Free entry'}</p>
                            </div>
                            <Button asChild>
                                <Link href={`/dashboard/contests/${contest.id}`}>View</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
         )}
      </div>
    </div>
  );
}
