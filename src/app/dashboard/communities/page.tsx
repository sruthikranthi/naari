'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Search, Plus, Lock, Globe } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { communities as initialCommunities, type Community } from '@/lib/mock-data';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const communitySchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters long.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long.' }),
  objective: z.string().min(10, { message: 'Objective must be at least 10 characters long.' }),
  category: z.string().nonempty({ message: 'Please select a category.' }),
  isPrivate: z.boolean().default(false),
});

type CommunityFormValues = z.infer<typeof communitySchema>;

export default function CommunitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [communities, setCommunities] = useState(initialCommunities);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<CommunityFormValues>({
    resolver: zodResolver(communitySchema),
    defaultValues: {
        name: '',
        description: '',
        objective: '',
        category: '',
        isPrivate: false,
    }
  });

  const onSubmit = (data: CommunityFormValues) => {
    const newCommunity: Community = {
      id: `comm${communities.length + 1}`,
      name: data.name,
      description: data.description,
      memberCount: 1,
      image: `https://picsum.photos/seed/newComm${communities.length + 1}/400/300`,
      bannerImage: `https://picsum.photos/seed/newCommBanner${communities.length + 1}/1200/400`,
    };
    setCommunities([newCommunity, ...communities]);
    toast({
      title: 'Community Created!',
      description: `Your new community "${data.name}" has been created.`,
    });
    reset();
    setIsDialogOpen(false);
  };

  const filteredCommunities = communities.filter((community) =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Find Your Circle"
        description="Join communities based on your interests, life-stage, or city."
      />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search communities..."
            className="w-full rounded-lg bg-background pl-8 md:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Community
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Create a New Community</DialogTitle>
                <DialogDescription>
                    Fill in the details below to start your own circle.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="name">Community Name</Label>
                  <Input id="name" placeholder="e.g., Mumbai Moms, Bangalore Bakers" {...register('name')} />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                </div>
                
                <div>
                  <Label htmlFor="description">Short Description</Label>
                  <Textarea
                    id="description"
                    placeholder="A brief, catchy description for your community."
                    rows={2}
                    {...register('description')}
                  />
                  {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
                </div>

                <div>
                  <Label htmlFor="objective">Objective</Label>
                  <Textarea
                    id="objective"
                    placeholder="What is the main goal or purpose of this community?"
                    rows={3}
                    {...register('objective')}
                  />
                  {errors.objective && <p className="mt-1 text-xs text-destructive">{errors.objective.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="category">Category</Label>
                        <Controller
                            name="category"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hobbies">Hobbies & Interests</SelectItem>
                                    <SelectItem value="professional">Professional Networking</SelectItem>
                                    <SelectItem value="parenting">Parenting Support</SelectItem>
                                    <SelectItem value="local">Local & City-based</SelectItem>
                                    <SelectItem value="wellness">Health & Wellness</SelectItem>
                                </SelectContent>
                                </Select>
                            )}
                        />
                         {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>}
                    </div>
                     <div>
                        <Label htmlFor="banner-image">Banner Image</Label>
                        <Input id="banner-image" type="file" accept="image/*" />
                        <p className="mt-1 text-xs text-muted-foreground">For demonstration only.</p>
                    </div>
                </div>

                <div>
                    <Label>Privacy</Label>
                    <Controller
                        name="isPrivate"
                        control={control}
                        render={({ field }) => (
                            <RadioGroup
                                onValueChange={(value) => field.onChange(value === 'private')}
                                defaultValue={field.value ? 'private' : 'public'}
                                className="mt-2 grid grid-cols-2 gap-4"
                            >
                                <div>
                                    <Label htmlFor="public" className="flex items-center gap-4 rounded-md border p-3 cursor-pointer hover:bg-accent has-[[data-state=checked]]:border-primary">
                                         <Globe className="h-5 w-5 text-primary" />
                                         <div>
                                            <p className="font-semibold">Public</p>
                                            <p className="text-xs text-muted-foreground">Anyone can find and join.</p>
                                         </div>
                                        <RadioGroupItem value="public" id="public" className="ml-auto" />
                                    </Label>
                                </div>
                                <div>
                                    <Label htmlFor="private" className="flex items-center gap-4 rounded-md border p-3 cursor-pointer hover:bg-accent has-[[data-state=checked]]:border-primary">
                                        <Lock className="h-5 w-5 text-primary" />
                                         <div>
                                            <p className="font-semibold">Private</p>
                                            <p className="text-xs text-muted-foreground">Only invited members can join.</p>
                                         </div>
                                        <RadioGroupItem value="private" id="private" className="ml-auto"/>
                                    </Label>
                                </div>
                            </RadioGroup>
                        )}
                    />
                </div>

              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" type="button">Cancel</Button>
                </DialogClose>
                <Button type="submit">Create Community</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCommunities.map((community) => (
          <Card key={community.id} className="flex flex-col overflow-hidden">
            <CardHeader className="p-0">
              <div className="relative aspect-video w-full">
                <Image
                  src={community.image}
                  alt={community.name}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  data-ai-hint="community people"
                />
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col p-4">
              <CardTitle className="mb-2 font-headline text-xl">
                {community.name}
              </CardTitle>
              <CardDescription className="flex-grow">
                {community.description}
              </CardDescription>
            </CardContent>
            <CardFooter className="flex justify-between p-4 pt-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-1.5 h-4 w-4" />
                {community.memberCount.toLocaleString()} members
              </div>
              <Button asChild size="sm">
                <Link href={`/dashboard/communities/${community.id}`}>
                  View
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {filteredCommunities.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          <h3 className="text-lg font-semibold">No communities found</h3>
          <p>Try adjusting your search or create a new community!</p>
        </div>
      )}
    </div>
  );
}
