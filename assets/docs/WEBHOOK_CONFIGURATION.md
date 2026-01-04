# Webhook Configuration for Stripe Checkout Sessions

## Current Setup

The webhook handler (`api/webhook.js`) listens for:
- ✅ `checkout.session.completed` - **CORRECT** for Checkout Sessions
- ✅ `checkout.session.async_payment_succeeded` - For async payments (bank transfers)
- ✅ `checkout.session.async_payment_failed` - For failed async payments

## Important: Event Types

**For Checkout Sessions (embedded or hosted), Stripe sends:**
- `checkout.session.completed` - When payment succeeds
- `checkout.session.async_payment_succeeded` - When async payment succeeds
- `checkout.session.async_payment_failed` - When async payment fails

**NOT `payment_intent.succeeded` or `payment_intent.payment_failed`**

Those events are for Payment Intents created directly, not through Checkout Sessions.

## Stripe Dashboard Configuration

In your Stripe Dashboard → Webhooks → Your endpoint, ensure you're listening for:

1. ✅ `checkout.session.completed` (REQUIRED)
2. ✅ `checkout.session.async_payment_succeeded` (Optional, for bank transfers)
3. ✅ `checkout.session.async_payment_failed` (Optional, for failed async payments)

**Remove:**
- ❌ `payment_intent.succeeded` (not sent for Checkout Sessions)
- ❌ `payment_intent.payment_failed` (not sent for Checkout Sessions)

## Testing

To test webhooks locally:
1. Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhook`
2. Trigger test payment: `stripe trigger checkout.session.completed`



## Why Multiple Checkout Sessions Are Created

If you see many `POST /v1/checkout/sessions` calls:
1. The MutationObserver is triggering `init()` multiple times
2. **FIXED**: Added `dataset.initStarted` flag to prevent multiple initializations
3. Check browser console for "Checkout section already initializing" messages

## Payment Status Flow

1. User signs contract → Routes to invoice (NOT completion)
2. User clicks pay → Creates checkout session (one time only)
3. User completes payment → Stripe sends `checkout.session.completed` webhook
4. Webhook updates JSON → Sets `state.payment_1.succeeded` or `state.payment_2.succeeded`
5. User returns → Completion controller reloads fresh JSON → Shows correct status
