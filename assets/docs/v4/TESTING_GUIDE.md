# Testing Guide

**Last Updated:** 2026-01-04  
**System Version:** v4

## Stripe Test Cards

Use these test card numbers in Stripe's test mode:

### Success Cards
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., `12/34`)
- **CVC:** Any 3 digits (e.g., `123`)
- **Result:** Payment succeeds immediately

### Decline Cards
- **Card Number:** `4000 0000 0000 0002`
- **Expiry:** Any future date
- **CVC:** Any 3 digits
- **Result:** Card declined

### 3D Secure Authentication
- **Card Number:** `4000 0027 6000 3184`
- **Expiry:** Any future date
- **CVC:** Any 3 digits
- **Result:** Requires 3D Secure authentication

### Additional Test Cards
- **Insufficient Funds:** `4000 0000 0000 9995`
- **Lost Card:** `4000 0000 0000 9987`
- **Stolen Card:** `4000 0000 0000 9979`

## Testing Workflow

### 1. Create Test Job

Create a new job JSON file in `assets/jobs/`:

```json
{
  "product": {
    "id": "uid-test-001",
    "name": "Test Project",
    "login_name": "Test",
    "login_keyword": "test-project",
    "total_payments": 2
  },
  "customer": {
    "name": "Test Client",
    "email": "test@example.com"
  },
  "price1": {
    "unit_amount": 100000
  },
  "price2": {
    "unit_amount": 150000
  }
}
```

### 2. Push to Trigger Workflow

```bash
git add assets/jobs/uid-test-001.json
git commit -m "Test: Add test job"
git push
```

### 3. Verify Stripe Objects Created

Check GitHub Actions logs for:
- ✅ Product created
- ✅ 2 Prices created
- ✅ Customer created
- ✅ Stripe IDs saved to JSON

### 4. Verify PDFs Generated

Check workflow logs for:
- ✅ Contract PDF generated: `assets/pdf/contract/kon-uid-test-001.pdf`
- ✅ Invoice PDF generated: `assets/pdf/invoice/inv-uid-test-001.pdf`
- ✅ PDF metadata saved to JSON

### 5. Test Login Lookup

1. Visit `https://payments.august.style/`
2. Enter:
   - **Last Name:** `Test`
   - **Project Keyword:** `test-project`
3. Click "Look Up Payment"
4. Should redirect to job page

### 6. Test Contract Viewing

1. After login, should see contract PDF embedded
2. Verify PDF loads correctly
3. Test download button
4. Test sign button (if contract not signed)

### 7. Test Invoice Viewing

1. Navigate to invoice section (`#invoice`)
2. Verify invoice PDF loads
3. Verify amounts are correct
4. Test download button

### 8. Test Checkout Flow

1. Navigate to payment section (`#payment-1` or `#payment-2`)
2. Click "Pay Now" button
3. Use test card `4242 4242 4242 4242`
4. Complete payment
5. Verify redirect to completion page
6. Check Stripe Dashboard for successful payment

### 9. Verify Webhook Handling

1. After payment, check GitHub Actions for webhook-triggered workflow
2. Verify payment status updated in JSON
3. Verify state.payment_1.succeeded or state.payment_2.succeeded set to true

## Common Test Scenarios

### Single Payment Job
- Create job with `total_payments: 1`
- Only `price1` should be created
- Only one checkout section should appear

### Two Payment Job
- Create job with `total_payments: 2`
- Both `price1` and `price2` should be created
- Two checkout sections should appear
- After first payment, second payment should become available

### Job with Coupon
- Add `coupon` object with `amount_off > 0`
- Verify coupon applied to first payment only
- Verify discount reflected in invoice

### Contract Signing Flow
1. View contract
2. Click "Sign Contract"
3. Verify signature saved
4. Verify state updated
5. Verify routing to next step (invoice or payment)

### Payment Completion Flow
1. Complete first payment
2. Verify state.payment_1.succeeded = true
3. Verify routing to second payment (if applicable)
4. Complete second payment
5. Verify state.payment_2.succeeded = true
6. Verify routing to completion page

## Debugging Tips

### PDF Not Loading
- Check browser console for errors
- Verify PDF file exists in repository
- Check PDF URL in JSON (`docs.contract.url` or `docs.invoice.url`)
- Verify PDF file is accessible (not 404)

### Login Not Working
- Check manifest.json has correct entry
- Verify `login_name` and `login_keyword` match exactly (case-insensitive)
- Check browser console for lookup errors
- Verify job JSON file exists

### Stripe Objects Not Created
- Check GitHub Actions logs for errors
- Verify `STRIPE_SECRET_KEY` is set correctly
- Check Stripe Dashboard for API errors
- Verify job JSON has required fields

### Payment Not Processing
- Verify Stripe test mode is enabled
- Check browser console for Stripe.js errors
- Verify checkout session created successfully
- Check Stripe Dashboard for payment attempts

## Test Data Cleanup

After testing, clean up:
1. Remove test job JSON files from `assets/jobs/`
2. Archive Stripe test products in Stripe Dashboard
3. Remove test PDFs from repository (optional)
