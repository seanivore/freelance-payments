# Stripe Checkout Integration Status - Custom UI Mode (Basil Release)

**Last Updated**: 2026-01-05  
**Status**: 🔴 Blocked - Parameter validation error with `initCheckout()`  
**Context**: Migrating from Stripe Embedded Checkout to Custom UI mode using Stripe Elements

---

## Current Objective

Implement Stripe Checkout with `ui_mode: "custom"` using Stripe Elements (Payment Element, Billing Address Element) instead of the embedded checkout form. This allows full control over the checkout UI while maintaining Stripe's payment processing.

---

## Technical Stack

### Backend (Vercel Serverless Functions)
- **File**: `api/create-checkout-session.js`
- **Stripe API Version**: `2025-03-31.basil` (required for `ui_mode: custom`)
- **Endpoint**: `POST /api/create-checkout-session`
- **Returns**: 
  ```json
  {
    "session_id": "cs_test_xxx",
    "client_secret": "cs_test_xxx_secret_xxx",
    "publishable_key": "pk_test_xxx",
    "session_url": "https://checkout.stripe.com/..."
  }
  ```

### Frontend (Stripe.js)
- **File**: `assets/js/checkout-controller.js`
- **Stripe.js Version**: Basil release (`https://js.stripe.com/basil/stripe.js`)
- **Function**: `mountStripeElements(clientSecret, containerDiv, returnUrl)`
- **Current Issue**: `initCheckout()` parameter validation error

---

## The Problem

### Error Message
```
IntegrationError: Invalid initCheckout() parameter: options.clientSecret is not an accepted parameter.
```

### What We've Tried

1. **Using `clientSecret` parameter** (original attempt)
   - Error: `options.clientSecret is not an accepted parameter`
   - Code: `stripe.initCheckout({ clientSecret: clientSecret })`

2. **Using `sessionId` parameter** (after web search suggested Basil uses sessionId)
   - Error: `options.sessionId is not an accepted parameter`
   - Code: `stripe.initCheckout({ sessionId: sessionId })`

3. **Removed `elementsOptions`** (to isolate the issue)
   - Still failed with same error

4. **Added `custom_checkout_beta` flag** (thinking Basil might need beta flag)
   - Warning: `The following betas are unrecognized: custom_checkout_beta`
   - Error persisted

5. **Current attempt**: Using `clientSecret` with `elementsOptions` (matching sample code)
   - Status: Pending test after Vercel deployment

---

## Reference Documentation

### Official Stripe Docs
- **Quickstart**: https://docs.stripe.com/payments/quickstart-checkout-sessions
- **JS Reference**: https://docs.stripe.com/js/custom_checkout/init
- **Versioning**: https://docs.stripe.com/sdks/stripejs-versioning

### Sample Code Reference
- **File**: `assets/docs/RESOURCES/stripe-sample-code/public/checkout.js`
- **API Version**: `2025-12-15.clover` (different from our Basil version)
- **Pattern**:
  ```javascript
  checkout = stripe.initCheckout({
    clientSecret: promise,  // Note: passes promise directly, not resolved value
    elementsOptions: { appearance },
  });
  ```

### Key Differences Between Sample and Our Code

| Aspect | Sample Code | Our Code |
|--------|-------------|----------|
| Stripe.js Version | Clover (`/clover/stripe.js`) | Basil (`/basil/stripe.js`) |
| API Version | `2025-12-15.clover` | `2025-03-31.basil` |
| `clientSecret` Source | Promise from fetch | Resolved string value |
| Beta Flag             | Not shown          | Tried `custom_checkout_beta` (rejected) |

---

## Current Code State

### Backend (`api/create-checkout-session.js`)
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil' // Required for ui_mode: 'custom'
});

// Creates session with:
const sessionParams = {
  mode: 'payment',
  line_items: lineItems,
  ui_mode: 'custom',
  return_url: return_url,
  // ... other params
};

const session = await stripe.checkout.sessions.create(sessionParams);

res.status(200).json({
  session_id: session.id,
  client_secret: session.client_secret,
  publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
  session_url: session.url
});
```

### Frontend (`assets/js/checkout-controller.js`)
```javascript
// Stripe.js loaded from: https://js.stripe.com/basil/stripe.js
const stripe = window.Stripe(publishableKey); // No beta flags

// Current attempt:
const initOptions = {
  clientSecret: clientSecret,  // From data.client_secret
  elementsOptions: { 
    appearance: { theme: 'stripe' } 
  }
};

const checkout = stripe.initCheckout(initOptions);
// ❌ Error: Invalid initCheckout() parameter: options.clientSecret is not an accepted parameter
```

---

## Debugging Information

### Console Output (from last test)
```
Session ID format: cs_test_a1nZzslFpHxb...
Stripe object: object initCheckout type: function
Stripe API version: (not logged - _apiVersion may not exist)
initCheckout options: {sessionId: 'cs_test_a1nZzslFpHxb...', ...}
```

### Warning Messages
```
[Stripe.js] The following betas are unrecognized for Stripe() parameter:
- custom_checkout_beta
They are either invalid or expired betas, please remove these beta flags to prevent future integration issues.
```

---

## Hypotheses & Next Steps

### Hypothesis 1: API Version Mismatch
- **Theory**: Basil Stripe.js might expect different parameter structure than Clover
- **Action**: Check if Basil requires different initialization method
- **Test**: Compare Basil vs Clover documentation side-by-side

### Hypothesis 2: Parameter Name Changed
- **Theory**: Basil might use a different parameter name (not `clientSecret` or `sessionId`)
- **Action**: Inspect `stripe.initCheckout.toString()` to see function signature
- **Test**: Log function signature in console (already added)

### Hypothesis 3: Promise vs Resolved Value
- **Theory**: Sample code passes promise directly; maybe Basil requires promise?
- **Action**: Try passing promise instead of resolved value
- **Test**: `stripe.initCheckout({ clientSecret: fetchPromise })`

### Hypothesis 4: Wrong Stripe.js Version
- **Theory**: Maybe Basil doesn't support `initCheckout` yet, or we need different version
- **Action**: Check Stripe changelog for Basil release notes
- **Test**: Try Clover version temporarily to verify basic flow works

### Hypothesis 5: Missing Required Parameters
- **Theory**: Maybe Basil requires additional parameters we're not providing
- **Action**: Check official Basil documentation for required vs optional params
- **Test**: Try minimal object `{}` to see what error we get

---

## Files Modified

1. `api/create-checkout-session.js`
   - Set `apiVersion: '2025-03-31.basil'`
   - Returns `client_secret` and `session_id`

2. `assets/js/checkout-controller.js`
   - Loads Basil Stripe.js: `https://js.stripe.com/basil/stripe.js`
   - Implements `mountStripeElements()` function
   - Currently failing at `stripe.initCheckout()` call

3. `job.html`
   - Removed static Stripe.js script tag (now loaded dynamically)

---

## Related Issues Fixed

✅ Stripe API version set to `2025-03-31.basil`  
✅ Removed unsupported parameters (`after_expiration`, `branding_settings`, `redirect_on_completion`, `name_collection`)  
✅ Stripe.js loading correctly from Basil CDN  
✅ Client secret format validated (`cs_` prefix)  
✅ Publishable key received from API  
❌ **BLOCKED**: `initCheckout()` parameter validation

---

## Questions to Resolve

1. **Does Basil Stripe.js support `initCheckout()`?**
   - Check Basil changelog/release notes
   - Verify if custom checkout is GA or still beta in Basil

2. **What is the correct parameter name for Basil?**
   - `clientSecret`? `sessionId`? Something else?
   - Check official Basil documentation

3. **Should we use a different Stripe.js version?**
   - Clover (`/clover/stripe.js`) works in sample code
   - But our API uses Basil (`2025-03-31.basil`)
   - Are they compatible?

4. **Does the parameter need to be a promise?**
   - Sample code passes promise directly
   - We're passing resolved string value

---

## Code Snippets for Quick Reference

### How We're Currently Calling It
```javascript
// In mountStripeElements():
const checkout = stripe.initCheckout({
  clientSecret: clientSecret,  // String from API response
  elementsOptions: { 
    appearance: { theme: 'stripe' } 
  }
});
```

### What Sample Code Does
```javascript
// In sample checkout.js:
const promise = fetch("/create-checkout-session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
})
  .then((r) => r.json())
  .then((r) => r.clientSecret);

checkout = stripe.initCheckout({
  clientSecret: promise,  // Promise, not resolved value!
  elementsOptions: { appearance },
});
```

---

## Next Immediate Steps

1. **Test current code** (with `clientSecret` + `elementsOptions`) after Vercel deployment
2. **Check console logs** for `initCheckout` function signature
3. **If still failing**: Try passing promise instead of resolved value
4. **If still failing**: Check if we should use Clover Stripe.js instead of Basil
5. **If still failing**: Review Basil changelog for breaking changes

---

## Resources

- **Stripe Checkout Sessions API**: https://docs.stripe.com/api/checkout/sessions
- **Stripe.js Custom Checkout**: https://docs.stripe.com/js/custom_checkout/init
- **Basil Changelog**: https://docs.stripe.com/checkout/elements-with-checkout-sessions-api/changelog
- **Sample Code**: `assets/docs/RESOURCES/stripe-sample-code/`

---

## Notes

- The sample code uses Clover API version (`2025-12-15.clover`) but we're using Basil (`2025-03-31.basil`)
- This version mismatch might be causing the parameter validation issue
- Custom checkout might have different API between Clover and Basil releases
- The `custom_checkout_beta` flag is expired/unrecognized, suggesting custom checkout is GA in Basil

---

**Status**: Awaiting test results with current implementation. If error persists, will investigate Stripe.js version compatibility and parameter requirements for Basil release.
