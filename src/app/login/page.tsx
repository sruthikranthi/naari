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
  createUserWithEmailAndPassword,
} from 'firebase/auth';
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
import { Logo } from '@/components/logo';
import { Loader } from 'lucide-react';
import { sanitizeText, isValidEmail, validationSchemas } from '@/lib/validation';
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
  const [isSignUp, setIsSignUp] = useState(false);

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
  const handleAuth = useCallback(
    async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
        if (isSignUp) {
          // Sign up flow
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            sanitizedEmail,
            sanitizedPassword
          );
          
          // Create user profile in Firestore
          if (firestore && userCredential.user) {
            const userDocRef = doc(firestore, 'users', userCredential.user.uid);
            await setDoc(userDocRef, {
              id: userCredential.user.uid,
              name: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User',
              avatar: userCredential.user.photoURL || `https://picsum.photos/seed/${userCredential.user.uid}/100/100`,
              email: userCredential.user.email,
              followerIds: [],
              followingIds: [],
            });
          }

          toast({
            title: 'Account Created!',
            description: 'Welcome to Naarimani! Redirecting...',
          });
        } else {
          // Sign in flow
          await signInWithEmailAndPassword(
            auth,
            sanitizedEmail,
            sanitizedPassword
          );
      
          toast({
            title: 'Login Successful!',
            description: 'Redirecting...',
          });
        }
        // Redirect is handled by effect when profile is ready
        redirectedRef.current = false; // allow redirect once profile loads
      } catch (err: any) {
      let errorMessage = isSignUp 
        ? 'Failed to create account. Please try again.' 
        : 'Please check your credentials and try again.';
        let errorHint = '';

        switch (err.code) {
          case 'auth/user-not-found':
        errorMessage = 'No account found with this email address.';
            errorHint = 'Please check your email or sign up for a new account.';
            break;
          case 'auth/wrong-password':
        errorMessage = 'Incorrect password. Please try again.';
            break;
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered.';
            errorHint = 'Please sign in instead or use a different email.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak.';
            errorHint = 'Please use a stronger password (at least 6 characters).';
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
        title: isSignUp ? 'Sign Up Failed' : 'Login Failed',
          description: errorHint || errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
    },
    [auth, email, password, toast, isSignUp, firestore]
  );

  // ---------- UI ----------
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-secondary/50 p-4">
      <div className="absolute top-8 left-8">
        <Logo />
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Naarimani</CardTitle>
          <CardDescription>
            {isSignUp 
              ? 'Create an account to join your safe space and connect with the community.'
              : 'Sign in to access your safe space and connect with the community.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          <form onSubmit={handleAuth}>
            <div className="grid gap-4">
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

            <Button className="w-full mt-4" type="submit" disabled={isLoading}>
              {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-primary hover:underline"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
