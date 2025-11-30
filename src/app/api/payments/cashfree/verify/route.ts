/**
 * Cashfree Payment Gateway - Verify Payment API Route
 * This endpoint verifies a payment status with Cashfree
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseServer } from '@/firebase/server';
import admin from 'firebase-admin';

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

    console.log('🔍 Verifying payment:', { orderId, paymentId });

    if (!orderId && !paymentId) {
      return NextResponse.json(
        { error: 'Either orderId or paymentId is required' },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin SDK
    let firestore;
    try {
      const firebaseInit = initializeFirebaseServer();
      firestore = firebaseInit.firestore;
      
      if (!firestore) {
        throw new Error('Firestore instance is null. Firebase Admin SDK may not be properly initialized.');
      }
    } catch (firebaseError: any) {
      console.error('❌ Firebase Admin SDK initialization error:', {
        message: firebaseError.message,
        stack: firebaseError.stack,
      });
      return NextResponse.json(
        { error: 'Failed to initialize Firebase', message: firebaseError.message },
        { status: 500 }
      );
    }

    // Get payment record using Admin SDK
    let paymentDoc: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>;
    let paymentData: admin.firestore.DocumentData | undefined;
    
    if (paymentId) {
      paymentDoc = await firestore.collection('payments').doc(paymentId).get();
      if (!paymentDoc.exists) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }
      paymentData = paymentDoc.data();
    } else {
      if (!orderId) {
        return NextResponse.json(
          { error: 'orderId is required when paymentId is not provided' },
          { status: 400 }
        );
      }
      // Find by orderId
      const snapshot = await firestore.collection('payments')
        .where('orderId', '==', orderId)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }
      paymentDoc = snapshot.docs[0];
      paymentData = paymentDoc.data();
    }

    // TypeScript guard: ensure paymentData is not undefined
    if (!paymentData) {
      return NextResponse.json(
        { error: 'Payment data not found' },
        { status: 404 }
      );
    }

    // Now TypeScript knows paymentData is defined
    const cfOrderId = (paymentData.orderId as string) || orderId || '';

    if (!cfOrderId) {
      console.error('❌ No order ID found:', { orderId, paymentId, paymentDataOrderId: paymentData.orderId });
      return NextResponse.json(
        { error: 'Order ID not found in payment record' },
        { status: 400 }
      );
    }

    console.log('📞 Calling Cashfree API to verify order:', {
      url: `${CASHFREE_BASE_URL}/orders/${cfOrderId}`,
      environment: isProduction ? 'PRODUCTION' : 'SANDBOX',
      hasAppId: !!CASHFREE_APP_ID,
      hasSecretKey: !!CASHFREE_SECRET_KEY,
    });

    // Verify payment with Cashfree
    let verifyResponse;
    try {
      verifyResponse = await fetch(`${CASHFREE_BASE_URL}/orders/${cfOrderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': '2022-09-01',
        },
      });
    } catch (fetchError: any) {
      console.error('❌ Cashfree API fetch error:', {
        message: fetchError.message,
        stack: fetchError.stack,
        orderId: cfOrderId,
      });
      return NextResponse.json(
        { error: 'Failed to connect to Cashfree', message: fetchError.message },
        { status: 500 }
      );
    }

    if (!verifyResponse.ok) {
      let errorData;
      try {
        errorData = await verifyResponse.json();
      } catch (e) {
        errorData = { message: `HTTP ${verifyResponse.status}: ${verifyResponse.statusText}` };
      }
      console.error('❌ Cashfree API error:', {
        status: verifyResponse.status,
        errorData,
        orderId: cfOrderId,
      });
      return NextResponse.json(
        { error: 'Failed to verify payment', details: errorData },
        { status: verifyResponse.status }
      );
    }

    let verifyData;
    try {
      verifyData = await verifyResponse.json();
      console.log('✅ Cashfree verification response:', {
        order_status: verifyData.order_status,
        payment_details: verifyData.payment_details,
      });
    } catch (parseError: any) {
      console.error('❌ Failed to parse Cashfree response:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from Cashfree', message: parseError.message },
        { status: 500 }
      );
    }

    const paymentStatus = verifyData.order_status === 'PAID' ? 'completed' : 
                         verifyData.order_status === 'ACTIVE' ? 'pending' : 'failed';

    // Update payment status in Firestore using Admin SDK
    try {
      await firestore.collection('payments').doc(paymentDoc.id).update({
        status: paymentStatus,
        transactionId: verifyData.payment_details?.cf_payment_id || null,
        updatedAt: admin.firestore.Timestamp.now(),
        metadata: {
          ...paymentData?.metadata,
          cashfree_order_status: verifyData.order_status,
          cashfree_payment_details: verifyData.payment_details,
        },
      });
      console.log('✅ Payment status updated in Firestore:', { paymentId: paymentDoc.id, status: paymentStatus });
    } catch (updateError: any) {
      console.error('❌ Failed to update payment status:', {
        message: updateError.message,
        stack: updateError.stack,
        paymentId: paymentDoc.id,
      });
      // Continue even if update fails, return the verification result
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentDoc.id,
      orderId: cfOrderId,
      status: paymentStatus,
      orderStatus: verifyData.order_status,
      paymentDetails: verifyData.payment_details,
    });
  } catch (error: any) {
    console.error('❌ Error verifying Cashfree payment:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

