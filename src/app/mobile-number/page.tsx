'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
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
import { Loader, Phone, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import type { User } from '@/lib/mock-data';

// Common country codes
const countryCodes = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
];

export default function MobileNumberPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Fetch user profile to check if mobile number already exists
  // Only create doc ref if user exists and we're not redirecting
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user || hasRedirected) {
      return null;
    }
    return doc(firestore, 'users', user.uid);
  }, [firestore, user, hasRedirected]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);
  const redirectingRef = useRef(false);
  const lastCheckedRef = useRef<string | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any pending redirect timeout
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    // Prevent multiple redirects using ref to avoid re-renders
    if (redirectingRef.current || hasRedirected) return;

    // Create a stable key for the current state to prevent rapid re-checks
    const stateKey = `${isUserLoading}-${isProfileLoading}-${user?.uid || 'no-user'}-${userProfile?.mobileNumber || 'no-mobile'}`;
    if (lastCheckedRef.current === stateKey) return;
    lastCheckedRef.current = stateKey;

    // Debounce redirect to prevent rapid re-renders
    redirectTimeoutRef.current = setTimeout(() => {
      // If user is not logged in, redirect to login (only if not already on login page)
      if (!isUserLoading && !user && pathname !== '/login') {
        redirectingRef.current = true;
        setHasRedirected(true);
        // Use replace instead of push to avoid adding to history
        router.replace('/login');
        return;
      }

      // If user profile exists and has mobile number, redirect to dashboard (only if not already there)
      if (!isProfileLoading && userProfile && userProfile.mobileNumber && pathname !== '/dashboard') {
        redirectingRef.current = true;
        setHasRedirected(true);
        // Use replace instead of push to avoid adding to history
        router.replace('/dashboard');
      }
    }, 100); // 100ms debounce

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [user, isUserLoading, userProfile, isProfileLoading, router, hasRedirected, pathname]);

  const validateMobileNumber = (number: string): boolean => {
    // Remove any spaces, dashes, or special characters
    const cleaned = number.replace(/[\s\-\(\)]/g, '');
    
    // Check if it's all digits
    if (!/^\d+$/.test(cleaned)) {
      return false;
    }

    // For India (+91), check for 10 digits
    if (countryCode === '+91') {
      return cleaned.length === 10;
    }

    // For other countries, allow 7-15 digits (international standard)
    return cleaned.length >= 7 && cleaned.length <= 15;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to continue.',
      });
      router.push('/login');
      return;
    }

    // Validate mobile number
    if (!mobileNumber.trim()) {
      setError('Please enter your mobile number');
      return;
    }

    if (!validateMobileNumber(mobileNumber)) {
      if (countryCode === '+91') {
        setError('Please enter a valid 10-digit mobile number');
      } else {
        setError('Please enter a valid mobile number (7-15 digits)');
      }
      return;
    }

    setIsLoading(true);

    try {
      const fullMobileNumber = `${countryCode} ${mobileNumber.replace(/[\s\-\(\)]/g, '')}`;
      
      if (!user || !firestore) {
        throw new Error('User or Firestore not available');
      }

      const userDocRef = doc(firestore, 'users', user.uid);

      // If profile doesn't exist, create it with all required fields
      if (!userProfile) {
        const newProfileData = {
          id: user.uid,
          mobileNumber: fullMobileNumber,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
          followerIds: [],
          followingIds: [],
        };
        // Use setDoc without merge for new documents (uses create rule)
        await setDoc(userDocRef, newProfileData);
      } else {
        // Profile exists - use setDoc with merge to update only mobileNumber
        // The updated Firestore rule allows updates if followerIds is not in the update
        // or if it matches the existing value. Since we're only updating mobileNumber,
        // followerIds won't be in the update, so it will be preserved automatically.
        await setDoc(userDocRef, {
          mobileNumber: fullMobileNumber,
        }, { merge: true });
      }

      toast({
        title: 'Mobile Number Saved!',
        description: 'Welcome to Sakhi Circle!',
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error saving mobile number:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to save mobile number.';
      let errorHint = '';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please make sure you are logged in.';
        errorHint = 'Try logging out and logging back in, or contact support if the issue persists.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service temporarily unavailable.';
        errorHint = 'Please check your internet connection and try again.';
      } else if (error.code === 'deadline-exceeded') {
        errorMessage = 'Request timed out.';
        errorHint = 'Your connection might be slow. Please try again.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error occurred.';
        errorHint = 'Please check your internet connection and try again.';
      } else {
        errorHint = 'Please verify your mobile number is correct and try again.';
      }
      
      setError(errorMessage);
      setErrorDetails(errorHint);
      setRetryCount(prev => prev + 1);
      
      toast({
        variant: 'destructive',
        title: 'Error Saving Mobile Number',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking user - prevent layout shifts
  // Only show loading if we're actually loading, not if we're redirecting
  const isActuallyLoading = (isUserLoading || isProfileLoading) && !hasRedirected;
  
  if (isActuallyLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-rose-950/20 p-4" style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
        <div className="absolute top-8 left-8">
          <Logo />
        </div>
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <Skeleton className="mx-auto mb-4 h-16 w-16 rounded-full" />
            <Skeleton className="mx-auto h-8 w-48 mb-2" />
            <Skeleton className="mx-auto h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="pt-4">
              <Progress value={undefined} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is not logged in or redirecting, don't render (redirect will happen)
  if (!user || hasRedirected) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-rose-950/20 p-4" style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="absolute top-8 left-8">
        <Logo />
      </div>
      <Card className="w-full max-w-md shadow-lg" style={{ position: 'relative', zIndex: 1 }}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30">
            <Phone className="h-8 w-8 text-pink-600 dark:text-pink-400" />
          </div>
          <CardTitle className="text-2xl">Add Your Mobile Number</CardTitle>
          <CardDescription>
            We need your mobile number to keep your account secure and send you important updates.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="country-code">Country Code</Label>
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger id="country-code" className="w-full">
                    <SelectValue placeholder="Select country code" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.country} ({country.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mobile-number">Mobile Number</Label>
                <Input
                  id="mobile-number"
                  type="tel"
                  placeholder={countryCode === '+91' ? '9876543210' : 'Enter mobile number'}
                  value={mobileNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                    setMobileNumber(value);
                    if (error) {
                      setError(null);
                    }
                  }}
                  maxLength={15}
                  required
                />
                {countryCode === '+91' && (
                  <p className="text-xs text-muted-foreground">
                    Enter your 10-digit mobile number
                  </p>
                )}
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{error}</AlertTitle>
                  {errorDetails && (
                    <AlertDescription className="mt-2">
                      {errorDetails}
                      {retryCount > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              setError(null);
                              setErrorDetails(null);
                              const form = document.querySelector('form');
                              if (form) {
                                const event = new Event('submit', { bubbles: true, cancelable: true });
                                form.dispatchEvent(event);
                              }
                            }}
                            disabled={isLoading}
                          >
                            <RefreshCw className="h-3 w-3 mr-2" />
                            Retry ({retryCount})
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  )}
                </Alert>
              )}
              
              {/* Help hint */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <button
                    type="button"
                    onClick={() => setShowHelp(!showHelp)}
                    className="text-primary hover:underline"
                  >
                    Need help with mobile number format?
                  </button>
                  {showHelp && (
                    <div className="mt-2 p-2 bg-muted rounded-md space-y-1">
                      <p>• For India (+91): Enter 10 digits (e.g., 9876543210)</p>
                      <p>• For other countries: Enter 7-15 digits</p>
                      <p>• Don&apos;t include spaces, dashes, or country code</p>
                      <p>• Make sure you have a stable internet connection</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            {isLoading && (
              <div className="w-full">
                <Progress value={undefined} className="h-1" />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Saving your mobile number...
                </p>
              </div>
            )}
            <Button
              className="w-full"
              type="submit"
              disabled={isLoading || !mobileNumber.trim()}
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Continue to Dashboard
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

