import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCashfreeOrder } from '@/lib/cashfree';

export const runtime = 'nodejs';

const cartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
});

const payloadSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  customer: z.object({
    id: z.string(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().min(6).optional(),
  }),
  cartItems: z.array(cartItemSchema).optional(),
  metadata: z.record(z.any()).optional(),
  orderNote: z.string().optional(),
  returnUrl: z.string().url().optional(),
  notifyUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = payloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid payload.',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { paymentSessionId, orderId } = await createCashfreeOrder(parsed.data);

    return NextResponse.json({
      paymentSessionId,
      orderId,
    });
  } catch (error) {
    console.error('Cashfree order route failed:', error);

    return NextResponse.json(
      { error: 'Unable to initiate payment. Please try again.' },
      { status: 500 }
    );
  }
}
