
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';

export default function CreateProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [interests, setInterests] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in' });
      return;
    }
    setIsLoading(true);

    const userProfile = {
      id: user.uid,
      name,
      city,
      interests: interests.split(',').map(i => i.trim()).filter(Boolean),
      avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
      followerIds: [],
      followingIds: [],
    };

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, userProfile, { merge: true });
      toast({
        title: 'Profile Created!',
        description: 'Welcome to Naarimani!',
      });
      router.push('/dashboard/profile');
    } catch (error) {
      console.error('Error creating profile: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not create your profile. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex h-full min-h-screen w-full items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-secondary/50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Let&apos;s get you set up so you can start connecting with others.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateProfile}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Priya Sharma"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">Your City</Label>
              <Input
                id="city"
                type="text"
                placeholder="e.g., Mumbai"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="interests">Your Interests</Label>
              <Input
                id="interests"
                type="text"
                placeholder="e.g., Cooking, Yoga, Reading (comma-separated)"
                required
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
            </div>
          </CardContent>
          <div className="p-6 pt-0">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Save & Continue
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

    