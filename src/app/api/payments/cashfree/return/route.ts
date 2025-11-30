/**
 * Cashfree Payment Gateway - Return/Redirect Handler
 * This endpoint handles the return URL after payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get('order_id');
  const orderStatus = searchParams.get('order_status');
  const paymentId = searchParams.get('payment_id');

  // Redirect to payment status page
  const redirectUrl = new URL('/dashboard/payments/status', request.nextUrl.origin);
  if (orderId) redirectUrl.searchParams.set('orderId', orderId);
  if (orderStatus) redirectUrl.searchParams.set('status', orderStatus);
  if (paymentId) redirectUrl.searchParams.set('paymentId', paymentId);

  redirect(redirectUrl.toString());
}

