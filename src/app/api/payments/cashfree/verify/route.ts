/**
 * Cashfree Payment Gateway - Verify Payment API Route
 * This endpoint verifies a payment status with Cashfree
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseServer } from '@/firebase/server';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';
const isProduction = process.env.NODE_ENV === 'production';
const CASHFREE_BASE_URL = isProduction 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId } = body;

    if (!orderId && !paymentId) {
      return NextResponse.json(
        { error: 'Either orderId or paymentId is required' },
        { status: 400 }
      );
    }

    const { firestore } = initializeFirebaseServer();

    // Get payment record
    let paymentDoc;
    if (paymentId) {
      paymentDoc = await getDoc(doc(firestore, 'payments', paymentId));
    } else {
      // Find by orderId
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const paymentsRef = collection(firestore, 'payments');
      const q = query(paymentsRef, where('orderId', '==', orderId));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }
      paymentDoc = snapshot.docs[0];
    }

    if (!paymentDoc || !paymentDoc.exists()) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const paymentData = paymentDoc.data();
    const cfOrderId = paymentData.orderId || orderId;

    // Verify payment with Cashfree
    const verifyResponse = await fetch(`${CASHFREE_BASE_URL}/orders/${cfOrderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2022-09-01',
      },
    });

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      return NextResponse.json(
        { error: 'Failed to verify payment', details: errorData },
        { status: verifyResponse.status }
      );
    }

    const verifyData = await verifyResponse.json();
    const paymentStatus = verifyData.order_status === 'PAID' ? 'completed' : 
                         verifyData.order_status === 'ACTIVE' ? 'pending' : 'failed';

    // Update payment status in Firestore
    const paymentRef = doc(firestore, 'payments', paymentDoc.id);
    await updateDoc(paymentRef, {
      status: paymentStatus,
      transactionId: verifyData.payment_details?.cf_payment_id || null,
      updatedAt: serverTimestamp(),
      metadata: {
        ...paymentData.metadata,
        cashfree_order_status: verifyData.order_status,
        cashfree_payment_details: verifyData.payment_details,
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: paymentDoc.id,
      orderId: cfOrderId,
      status: paymentStatus,
      orderStatus: verifyData.order_status,
      paymentDetails: verifyData.payment_details,
    });
  } catch (error: any) {
    console.error('Error verifying Cashfree payment:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

