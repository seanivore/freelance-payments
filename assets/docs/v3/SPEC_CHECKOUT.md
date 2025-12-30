# Checkout Session Parameters Update

**Date:** 2025-12-28

## Issue

When Stripe Price objects are created, the Stripe-generated `price_id` (e.g., `price_xyz...`) is stored in:
- ✅ `state_management.object.price[].initial` or `.balance`
- ✅ `initial_price_object.id` or `balance_price_object.id`

But `initial_checkout_session.line_items[].price` was not being updated with the actual Stripe `price_id`.

## Solution

Updated `sync_catalog.py` to also update checkout session parameters with actual Stripe IDs:

1. **`line_items[].price`** → Updated with Stripe-generated `price_id`
2. **`discounts[].coupon`** → Updated with Stripe `coupon_id` (if coupon exists)
3. **`client_reference_id`** → Stays as internal reference (no change needed)

## Template Update

Updated `_job_template_v3.json` to show `null` for:
- `initial_checkout_session.line_items[].price` → `null` (will be populated after Stripe objects created)
- `balance_checkout_session.line_items[].price` → `null` (will be populated after Stripe objects created)
- `initial_checkout_session.discounts[].coupon` → `null` (will be populated if coupon exists)

## Why This Matters

While checkout sessions are created **on-demand** via `api/create-checkout-session.js` (which gets `price_id` from `initial_price_object.id`), updating the checkout session parameters in the JSON file ensures:

1. **Complete Documentation** - JSON file accurately reflects all Stripe IDs
2. **Consistency** - All price references use the same Stripe-generated ID
3. **Easier Debugging** - Can see actual Stripe IDs in JSON file for reference

## Flow

```
1. New JSON file added with price: null in checkout_session
2. sync_catalog.py creates Stripe Price → gets price_id (e.g., "price_abc123...")
3. Updates:
   - initial_price_object.id = "price_abc123..."
   - state_management.object.price[].initial = "price_abc123..."
   - initial_checkout_session.line_items[].price = "price_abc123..." ✅ NEW
4. JSON file saved with all Stripe IDs populated
```

## Files Modified

- `.github/scripts/orchestration/sync_catalog.py` - Updates checkout_session parameters
- `assets/jobs/_job_template_v3.json` - Template shows `null` for price/coupon (will be populated)
