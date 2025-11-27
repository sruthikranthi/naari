'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  useAuth,
  useUser,
  useFirestore,
  useDoc,
  useMemoFirebase,
} from '@/firebase';
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc } from 'firebase/firestore';
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
import { Logo } from '@/components/logo';
import { Loader, Mail } from 'lucide-react';
import { sanitizeText, isValidEmail, validationSchemas } from '@/lib/validation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import type { User } from '@/lib/mock-data';

export default function LoginPage() {
  // ---------- Core services ----------
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // ---------- State & refs (DECLARED BEFORE hooks that use them) ----------
  const [email, setEmail] = useState('admin@sakhi.com');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Prevents multiple navigations (uses ref so effect doesn't re-run redirect)
  const redirectedRef = useRef(false);

  // ---------- Firestore doc + profile (memoized) ----------
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  // ---------- Derived flags ----------
  const isAuthReady = !isUserLoading && Boolean(user);
  const isProfileReady = !isProfileLoading;

  // ---------- Redirect effect (single source of truth) ----------
  useEffect(() => {
    // Only run when auth/profile are ready, and haven't redirected yet
    if (redirectedRef.current) return;
    if (!isAuthReady || !isProfileReady) return;

    // If user is missing (logged out) -> noop
    if (!user) return;

    // mark redirected to prevent duplicate navigations
    redirectedRef.current = true;

    // Route decision
    const hasMobile = Boolean(userProfile?.mobileNumber);
    if (hasMobile && pathname !== '/dashboard') {
      router.replace('/dashboard');
    } else if (!hasMobile && pathname !== '/mobile-number') {
      router.replace('/mobile-number');
    }
  }, [isAuthReady, isProfileReady, user, userProfile, router, pathname]);

  // ---------- Handlers ----------
  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setEmailNotVerified(false);

      const sanitizedEmail = sanitizeText(email);
      const sanitizedPassword = password.trim();

      if (!validationSchemas.email.validate(sanitizedEmail)) {
        setError(validationSchemas.email.message);
        return;
      }
      if (sanitizedPassword.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      setIsLoading(true);
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          sanitizedEmail,
          sanitizedPassword
        );

        if (!userCredential.user.emailVerified) {
          setEmailNotVerified(true);
          toast({
            variant: 'destructive',
            title: 'Email Not Verified',
            description: 'Please verify your email address before accessing the dashboard.',
          });
        } else {
          toast({
            title: 'Login Successful!',
            description: 'Redirecting...',
          });
          // Redirect is handled by effect when profile is ready
          redirectedRef.current = false; // allow redirect once profile loads
        }
      } catch (err: any) {
        let errorMessage = 'Please check your credentials and try again.';
        let errorHint = '';

        switch (err.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address.';
            errorHint = 'Please check your email or sign up for a new account.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please try again.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Try again later.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Check your connection.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'This sign-in method is not enabled.';
            break;
          default:
            if (err.message) errorMessage = err.message;
        }

        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: errorHint || errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [auth, email, password, toast]
  );

  const handleResendVerification = useCallback(async () => {
    if (!auth.currentUser) return;
    setIsResendingVerification(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your inbox and click the verification link.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Send Verification Email',
        description: err?.message || 'Please try again later.',
      });
    } finally {
      setIsResendingVerification(false);
    }
  }, [auth, toast]);

  useEffect(() => {
    if (!auth) return;
    let isMounted = true;

    getRedirectResult(auth)
      .then((result) => {
        if (!isMounted || !result?.user) return;

        toast({
          title: 'Login Successful!',
          description: 'Welcome to Sakhi Circle!',
        });

        redirectedRef.current = false;
      })
      .catch((err: any) => {
        console.error('Google redirect sign-in error:', err);
        if (!isMounted) return;
        const message = err?.message || 'Failed to complete Google sign-in redirect.';
        setError(message);
        toast({
          variant: 'destructive',
          title: 'Google Sign-In Failed',
          description: message,
        });
      });

    return () => {
      isMounted = false;
    };
  }, [auth, toast]);

  const handleGoogleSignIn = useCallback(async () => {
    if (!auth) {
      setError('Authentication service is not available. Please refresh the page.');
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Authentication service is not available. Please refresh the page.',
      });
      return;
    }

    setIsGoogleLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      const userCredential = await signInWithPopup(auth, provider);
      if (!userCredential || !userCredential.user) {
        throw new Error('Authentication failed. No user returned.');
      }

      toast({
        title: 'Login Successful!',
        description: 'Welcome to Sakhi Circle!',
      });

      // allow redirect after profile loads
      redirectedRef.current = false;
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      let message = 'Failed to sign in with Google. Please try again.';
      let handled = false;
      if (err.code === 'auth/internal-error') {
        try {
          const provider = new GoogleAuthProvider();
          provider.addScope('profile');
          provider.addScope('email');
          await signInWithRedirect(auth, provider);
          handled = true;
        } catch (redirectErr: any) {
          console.error('Google redirect fallback error:', redirectErr);
          message = redirectErr?.message || message;
        }
      }
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in popup was closed.';
      } else if (err.code === 'auth/popup-blocked') {
        message = 'Popup was blocked by your browser.';
      } else if (!handled && err.message) {
        message = err.message;
      }
      if (!handled) {
        setError(message);
        toast({
          variant: 'destructive',
          title: 'Google Sign-In Failed',
          description: message,
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }, [auth, toast]);

  // ---------- UI ----------
  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center bg-secondary/50 p-4"
      style={{ willChange: 'auto', minHeight: '100vh' }}
    >
      <div className="absolute top-8 left-8">
        <Logo />
      </div>

      <Card className="w-full max-w-sm" style={{ willChange: 'auto' }}>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Sakhi Circle</CardTitle>
          <CardDescription>Sign in to access your safe space and connect with the community.</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
          >
            {isGoogleLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                {/* Google icon */}
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              {emailNotVerified && (
                <Alert variant="destructive">
                  <Mail className="h-4 w-4" />
                  <AlertTitle>Email Verification Required</AlertTitle>
                  <AlertDescription className="mt-2">
                    Your email address has not been verified. Please check your inbox and click the verification link.
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={handleResendVerification}
                      disabled={isResendingVerification}
                    >
                      {isResendingVerification ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Resend Verification Email'
                      )}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => {
                    const sanitized = sanitizeText(e.target.value);
                    setEmail(sanitized);
                    if (error && isValidEmail(sanitized)) setError(null);
                  }}
                  onBlur={(e) => {
                    const sanitized = sanitizeText(e.target.value);
                    if (!isValidEmail(sanitized) && sanitized.length > 0) {
                      setError(validationSchemas.email.message);
                    }
                  }}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <Button className="w-full mt-4" type="submit" disabled={isLoading || isGoogleLoading}>
              {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Sign In with Email
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
