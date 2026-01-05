# v4 Schema Updates

**Version:** 4.0  
**Date:** 2026-01-04  
**Status:** Production-ready

## Summary

v4 schema simplifies and flattens the job JSON structure, aligns field names with Stripe vocabulary, and introduces PDF generation from Google Docs templates.

## Key Changes

### 1. Flattened Structure
- Removed `metadata` nesting level throughout
- Direct field access (e.g., `product.login_name` instead of `product.metadata.login_name`)

### 2. Field Name Shortening
- `product_object` → `product`
- `state_management` → `state`
- `initial_price_object` → `price1`
- `balance_price_object` → `price2`
- `customer_object` → `customer`

### 3. Price Object Updates
- `state.objects.initial_price` → `state.objects.price_1`
- `state.objects.balance_price` → `state.objects.price_2`
- Removed `metadata.payment_number` (use `price1.count`, `price2.count`)

### 4. Customer Object Simplification
- `customer_object.description` → `customer.title` (stored in Stripe metadata)
- `customer_object.individual_name` → `customer.name`
- `customer_object.business_name` → `customer.business`

### 5. Checkout Session Updates
- `initial_checkout_session` → `checkout_session_1`
- `balance_checkout_session` → `checkout_session_2`
- Sessions created on-demand (not stored in JSON)

### 6. PDF Generation (NEW)
- PDFs generated from Google Docs templates immediately after Stripe object creation
- PDFs stored in repository: `assets/pdf/contract/kon-{job_id}.pdf` and `assets/pdf/invoice/inv-{job_id}.pdf`
- PDF metadata stored in `docs.contract` and `docs.invoice` objects
- No HTML fallback rendering (PDF-only display)

### 7. ID Prefixes
- Contract IDs: `kon-{job_id}` (e.g., `kon-uid-test-001`)
- Invoice IDs: `inv-{job_id}` (e.g., `inv-uid-test-001`)
- Customer IDs: `cus-{id}` (when using custom IDs)
- Coupon IDs: `cou-{id}` (when using custom IDs)

## Breaking Changes

1. **No HTML Rendering**: Frontend displays PDFs only. If PDF generation fails, error is shown (no HTML fallback).

2. **Manifest Structure**: Manifest uses `login_keyword` as lookup key, with `login_name` and `login_keyword` stored as separate fields in each entry.

3. **State Management**: Payment status tracked in `state.payment_1` and `state.payment_2` (not `state_management.initial_payment_intent`).

## Migration Notes

- Existing v3 jobs need to be migrated to v4 schema
- PDFs will be generated automatically for new jobs
- Old HTML rendering code removed (PDF-only approach)

## Files Changed

- `.github/scripts/pdf/generate_pdfs.py` - PDF generation from Google Docs
- `.github/scripts/orchestration/sync_catalog.py` - Updated for v4 schema
- `assets/js/payment-lookup.js` - Updated manifest lookup logic
- `assets/js/contract-controller.js` - PDF-only rendering
- `assets/js/invoice-controller.js` - PDF-only rendering
- All job JSON files - Schema migration required
