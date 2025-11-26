'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, Phone, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

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

interface EditMobileNumberDialogProps {
  currentMobileNumber: string;
  userDocRef: DocumentReference | null;
  onSuccess: () => void;
}

export function EditMobileNumberDialog({
  currentMobileNumber,
  userDocRef,
  onSuccess,
}: EditMobileNumberDialogProps) {
  const { toast } = useToast();
  
  // Parse current mobile number to extract country code and number
  const parseMobileNumber = (mobile: string) => {
    const match = mobile.match(/^(\+\d+)\s(.+)$/);
    if (match) {
      return { countryCode: match[1], number: match[2] };
    }
    // Default to India if can't parse
    return { countryCode: '+91', number: mobile.replace(/\D/g, '') };
  };

  const parsed = parseMobileNumber(currentMobileNumber);
  const [countryCode, setCountryCode] = useState(parsed.countryCode);
  const [mobileNumber, setMobileNumber] = useState(parsed.number);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  const validateMobileNumber = (number: string): boolean => {
    const cleaned = number.replace(/[\s\-\(\)]/g, '');
    
    if (!/^\d+$/.test(cleaned)) {
      return false;
    }

    if (countryCode === '+91') {
      return cleaned.length === 10;
    }

    return cleaned.length >= 7 && cleaned.length <= 15;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorDetails(null);

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

    if (!userDocRef) {
      setError('User document not found');
      return;
    }

    setIsLoading(true);

    try {
      const fullMobileNumber = `${countryCode} ${mobileNumber.replace(/[\s\-\(\)]/g, '')}`;
      
      await setDoc(userDocRef, {
        mobileNumber: fullMobileNumber,
      }, { merge: true });

      toast({
        title: 'Mobile Number Updated!',
        description: 'Your mobile number has been successfully updated.',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating mobile number:', error);
      
      let errorMessage = 'Failed to update mobile number.';
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="edit-country-code">Country Code</Label>
          <Select value={countryCode} onValueChange={setCountryCode}>
            <SelectTrigger id="edit-country-code">
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
          <Label htmlFor="edit-mobile-number">Mobile Number</Label>
          <Input
            id="edit-mobile-number"
            type="tel"
            placeholder={countryCode === '+91' ? '9876543210' : 'Enter mobile number'}
            value={mobileNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setMobileNumber(value);
              if (error) {
                setError(null);
                setErrorDetails(null);
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
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSubmit}
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
              </div>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="space-y-2">
            <Progress value={undefined} className="h-1" />
            <p className="text-xs text-muted-foreground text-center">
              Updating your mobile number...
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
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
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

