# Stripe Checkout Integration Fix - fetchClientSecret Pattern

**Date**: 2026-01-05  
**Status**: ✅ Fixed  
**Issue**: `Invalid initCheckout() parameter: options.clientSecret is not an accepted parameter`

---

## Root Cause

The error occurred because we were passing `clientSecret` as a **string value**, but Stripe.js Basil release requires `fetchClientSecret` as an **async function**.

### Incorrect (What We Were Doing)
```javascript
const checkout = stripe.initCheckout({
  clientSecret: clientSecret,  // ❌ String value
  elementsOptions: { appearance }
});
```

### Correct (What Stripe.js Expects)
```javascript
const fetchClientSecret = async () => {
  const data = await createCheckoutSession(jobData, paymentNumber);
  return data.client_secret;
};

const checkout = stripe.initCheckout({
  fetchClientSecret: fetchClientSecret,  // ✅ Async function
  elementsOptions: { appearance }
});
```

---

## Why This Pattern?

Per Stripe documentation:
- `initCheckout()` accepts `fetchClientSecret` as an async function
- Stripe.js calls this function **when it needs** the client secret
- This allows Stripe.js to handle the timing internally
- The function can create the checkout session on-demand

---

## Changes Made

### File: `assets/js/checkout-controller.js`

1. **Changed function signature**:
   - OLD: `mountStripeElements(clientSecret, containerDiv, returnUrl)`
   - NEW: `mountStripeElements(jobData, paymentNumber, containerDiv, returnUrl)`

2. **Created `fetchClientSecret` function**:
   ```javascript
   const fetchClientSecret = async () => {
     console.log('🔄 fetchClientSecret called by Stripe.js, creating checkout session...');
     const data = await createCheckoutSession(jobData, paymentNumber);
     
     // Store publishable key if provided
     if (data.publishable_key) {
       window.STRIPE_PUBLISHABLE_KEY = data.publishable_key;
     }
     
     if (!data.client_secret) {
       throw new Error('No client_secret returned from server');
     }
     
     return data.client_secret;
   };
   ```

3. **Updated `initCheckout` call**:
   ```javascript
   const initOptions = {
     fetchClientSecret: fetchClientSecret,  // Function, not string!
     elementsOptions: { appearance }
   };
   
   const checkout = stripe.initCheckout(initOptions);
   ```

4. **Simplified initialization flow**:
   - Removed upfront `createCheckoutSession` call
   - Stripe.js now calls `fetchClientSecret` when needed
   - Added `mountStripeElementsWithFetch` helper function

---

## How It Works Now

1. User clicks payment button
2. `init()` function calls `mountStripeElementsWithFetch()`
3. `mountStripeElements()` is called with `jobData` and `paymentNumber`
4. Stripe.js is loaded and initialized
5. `initCheckout()` is called with `fetchClientSecret` function
6. Stripe.js calls `fetchClientSecret()` when it needs the client secret
7. `fetchClientSecret()` creates checkout session and returns `client_secret`
8. Stripe.js initializes checkout with the client secret
9. Payment Element and Billing Address Element are mounted

---

## Testing Checklist

- [ ] Checkout session is created when Stripe.js calls `fetchClientSecret`
- [ ] Client secret is returned correctly
- [ ] Payment Element mounts successfully
- [ ] Billing Address Element mounts successfully
- [ ] Form submission works
- [ ] Payment confirmation works
- [ ] Redirect to completion page works

---

## References

- **Stripe Documentation**: https://docs.stripe.com/js/custom_checkout/init
- **Basil Changelog**: https://docs.stripe.com/changelog/basil/2025-03-31/add-checkout-session-custom-ui-mode
- **Sample Code**: `assets/docs/RESOURCES/stripe-sample-code/public/checkout.js`

---

## Key Takeaway

**Always use `fetchClientSecret` as an async function, not `clientSecret` as a string value.**

This pattern allows Stripe.js to control when the checkout session is created, which is more efficient and follows Stripe's recommended approach.
