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
            To keep our community safe and authentic, we require a quick
            one-time verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold">Create Your Account</h3>
                <p className="text-sm text-muted-foreground">
                  Start by setting up your profile with basic details.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold">Quick Video Verification</h3>
                <p className="text-sm text-muted-foreground">
                  A short, private video selfie confirms your identity and
                  ensures our circle is for women only.
                </p>
              </div>
            </div>
             <div className="flex items-start space-x-4">
              <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold">Join the Circle</h3>
                <p className="text-sm text-muted-foreground">
                  Once verified, unlock access to a supportive community of thousands of women.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Button
              className="w-full"
              asChild
              size="lg"
            >
              <Link href="/dashboard">
                <Video className="mr-2 h-5 w-5" />
                Start Video Verification
              </Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Your privacy is our priority. Verification is automated and data is not stored.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-center justify-center gap-2 pt-4">
           <Separator className="mb-4" />
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
