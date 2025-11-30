import { randomUUID } from 'node:crypto';
import { Cashfree } from 'cashfree-pg';

type CashfreeMode = 'sandbox' | 'production';

export type CashfreeCartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type CashfreeCustomer = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type CreateCashfreeOrderInput = {
  amount: number;
  currency?: string;
  customer: CashfreeCustomer;
  cartItems?: CashfreeCartItem[];
  metadata?: Record<string, unknown>;
  orderId?: string;
  orderNote?: string;
  returnUrl?: string;
  notifyUrl?: string;
};

type CashfreeOrderResponse = {
  paymentSessionId: string;
  orderId: string;
};

const API_VERSION = '2023-08-01';
let isConfigured = false;

function getMode(): CashfreeMode {
  const env = process.env.CASHFREE_ENV ?? 'sandbox';
  return env.toLowerCase() === 'production' ? 'production' : 'sandbox';
}

function ensureConfigured() {
  if (isConfigured) {
    return;
  }

  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    throw new Error(
      'Cashfree credentials are missing. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.'
    );
  }

  Cashfree.XClientId = appId;
  Cashfree.XClientSecret = secretKey;
  Cashfree.XEnvironment =
    getMode() === 'production'
      ? Cashfree.Environment.PRODUCTION
      : Cashfree.Environment.SANDBOX;

  isConfigured = true;
}

function sanitizeAmount(amount: number) {
  return Number(amount.toFixed(2));
}

export async function createCashfreeOrder(
  input: CreateCashfreeOrderInput
): Promise<CashfreeOrderResponse> {
  ensureConfigured();

  const orderId = input.orderId ?? `naari_${randomUUID()}`;

  const customerDetails: Record<string, string> = {
    customer_id: input.customer.id,
  };

  if (input.customer.email) {
    customerDetails.customer_email = input.customer.email;
  }
  if (input.customer.phone) {
    customerDetails.customer_phone = input.customer.phone;
  }
  if (input.customer.name) {
    customerDetails.customer_name = input.customer.name;
  }

  const orderMeta: Record<string, string> = {};
  const returnUrl =
    input.returnUrl ??
    process.env.CASHFREE_RETURN_URL ??
    process.env.NEXT_PUBLIC_CASHFREE_RETURN_URL;
  if (returnUrl) {
    orderMeta.return_url = returnUrl;
  }
  if (input.notifyUrl ?? process.env.CASHFREE_NOTIFY_URL) {
    orderMeta.notify_url = input.notifyUrl ?? process.env.CASHFREE_NOTIFY_URL!;
  }

  const orderTags: Record<string, string> = {
    platform: 'naarimani',
    ...(input.metadata
      ? { metadata: JSON.stringify(input.metadata).slice(0, 500) }
      : {}),
  };

  if (input.cartItems?.length) {
    orderTags.cart_summary = input.cartItems
      .map((item) => `${item.name}x${item.quantity}`)
      .join(',');
  }

  const payload: Record<string, unknown> = {
    order_id: orderId,
    order_amount: sanitizeAmount(input.amount),
    order_currency: input.currency ?? 'INR',
    customer_details: customerDetails,
    order_note:
      input.orderNote ??
      `Naari marketplace purchase (${input.cartItems?.length ?? 0} items)`,
    order_tags: orderTags,
  };

  if (Object.keys(orderMeta).length > 0) {
    payload.order_meta = orderMeta;
  }

  try {
    const response = await Cashfree.PGCreateOrder(API_VERSION, payload);
    const data = response?.data;

    if (!data?.payment_session_id || !data?.order_id) {
      throw new Error('Cashfree response missing payment session details.');
    }

    return {
      paymentSessionId: data.payment_session_id,
      orderId: data.order_id,
    };
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: unknown }; message?: string })?.message ??
      'Unknown error while creating Cashfree order.';

    console.error('Cashfree order creation failed', {
      message,
      cashfreeError: (error as { response?: { data?: unknown } })?.response
        ?.data,
    });

    throw new Error('Unable to create Cashfree order.');
  }
}
