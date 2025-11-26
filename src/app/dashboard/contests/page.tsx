
'use client';
import { useState } from 'react';
import Image from 'next/image';
import {
  Award,
  Trophy,
  Plus,
  Heart,
  MessageCircle,
  Share2,
  Check,
  IndianRupee,
  Users,
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
import { useDashboard } from '@/app/dashboard/layout';
import { users } from '@/lib/mock-data';

const featuredContests = [
  {
    id: 'c1',
    title: 'NAARIMANI of the Year',
    category: 'Annual Award',
    description:
      'Celebrating the most inspirational and impactful woman in our community. Nominate someone who has made a significant difference.',
    prize: '₹1,00,000 + Trophy',
    endsIn: '45 days',
    participants: 1250,
    image: 'https://picsum.photos/seed/naarimani/800/600',
    action: 'Nominate',
  },
  {
    id: 'c2',
    title: 'Woman Entrepreneur of The Year',
    category: 'Business Award',
    description:
      'Recognizing the most innovative and successful woman-led business on our platform. Showcase your venture and win big!',
    prize: '₹50,000 Grant',
    endsIn: '60 days',
    participants: 480,
    image: 'https://picsum.photos/seed/entrepreneur/800/600',
    action: 'Participate',
  },
  {
    id: 'c3',
    title: 'Parashakthi Award for Bravery',
    category: 'Community Award',
    description:
      'Honoring extraordinary courage and resilience. Share a story of a woman who has overcome immense challenges with grace.',
    prize: 'Trophy + Feature',
    endsIn: '30 days',
    participants: 970,
    image: 'https://picsum.photos/seed/bravery/800/600',
    action: 'Nominate',
  },
];

const communityContests = [
  {
    id: 'cc1',
    title: 'Best Home Chef',
    category: 'Cooking Contest',
    prize: 'Gift Hamper',
    participants: 120,
  },
  {
    id: 'cc2',
    title: 'DIY Craft Challenge',
    category: 'Creative Contest',
    prize: 'Voucher',
    participants: 85,
  },
  {
    id: 'cc3',
    title: 'Photography Contest: Monsoon',
    category: 'Art Contest',
    prize: 'Feature',
    participants: 210,
  },
];

const contestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(10, 'Description is required.'),
  prize: z.string().min(3, 'Prize details are required.'),
  category: z.string().nonempty('Please select a category.'),
});

type ContestFormValues = z.infer<typeof contestSchema>;

export default function ContestsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [nominatedContests, setNominatedContests] = useState<string[]>([]);
  const { addPost } = useDashboard();
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<ContestFormValues>({
    resolver: zodResolver(contestSchema),
  });
  
  const handleNominate = (contestId: string, contestTitle: string) => {
    if (nominatedContests.includes(contestId)) return;
    setNominatedContests([...nominatedContests, contestId]);
    toast({
      title: 'Nomination Submitted!',
      description: `Your submission for "${contestTitle}" is in. Now spread the word to gather support!`,
    });
  };

  const handleShare = (contestTitle: string, action: string) => {
    const postContent = action === 'Nominate' 
        ? `I've just nominated ${users[1].name} for the "${contestTitle}" award! Show your support by liking and commenting. #SakhiAwards #${contestTitle.replace(/ /g, '')}`
        : `I'm excited to participate in the "${contestTitle}" contest! Wish me luck! #SakhiContest #${contestTitle.replace(/ /g, '')}`;

    addPost({
        id: `post-${Date.now()}`,
        author: users[0],
        content: postContent,
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
        isAnonymous: false,
    });
    
    toast({
      title: 'Shared to Feed!',
      description: `A post about your participation has been added to the main dashboard.`,
    });
  };

  const handleCreateContest = (data: ContestFormValues) => {
    console.log('New Contest Data:', data);
    toast({
      title: 'Contest Submitted for Review!',
      description: `Your contest "${data.title}" will be live after admin approval.`,
    });
    reset();
    setIsDialogOpen(false);
  };

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
        {featuredContests.map((contest) => {
          const isNominated = nominatedContests.includes(contest.id);
          return (
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
                      {contest.participants.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Participants
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 p-4 pt-0">
                 <Button
                  className="w-full"
                  onClick={() => handleNominate(contest.id, contest.title)}
                  disabled={isNominated}
                  variant={isNominated ? 'secondary' : 'default'}
                >
                  {isNominated ? <Check className="mr-2 h-4 w-4" /> : <Trophy className="mr-2 h-4 w-4" />}
                  {isNominated ? 'Submitted' : contest.action}
                </Button>
                <div className="w-full grid grid-cols-3 gap-2">
                    <Button variant="ghost" className="w-full text-muted-foreground"><Heart className="mr-2 h-4 w-4" />Like</Button>
                    <Button variant="ghost" className="w-full text-muted-foreground"><MessageCircle className="mr-2 h-4 w-4" />Comment</Button>
                    <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => handleShare(contest.title, contest.action)}><Share2 className="mr-2 h-4 w-4" />Share</Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Separator />

      <div>
        <h2 className="font-headline text-2xl font-bold mb-4">Ongoing Community Contests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communityContests.map(contest => (
                <Card key={contest.id}>
                    <CardHeader>
                        <CardTitle className="text-lg">{contest.title}</CardTitle>
                        <CardDescription>{contest.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center text-sm">
                        <div className="space-y-1">
                            <p className="flex items-center gap-1.5 text-muted-foreground"><IndianRupee className="h-4 w-4" /> {contest.prize}</p>
                            <p className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4" /> {contest.participants.toLocaleString()} participants</p>
                        </div>
                        <Button>View Details</Button>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
