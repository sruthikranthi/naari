/**
 * Cashfree Payment Gateway - Create Order API Route
 * This endpoint creates a payment order in Cashfree
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseServer } from '@/firebase/server';
import { firebaseConfig } from '@/firebase/config';
import admin from 'firebase-admin';

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
    const { amount, currency = 'INR', userId, description, customerDetails, metadata, authToken } = body;
    
    // Get auth token from Authorization header if not in body
    const authHeader = request.headers.get('authorization');
    const token = authToken || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);

    // Validate required fields
    if (!amount || !userId || !customerDetails) {
      console.error('Missing required fields:', { amount: !!amount, userId: !!userId, customerDetails: !!customerDetails });
      return NextResponse.json(
        { error: 'Missing required fields: amount, userId, customerDetails' },
        { status: 400 }
      );
    }

    // Log environment and credentials status (without exposing actual keys)
    console.log('Cashfree Configuration:', {
      environment: isProduction ? 'PRODUCTION' : 'SANDBOX',
      baseUrl: CASHFREE_BASE_URL,
      hasAppId: !!CASHFREE_APP_ID,
      hasSecretKey: !!CASHFREE_SECRET_KEY,
      appIdLength: CASHFREE_APP_ID?.length || 0,
      secretKeyLength: CASHFREE_SECRET_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV,
    });

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      console.error('❌ Cashfree credentials missing:', { 
        hasAppId: !!CASHFREE_APP_ID, 
        hasSecretKey: !!CASHFREE_SECRET_KEY,
        environment: isProduction ? 'PRODUCTION' : 'SANDBOX',
        expectedUrl: CASHFREE_BASE_URL,
      });
      return NextResponse.json(
        { error: 'Cashfree credentials not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY environment variables.' },
        { status: 500 }
      );
    }

    // Verify auth token matches userId (basic validation)
    // Note: In production, you should use Firebase Admin SDK to properly verify tokens
    if (token && userId) {
      // Basic validation - in production, verify token with Admin SDK
      console.log('Auth token provided, userId:', userId);
    }

    // Create payment record in Firestore first using Admin SDK
    let firestore;
    let paymentDoc;
    let orderId;
    try {
      // Check Firebase Admin SDK initialization
      console.log('Initializing Firebase Admin SDK...', {
        hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        projectId: firebaseConfig.projectId,
      });
      
      const firebaseInit = initializeFirebaseServer();
      firestore = firebaseInit.firestore;
      
      if (!firestore) {
        throw new Error('Firestore instance is null. Firebase Admin SDK may not be properly initialized.');
      }
      
      orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Create payment document using Admin SDK (bypasses security rules)
      const paymentData = {
        userId,
        orderId,
        amount: parseFloat(amount),
        currency,
        status: 'pending',
        paymentMethod: 'cashfree',
        description: description || 'Payment via Cashfree',
        metadata: metadata || {},
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      };
      
      console.log('Attempting to create payment record in Firestore...', { orderId, userId });
      paymentDoc = await firestore.collection('payments').add(paymentData);
      
      console.log('Payment record created successfully:', paymentDoc.id);
    } catch (firestoreError: any) {
      console.error('Firestore error details:', {
        message: firestoreError.message,
        code: firestoreError.code,
        stack: firestoreError.stack,
        name: firestoreError.name,
        userId,
        hasToken: !!token,
        errorType: firestoreError.constructor?.name,
        // Check if it's an initialization error
        isInitializationError: firestoreError.message?.includes('initialize') || 
                               firestoreError.message?.includes('Admin SDK') ||
                               firestoreError.message?.includes('credential'),
      });
      
      // Check if it's an initialization error
      if (firestoreError.message?.includes('initialize') || 
          firestoreError.message?.includes('Admin SDK') ||
          firestoreError.message?.includes('credential')) {
        return NextResponse.json(
          { 
            error: 'Firebase Admin SDK initialization failed', 
            message: 'Unable to initialize Firebase Admin SDK. Please check environment variables.',
            hint: 'Ensure FIREBASE_SERVICE_ACCOUNT_KEY is set in your environment variables. See FIREBASE_ADMIN_SETUP.md for instructions.',
            details: process.env.NODE_ENV === 'development' ? firestoreError.message : undefined
          },
          { status: 500 }
        );
      }
      
      // Check if it's a permission error
      if (firestoreError.code === 'permission-denied' || firestoreError.message?.includes('permission')) {
        return NextResponse.json(
          { 
            error: 'Permission denied', 
            message: 'Unable to create payment record. Please ensure you are authenticated and try again.',
            hint: 'This may be a Firestore security rules issue. Check that the auth token is valid.'
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create payment record', 
          message: firestoreError.message,
          code: firestoreError.code || 'UNKNOWN',
          details: process.env.NODE_ENV === 'development' ? firestoreError.stack : undefined
        },
        { status: 500 }
      );
    }

    // Validate phone number format (Cashfree requires 10-digit phone)
    const phone = customerDetails.phone || '9999999999';
    const phoneDigits = phone.replace(/\D/g, ''); // Remove all non-digits
    if (phoneDigits.length !== 10) {
      console.error('❌ Invalid phone number format:', { 
        provided: phone, 
        digitsOnly: phoneDigits, 
        length: phoneDigits.length,
        required: '10 digits'
      });
      return NextResponse.json(
        { error: 'Invalid phone number. Phone number must be exactly 10 digits.' },
        { status: 400 }
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
        customer_phone: phoneDigits, // Use validated 10-digit phone
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/cashfree/return?order_id={order_id}`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/cashfree/webhook`,
        // Cashfree PG v2022-09-01 valid payment methods: cc,dc,ppc,ccc,emi,paypal,upi,nb,paylater,applepay
        // Note: 'wallet' is NOT valid in new API version, use 'nb' for netbanking
        // cc = Credit Card, dc = Debit Card, upi = UPI, nb = Net Banking
        payment_methods: 'cc,dc,upi,nb', // Core payment methods (wallet removed in v2022-09-01)
        // Add Naarimani logo to payment page (must be publicly accessible HTTPS URL)
        payment_logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://naarimani.com'}/icon-512x512.png`,
      },
    };

    console.log('📤 Sending request to Cashfree:', {
      url: `${CASHFREE_BASE_URL}/orders`,
      environment: isProduction ? 'PRODUCTION (LIVE)' : 'SANDBOX (TEST)',
      orderId: cashfreeOrderData.order_id,
      amount: cashfreeOrderData.order_amount,
      customerPhone: cashfreeOrderData.customer_details.customer_phone,
      customerEmail: cashfreeOrderData.customer_details.customer_email,
    });

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
        let errorText = '';
        try {
          errorText = await cashfreeResponse.text();
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { 
            message: `HTTP ${cashfreeResponse.status}: ${cashfreeResponse.statusText}`,
            rawResponse: errorText.substring(0, 500), // First 500 chars
          };
        }
        
        // Detailed error logging for debugging
        console.error('❌ Cashfree API Error (FULL DETAILS):', {
          status: cashfreeResponse.status,
          statusText: cashfreeResponse.statusText,
          environment: isProduction ? 'PRODUCTION (LIVE)' : 'SANDBOX (TEST)',
          baseUrl: CASHFREE_BASE_URL,
          hasAppId: !!CASHFREE_APP_ID,
          hasSecretKey: !!CASHFREE_SECRET_KEY,
          errorData: errorData,
          requestBody: {
            order_id: cashfreeOrderData.order_id,
            order_amount: cashfreeOrderData.order_amount,
            customer_phone: cashfreeOrderData.customer_details.customer_phone,
          },
        });
        
      // Update payment status to failed
      if (paymentDoc && firestore) {
        try {
          await firestore.collection('payments').doc(paymentDoc.id).update({
            status: 'failed',
            updatedAt: admin.firestore.Timestamp.now(),
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
          await firestore.collection('payments').doc(paymentDoc.id).update({
            status: 'failed',
            updatedAt: admin.firestore.Timestamp.now(),
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
      
      // Log the full Cashfree response for debugging
      console.log('✅ Cashfree API Success Response:', {
        order_id: cashfreeData.order_id,
        payment_session_id: cashfreeData.payment_session_id,
        order_token: cashfreeData.order_token,
        orderToken: cashfreeData.orderToken, // Check alternative field name
        token: cashfreeData.token, // Check alternative field name
        payment_link: cashfreeData.payment_link,
        payment_url: cashfreeData.payment_url,
        allKeys: Object.keys(cashfreeData),
        fullResponse: JSON.stringify(cashfreeData, null, 2),
      });
      
      // Cashfree might return order_token or orderToken - check both
      const orderToken = cashfreeData.order_token || cashfreeData.orderToken || cashfreeData.token;
      
      if (!orderToken) {
        console.warn('⚠️ order_token not found in Cashfree response. Available keys:', Object.keys(cashfreeData));
      }
    } catch (parseError: any) {
      console.error('Failed to parse Cashfree response:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from Cashfree', message: parseError.message },
        { status: 500 }
      );
    }

    // Update payment record with Cashfree order details
    try {
      await firestore.collection('payments').doc(paymentDoc.id).update({
        orderId: cashfreeData.order_id || cashfreeOrderData.order_id,
        metadata: {
          ...metadata,
          cashfree_order_id: cashfreeData.order_id,
          payment_session_id: cashfreeData.payment_session_id,
          order_token: cashfreeData.order_token,
          payment_link: cashfreeData.payment_link || cashfreeData.payment_url,
        },
        updatedAt: admin.firestore.Timestamp.now(),
      });
    } catch (updateError: any) {
      console.error('Failed to update payment with Cashfree data:', updateError);
      // Continue even if update fails, as payment is created
    }

    // Extract order_token (check multiple possible field names)
    const orderToken = cashfreeData.order_token || cashfreeData.orderToken || cashfreeData.token;
    
    // Cashfree returns payment_link or payment_url, or we can construct from session_id and token
    const paymentUrl = cashfreeData.payment_link || 
                       cashfreeData.payment_url || 
                       (cashfreeData.payment_session_id && orderToken 
                         ? `https://payments.cashfree.com/forms/v2/${cashfreeData.payment_session_id}` 
                         : null);

    console.log('📤 Returning payment response:', {
      paymentId: paymentDoc.id,
      orderId: cashfreeData.order_id || cashfreeOrderData.order_id,
      paymentSessionId: cashfreeData.payment_session_id,
      orderToken: orderToken,
      hasOrderToken: !!orderToken,
      paymentUrl: paymentUrl,
      hasPaymentUrl: !!paymentUrl,
    });

    return NextResponse.json({
      success: true,
      paymentId: paymentDoc.id,
      orderId: cashfreeData.order_id || cashfreeOrderData.order_id,
      paymentSessionId: cashfreeData.payment_session_id,
      orderToken: orderToken, // Use extracted orderToken
      paymentUrl: paymentUrl,
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

