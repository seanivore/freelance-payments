# Final Updates & Testing Plan
*Freelance Payments Micro-Site - Final Testing Protocol*

**Purpose:** This document guides the final updates and systematic testing before the site goes live. Each section can be completed independently and removed once finished.

**Status:** Ready to begin
**Last Updated:** 2025-12-20

---

## Part 1: Consolidate Workflow Automation with Conditional Steps

### Current Problem

The GitHub Actions workflow (`.github/workflows/process-job.yml`) currently handles:
- ✅ JSON file changes → Manifest generation + Stripe sync
- ❌ User signs contract → workflow_dispatch triggered but NOT handled
- ❌ User makes payment → workflow_dispatch triggered but NOT handled

**Symptoms:**
- Workflows "cancel" when they're not supposed to (causing error emails)
- Contract signing doesn't update JSON files
- Payment completion doesn't update JSON files
- Multiple workflows run when they should be one unified flow

### The Fix: Single Workflow with Conditional Steps

**Concept:**
Instead of separate workflows that sometimes conflict, create ONE workflow that:
1. Detects the trigger type (push vs workflow_dispatch)
2. Detects the action type (file change, sign-contract, update-payment)
3. Executes only the relevant steps based on conditions

**Implementation Plan:**

#### Step 1: Create Python Helper Script
**File:** `.github/scripts/update_job_json.py`

This script will handle JSON updates for both contract signing and payment updates:

```python
#!/usr/bin/env python3
"""
Update job JSON files with state changes (contract signing, payment updates)
Called by GitHub Actions workflow with specific action types
"""

import json
import sys
from pathlib import Path
from datetime import datetime

def update_contract_signed(job_id, signature_data):
    """Update contract.signed field and signature data"""
    # Load JSON file
    # Update contract.signed = true
    # Update signature fields
    # Save JSON file
    pass

def update_payment_status(job_id, payment_number, payment_data):
    """Update payment status when payment succeeds"""
    # Load JSON file
    # Find payment by payment_number
    # Update status, paid_date, paid_date_unix
    # Save JSON file
    pass

if __name__ == '__main__':
    action = sys.argv[1]
    job_id = sys.argv[2]

    if action == 'sign-contract':
        signature_data = json.loads(sys.argv[3])
        update_contract_signed(job_id, signature_data)
    elif action == 'update-payment':
        payment_number = int(sys.argv[3])
        payment_data = json.loads(sys.argv[4])
        update_payment_status(job_id, payment_number, payment_data)
```

#### Step 2: Update Workflow File
**File:** `.github/workflows/process-job.yml`

Add conditional steps:

```yaml
- name: Handle Contract Signing
  if: github.event.inputs.action == 'sign-contract'
  run: |
    python3 .github/scripts/update_job_json.py \
      sign-contract \
      "${{ github.event.inputs.job_id }}" \
      '${{ github.event.inputs.signature_data }}'

- name: Handle Payment Update
  if: github.event.inputs.action == 'update-payment'
  run: |
    python3 .github/scripts/update_job_json.py \
      update-payment \
      "${{ github.event.inputs.job_id }}" \
      "${{ github.event.inputs.payment_number }}" \
      '${{ github.event.inputs.payment_data }}'

- name: Generate Manifest
  if: github.event_name == 'push' || steps.json-changed.outputs.changed == 'true'
  run: python3 generate_manifest.py

- name: Process Stripe Products
  if: github.event_name == 'push'
  env:
    STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
  run: python3 .github/scripts/process_stripe_products.py
```

#### Step 3: Adjust Commit Logic
Only commit if there are actual changes:

```yaml
- name: Check for any changes
  id: changes-detected
  run: |
    if [ -n "$(git status --porcelain)" ]; then
      echo "changed=true" >> $GITHUB_OUTPUT
    else
      echo "changed=false" >> $GITHUB_OUTPUT
    fi

- name: Commit and push changes
  if: steps.changes-detected.outputs.changed == 'true'
  run: |
    git config --local user.email "action@github.com"
    git config --local user.name "GitHub Action"
    git add -A
    git commit -m "🤖 Auto-update: ${{ github.event.inputs.action || 'manifest and catalog' }}"
    git push
```

### Expected Outcome

After this fix:
- ✅ ONE workflow handles all three trigger types
- ✅ No more "canceled" workflows (no conflicts)
- ✅ Contract signing updates JSON → commits → pushes
- ✅ Payment completion updates JSON → commits → pushes
- ✅ JSON file changes still trigger manifest + Stripe sync
- ✅ No more confusing error emails

---

## Part 2: Clean Up Test JSON Files

### Files to Clean
All test files in `assets/docs/W_I_P/`:
- test-all-paid.json
- test-already-signed.json
- test-four-payments.json
- test-long-description.json
- test-multi-payment.json
- test-partially-paid.json
- test-single-payment.json
- test-special-chars.json

### Fields to Remove

These fields are **written by automation** and should be `null` or empty in fresh test files:

**For each payment in `payments[]` array:**
```json
"stripe_product_id": null,           // Remove actual ID
"stripe_price_id": null,              // Remove actual ID
"stripe_product_name": null,          // Remove actual name
"stripe_metadata": {}                 // Empty object
```

**For contract (when testing unsigned state):**
```json
"signed": false,                      // Keep false for testing
"signed_date": null,                  // Remove any date
"signed_by": null,                    // Remove any name
"contractor_signature": null,         // Remove signature
"contractor_date": null,              // Remove date
"client_date": null                   // Remove date
```

**For payments (when testing unpaid state):**
```json
"status": "pending",                  // Keep pending for testing
"paid_date": null,                    // Remove any date
"paid_date_unix": null                // Remove any timestamp
```

### Special Cases

**test-already-signed.json:**
- Keep `contract.signed: true`
- Keep signature fields populated
- This tests the "return user" flow

**test-partially-paid.json:**
- First payment: Set `status: "paid"` with dates
- Second payment: Set `status: "pending"` with null dates
- This tests multi-payment routing

**test-all-paid.json:**
- All payments: Set `status: "paid"` with dates
- This tests completion page routing

**All others:**
- Clean slate: unsigned contract, unpaid payments

### Automation

AI will programmatically:
1. Read each JSON file
2. Set Stripe fields to null/empty (except for special test cases)
3. Reset state fields as appropriate
4. Save cleaned files
5. Confirm ready for testing

---

## Part 3: Systematic Testing Plan

### Overview

**Testing Environment:**
- Live site: https://payments.august.style
- Test mode: Stripe test keys
- Monitoring: GitHub Actions, Stripe Dashboard, Vercel logs

**Test Files:**
8 test JSON files covering all scenarios (cleaned in Part 2)

**Logging Tools:**
```bash
# GitHub Actions
gh run list --repo seanivore/freelance-payments --limit 10
gh run view <run-id> --log
gh run watch  # Real-time monitoring

# Stripe
stripe logs tail
stripe events list --limit 10
stripe products list

# Vercel
vercel logs --prod
vercel logs --function api/webhook --follow
```

---

### Phase 1: JSON Manipulation & Stripe Sync (Foundation)

**Must work perfectly before moving to Phase 2**

#### Test 1.1: Add Single Test Job
**Goal:** Verify basic workflow: JSON → Manifest → Stripe → JSON updated

**Steps:**
1. Copy test file to jobs directory:
   ```bash
   cp assets/docs/W_I_P/test-single-payment.json assets/jobs/
   git add assets/jobs/test-single-payment.json
   git commit -m "Test 1.1: Add single payment job"
   git push
   ```

2. Monitor GitHub Actions:
   ```bash
   gh run watch
   ```

3. Check workflow logs:
   - ✅ Manifest generated
   - ✅ Stripe product created
   - ✅ JSON file updated with Stripe IDs
   - ✅ Changes committed and pushed

4. Verify Stripe Dashboard:
   - Product exists: `uid-test-001-1`
   - Price: $1,000.00
   - Metadata populated

5. Pull and verify JSON:
   ```bash
   git pull
   cat assets/jobs/test-single-payment.json | grep stripe_product_id
   ```
   Should see actual IDs, not null

**Expected Result:**
- Workflow completes successfully (green checkmark)
- No cancellations or errors
- JSON file has Stripe IDs
- Manifest has new entry

**If this fails, stop and debug before continuing.**

---

#### Test 1.2: Add Multiple Test Jobs
**Goal:** Verify batch processing works

**Steps:**
1. Add 3 more test files at once:
   ```bash
   cp assets/docs/W_I_P/test-multi-payment.json assets/jobs/
   cp assets/docs/W_I_P/test-special-chars.json assets/jobs/
   cp assets/docs/W_I_P/test-long-description.json assets/jobs/
   git add assets/jobs/
   git commit -m "Test 1.2: Add multiple jobs"
   git push
   ```

2. Monitor workflow

3. Verify:
   - All JSON files updated with Stripe IDs
   - All products in Stripe catalog
   - Manifest has all 4 entries
   - Special characters handled correctly (O'Brien)

**Expected Result:**
- 4 total jobs in system
- test-multi-payment: 3 products created (one per payment)
- test-special-chars: Special characters preserved
- test-long-description: Description truncated if needed

---

#### Test 1.3: Edit Existing Job (Change Payment Amount)
**Goal:** Verify updates work, new price created

**Steps:**
1. Edit test-single-payment.json:
   - Change payment amount from $1,000 to $1,200
   ```bash
   # Edit file manually or with script
   git add assets/jobs/test-single-payment.json
   git commit -m "Test 1.3: Update payment amount"
   git push
   ```

2. Monitor workflow

3. Verify:
   - New Stripe price created (can't modify existing prices)
   - JSON updated with new `stripe_price_id`
   - Old price still exists (Stripe doesn't delete)
   - Product metadata unchanged

**Expected Result:**
- New price ID in JSON
- Product updated, new price created
- No duplicate products

---

#### Test 1.4: Delete Job File
**Goal:** Verify orphaned product deletion works

**Steps:**
1. Delete one test file:
   ```bash
   git rm assets/jobs/test-long-description.json
   git commit -m "Test 1.4: Remove test job"
   git push
   ```

2. Monitor workflow

3. Check Stripe Dashboard:
   - Product should be deleted (or archived)
   - Verify by searching for job_id in Stripe

4. Verify manifest:
   - Entry removed from manifest.json
   - Only 3 entries remain

**Expected Result:**
- Stripe product deleted automatically
- Manifest updated
- No orphaned products

**Critical Check:** Run Stripe product list:
```bash
stripe products list --limit 100
```
Should only see products for files that exist in assets/jobs/

---

### Phase 2: User Interaction Flows

**Prerequisites:** Phase 1 must be 100% working

#### Test 2.1: Contract Signing Flow
**Goal:** Verify contract signing updates JSON via workflow_dispatch

**Steps:**
1. Use test-single-payment job (already in system)

2. Visit site:
   ```
   https://payments.august.style/
   ```

3. Lookup:
   - Last Name: `Single`
   - Keyword: `single-payment-test`
   - Click "Look Up Payment"

4. Should route to contract page (contract.signed = false)

5. Fill signature fields:
   - Contractor Signature: `Sean Horvath`
   - Contractor Date: Today's date
   - Client Signature: `Jane Single`
   - Client Date: Today's date

6. Click "Sign Contract"

7. Monitor workflow:
   ```bash
   gh run watch
   ```

8. Verify workflow triggered:
   - Check GitHub Actions → Should see new run
   - Action type: `sign-contract`
   - Job ID: `uid-test-001`

9. Pull and verify JSON:
   ```bash
   git pull
   cat assets/jobs/test-single-payment.json | grep signed
   ```
   Should see: `"signed": true`

10. Frontend should redirect to invoice page

**Expected Result:**
- Workflow triggered via workflow_dispatch
- JSON updated with signature data
- Changes committed automatically
- Frontend routes to invoice

**If this fails:** Check Vercel logs, webhook signature, GitHub token permissions

---

#### Test 2.2: Single Payment Flow
**Goal:** Verify payment success updates JSON via webhook

**Steps:**
1. Continue from Test 2.1 (on invoice page)

2. Click "Pay Now" → Routes to checkout

3. Stripe Payment Element should load

4. Enter test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - ZIP: `12345`

5. Click "Pay $1,000.00"

6. Monitor all logs simultaneously:
   ```bash
   # Terminal 1: GitHub Actions
   gh run watch

   # Terminal 2: Stripe events
   stripe logs tail

   # Terminal 3: Vercel
   vercel logs --function api/webhook --follow
   ```

7. Verify webhook flow:
   - Stripe sends `payment_intent.succeeded`
   - Vercel receives webhook
   - Vercel validates signature
   - Vercel calls `/api/update-payment`
   - GitHub Actions triggered
   - JSON updated

8. Pull and verify JSON:
   ```bash
   git pull
   cat assets/jobs/test-single-payment.json
   ```
   Should see:
   - `"status": "paid"`
   - `"paid_date": "2025-01-XX"`
   - `"paid_date_unix": 1737XXXXXX`

9. Frontend should route to completion page

**Expected Result:**
- Payment processed successfully
- Webhook received and validated
- Workflow triggered
- JSON updated
- Completion page displayed

---

#### Test 2.3: Multi-Payment Sequential Flow
**Goal:** Verify sequential payment routing

**Setup:**
1. Use test-multi-payment.json (3 payments: $5k, $5k, $5k)
2. Already added in Test 1.2

**Steps:**
1. Lookup: `Multi` / `multi-payment-test`

2. Sign contract (same as Test 2.1)

3. Pay first payment ($5,000)
   - Should redirect to invoice for payment #2

4. Check JSON after first payment:
   ```bash
   git pull
   # Payment 1: status = "paid"
   # Payment 2: status = "pending"
   # Payment 3: status = "pending"
   ```

5. Pay second payment ($5,000)
   - Should redirect to invoice for payment #3

6. Check JSON after second payment:
   ```bash
   git pull
   # Payment 1: status = "paid"
   # Payment 2: status = "paid"
   # Payment 3: status = "pending"
   ```

7. Pay third payment ($5,000)
   - Should redirect to completion page

8. Check JSON after third payment:
   ```bash
   git pull
   # All payments: status = "paid"
   ```

**Expected Result:**
- Sequential routing works correctly
- Each payment updates JSON independently
- Completion page shows after final payment

---

#### Test 2.4: Return User (Already Signed)
**Goal:** Verify state persistence and routing

**Setup:**
1. Use test-already-signed.json (contract.signed = true)
2. Add to jobs directory:
   ```bash
   cp assets/docs/W_I_P/test-already-signed.json assets/jobs/
   git add assets/jobs/test-already-signed.json
   git commit -m "Test 2.4: Add already-signed job"
   git push
   ```

**Steps:**
1. Lookup: `Signed` / `already-signed`

2. Should skip contract page entirely
   - Routes directly to invoice

3. Verify contract page is not shown

4. Pay invoice

5. Should complete successfully

**Expected Result:**
- State machine correctly detects signed contract
- Skips contract page
- Routes directly to payment flow

---

#### Test 2.5: Partially Paid (Return User)
**Goal:** Verify routing to correct pending payment

**Setup:**
1. Use test-partially-paid.json (payment 1 paid, payment 2 pending)
2. Add to jobs directory:
   ```bash
   cp assets/docs/W_I_P/test-partially-paid.json assets/jobs/
   git add assets/jobs/test-partially-paid.json
   git commit -m "Test 2.5: Add partially-paid job"
   git push
   ```

**Steps:**
1. Lookup: `Partial` / `partially-paid`

2. Should route to payment #2 invoice (skip payment #1)

3. Verify invoice shows second payment only

4. Pay second payment

5. Should route to completion page

**Expected Result:**
- Skips paid payment
- Routes to first pending payment
- Completion after final payment

---

#### Test 2.6: All Payments Completed
**Goal:** Verify completion page routing

**Setup:**
1. Use test-all-paid.json (all payments paid)
2. Add to jobs directory:
   ```bash
   cp assets/docs/W_I_P/test-all-paid.json assets/jobs/
   git add assets/jobs/test-all-paid.json
   git commit -m "Test 2.6: Add all-paid job"
   git push
   ```

**Steps:**
1. Lookup: `Allpaid` / `all-paid`

2. Should route directly to completion page

3. Verify no payment prompts shown

4. Completion message displayed

**Expected Result:**
- State machine detects all payments complete
- Routes to completion page
- No payment or contract prompts

---

### Phase 3: Edge Cases & Stress Testing

#### Test 3.1: Special Characters
**Goal:** Verify URL encoding, metadata handling

**Already added in Test 1.2**

**Steps:**
1. Lookup: `O'Brien` / `special-chars-test`
2. Complete full flow (sign + pay)
3. Verify special characters preserved in:
   - URLs
   - Stripe metadata
   - JSON file
   - Contract display

**Expected Result:**
- Apostrophe handled correctly
- No encoding errors
- Data integrity maintained

---

#### Test 3.2: Four Payment Flow
**Goal:** Verify extended sequential flow

**Setup:**
```bash
cp assets/docs/W_I_P/test-four-payments.json assets/jobs/
git add assets/jobs/test-four-payments.json
git commit -m "Test 3.2: Add four-payment job"
git push
```

**Steps:**
1. Complete full flow: sign + pay all 4 payments
2. Verify routing between each payment
3. Check JSON after each payment

**Expected Result:**
- All 4 payments process sequentially
- No routing errors
- Completion after 4th payment

---

### Testing Checklist

Use this checklist to track progress:

#### Phase 1: Foundation
- [ ] Test 1.1: Single job added (Stripe product created, JSON updated)
- [ ] Test 1.2: Multiple jobs added (batch processing works)
- [ ] Test 1.3: Payment amount changed (new price created)
- [ ] Test 1.4: Job deleted (orphaned product removed)

#### Phase 2: User Flows
- [ ] Test 2.1: Contract signing (JSON updated via workflow_dispatch)
- [ ] Test 2.2: Single payment (webhook triggers, JSON updated)
- [ ] Test 2.3: Multi-payment sequential (3 payments in order)
- [ ] Test 2.4: Return user - already signed (skips contract)
- [ ] Test 2.5: Return user - partially paid (routes to pending)
- [ ] Test 2.6: All paid (routes to completion)

#### Phase 3: Edge Cases
- [ ] Test 3.1: Special characters (O'Brien handles correctly)
- [ ] Test 3.2: Four payments (extended flow works)

---

### Success Criteria

Before going live, ALL of the following must be true:

**GitHub Actions:**
- ✅ No workflow cancellations
- ✅ No error emails
- ✅ All workflows complete successfully
- ✅ Logs are clean and informative

**Stripe:**
- ✅ Products created correctly
- ✅ Orphaned products deleted
- ✅ Metadata populated
- ✅ Prices accurate (converted to cents)

**JSON Files:**
- ✅ Stripe IDs written back
- ✅ Contract signing updates persist
- ✅ Payment status updates persist
- ✅ No manual intervention needed

**User Experience:**
- ✅ Lookup works (manifest accurate)
- ✅ Contract displays correctly
- ✅ Signature form works
- ✅ Invoice displays correct payment
- ✅ Stripe Payment Element loads
- ✅ Payment processes successfully
- ✅ State machine routes correctly
- ✅ Completion page displays

**Webhooks:**
- ✅ Stripe webhooks received
- ✅ Signature validation works
- ✅ Vercel functions execute
- ✅ GitHub Actions triggered
- ✅ JSON updated automatically

---

### Cleanup After Testing

Once all tests pass:

1. **Remove test jobs:**
   ```bash
   git rm assets/jobs/test-*.json
   git commit -m "Clean up test files"
   git push
   ```

2. **Verify Stripe cleanup:**
   ```bash
   stripe products list
   # Should see no test products
   ```

3. **Verify manifest:**
   ```bash
   cat assets/js/manifest.json
   # Should be empty or minimal
   ```

4. **Ready for production:**
   - Add real client jobs
   - Switch to live Stripe keys (when ready)
   - Update Stripe webhook to production endpoint

---

## Troubleshooting Guide

### Workflow Cancellations
**Symptom:** Workflows cancel unexpectedly

**Check:**
1. Multiple workflows triggering simultaneously?
2. Git conflicts causing issues?
3. Check workflow logs for specific errors

**Fix:**
- Ensure only one workflow definition
- Use conditional steps to prevent conflicts

### JSON Not Updating
**Symptom:** Contract signing or payment success doesn't update JSON

**Check:**
1. Vercel function logs: `vercel logs --function api/webhook`
2. GitHub Actions logs: `gh run view <run-id> --log`
3. Webhook signature validation

**Fix:**
- Verify GITHUB_TOKEN has write permissions
- Check webhook secret matches Stripe
- Ensure workflow_dispatch handler exists

### Stripe Products Not Deleted
**Symptom:** Deleting JSON file doesn't remove Stripe product

**Check:**
1. Workflow logs - did deletion step run?
2. Stripe API errors?
3. Job ID matching correctly?

**Fix:**
- Verify job_id in Stripe metadata matches JSON
- Check deletion logic in process_stripe_products.py
- Manually verify with: `stripe products list`

### Payment Element Not Loading
**Symptom:** Checkout page blank or errors

**Check:**
1. Browser console errors
2. Stripe publishable key correct?
3. Network tab - API calls succeeding?

**Fix:**
- Verify publishable key (pk_test_...)
- Check CORS settings in Vercel
- Verify create-payment-intent function works

---

## Log Monitoring Commands

**During testing, run these in separate terminals:**

```bash
# Terminal 1: GitHub Actions
gh run watch

# Terminal 2: Stripe Events
stripe logs tail

# Terminal 3: Vercel Functions
vercel logs --prod --follow

# Terminal 4: Pull changes
watch -n 10 'git pull'
```

---

**END OF DOCUMENT**

*Delete completed sections as you progress. This document is designed to be self-contained for any AI context.*
