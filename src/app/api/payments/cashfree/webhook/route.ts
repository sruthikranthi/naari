/**
 * Cashfree Payment Gateway - Webhook Handler
 * This endpoint handles webhook notifications from Cashfree
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseServer } from '@/firebase/server';
import admin from 'firebase-admin';

const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';

/**
 * Verify webhook signature (if Cashfree provides signature verification)
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  // Implement signature verification if Cashfree provides it
  // For now, we'll trust the webhook (in production, always verify)
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-cashfree-signature') || '';

    // Verify webhook signature (implement based on Cashfree documentation)
    const payload = JSON.stringify(body);
    if (!verifyWebhookSignature(payload, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const { orderId, orderAmount, orderStatus, paymentDetails } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }

    const { firestore } = initializeFirebaseServer();

    // Find payment by orderId using Admin SDK
    const snapshot = await firestore.collection('payments')
      .where('orderId', '==', orderId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.error('Payment not found for orderId:', orderId);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const paymentDoc = snapshot.docs[0];
    const paymentData = paymentDoc.data();

    // Map Cashfree order status to our payment status
    let paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' = 'pending';
    if (orderStatus === 'PAID') {
      paymentStatus = 'completed';
    } else if (orderStatus === 'ACTIVE' || orderStatus === 'PENDING') {
      paymentStatus = 'pending';
    } else if (orderStatus === 'EXPIRED' || orderStatus === 'CANCELLED') {
      paymentStatus = 'failed';
    }

    // Update payment status using Admin SDK
    await firestore.collection('payments').doc(paymentDoc.id).update({
      status: paymentStatus,
      transactionId: paymentDetails?.cf_payment_id || paymentData?.transactionId || null,
      updatedAt: admin.firestore.Timestamp.now(),
      metadata: {
        ...paymentData?.metadata,
        cashfree_order_status: orderStatus,
        cashfree_payment_details: paymentDetails,
        webhook_received_at: new Date().toISOString(),
      },
    });

    // Log webhook event using Admin SDK
    await firestore.collection('payment_webhooks').add({
      orderId,
      orderStatus,
      paymentStatus,
      payload: body,
      receivedAt: admin.firestore.Timestamp.now(),
    });

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('Error processing Cashfree webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification)
export async function GET() {
  return NextResponse.json({ message: 'Cashfree webhook endpoint is active' });
}

