# Cashfree Payment Gateway Integration

This document explains how to set up and use the Cashfree payment gateway integration in the Naarimani application.

## Prerequisites

1. **Cashfree Account**: Sign up at [https://www.cashfree.com](https://www.cashfree.com)
2. **API Credentials**: Get your App ID and Secret Key from the Cashfree dashboard
3. **Environment Variables**: Configure the required environment variables

## Installation

Install the Cashfree SDK (optional, we use direct API calls):

```bash
npm install cashfree-pg
```

## Environment Variables

Add the following environment variables to your `.env.local` file (for development) or your hosting platform (Vercel, etc.):

```env
# Cashfree Configuration
CASHFREE_APP_ID=your_app_id_here
CASHFREE_SECRET_KEY=your_secret_key_here
CASHFREE_API_URL=https://api.cashfree.com/pg  # Production
# CASHFREE_API_URL=https://sandbox.cashfree.com/pg  # Sandbox/Testing

# Application URL (for webhooks and return URLs)
NEXT_PUBLIC_APP_URL=https://naarimani.com  # Production
# NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
```

### Getting Cashfree Credentials

1. Log in to your Cashfree dashboard
2. Navigate to **Settings** → **API Keys**
3. Copy your **App ID** and **Secret Key**
4. For testing, use the **Sandbox** environment credentials
5. For production, use the **Live** environment credentials

## API Routes

The integration includes the following API routes:

### 1. Create Order (`/api/payments/cashfree/create-order`)

Creates a payment order in Cashfree.

**Request:**
```json
{
  "amount": 100.00,
  "currency": "INR",
  "userId": "user_id",
  "description": "Payment description",
  "customerDetails": {
    "name": "Customer Name",
    "email": "customer@example.com",
    "phone": "+919876543210"
  },
  "metadata": {
    "customField": "value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "payment_id",
  "orderId": "order_id",
  "paymentSessionId": "session_id",
  "orderToken": "token",
  "paymentUrl": "https://..."
}
```

### 2. Verify Payment (`/api/payments/cashfree/verify`)

Verifies the payment status with Cashfree.

**Request:**
```json
{
  "orderId": "order_id",
  "paymentId": "payment_id"
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "payment_id",
  "orderId": "order_id",
  "status": "completed",
  "orderStatus": "PAID",
  "paymentDetails": { ... }
}
```

### 3. Webhook Handler (`/api/payments/cashfree/webhook`)

Handles webhook notifications from Cashfree. Configure this URL in your Cashfree dashboard:
- **Settings** → **Webhooks** → Add webhook URL: `https://naarimani.com/api/payments/cashfree/webhook`

### 4. Return Handler (`/api/payments/cashfree/return`)

Handles the return URL after payment completion. This redirects users to the payment status page.

## Usage

### Using the CashfreePayment Component

```tsx
import { CashfreePayment } from '@/components/cashfree-payment';

function MyComponent() {
  return (
    <CashfreePayment
      amount={100}
      currency="INR"
      description="Payment for services"
      onSuccess={(paymentId, orderId) => {
        console.log('Payment successful:', paymentId, orderId);
      }}
      onError={(error) => {
        console.error('Payment error:', error);
      }}
      metadata={{
        customField: 'value'
      }}
    />
  );
}
```

### Using the Payment Functions Directly

```tsx
import { processCashfreePayment, verifyCashfreePayment } from '@/lib/payments';

// Create payment
const response = await processCashfreePayment(
  100, // amount
  'INR', // currency
  'Payment description', // description
  userId, // userId
  {
    name: 'Customer Name',
    email: 'customer@example.com',
    phone: '+919876543210'
  }, // customerDetails
  { customField: 'value' } // metadata
);

// Verify payment
const verification = await verifyCashfreePayment(
  response.orderId,
  response.paymentId
);
```

## Payment Flow

1. **User initiates payment** → `CashfreePayment` component collects customer details
2. **Create order** → API creates order in Cashfree and Firestore
3. **Redirect to Cashfree** → User is redirected to Cashfree payment page
4. **Payment processing** → User completes payment on Cashfree
5. **Return/Webhook** → Cashfree redirects back and sends webhook
6. **Verify payment** → System verifies payment status
7. **Update Firestore** → Payment status is updated in Firestore

## Testing

### Sandbox Mode

1. Use sandbox credentials in environment variables
2. Set `CASHFREE_API_URL=https://sandbox.cashfree.com/pg`
3. Use test payment methods provided by Cashfree

### Test Cards (Sandbox)

Cashfree provides test cards for different scenarios:
- **Success**: Use any card number with valid expiry
- **Failure**: Use specific test card numbers (check Cashfree docs)

## Webhook Configuration

1. Log in to Cashfree dashboard
2. Go to **Settings** → **Webhooks**
3. Add webhook URL: `https://naarimani.com/api/payments/cashfree/webhook`
4. Select events: `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `PAYMENT_PENDING`
5. Save the webhook

## Security Considerations

1. **Never expose secret keys** in client-side code
2. **Always verify webhook signatures** (implement signature verification)
3. **Use HTTPS** for all payment-related endpoints
4. **Validate payment amounts** on the server side
5. **Store payment records** in Firestore for audit trail
6. **Implement rate limiting** for payment endpoints

## Troubleshooting

### Payment not creating

- Check environment variables are set correctly
- Verify Cashfree credentials are valid
- Check API URL matches environment (sandbox vs production)
- Review server logs for error messages

### Webhook not receiving

- Verify webhook URL is accessible (not localhost)
- Check webhook is configured in Cashfree dashboard
- Ensure webhook endpoint is publicly accessible
- Review webhook logs in Cashfree dashboard

### Payment verification failing

- Check order ID is correct
- Verify payment was actually completed
- Review Cashfree dashboard for payment status
- Check Firestore for payment record

## Support

For Cashfree-specific issues:
- Cashfree Documentation: [https://docs.cashfree.com](https://docs.cashfree.com)
- Cashfree Support: [https://www.cashfree.com/support](https://www.cashfree.com/support)

For integration issues:
- Check application logs
- Review Firestore rules
- Verify API routes are working

