# Stripe Payment Integration - StudentHub

## Overview

This document explains the complete Stripe integration for the StudentHub e-commerce platform, including:
- Database schema for orders, transactions, and seller balances
- Server-side API endpoints
- Frontend checkout flow
- How sellers get paid

---

## 1. Database Schema

### Run this SQL in Supabase SQL Editor:
**File:** `stripe_setup.sql`

### Tables Created:

| Table | Purpose |
|-------|---------|
| `orders` | Tracks all purchases made on the platform |
| `order_items` | Individual items within each order |
| `transactions` | All money movements (payments, payouts, refunds) |
| `payouts` | Seller withdrawal requests (future feature) |

### Student Table Updates:
- `balance` - Current available balance for seller
- `total_earnings` - Lifetime earnings from sales
- `stripe_customer_id` - Stripe customer ID (for returning customers)

---

## 2. How Payments Work

### Flow Diagram:
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Buyer     │──────│  StudentHub │──────│   Stripe    │
│   Cart      │      │   Server    │      │  Checkout   │
└─────────────┘      └─────────────┘      └─────────────┘
      │                     │                     │
      │ 1. Click Checkout   │                     │
      │────────────────────>│                     │
      │                     │                     │
      │                     │ 2. Create Session   │
      │                     │────────────────────>│
      │                     │                     │
      │                     │ 3. Session URL      │
      │                     │<────────────────────│
      │                     │                     │
      │ 4. Redirect         │                     │
      │<────────────────────│                     │
      │                     │                     │
      │ 5. User pays on Stripe                    │
      │──────────────────────────────────────────>│
      │                     │                     │
      │ 6. Success redirect │                     │
      │<──────────────────────────────────────────│
      │                     │                     │
      │ 7. Verify payment   │                     │
      │────────────────────>│                     │
      │                     │                     │
      │                     │ 8. Credit sellers   │
      │                     │ (update balances)   │
      │                     │                     │
      │ 9. Show success     │                     │
      │<────────────────────│                     │
```

### Platform Fee:
- **5% platform fee** is deducted from each sale
- Seller receives 95% of the sale price
- Example: $100 item = $95 to seller, $5 to platform

---

## 3. API Endpoints

### Checkout Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/checkout/create-session` | Create Stripe checkout session |
| POST | `/api/checkout/verify-payment` | Verify payment after redirect |
| GET | `/api/orders` | Get user's order history |
| GET | `/api/orders/:orderId` | Get specific order details |
| GET | `/api/sales` | Get seller's sales (items they sold) |
| GET | `/api/balance` | Get user's current balance/earnings |
| GET | `/api/transactions` | Get transaction history |

### Request/Response Examples:

#### Create Checkout Session
```javascript
POST /api/checkout/create-session

Request:
{
  "cartItems": [
    { "product_id": "uuid", "title": "Calculus Book", "price": 45.00, "quantity": 1 }
  ]
}

Response:
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/...",
  "orderId": "order-uuid"
}
```

#### Verify Payment
```javascript
POST /api/checkout/verify-payment

Request:
{
  "sessionId": "cs_test_...",
  "orderId": "order-uuid"
}

Response:
{
  "success": true,
  "message": "Payment verified and order completed",
  "orderId": "order-uuid"
}
```

---

## 4. Setting Up Stripe

### Step 1: Create Stripe Account
1. Go to [https://stripe.com](https://stripe.com)
2. Create an account (or log in)
3. Complete your business profile

### Step 2: Get API Keys
1. Go to **Developers** → **API Keys**
2. Copy your **Secret Key** (starts with `sk_test_` for test mode)
3. Copy your **Publishable Key** (starts with `pk_test_` for test mode)

### Step 3: Configure Environment Variables
Create or update `.env` file:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### Step 4: Update server.js
Replace the placeholder in `server.js`:
```javascript
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_KEY';
```

### Step 5: Install Stripe Package
```bash
npm install stripe
```

---

## 5. Testing Payments

### Test Card Numbers:
| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 9995 | Insufficient funds |

- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC (e.g., 123)
- Use any billing ZIP (e.g., 12345)

---

## 6. Files Modified/Created

### New Files:
| File | Purpose |
|------|---------|
| `stripe_setup.sql` | Database schema for orders/transactions |
| `public/views/order-success.html` | Order confirmation page |
| `STRIPE_INTEGRATION.md` | This documentation |

### Modified Files:
| File | Changes |
|------|---------|
| `package.json` | Added Stripe dependency |
| `server.js` | Added Stripe import, config, and 8 new endpoints |
| `public/views/cart.html` | Updated checkout to use Stripe |
| `public/views/profile.html` | Added balance display card |
| `public/scripts/profile.js` | Added balance loading function |

---

## 7. Seller Balance System

### How Sellers Get Paid:

1. **Buyer completes checkout** → Payment captured by Stripe
2. **Payment verified** → Server marks order as paid
3. **Seller credited** → Balance and total_earnings updated
4. **Transaction logged** → Record in transactions table

### Balance Display:
- Sellers see their balance on their profile page
- Green card shows current balance and lifetime earnings

### Future: Payouts
The `payouts` table is ready for implementing seller withdrawals:
- Seller requests payout
- Admin approves and processes
- Stripe Connect or manual bank transfer

---

## 8. Security Considerations

### Already Implemented:
- ✅ Server-side price verification (prevents client manipulation)
- ✅ User authentication required for checkout
- ✅ Order ownership verification
- ✅ RLS policies on database tables

### Recommended for Production:
- [ ] Move to Stripe production keys
- [ ] Set up Stripe webhooks for async event handling
- [ ] Implement idempotency keys for retry safety
- [ ] Add rate limiting on checkout endpoint
- [ ] Set up proper logging and monitoring
- [ ] Consider Stripe Connect for direct seller payouts

---

## 9. Stripe Webhooks (Optional Enhancement)

For more reliable payment tracking, set up webhooks:

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `payment_intent.payment_failed`
4. Copy the webhook secret to `.env`

The webhook endpoint is already implemented in `server.js`.

---

## 10. Troubleshooting

### "Payment verification failed"
- Check that Stripe secret key is correct
- Ensure session ID matches the checkout session

### "Cannot buy your own product"
- Working as intended - users cannot purchase their own listings

### Balance not updating
- Ensure `stripe_setup.sql` was run in Supabase
- Check `student` table has `balance` and `total_earnings` columns

### Checkout button not working
- Check browser console for errors
- Verify user is logged in
- Ensure cart has items

---

## Quick Start Checklist

1. [ ] Run `stripe_setup.sql` in Supabase SQL Editor
2. [ ] Create Stripe account and get test API keys
3. [ ] Update `STRIPE_SECRET_KEY` in `server.js`
4. [ ] Run `npm install` to install Stripe package
5. [ ] Restart server: `node server.js`
6. [ ] Add items to cart and test checkout with test card
7. [ ] Verify order appears in purchase history
8. [ ] Check seller's profile for updated balance

---

**Questions?** The code includes detailed comments explaining each step of the process.

