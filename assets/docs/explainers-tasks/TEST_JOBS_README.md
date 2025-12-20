# Test Job JSON Files

This directory contains test JSON files for edge case testing. Use these to verify the system handles various scenarios correctly.

## Test Files

### 1. `test-single-payment.json`
- **Scenario**: Single payment project
- **Lookup**: Last Name: `Single`, Keyword: `single-payment-test`
- **Tests**: Basic single payment flow, no sequential logic needed

### 2. `test-multi-payment.json`
- **Scenario**: Three payments with mixed due types
- **Lookup**: Last Name: `Multi`, Keyword: `multi-payment-test`
- **Tests**: Sequential payments, date vs term due types

### 3. `test-already-signed.json`
- **Scenario**: Contract already signed
- **Lookup**: Last Name: `Signed`, Keyword: `already-signed`
- **Tests**: Routing skips contract page, goes straight to invoice

### 4. `test-partially-paid.json`
- **Scenario**: First payment completed, second pending
- **Lookup**: Last Name: `Partial`, Keyword: `partially-paid`
- **Tests**: Routing to correct pending payment, skipping completed ones

### 5. `test-all-paid.json`
- **Scenario**: All payments completed
- **Lookup**: Last Name: `Allpaid`, Keyword: `all-paid`
- **Tests**: Completion page routing, status handling

### 6. `test-special-chars.json`
- **Scenario**: Special characters in names (apostrophes, ampersands, hyphens)
- **Lookup**: Last Name: `O'Brien`, Keyword: `special-chars-test`
- **Tests**: URL encoding, JSON parsing, Stripe metadata handling

### 7. `test-long-description.json`
- **Scenario**: Very long payment descriptions
- **Lookup**: Last Name: `Longdesc`, Keyword: `long-description`
- **Tests**: Text truncation, Stripe description limits (500 chars), UI display

### 8. `test-four-payments.json`
- **Scenario**: Four payment milestones
- **Lookup**: Last Name: `Fourpay`, Keyword: `four-payments`
- **Tests**: Extended sequential payment flow, multiple pending payments

## Testing Checklist

### Stripe Catalog Creation
- [ ] All payments create separate Stripe Products (`{invoice_number}-{payment_number}`)
- [ ] Product names are correct format
- [ ] Metadata includes all required fields
- [ ] Prices match JSON amounts (converted to cents)
- [ ] JSON files updated with Stripe IDs

### Payment Routing
- [ ] Single payment → Direct to invoice
- [ ] Multiple payments → Routes to first pending
- [ ] Already signed → Skips contract page
- [ ] Partially paid → Routes to next pending payment
- [ ] All paid → Routes to completion page

### Edge Cases
- [ ] Special characters handled correctly in URLs
- [ ] Long descriptions truncated appropriately
- [ ] Four+ payments handled sequentially
- [ ] Mixed due types (date vs term) display correctly

### Webhook & Updates
- [ ] Payment success updates JSON correctly
- [ ] Contract signing updates JSON correctly
- [ ] Manifest only updates when lookup fields change
- [ ] Stripe catalog only updates when payment details change

## Usage

1. **Add test files to repo** (they're already created)
2. **Push to GitHub** - triggers workflow
3. **Check GitHub Actions** - verify Stripe products created
4. **Test payment flow** - use Stripe test cards
5. **Verify JSON updates** - check files after actions

## Stripe Test Cards

Use these for testing payments:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Any expiry date, any CVC, any ZIP.
