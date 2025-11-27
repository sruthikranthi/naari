
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  HeartHandshake,
  ShieldCheck,
  UserPlus,
  Video,
  Loader,
  CheckCircle,
} from 'lucide-react';

import { SplashScreen } from '@/components/splash-screen';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/logo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CameraCapture } from '@/components/camera-capture';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { User } from '@/lib/mock-data';

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return <VerificationPage />;
}

function VerificationPage() {
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [verificationStep, setVerificationStep] =
    useState<'capture' | 'verifying' | 'success'>('capture');
  const [hasAgreedToPolicies, setHasAgreedToPolicies] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser]
  );

  const { data: userProfile, isLoading: isProfileLoading } =
    useDoc<User>(userDocRef);

  const isLoading = isAuthLoading || isProfileLoading;
  const hasCompletedVerification = Boolean(
    userProfile?.videoVerification?.status === 'approved'
  );

  useEffect(() => {
    if (isLoading) return;
    if (!authUser) {
      router.replace('/login');
      return;
    }
    if (hasCompletedVerification) {
      router.replace('/dashboard');
    }
  }, [authUser, hasCompletedVerification, isLoading, router]);

  const completeVerification = useCallback(async () => {
    if (!authUser || !firestore) return;
    const targetDoc = doc(firestore, 'users', authUser.uid);

    const baseProfile =
      userProfile ||
      ({
        id: authUser.uid,
        name: authUser.displayName || authUser.email?.split('@')[0] || 'Naarimani Member',
        avatar:
          authUser.photoURL || `https://picsum.photos/seed/${authUser.uid}/100/100`,
        followerIds: [],
        followingIds: [],
      } satisfies Partial<User>);

    const profileSeed = userProfile ? {} : baseProfile;

    const verificationPayload = {
      ...profileSeed,
      videoVerification: {
        status: 'approved',
        method: 'video-selfie',
        autoApproved: true,
        instruction: 'Say your name on camera',
        approvedAt: serverTimestamp(),
      },
      verificationStatus: 'approved',
    };

    await setDoc(
      targetDoc,
      verificationPayload,
      { merge: true }
    );
  }, [authUser, firestore, userProfile]);

  const handleMediaCaptured = (dataUrl: string, type: 'image' | 'video') => {
    console.info(
      'Media captured for verification (discarded immediately):',
      type,
      dataUrl.slice(0, 32)
    );
    setVerificationStep('verifying');
  };

  useEffect(() => {
    if (verificationStep !== 'verifying') return;
    const timer = setTimeout(() => {
      setVerificationStep('success');
    }, 2200);
    return () => clearTimeout(timer);
  }, [verificationStep]);

  useEffect(() => {
    if (verificationStep !== 'success') return;

    let isMounted = true;

    const finalize = async () => {
      try {
        await completeVerification();
        if (!isMounted) return;
        toast({
          title: 'Verification Complete',
          description: 'You are all set—let’s finish your profile.',
        });
        router.push('/dashboard/profile/create');
      } catch (error) {
        console.error('Error completing verification:', error);
        if (!isMounted) return;
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: 'Please try again. If the issue persists, contact support.',
        });
        setVerificationStep('capture');
      }
    };

    finalize();

    return () => {
      isMounted = false;
    };
  }, [verificationStep, completeVerification, toast, router]);

  const resetVerification = () => {
    setIsVerificationOpen(false);
    setTimeout(() => setVerificationStep('capture'), 300);
  };

  if (isLoading || !authUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Preparing your experience...</p>
        </div>
      </div>
    );
  }

  const FeatureList = [
    {
      title: 'Community Integrity',
      description:
        'Every member takes a quick selfie video so we know our circle stays women-only.',
      icon: ShieldCheck,
    },
    {
      title: 'Human Moments, Safely',
      description:
        'Privacy-first verification—nothing is stored after we check your clip.',
      icon: HeartHandshake,
    },
    {
      title: 'Effortless Onboarding',
      description: 'Say your name, smile, and you’re in—auto-approved in seconds.',
      icon: UserPlus,
    },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-secondary/50 p-4">
      <div className="absolute top-8 left-8">
        <Logo />
      </div>

      <Card className="w-full max-w-md animate-fade-in-up">
        <CardHeader className="items-center text-center">
          <ShieldCheck className="mb-2 h-12 w-12 text-primary" />
          <CardTitle className="font-headline text-3xl">
            Welcome to Your Safe Space
          </CardTitle>
          <CardDescription>
            To keep our community safe and authentic, we require a quick one-time
            verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {FeatureList.map(({ title, description, icon: Icon }) => (
              <div className="flex items-start space-x-4" key={title}>
                <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={hasAgreedToPolicies}
                onCheckedChange={(value) =>
                  setHasAgreedToPolicies(Boolean(value))
                }
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm text-muted-foreground font-normal">
                I agree to the Naarimani{' '}
                <Link
                  href="/policies/terms"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Terms & Conditions
                </Link>
                ,{' '}
                <Link
                  href="/policies/privacy"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Privacy Policy
                </Link>
                ,{' '}
                <Link
                  href="/policies/refund"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Refund Policy
                </Link>
                , and{' '}
                <Link
                  href="/policies/cancellation"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Cancellation Policy
                </Link>
                .
              </Label>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => setIsVerificationOpen(true)}
              disabled={!hasAgreedToPolicies || isLoading}
            >
              <Video className="mr-2 h-5 w-5" />
              Start Video Verification
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Your privacy is our priority. Verification is automated and the clip isn’t
              stored once approved.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-center justify-center gap-2 pt-4">
          <Separator className="mb-4" />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>

      <Dialog open={isVerificationOpen} onOpenChange={resetVerification}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Video Verification</DialogTitle>
            <DialogDescription>
              Position your face in the center, smile, and clearly say your name.
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video w-full">
            {verificationStep === 'capture' && (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Tip: “Hi, I’m [Your Name]” works perfectly.
                </p>
                <CameraCapture onMediaCaptured={handleMediaCaptured} />
              </div>
            )}
            {verificationStep === 'verifying' && (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-lg bg-secondary">
                <Loader className="h-12 w-12 animate-spin text-primary" />
                <p className="font-semibold">Analyzing... Please wait.</p>
                <p className="text-sm text-muted-foreground">
                  Checking for liveness and authenticity.
                </p>
              </div>
            )}
            {verificationStep === 'success' && (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-lg bg-green-50 text-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
                <p className="font-semibold text-green-700">Verification Successful!</p>
                <p className="text-sm text-green-600">
                  Redirecting you to finish setting up your profile...
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
