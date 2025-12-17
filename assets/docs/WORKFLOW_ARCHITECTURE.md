# Complete Workflow Architecture

## Overview

This document clarifies the complete flow of data updates, Stripe catalog synchronization, and JSON file management across all user interactions and system events.

---

## 1. Stripe Product Structure

### ✅ Confirmed: Each Payment = Separate Stripe Product

**Answer to Question 1**: Yes, each payment becomes a separate Stripe Product.

- **Format**: `{invoice_number}-{payment_number}` (e.g., `uid-abc-123-1`, `uid-abc-123-2`)
- **Why**: Allows tracking individual payment status, prevents paying wrong amount, enables sequential payment flow
- **Example**: Job `uid-abc-123` with 2 payments creates:
  - Product `uid-abc-123-1` ($1250 - Deposit)
  - Product `uid-abc-123-2` ($3750 - Final payment)

**Answer to Question 2**: Not one product with partial payments. Each payment is a separate Product/Price pair.

**Preventing Underpayment**: Stripe Payment Element uses the exact Price amount - user cannot pay less than the specified amount. The Price is locked to the Product, so they pay the exact amount or nothing.

---

## 2. GitHub Actions Workflow: JSON Changes → Stripe Catalog

### Workflow: `.github/workflows/process-job.yml`

**Trigger**: Any change to `assets/jobs/**/*.json`

**Steps**:

1. **Generate Manifest** (`python3 generate_manifest.py`)
   - Always runs (manifest may or may not change)

2. **Detect What Changed** (NEW - Critical!)
   - Compare current JSON with previous version
   - Identify:
     - **New payments** (payment objects without `stripe_product_id`)
     - **Payment amount changes** (amount changed but product exists)
     - **Non-payment changes** (contract.signed, payment.status, etc.)

3. **Selective Stripe API Calls** (NEW - Critical!)
   - **Only create/update Stripe Products when**:
     - New payment detected (no `stripe_product_id`)
     - Payment amount changed (need to update Price)
     - Payment description changed (update Product description)
   - **Skip Stripe API calls when**:
     - Only `contract.signed` changed
     - Only `payment.status` changed (paid_date, etc.)
     - Only non-payment fields changed

4. **Create/Update Stripe Products**
   - For each new payment: Create Product + Price
   - For each changed payment: Update existing Product/Price
   - Store `stripe_product_id`, `stripe_price_id`, `stripe_product_name` back in JSON

5. **Commit Changes**
   - Updated JSON files (with Stripe IDs)
   - Updated manifest.json (if changed)

---

## 3. User Actions → JSON Updates

### ⚠️ CRITICAL MISSING PIECE: JSON Update Mechanism

Currently, user actions only update `sessionStorage` - the JSON files in the repo are NOT updated. This needs to be fixed.

### 3.1 Contract Signing Flow

**Current State**: Updates sessionStorage only ❌

**Needed Flow**:
1. User fills signature fields
2. Clicks "Sign Contract"
3. **Frontend calls serverless function** (Vercel/Netlify)
4. **Serverless function calls GitHub Actions API** (workflow_dispatch)
5. **GitHub Action updates JSON file**:
   - Sets `contract.signed = true`
   - Sets `contract.signed_date = "2025-01-20"`
   - Sets `contract.signed_by = "Client Name"`
   - Sets signature fields
6. **Commits and pushes** updated JSON
7. **Frontend updates sessionStorage** and routes to invoice

**Why This Matters**: Next time user visits, JSON reflects signed status (not just sessionStorage).

### 3.2 Payment Success Flow

**Current State**: Updates sessionStorage only ❌

**Needed Flow**:
1. User completes payment via Stripe Payment Element
2. **Stripe sends webhook** to serverless function
3. **Serverless function calls GitHub Actions API** (workflow_dispatch)
4. **GitHub Action updates JSON file**:
   - Sets `payment.status = "paid"`
   - Sets `payment.paid_date = "2025-01-20"`
   - Sets `payment.paid_date_unix = 1737417600`
5. **Commits and pushes** updated JSON
6. **Frontend receives success** and routes to next payment/completion

**Alternative (if webhook not ready)**: Frontend can call serverless function directly after payment success, but webhook is more reliable.

---

## 4. Stripe Webhook → JSON Update

### Webhook Events Needed

- `payment_intent.succeeded` - Payment completed
- `payment_intent.payment_failed` - Payment failed (optional, for logging)

### Webhook Flow

1. **Stripe sends webhook** to serverless function endpoint
2. **Serverless function validates** webhook signature
3. **Extracts payment info**:
   - `payment_intent.metadata.job_id`
   - `payment_intent.metadata.payment_number`
4. **Calls GitHub Actions API** (workflow_dispatch) with:
   - Job ID
   - Payment number
   - Payment status
   - Paid date
5. **GitHub Action updates JSON**:
   - Finds job JSON file
   - Updates specific payment object
   - Commits and pushes

**Why Webhook**: More reliable than frontend callback (handles edge cases like user closing browser).

---

## 5. Selective Stripe Catalog Updates

### When to Update Stripe Catalog

**✅ Update Stripe Catalog**:
- New payment added to JSON
- Payment amount changed
- Payment description changed
- Payment due date changed (if stored in metadata)

**❌ Skip Stripe Catalog Update**:
- Contract signed status changed
- Payment status changed (paid/unpaid)
- Payment paid_date updated
- Non-payment fields changed (client info, project scope, etc.)

### Implementation Logic

```python
# Pseudo-code for GitHub Action
def should_update_stripe(json_file, previous_version):
    if not previous_version:
        return True  # New file, create all products
    
    # Check each payment
    for payment in json_file['payments']:
        prev_payment = find_previous_payment(payment['payment_number'], previous_version)
        
        if not prev_payment:
            return True  # New payment
        
        if payment['amount'] != prev_payment['amount']:
            return True  # Amount changed
        
        if payment['description'] != prev_payment['description']:
            return True  # Description changed
        
        if not payment.get('stripe_product_id'):
            return True  # Missing Stripe ID
    
    return False  # No Stripe updates needed
```

---

## 6. Manifest Updates

### When Manifest Changes

**Manifest changes when**:
- New JSON file added
- JSON file deleted
- `client.last_name` changed
- `client.project_keyword` changed

**Manifest does NOT change when**:
- Contract signed
- Payment status updated
- Payment amounts changed (if Stripe IDs already exist)
- Non-lookup fields changed

**Result**: Most user actions (signing, paying) won't change manifest, but workflow will still run (harmless - just checks for changes and skips if none).

---

## 7. Complete Flow Examples

### Example 1: New Job Added

1. **You create** `assets/jobs/uid-abc-123.json` with 2 payments
2. **Push to GitHub**
3. **GitHub Action triggers**:
   - Generates manifest (adds `smith-art-website` → `assets/jobs/uid-abc-123.json`)
   - Detects 2 new payments (no Stripe IDs)
   - Creates Stripe Products:
     - `uid-abc-123-1` ($1250)
     - `uid-abc-123-2` ($3750)
   - Updates JSON with Stripe IDs
   - Commits manifest + updated JSON

### Example 2: User Signs Contract

1. **User visits** site, enters last name + keyword
2. **Views contract**, fills signature fields
3. **Clicks "Sign Contract"**
4. **Frontend calls** serverless function `/api/sign-contract`
5. **Serverless function calls** GitHub Actions API (workflow_dispatch)
6. **GitHub Action**:
   - Loads JSON file
   - Updates `contract.signed = true`, signature fields
   - Commits and pushes
   - **Skips Stripe API calls** (no payment changes)
   - **Manifest unchanged** (lookup fields same)
7. **Frontend routes** to invoice page

### Example 3: User Pays First Payment

1. **User views invoice** for payment #1
2. **Clicks "Pay Now"**, completes Stripe checkout
3. **Stripe processes payment**
4. **Stripe sends webhook** to serverless function
5. **Serverless function calls** GitHub Actions API
6. **GitHub Action**:
   - Loads JSON file
   - Updates `payments[0].status = "paid"`, `paid_date`, etc.
   - Commits and pushes
   - **Skips Stripe API calls** (no new/changed payments)
   - **Manifest unchanged**
7. **Frontend routes** to payment #2 invoice (or completion if last payment)

### Example 4: User Returns Later (Contract Already Signed)

1. **User visits** site, enters last name + keyword
2. **Payment router** checks JSON (not just sessionStorage)
3. **JSON shows** `contract.signed = true`, `payment[0].status = "paid"`
4. **Routes to** payment #2 invoice (skips contract, skips payment #1)

---

## 8. Implementation Checklist

### Phase 2 Tasks

- [ ] **GitHub Actions Workflow** (`.github/workflows/process-job.yml`)
  - [ ] Generate manifest
  - [ ] Detect JSON changes (compare with previous version)
  - [ ] Selective Stripe API calls (only for payment changes)
  - [ ] Create/update Stripe Products/Prices
  - [ ] Update JSON with Stripe IDs
  - [ ] Commit and push

- [ ] **Serverless Functions** (Vercel/Netlify)
  - [ ] `/api/sign-contract` - Updates contract signed status
  - [ ] `/api/update-payment` - Updates payment status (called by webhook)
  - [ ] `/api/create-payment-intent` - Creates PaymentIntent for checkout

- [ ] **Stripe Webhook**
  - [ ] Configure webhook endpoint
  - [ ] Handle `payment_intent.succeeded` event
  - [ ] Validate webhook signature
  - [ ] Extract metadata (job_id, payment_number)
  - [ ] Call GitHub Actions API

- [ ] **Frontend Updates**
  - [ ] Contract signing calls serverless function
  - [ ] Payment success handles webhook callback
  - [ ] Payment router checks JSON (not just sessionStorage)

---

## 9. Key Insights

1. **Each payment = separate Stripe Product** ✅ Confirmed
2. **Selective Stripe updates** - Only when payment details change
3. **JSON updates required** - User actions must update repo JSON files
4. **Webhook recommended** - More reliable than frontend callbacks
5. **Manifest rarely changes** - Only when lookup fields change
6. **Workflow runs often** - But intelligently skips unnecessary steps

---

## 10. Questions Answered

**Q1**: Will it add single JSON job with 2+ payments as different products?
**A**: Yes, each payment becomes `{invoice_number}-{payment_number}` (e.g., `uid-123-1`, `uid-123-2`)

**Q2**: Or one product with partial payments?
**A**: No, separate products. Stripe Price locks the amount - user pays exact amount or nothing.

**Q3**: How does it know which payment to request from catalog?
**A**: Payment router determines which payment is next, checkout page uses `payment_number` to construct Product name or lookup via `stripe_price_id` stored in JSON.

**Q4**: How are JSON updates triggered from user actions?
**A**: Frontend → Serverless function → GitHub Actions API → Updates JSON → Commits

**Q5**: How does payment success update JSON?
**A**: Stripe webhook → Serverless function → GitHub Actions API → Updates JSON → Commits

**Q6**: Does manifest change when contract signed/payment made?
**A**: No, manifest only changes when lookup fields (`last_name`, `project_keyword`) change.

**Q7**: How do we prevent unnecessary Stripe API calls?
**A**: Compare JSON versions, only update Stripe when payment details change (new payment, amount change, etc.)

---

**Status**: Architecture clarified. Ready to implement Phase 2 workflows.
