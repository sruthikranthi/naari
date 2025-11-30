/**
 * Cashfree Payment Gateway - Create Order API Route
 * This endpoint creates a payment order in Cashfree
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
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
      return NextResponse.json(
        { error: 'Missing required fields: amount, userId, customerDetails' },
        { status: 400 }
      );
    }

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Cashfree credentials not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY environment variables.' },
        { status: 500 }
      );
    }

    // Create payment record in Firestore first
    const { firestore } = initializeFirebase();
    const paymentsRef = collection(firestore, 'payments');
    
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const paymentDoc = await addDoc(paymentsRef, {
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
    const cashfreeResponse = await fetch(`${CASHFREE_BASE_URL}/orders`, {
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
      const errorData = await cashfreeResponse.json();
      console.error('Cashfree API Error:', errorData);
      
      // Update payment status to failed
      await updateDoc(doc(firestore, 'payments', paymentDoc.id), {
        status: 'failed',
        updatedAt: serverTimestamp(),
        metadata: { error: errorData.message || 'Failed to create order' },
      });

      return NextResponse.json(
        { error: 'Failed to create Cashfree order', details: errorData },
        { status: cashfreeResponse.status }
      );
    }

    const cashfreeData = await cashfreeResponse.json();

    // Update payment record with Cashfree order details
    await updateDoc(doc(firestore, 'payments', paymentDoc.id), {
      orderId: cashfreeData.order_id || orderId,
      metadata: {
        ...metadata,
        cashfree_order_id: cashfreeData.order_id,
        payment_session_id: cashfreeData.payment_session_id,
      },
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      paymentId: paymentDoc.id,
      orderId: cashfreeData.order_id || orderId,
      paymentSessionId: cashfreeData.payment_session_id,
      orderToken: cashfreeData.order_token,
      paymentUrl: cashfreeData.payment_link || null,
    });
  } catch (error: any) {
    console.error('Error creating Cashfree order:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

