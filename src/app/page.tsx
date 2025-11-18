import Link from 'next/link';
import {
  HeartHandshake,
  ShieldCheck,
  UserPlus,
  Video,
} from 'lucide-react';

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

export default function VerificationPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="absolute top-8 left-8">
        <Logo />
      </div>
      <Card className="w-full max-w-md animate-fade-in-up">
        <CardHeader className="items-center text-center">
          <CardTitle className="font-headline text-3xl">
            Join Sakhi Circle
          </CardTitle>
          <CardDescription>
            India's safe and supportive space for women.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Create Your Account</h3>
              <p className="text-sm text-muted-foreground">
                Start by setting up your profile with basic details.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Verify Your Identity</h3>
              <p className="text-sm text-muted-foreground">
                Our #1 priority is safety. A quick verification ensures our
                community is for women only.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Join the Circle</h3>
              <p className="text-sm text-muted-foreground">
                Connect with thousands of women, join communities, and grow.
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              asChild
            >
              <Link href="/dashboard">
                <Video />
                Verify with Video Selfie
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Verify with Aadhaar (Optional)
              </Link>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/dashboard"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
