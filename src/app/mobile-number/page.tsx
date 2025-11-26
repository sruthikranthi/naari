'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Loader, Phone } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const { toast } = useToast();
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile to check if mobile number already exists
  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!isUserLoading && !user) {
      router.push('/login');
      return;
    }

    // If user profile exists and has mobile number, redirect to dashboard
    if (!isProfileLoading && userProfile && userProfile.mobileNumber) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, userProfile, isProfileLoading, router]);

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
      const errorMessage = error.message || 'Failed to save mobile number. Please try again.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking user
  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-secondary/50 p-4">
        <div className="absolute top-8 left-8">
          <Logo />
        </div>
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is not logged in, don't render (redirect will happen)
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-rose-950/20 p-4">
      <div className="absolute top-8 left-8">
        <Logo />
      </div>
      <Card className="w-full max-w-md shadow-lg">
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
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
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

