'use client';

/**
 * Payments Page
 * Main page for initiating payments
 */

import { useUser } from '@/firebase/provider';
import { CashfreePayment } from '@/components/cashfree-payment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { verifyCashfreePayment } from '@/lib/payments';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PaymentsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const orderId = searchParams.get('orderId');
  const status = searchParams.get('status');

  const verifyPaymentStatus = useCallback(async () => {
    if (!orderId) return;

    setVerificationStatus('verifying');
    try {
      const result = await verifyCashfreePayment(orderId);
      setPaymentDetails(result);
      setVerificationStatus(result.status === 'completed' ? 'success' : 'failed');
      
      if (result.status === 'completed') {
        toast({
          title: 'Payment Verified',
          description: 'Payment verified successfully!',
        });
      } else {
        toast({
          title: 'Verification Failed',
          description: 'Payment verification failed',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setVerificationStatus('failed');
      toast({
        title: 'Verification Error',
        description: error.message || 'Failed to verify payment',
        variant: 'destructive',
      });
    }
  }, [orderId, toast]);

  useEffect(() => {
    if (orderId && status) {
      verifyPaymentStatus();
    }
  }, [orderId, status, verifyPaymentStatus]);

  if (verificationStatus === 'verifying') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verifying payment status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'success' && paymentDetails) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Payment Successful
            </CardTitle>
            <CardDescription>
              Your payment has been processed and verified successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Order ID:</span>
                <span className="text-sm font-medium">{paymentDetails.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Payment ID:</span>
                <span className="text-sm font-medium">{paymentDetails.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm font-medium text-green-500">{paymentDetails.status}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'failed') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Payment Verification Failed
            </CardTitle>
            <CardDescription>
              We couldn&apos;t verify your payment. Please contact support if you&apos;ve already paid.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payments</h1>
        <p className="text-muted-foreground">
          Make secure payments using Cashfree payment gateway
        </p>
      </div>

      <Tabs defaultValue="new-payment" className="space-y-4">
        <TabsList>
          <TabsTrigger value="new-payment">New Payment</TabsTrigger>
          <TabsTrigger value="payment-history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="new-payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Payment</CardTitle>
              <CardDescription>
                Enter payment details and proceed with Cashfree
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CashfreePayment
                amount={100} // Default amount, can be made dynamic
                currency="INR"
                description="Payment for Naarimani services"
                onSuccess={(paymentId, orderId) => {
                  console.log('Payment successful:', { paymentId, orderId });
                }}
                onError={(error) => {
                  console.error('Payment error:', error);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                View your past transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Payment history will be displayed here. This feature is coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

