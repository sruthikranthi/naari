'use client';

/**
 * Payment Status Page
 * Displays payment status after redirect from Cashfree
 */

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase/provider';
import { verifyCashfreePayment } from '@/lib/payments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const orderId = searchParams.get('orderId');
  const orderStatus = searchParams.get('status');
  const paymentId = searchParams.get('paymentId');

  useEffect(() => {
    if (orderId || paymentId) {
      verifyPayment();
    } else {
      setStatus('failed');
    }
  }, [orderId, paymentId]);

  const verifyPayment = async () => {
    try {
      const result = await verifyCashfreePayment(orderId || undefined, paymentId || undefined);
      setPaymentDetails(result);
      
      if (result.status === 'completed') {
        setStatus('success');
        toast({
          title: 'Payment Successful',
          description: 'Payment completed successfully!',
        });
      } else if (result.status === 'pending') {
        setStatus('pending');
      } else {
        setStatus('failed');
        toast({
          title: 'Verification Failed',
          description: 'Payment verification failed',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setStatus('failed');
      toast({
        title: 'Verification Error',
        description: error.message || 'Failed to verify payment',
        variant: 'destructive',
      });
    }
  };

  if (status === 'loading') {
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

  if (status === 'success') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Payment Successful
            </CardTitle>
            <CardDescription>
              Your payment has been processed successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentDetails && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
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
                  <span className="text-sm font-medium text-green-500 capitalize">{paymentDetails.status}</span>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/payments">View Payment History</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Payment Pending
            </CardTitle>
            <CardDescription>
              Your payment is being processed. Please wait a moment and refresh.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentDetails && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Order ID:</span>
                  <span className="text-sm font-medium">{paymentDetails.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="text-sm font-medium text-yellow-500 capitalize">{paymentDetails.status}</span>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={verifyPayment}>Refresh Status</Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Payment Failed
          </CardTitle>
          <CardDescription>
            Your payment could not be processed. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentDetails && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Order ID:</span>
                <span className="text-sm font-medium">{paymentDetails.orderId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm font-medium text-red-500 capitalize">{paymentDetails.status || 'Failed'}</span>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard/payments">Try Again</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

