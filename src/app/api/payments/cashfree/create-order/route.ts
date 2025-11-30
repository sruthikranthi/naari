/**
 * Cashfree Payment Gateway - Create Order API Route
 * This endpoint creates a payment order in Cashfree
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseServer } from '@/firebase/server';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

// Initialize Cashfree SDK (you'll need to install: npm install cashfree-pg)
// For now, we'll use direct API calls
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';
const CASHFREE_API_URL = process.env.CASHFREE_API_URL || 'https://api.cashfree.com/pg';

// Determine environment (sandbox or production)
const isProduction = process.env.NODE_ENV === 'production';
const CASHFREE_BASE_URL = isProduction 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', userId, description, customerDetails, metadata } = body;

    // Validate required fields
    if (!amount || !userId || !customerDetails) {
      console.error('Missing required fields:', { amount: !!amount, userId: !!userId, customerDetails: !!customerDetails });
      return NextResponse.json(
        { error: 'Missing required fields: amount, userId, customerDetails' },
        { status: 400 }
      );
    }

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      console.error('Cashfree credentials missing:', { 
        hasAppId: !!CASHFREE_APP_ID, 
        hasSecretKey: !!CASHFREE_SECRET_KEY 
      });
      return NextResponse.json(
        { error: 'Cashfree credentials not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY environment variables.' },
        { status: 500 }
      );
    }

    // Create payment record in Firestore first
    let firestore;
    let paymentDoc;
    let orderId;
    try {
      const firebaseInit = initializeFirebaseServer();
      firestore = firebaseInit.firestore;
      const paymentsRef = collection(firestore, 'payments');
      
      orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      paymentDoc = await addDoc(paymentsRef, {
        userId,
        orderId,
        amount: parseFloat(amount),
        currency,
        status: 'pending',
        paymentMethod: 'cashfree',
        description: description || 'Payment via Cashfree',
        metadata: metadata || {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (firestoreError: any) {
      console.error('Firestore error:', firestoreError);
      return NextResponse.json(
        { error: 'Failed to create payment record', message: firestoreError.message },
        { status: 500 }
      );
    }

    // Create order in Cashfree
    const cashfreeOrderData = {
      order_id: orderId,
      order_amount: parseFloat(amount),
      order_currency: currency,
      order_note: description || 'Payment via Cashfree',
      customer_details: {
        customer_id: userId,
        customer_name: customerDetails.name || 'Customer',
        customer_email: customerDetails.email || '',
        customer_phone: customerDetails.phone || '',
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/cashfree/return?order_id={order_id}`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/cashfree/webhook`,
        payment_methods: 'cc,dc,upi,wallet,netbanking', // All payment methods
      },
    };

    // Call Cashfree API to create order
    let cashfreeResponse;
    try {
      console.log('Calling Cashfree API:', { url: `${CASHFREE_BASE_URL}/orders`, orderId: cashfreeOrderData.order_id });
      cashfreeResponse = await fetch(`${CASHFREE_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': '2022-09-01',
        },
        body: JSON.stringify(cashfreeOrderData),
      });

      if (!cashfreeResponse.ok) {
        let errorData;
        try {
          errorData = await cashfreeResponse.json();
        } catch (e) {
          errorData = { message: `HTTP ${cashfreeResponse.status}: ${cashfreeResponse.statusText}` };
        }
        console.error('Cashfree API Error:', errorData);
        
        // Update payment status to failed
        if (paymentDoc && firestore) {
          try {
            await updateDoc(doc(firestore, 'payments', paymentDoc.id), {
              status: 'failed',
              updatedAt: serverTimestamp(),
              metadata: { error: errorData.message || 'Failed to create order' },
            });
          } catch (updateError) {
            console.error('Failed to update payment status:', updateError);
          }
        }

        return NextResponse.json(
          { error: 'Failed to create Cashfree order', details: errorData },
          { status: cashfreeResponse.status }
        );
      }
    } catch (fetchError: any) {
      console.error('Cashfree API fetch error:', fetchError);
      if (paymentDoc && firestore) {
        try {
          await updateDoc(doc(firestore, 'payments', paymentDoc.id), {
            status: 'failed',
            updatedAt: serverTimestamp(),
            metadata: { error: fetchError.message || 'Network error' },
          });
        } catch (updateError) {
          console.error('Failed to update payment status:', updateError);
        }
      }
      return NextResponse.json(
        { error: 'Failed to connect to Cashfree', message: fetchError.message },
        { status: 500 }
      );
    }

    let cashfreeData;
    try {
      cashfreeData = await cashfreeResponse.json();
    } catch (parseError: any) {
      console.error('Failed to parse Cashfree response:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from Cashfree', message: parseError.message },
        { status: 500 }
      );
    }

    // Update payment record with Cashfree order details
    try {
      await updateDoc(doc(firestore, 'payments', paymentDoc.id), {
        orderId: cashfreeData.order_id || cashfreeOrderData.order_id,
        metadata: {
          ...metadata,
          cashfree_order_id: cashfreeData.order_id,
          payment_session_id: cashfreeData.payment_session_id,
        },
        updatedAt: serverTimestamp(),
      });
    } catch (updateError: any) {
      console.error('Failed to update payment with Cashfree data:', updateError);
      // Continue even if update fails, as payment is created
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentDoc.id,
      orderId: cashfreeData.order_id || cashfreeOrderData.order_id,
      paymentSessionId: cashfreeData.payment_session_id,
      orderToken: cashfreeData.order_token,
      paymentUrl: cashfreeData.payment_link || null,
    });
  } catch (error: any) {
    console.error('Unexpected error creating Cashfree order:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

