'use client';

/**
 * Cashfree Payment Component
 * Handles payment processing via Cashfree gateway
 */

import { useState } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { processCashfreePayment, verifyCashfreePayment, type CashfreeCustomerDetails } from '@/lib/payments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface CashfreePaymentProps {
  amount: number;
  currency?: string;
  description: string;
  onSuccess?: (paymentId: string, orderId: string) => void;
  onError?: (error: string) => void;
  metadata?: Record<string, any>;
}

export function CashfreePayment({
  amount,
  currency = 'INR',
  description,
  onSuccess,
  onError,
  metadata,
}: CashfreePaymentProps) {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [customerDetails, setCustomerDetails] = useState<CashfreeCustomerDetails>({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
  });
  const [paymentData, setPaymentData] = useState<{
    paymentId: string;
    orderId: string;
    paymentUrl: string | null;
  } | null>(null);

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to make a payment',
        variant: 'destructive',
      });
      return;
    }

    if (!customerDetails.name || !customerDetails.email) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required customer details',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      const response = await processCashfreePayment(
        amount,
        currency,
        description,
        user.uid,
        customerDetails,
        metadata
      );

      setPaymentData({
        paymentId: response.paymentId,
        orderId: response.orderId,
        paymentUrl: response.paymentUrl,
      });

      // If payment URL is provided, redirect to Cashfree payment page
      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
        return;
      }

      // If payment session ID is provided, use Cashfree Checkout.js
      if (response.paymentSessionId && response.orderToken) {
        // Load Cashfree Checkout.js script
        await loadCashfreeCheckout(response.paymentSessionId, response.orderToken);
      } else {
        toast({
          title: 'Payment Error',
          description: 'Payment URL not available. Please try again.',
          variant: 'destructive',
        });
        setPaymentStatus('failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
      setPaymentStatus('failed');
      onError?.(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadCashfreeCheckout = async (paymentSessionId: string, orderToken: string) => {
    return new Promise<void>((resolve, reject) => {
      // Check if script is already loaded
      if (window.Cashfree && window.Cashfree.Checkout) {
        initializeCheckout(paymentSessionId, orderToken);
        resolve();
        return;
      }

      // Load Cashfree Checkout.js
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.onload = () => {
        initializeCheckout(paymentSessionId, orderToken);
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Cashfree SDK'));
      };
      document.body.appendChild(script);
    });
  };

  const initializeCheckout = (paymentSessionId: string, orderToken: string) => {
    try {
      const checkout = new (window as any).Cashfree.Checkout({
        paymentSessionId,
        returnUrl: `${window.location.origin}/api/payments/cashfree/return`,
      });

      checkout.redirect();
    } catch (error) {
      console.error('Error initializing Cashfree checkout:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to initialize payment. Please try again.',
        variant: 'destructive',
      });
      setPaymentStatus('failed');
    }
  };

  const handleVerifyPayment = async () => {
    if (!paymentData) return;

    try {
      const result = await verifyCashfreePayment(paymentData.orderId, paymentData.paymentId);
      
      if (result.status === 'completed') {
        setPaymentStatus('success');
        toast({
          title: 'Payment Successful',
          description: 'Payment completed successfully!',
        });
        onSuccess?.(paymentData.paymentId, paymentData.orderId);
        
        // Redirect to success page after a delay
        setTimeout(() => {
          router.push(`/dashboard/payments/status?orderId=${paymentData.orderId}&status=completed`);
        }, 2000);
      } else {
        setPaymentStatus('failed');
        toast({
          title: 'Verification Failed',
          description: 'Payment verification failed',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: 'Verification Error',
        description: error.message || 'Failed to verify payment',
        variant: 'destructive',
      });
    }
  };

  if (paymentStatus === 'success') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Payment Successful
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Your payment has been processed successfully.
          </p>
          {paymentData && (
            <div className="space-y-2 text-sm">
              <p><strong>Order ID:</strong> {paymentData.orderId}</p>
              <p><strong>Payment ID:</strong> {paymentData.paymentId}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Payment Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Your payment could not be processed. Please try again.
          </p>
          <Button onClick={() => setPaymentStatus('idle')} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Cashfree Payment
        </CardTitle>
        <CardDescription>
          Complete your payment securely via Cashfree
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Amount</span>
            <span className="text-lg font-bold">₹{amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Description</span>
            <span className="text-sm text-muted-foreground">{description}</span>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Full Name *</Label>
            <Input
              id="customer-name"
              value={customerDetails.name}
              onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-email">Email *</Label>
            <Input
              id="customer-email"
              type="email"
              value={customerDetails.email}
              onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-phone">Phone Number</Label>
            <Input
              id="customer-phone"
              type="tel"
              value={customerDetails.phone}
              onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !customerDetails.name || !customerDetails.email}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay ₹{amount.toFixed(2)}
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
          <AlertCircle className="h-3 w-3" />
          <span>Your payment is secured by Cashfree. We do not store your payment details.</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Extend Window interface for Cashfree
declare global {
  interface Window {
    Cashfree?: any;
  }
}

