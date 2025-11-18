
'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Search, Plus } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { communities as allCommunities } from '@/lib/mock-data';
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

export default function CommunitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCommunities = allCommunities.filter((community) =>
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
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Community
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create a New Community</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" placeholder="e.g., Mumbai Moms" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="What is your community about?"
                  className="col-span-3"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="submit">Create Community</Button>
              </DialogClose>
            </DialogFooter>
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
