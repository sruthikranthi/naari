
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [email, setEmail] = useState('admin@sakhi.com');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Check user profile for mobile number
  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);
  const [hasRedirected, setHasRedirected] = useState(false);
  const redirectingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple redirects using ref to avoid re-renders
    if (redirectingRef.current || hasRedirected) return;
    
    if (!isUserLoading && !isProfileLoading && user) {
      redirectingRef.current = true;
      setHasRedirected(true);
      // If user has mobile number, go to dashboard (only if not already there)
      if (userProfile && userProfile.mobileNumber && pathname !== '/dashboard') {
        router.push('/dashboard');
      } else if ((!userProfile || !userProfile.mobileNumber) && pathname !== '/mobile-number') {
        // Otherwise, go to mobile number collection (only if not already there)
        router.push('/mobile-number');
      }
    }
  }, [user, isUserLoading, userProfile, isProfileLoading, router, hasRedirected, pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setEmailNotVerified(false);

    // Validate and sanitize inputs
    const sanitizedEmail = sanitizeText(email);
    const sanitizedPassword = password.trim();

    if (!validationSchemas.email.validate(sanitizedEmail)) {
      setError(validationSchemas.email.message);
      setIsLoading(false);
      return;
    }

    if (sanitizedPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, sanitizedPassword);
      
      // Check email verification
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
        // The useEffect will handle the redirect based on mobile number
      }
    } catch (error: any) {
      let errorMessage = 'Please check your credentials and try again.';
      let errorHint = '';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
        errorHint = 'Please check your email or sign up for a new account.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
        errorHint = 'Make sure Caps Lock is off and check for typos. You can reset your password if needed.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
        errorHint = 'For security, your account has been temporarily locked. Please wait a few minutes or reset your password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
        errorHint = 'Please enter a valid email address (e.g., name@example.com).';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
        errorHint = 'Make sure you have a stable internet connection and try again.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'This sign-in method is not enabled.';
        errorHint = 'Please contact support or try a different sign-in method.';
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
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    
    setIsResendingVerification(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your inbox and click the verification link.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Send Verification Email',
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
      // Add additional scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      const userCredential = await signInWithPopup(auth, provider);
      
      // Verify the user was actually authenticated
      if (!userCredential || !userCredential.user) {
        throw new Error('Authentication failed. No user returned.');
      }
      
      toast({
        title: 'Login Successful!',
        description: 'Welcome to Sakhi Circle!',
      });
      
      // The useEffect will handle the redirect based on mobile number
      // Reset redirect flag to allow redirect after successful login
      setHasRedirected(false);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      let errorMessage = 'Failed to sign in with Google. Please try again.';
      let errorHint = '';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed.';
        errorHint = 'Please try again and complete the sign-in process.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by your browser.';
        errorHint = 'Please allow popups for this site and try again.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in was cancelled.';
        errorHint = 'Please try again.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for Google sign-in.';
        errorHint = 'Please contact support.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google sign-in is not enabled.';
        errorHint = 'Please contact support or use email sign-in.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: errorHint || errorMessage,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-secondary/50 p-4" style={{ willChange: 'auto', minHeight: '100vh' }}>
      <div className="absolute top-8 left-8">
        <Logo />
      </div>
      <Card className="w-full max-w-sm" style={{ willChange: 'auto' }}>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Sakhi Circle</CardTitle>
          <CardDescription>
            Sign in to access your safe space and connect with the community.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Google Sign In Button */}
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
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
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
                    if (error && isValidEmail(sanitized)) {
                      setError(null);
                    }
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
