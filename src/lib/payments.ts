/**
 * Payment integration utilities
 * Supports Stripe, PayPal, and Cashfree
 */

import { collection, addDoc, query, where, getDocs, orderBy, limit, updateDoc, doc, serverTimestamp, Firestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Get Firestore instance
function getDb(): Firestore {
  const { firestore } = initializeFirebase();
  return firestore;
}

export interface Payment {
  id: string;
  userId: string;
  orderId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'paypal' | 'cashfree' | 'other';
  paymentIntentId?: string; // Stripe payment intent ID
  transactionId?: string; // PayPal/Cashfree transaction ID
  description: string;
  metadata?: Record<string, any>;
  createdAt: any;
  updatedAt: any;
}

export interface CashfreeCustomerDetails {
  name: string;
  email?: string;
  phone?: string;
}

export interface CashfreeOrderResponse {
  success: boolean;
  paymentId: string;
  orderId: string;
  paymentSessionId: string;
  orderToken: string;
  paymentUrl: string | null;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'completed' | 'failed';
  refundId?: string; // Stripe/PayPal refund ID
  createdAt: any;
}

/**
 * Create a payment record
 */
export async function createPayment(
  payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = getDb();
  const paymentsRef = collection(db, 'payments');
  const docRef = await addDoc(paymentsRef, {
    ...payment,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: Payment['status'],
  metadata?: Record<string, any>
) {
  const db = getDb();
  const paymentRef = doc(db, 'payments', paymentId);
  await updateDoc(paymentRef, {
    status,
    updatedAt: serverTimestamp(),
    ...(metadata && { metadata: { ...metadata } }),
  });
}

/**
 * Get user payment history
 */
export async function getUserPaymentHistory(
  userId: string,
  limitCount: number = 50
): Promise<Payment[]> {
  const db = getDb();
  const paymentsRef = collection(db, 'payments');
  const q = query(
    paymentsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Payment[];
}

/**
 * Get payment by ID
 */
export async function getPayment(paymentId: string): Promise<Payment | null> {
  const db = getDb();
  const paymentRef = doc(db, 'payments', paymentId);
  const paymentDoc = await getDocs(query(collection(db, 'payments'), where('__name__', '==', paymentId)));
  
  if (paymentDoc.empty) return null;
  
  return {
    id: paymentDoc.docs[0].id,
    ...paymentDoc.docs[0].data(),
  } as Payment;
}

/**
 * Create a refund
 */
export async function createRefund(
  paymentId: string,
  amount: number,
  reason: string,
  refundId?: string
): Promise<string> {
  const db = getDb();
  // Create refund record
  const refundsRef = collection(db, 'refunds');
  const refundDoc = await addDoc(refundsRef, {
    paymentId,
    amount,
    reason,
    status: 'pending',
    refundId,
    createdAt: serverTimestamp(),
  });
  
  // Update payment status
  await updatePaymentStatus(paymentId, 'refunded');
  
  return refundDoc.id;
}

/**
 * Update refund status
 */
export async function updateRefundStatus(
  refundId: string,
  status: Refund['status']
) {
  const db = getDb();
  const refundRef = doc(db, 'refunds', refundId);
  await updateDoc(refundRef, {
    status,
  });
}

/**
 * Get refunds for a payment
 */
export async function getRefundsForPayment(paymentId: string): Promise<Refund[]> {
  const db = getDb();
  const refundsRef = collection(db, 'refunds');
  const q = query(
    refundsRef,
    where('paymentId', '==', paymentId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Refund[];
}

/**
 * Stripe payment integration
 * Note: In production, use Stripe's server-side SDK for security
 */
export async function processStripePayment(
  amount: number,
  currency: string = 'INR',
  description: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<{ paymentIntentId: string; clientSecret: string }> {
  // In production, this should call your backend API
  // which uses Stripe's server-side SDK
  // For now, this is a placeholder
  
  const paymentId = await createPayment({
    userId,
    amount,
    currency,
    status: 'pending',
    paymentMethod: 'stripe',
    description,
    metadata,
  });
  
  // In production, create payment intent on server
  // const response = await fetch('/api/create-payment-intent', {
  //   method: 'POST',
  //   body: JSON.stringify({ amount, currency, paymentId }),
  // });
  // const { paymentIntentId, clientSecret } = await response.json();
  
  // Placeholder
  return {
    paymentIntentId: `pi_${paymentId}`,
    clientSecret: `pi_${paymentId}_secret_placeholder`,
  };
}

/**
 * PayPal payment integration
 * Note: In production, use PayPal's server-side SDK
 */
export async function processPayPalPayment(
  amount: number,
  currency: string = 'INR',
  description: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<{ orderId: string; approvalUrl: string }> {
  // In production, this should call your backend API
  // which uses PayPal's server-side SDK
  
  const paymentId = await createPayment({
    userId,
    amount,
    currency,
    status: 'pending',
    paymentMethod: 'paypal',
    description,
    metadata,
  });
  
  // Placeholder
  return {
    orderId: `order_${paymentId}`,
    approvalUrl: `https://paypal.com/checkout?order=${paymentId}`,
  };
}

/**
 * Cashfree payment integration
 * Creates a payment order via Cashfree API
 */
export async function processCashfreePayment(
  amount: number,
  currency: string = 'INR',
  description: string,
  userId: string,
  customerDetails: CashfreeCustomerDetails,
  metadata?: Record<string, any>
): Promise<CashfreeOrderResponse> {
  const response = await fetch('/api/payments/cashfree/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      description,
      userId,
      customerDetails,
      metadata,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create Cashfree order');
  }

  return response.json();
}

/**
 * Verify Cashfree payment status
 */
export async function verifyCashfreePayment(
  orderId?: string,
  paymentId?: string
): Promise<{ success: boolean; status: Payment['status']; orderStatus: string }> {
  const response = await fetch('/api/payments/cashfree/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId, paymentId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to verify payment');
  }

  return response.json();
}

