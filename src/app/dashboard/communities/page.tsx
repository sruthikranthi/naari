'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Search, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const communitySchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters long.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long.' }),
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
    formState: { errors },
    reset,
  } = useForm<CommunityFormValues>({
    resolver: zodResolver(communitySchema),
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
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Create a New Community</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <div className="col-span-3">
                    <Input id="name" placeholder="e.g., Mumbai Moms" {...register('name')} />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                   <div className="col-span-3">
                    <Textarea
                      id="description"
                      placeholder="What is your community about?"
                      rows={4}
                      {...register('description')}
                    />
                    {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
                  </div>
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
