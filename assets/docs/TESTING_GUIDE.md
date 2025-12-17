# Testing Guide 🧪

## Pre-Flight Check ✅

Before testing, make sure:
- [x] STRIPE_SECRET_KEY added to Vercel ✅
- [x] STRIPE_WEBHOOK_SECRET added to Vercel ✅
- [x] Stripe publishable key added to frontend (see below)
- [x] GitHub Pages enabled ✅
- [x] Site live at payments.august.style ✅

---

## Step 1: Add Stripe Publishable Key

**Quick Option (for testing):**
Edit `assets/js/checkout-controller.js` line ~105:

```javascript
const publishableKey = 'pk_test_51Sbjhg9fljwH26CPk5PQKftpMaVQ7D7kIH3O3tYVEFSkOzVdqI5DWtT7EMcJDUqQLKEgIosx7q4nfgjrB1KMf85100WsuWFKNr';
```

---

## Step 2: Test GitHub Actions Workflow

### Test 1: Push a Test JSON File

1. **Push a test file:**
   ```bash
   git add assets/jobs/test-single-payment.json
   git commit -m "Test: Add single payment job"
   git push
   ```

2. **Check GitHub Actions:**
   - Go to: https://github.com/seanivore/freelance-payments/actions
   - Should see "Process Job & Update Stripe Catalog" workflow running
   - Wait for it to complete (green checkmark)

3. **Check Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/test/products
   - Should see a new product: `uid-test-001-1`
   - Check metadata includes: `job_id`, `payment_number`, `client_last_name`, `project_keyword`

4. **Check JSON file:**
   - Go back to GitHub, check `assets/jobs/test-single-payment.json`
   - Should have `stripe_product_id` and `stripe_price_id` filled in

---

## Step 3: Test Payment Flow

### Test 2: Full Payment Flow

1. **Visit site:**
   - Go to: https://payments.august.style/

2. **Lookup:**
   - Last Name: `Single`
   - Project Keyword: `single-payment-test`
   - Click "Look Up Payment"

3. **Contract Page:**
   - Should see contract populated from JSON
   - Fill in signature fields:
     - Contractor Signature: `Sean Horvath`
     - Contractor Date: Today's date
     - Client Signature: `Test Client`
     - Client Date: Today's date
   - Click "Sign Contract"
   - Should redirect to invoice page

4. **Invoice Page:**
   - Should show payment details
   - Amount: $1,000.00
   - Click "Pay Now" → Should go to checkout

5. **Checkout Page:**
   - Should see Stripe Payment Element
   - Enter test card:
     - Card: `4242 4242 4242 4242`
     - Expiry: Any future date (e.g., `12/25`)
     - CVC: Any 3 digits (e.g., `123`)
     - ZIP: Any 5 digits (e.g., `12345`)
   - Click "Pay $1,000.00"
   - Should process payment

6. **Success:**
   - Should see "Payment Successful!" message
   - Should redirect to completion page (or next payment if multiple)

7. **Check Webhook:**
   - Go to Stripe Dashboard → Webhooks
   - Click on your webhook endpoint
   - Check "Recent events" - should see `payment_intent.succeeded`

8. **Check JSON Updated:**
   - Go back to GitHub, check `test-single-payment.json`
   - Payment should have:
     - `status: "paid"`
     - `paid_date: "2025-01-XX"` (today's date)
     - `paid_date_unix: 1737XXXXXX` (Unix timestamp)

---

## Step 4: Test Edge Cases

### Test 3: Multi-Payment Flow

1. **Push multi-payment test:**
   ```bash
   git add assets/jobs/test-multi-payment.json
   git commit -m "Test: Add multi-payment job"
   git push
   ```

2. **Test lookup:**
   - Last Name: `Multi`
   - Keyword: `multi-payment-test`

3. **Flow:**
   - Sign contract
   - Pay first payment ($5,000)
   - Should route to second payment invoice
   - Pay second payment ($5,000)
   - Should route to third payment invoice
   - Pay third payment ($5,000)
   - Should route to completion page

### Test 4: Already Signed Contract

1. **Push already-signed test:**
   ```bash
   git add assets/jobs/test-already-signed.json
   git commit -m "Test: Add already-signed job"
   git push
   ```

2. **Test lookup:**
   - Last Name: `Signed`
   - Keyword: `already-signed`

3. **Should skip contract page:**
   - Should go directly to invoice (contract already signed)

### Test 5: Partially Paid

1. **Push partially-paid test:**
   ```bash
   git add assets/jobs/test-partially-paid.json
   git commit -m "Test: Add partially-paid job"
   git push
   ```

2. **Test lookup:**
   - Last Name: `Partial`
   - Keyword: `partially-paid`

3. **Should route to second payment:**
   - Should skip contract (already signed)
   - Should skip first payment (already paid)
   - Should show second payment invoice

### Test 6: Special Characters

1. **Push special-chars test:**
   ```bash
   git add assets/jobs/test-special-chars.json
   git commit -m "Test: Add special characters job"
   git push
   ```

2. **Test lookup:**
   - Last Name: `O'Brien` (with apostrophe)
   - Keyword: `special-chars-test`

3. **Check:**
   - URL encoding works correctly
   - Manifest lookup works
   - Stripe metadata handles special chars

---

## Troubleshooting

### Payment Element Not Loading
- **Check:** Stripe publishable key is correct
- **Check:** Browser console for errors
- **Check:** Network tab - is API call to Vercel succeeding?

### Webhook Not Receiving Events
- **Check:** Webhook secret matches Stripe dashboard
- **Check:** Webhook URL is correct
- **Check:** Vercel function logs: `vercel logs`
- **Test:** Use Stripe Dashboard → Webhooks → "Send test webhook"

### GitHub Actions Not Running
- **Check:** Workflow file path: `.github/workflows/process-job.yml`
- **Check:** Branch name matches workflow (`freelance-payments`)
- **Check:** JSON file path matches workflow (`assets/jobs/**/*.json`)

### Stripe Products Not Created
- **Check:** GitHub Actions logs for errors
- **Check:** STRIPE_SECRET_KEY is correct (test mode key)
- **Check:** Python script ran successfully
- **Check:** JSON file has valid payment structure

### Contract Signing Not Updating JSON
- **Check:** Vercel function logs
- **Check:** GITHUB_TOKEN has correct permissions
- **Check:** Network tab - is API call succeeding?

---

## Test Cards

**Success:**
- `4242 4242 4242 4242` - Always succeeds

**Decline:**
- `4000 0000 0000 0002` - Card declined

**3D Secure:**
- `4000 0027 6000 3184` - Requires authentication

**Any expiry date (future), any CVC, any ZIP**

---

## Success Criteria ✅

- [ ] GitHub Actions creates Stripe products
- [ ] JSON files updated with Stripe IDs
- [ ] Lookup form finds jobs correctly
- [ ] Contract page populates correctly
- [ ] Contract signing updates JSON
- [ ] Invoice page shows correct payment
- [ ] Checkout loads Payment Element
- [ ] Payment processes successfully
- [ ] Webhook receives payment event
- [ ] JSON updated with payment status
- [ ] Multi-payment flow works sequentially
- [ ] Routing logic works for all states

---

**Ready to test!** Start with Test 1 (push a JSON file) and work through systematically. 🚀
