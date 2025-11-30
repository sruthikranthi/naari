'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';

export default function JoinKittyGroupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'joining' | 'success' | 'error' | 'already-member'>('loading');
  const [groupName, setGroupName] = useState<string>('');

  const groupId = searchParams.get('groupId');

  useEffect(() => {
    const joinGroup = async () => {
      if (!groupId || !user || !firestore) {
        setStatus('error');
        return;
      }

      try {
        // Check if group exists
        const groupRef = doc(firestore, 'kitty_groups', groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
          toast({
            title: 'Group Not Found',
            description: 'This kitty group does not exist or has been deleted.',
            variant: 'destructive',
          });
          setStatus('error');
          return;
        }

        const groupData = groupSnap.data();
        setGroupName(groupData.name || 'Kitty Group');

        // Check if user is already a member
        if (groupData.memberIds && groupData.memberIds.includes(user.uid)) {
          setStatus('already-member');
          return;
        }

        // Add user to group
        setStatus('joining');
        await updateDoc(groupRef, {
          memberIds: arrayUnion(user.uid),
        });

        setStatus('success');
        toast({
          title: 'Successfully Joined!',
          description: `You have joined "${groupData.name}".`,
        });

        // Redirect to group page after 2 seconds
        setTimeout(() => {
          router.push(`/dashboard/kitty-groups/${groupId}`);
        }, 2000);
      } catch (error: any) {
        console.error('Error joining group:', error);
        toast({
          title: 'Error Joining Group',
          description: error.message || 'Failed to join the group. Please try again.',
          variant: 'destructive',
        });
        setStatus('error');
      }
    };

    if (groupId && user && firestore) {
      joinGroup();
    } else if (!user) {
      // User not logged in, redirect to login
      router.push('/login?redirect=/dashboard/kitty-groups/join?groupId=' + groupId);
    }
  }, [groupId, user, firestore, toast, router]);

  if (status === 'loading' || status === 'joining') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              {status === 'loading' ? 'Loading group...' : 'Joining group...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Successfully Joined!
            </CardTitle>
            <CardDescription>
              You have been added to &quot;{groupName}&quot;
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Redirecting you to the group page...
            </p>
            <Button asChild>
              <Link href={`/dashboard/kitty-groups/${groupId}`}>Go to Group</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'already-member') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Already a Member
            </CardTitle>
            <CardDescription>
              You are already a member of &quot;{groupName}&quot;
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild>
              <Link href={`/dashboard/kitty-groups/${groupId}`}>Go to Group</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/kitty-groups">Back to Kitty Groups</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Unable to Join
          </CardTitle>
          <CardDescription>
            There was an error joining the group.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild>
            <Link href="/dashboard/kitty-groups">Back to Kitty Groups</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

