# Schema Migration Recovery Plan - Updated

**Created:** 2025-12-21  
**Status:** Ready for Implementation  
**Purpose:** Recover project by migrating to new JSON schema (`_job_template_v2.json`) with modular workflows

---

## Executive Summary

This plan recreates all JavaScript files, updates Python scripts, and creates modular workflows to match the new JSON schema. Key improvements:

1. **Umbrella Orchestrator**: Single script coordinates all workflows, commits everything, then pushes ONCE (eliminates cancellation issues)
2. **Early Conditional Checks**: Verify `sync = true` flags before running workflows
3. **Simplified Sync Logic**: Clear 5-step process for product and price syncing
4. **Single Manifest Build**: Generate manifest once at end of workflow chain
5. **Git Auto-Pull**: Configure automatic pull before push
6. **Testing Pauses**: Stop between workflow tests to debug cancellations

---

## Critical Confirmations

### Sync Flag Behavior

✅ **CONFIRMED**: When products/prices are synced:
- `product.sync` flips from `true` → `false` after successful sync
- `price[].sync` flips from `true` → `false` after successful sync
- Stripe IDs (`stripe_product_id`, `stripe_price_id`) are stored in JSON
- This happens in `sync_catalog.py` after successful API calls

### Payment Status Updates

✅ **CONFIRMED**: When payment completes:
- `price.paid` flips from `false` → `true`
- `price.active` flips from `true` → `false` (archives paid price)
- If all prices paid → `product.active` flips to `false`
- This happens in `update_payment.py`

---

## Schema Changes Summary

### Key Field Mappings (Old → New)

- `client.name` → `client.business`
- `client.last_name` → `_metadata.client_last_name`
- `client.project_keyword` → `_metadata.project_keyword`
- `job_id` → `_metadata.job_id` (single source of truth)
- `payments[]` → `price[]` (array renamed)
- `payment.amount` → `price.unit_amount` (in cents, not dollars)
- `payment.status` → `price.paid` (boolean, not string)
- `payment.stripe_price_id` → `price.stripe_price_id`
- `contract.signed_date` → `contract.signatures.client.signed_date`
- `contract.signed_by` → `contract.signatures.client.legal_name`
- `contract.contractor_signature` → `contract.signatures.contractor.legal_name`
- `invoice_number` → `_metadata.job_id` (use job_id as invoice number)

**Terminology Fix**: All references to `updated` flag → `sync` flag (consistent terminology)

---

## Phase 1: Fix Core Infrastructure

### 1.1 Update `generate_manifest.py`

**File:** `generate_manifest.py`

**Changes:**
- Read from `_metadata.client_last_name` and `_metadata.project_keyword`
- Update template exclusion to check for `_job_template_v2.json`

**Key Code:**
```python
metadata = data.get('_metadata', {})
if not metadata:
    print(f"⚠️  Missing '_metadata' field in {file_path.name}", file=sys.stderr)
    return None

last_name = normalize_lookup_key(metadata.get('client_last_name', ''))
project_keyword = normalize_lookup_key(metadata.get('project_keyword', ''))
```

### 1.2 Update `json_io.py`

**File:** `.github/scripts/utils/json_io.py`

**Changes:**
- Update `validate_job_schema()` to check `_metadata` section
- Update to check `price[]` array (not `prices[]`)
- Update `find_job_file()` to look for `_metadata.job_id`
- Fix all references from `section_updated` → `sync`
- Fix all references from `prices` → `price`

**Key Updates:**
```python
# Update required_fields
required_fields = ['_metadata', 'client', 'contract', 'product', 'price']

# Check _metadata.job_id
if '_metadata' not in job_data or 'job_id' not in job_data['_metadata']:
    errors.append("Missing _metadata.job_id")

# Check 'price' not 'prices'
if 'price' in job_data:
    if not isinstance(job_data['price'], list):
        errors.append("Price must be a list")
```

---

## Phase 2: Recreate JavaScript Files

### 2.1 `payment-lookup.js`

**Status:** ✅ No changes needed - Only reads manifest, doesn't access job JSON fields

### 2.2 `payment-router.js`

**Changes Required:**
- Use `price[]` array instead of `payments[]`
- Check `price.paid` (boolean) instead of `payment.status === 'paid'`
- Check `price.active` to determine if payment is available
- Use `_metadata.job_id` for job_id references

**Key Logic:**
```javascript
// OLD: jobData.payments
// NEW: jobData.price

// OLD: payment.status === 'paid'
// NEW: price.paid === true && price.active === false

// Find first unpaid, active price
const firstPendingPayment = jobData.price.find(
  p => p.paid === false && p.active === true
);
```

### 2.3 `contract-controller.js`

**Changes Required:**
- Update signature handling to use `contract.signatures.contractor` and `contract.signatures.client`
- Update payment list generation to use `price[]` array
- Convert `price.unit_amount` from cents to dollars for display
- Update Vercel API call payload

**Key Updates:**
```javascript
// Signature structure
jobData.contract.signatures.contractor.legal_name = contractorSignature;
jobData.contract.signatures.contractor.signed_date = contractorDate;
jobData.contract.signatures.client.legal_name = clientSignature;
jobData.contract.signatures.client.signed_date = clientDate;

// Payment list
jobData.price.forEach(price => {
  const amount = price.unit_amount / 100; // cents to dollars
  // ... display logic
});

// API payload
{
  job_id: jobData._metadata.job_id,
  signature_data: {
    signed: true,
    signatures: {
      contractor: {
        legal_name: contractorSignature,
        signed_date: contractorDate
      },
      client: {
        legal_name: clientSignature,
        signed_date: clientDate
      }
    }
  }
}
```

### 2.4 `invoice-controller.js`

**Changes Required:**
- Find payment from `price[]` array using `payment_number`
- Convert `price.unit_amount` from cents to dollars
- Use `price.paid` boolean instead of `payment.status`
- Use `price.due_date` and `price.due_term`

**Key Updates:**
```javascript
// Find current payment
const payment = jobData.price.find(p => p.payment_number === paymentNumber);

// Amount conversion
const amount = payment.unit_amount / 100; // cents to dollars

// Status check
const isPaid = payment.paid === true;

// Due date logic
const dueDate = payment.due_type === 'date' 
  ? payment.due_date 
  : payment.due_term;
```

### 2.5 `checkout-controller.js`

**Changes Required:**
- Use `price[]` array instead of `payments[]`
- Use `price.stripe_price_id` (unchanged)
- Convert `price.unit_amount` for display
- Use `price.paid` and `price.active` for status checks
- Update metadata to use `_metadata.job_id`

**Key Updates:**
```javascript
// Find payment
const payment = jobData.price.find(p => p.payment_number === currentPaymentNumber);

// Amount display
const amount = payment.unit_amount / 100;

// Metadata
metadata: {
  job_id: jobData._metadata.job_id,
  payment_number: payment.payment_number,
  client_last_name: jobData._metadata.client_last_name,
  project_keyword: jobData._metadata.project_keyword
}
```

---

## Phase 3: Update Python Scripts

### 3.1 Fix `sync_catalog.py` Logic

**File:** `.github/scripts/orchestration/sync_catalog.py`

**Critical Fixes:**
- Change `section_updated` → `sync` throughout
- Change `prices` → `price` array
- Change `job_id` → `_metadata.job_id`
- Change `product.metadata.stripe_product_id` → `product.stripe_product_id`
- Change `price.metadata.stripe_price_id` → `price.stripe_price_id`

**Simplified Sync Logic (as specified):**

**For `product.sync = true`:**
1. Check if `stripe_product_id` exists
2. No match? → CREATE NEW PRODUCT
3. Match found? → MODIFY PRODUCT (overwrite all fields)
4. Store `stripe_product_id` in JSON
5. Set `product.sync = false`

**For `price[].sync = true`:**
1. Check if `stripe_price_id` exists
2. No match? → CREATE NEW PRICE
3. Match found? → ARCHIVE OLD PRICE (`active = false`), CREATE NEW PRICE
4. Store `stripe_price_id` in JSON
5. Set `price[].sync = false`

**CRITICAL**: Product MUST be created/updated BEFORE prices (product ID required for price creation)

### 3.2 Update State Scripts

**Files:**
- `.github/scripts/state/update_contract.py`
- `.github/scripts/state/update_payment.py`
- `.github/scripts/state/detect_sync_needs.py`

**Changes:**
- Update all field paths to match new schema
- Update to use `_metadata.job_id`
- Update signature handling in `update_contract.py`
- Update payment updates to use `price[]` array, `price.paid`, `price.active`
- Change `section_updated` → `sync` in `detect_sync_needs.py`

### 3.3 Update Stripe Scripts

**Files:** All scripts in `.github/scripts/stripe/product/` and `.github/scripts/stripe/price/`

**Changes:**
- Update metadata extraction to use `_metadata.job_id`
- Ensure scripts use `json_io.py` for file operations
- Update to read from `price[]` array structure

### 3.4 Update Orchestration Scripts

**Files:**
- `.github/scripts/orchestration/cleanup_orphans.py`

**Changes:**
- Update to iterate `price[]` array
- Update to use `_metadata.job_id` for lookups

---

## Phase 4: Create Umbrella Orchestrator

### 4.1 `orchestrate_workflow.py`

**File:** `.github/scripts/orchestration/orchestrate_workflow.py` (NEW)

**Purpose:** Single coordinator that runs all needed workflows, commits everything, then pushes ONCE

**Logic:**
1. Determine trigger type (push, workflow_dispatch, webhook)
2. Check what needs to be done:
   - Any `sync = true` flags? → Run sync workflow
   - Contract signing? → Run contract update
   - Payment update? → Run payment update
   - JSON files changed? → Generate manifest
3. Run all needed scripts in correct order:
   - `detect_sync_needs.py` (if JSON changed)
   - `sync_catalog.py` (if sync flags true)
   - `update_contract.py` (if contract signing)
   - `update_payment.py` (if payment update)
   - `generate_manifest.py` (always at end)
4. Commit all changes together
5. Push ONCE at the end

**Benefits:**
- Eliminates multiple pushes that cause cancellations
- Single commit message for all changes
- Cleaner GitHub Actions history
- No race conditions between workflows

### 4.2 Update Workflows to Use Orchestrator

**New Workflow:** `.github/workflows/orchestrate.yml`

**Single workflow that:**
- Triggers on: push, workflow_dispatch, webhook events
- Runs `orchestrate_workflow.py`
- Commits and pushes once at end

**Old workflows:** Archive (rename to `.old`)

---

## Phase 5: Update Vercel API Functions

### 5.1 `api/sign-contract.js`

**Changes:**
- Update payload structure to match new schema signature format
- Call GitHub Actions API with correct field paths

### 5.2 `api/update-payment.js`

**Changes:**
- Reference `price[]` array by `payment_number`
- Set `price.paid = true` and `price.active = false`
- Check if all prices are paid to archive product

### 5.3 `api/webhook.js`

**Changes:**
- Extract `job_id` from metadata (should be `_metadata.job_id`)
- Verify webhook calls `update-payment.js` with correct structure

---

## Phase 6: Git Configuration

### 6.1 Set Up Auto-Pull Before Push

**Command:**
```bash
git config pull.rebase true
git config push.autoSetupRemote true
```

**Purpose:** Automatically pull and rebase before pushing, preventing divergent branch errors

**Note:** This is a local git config, not part of GitHub Actions (Actions always start fresh)

### 6.2 Local Pull Relevance

**Question:** Does local pull matter for dynamic functionality?

**Answer:** ❌ **NO** - Dynamic functionality pulls from GitHub repository (via manifest.json), not local files. Local pulls only matter for:
- Keeping local files in sync for editing
- Preventing merge conflicts when pushing
- Having latest code locally

**For dynamic site:** GitHub Pages serves from the repository, so local state doesn't affect live site.

---

## Phase 7: Manifest Generation Strategy

### 7.1 Single Manifest Build

**Decision:** Generate manifest ONCE at the end of workflow chain

**Rationale:**
- Manifest doesn't need real-time updates
- Only needed when job files change
- Can be built after all other workflows complete
- Reduces redundant builds

**Implementation:**
- `orchestrate_workflow.py` runs `generate_manifest.py` as final step
- Only if job files were changed or manifest generator script changed
- Commits manifest along with all other changes

### 7.2 Remove Separate Manifest Workflow

**Action:** Don't create separate `manifest-update.yml` workflow

**Reason:** Manifest generation is now part of umbrella orchestrator

---

## Phase 8: Testing Strategy

### 8.1 Test One Workflow at a Time

**Process:**
1. Test manifest generation first (foundation)
2. Test sync workflow (Stripe catalog)
3. Test contract signing flow
4. Test payment completion flow
5. Test webhook updates
6. Test full end-to-end flow

### 8.2 Pause Between Tests

**Requirement:** ⚠️ **PAUSE after each workflow test**

**Check:**
- Did workflow complete successfully?
- Any cancellations? (If yes, debug before proceeding)
- Are Stripe products/prices created correctly?
- Is JSON updated correctly?

**If cancellation occurs:**
- Check GitHub Actions logs
- Verify trigger conditions
- Check for conflicting workflows
- Fix issue before moving to next test

### 8.3 Test JSON Files

**Create new test files using `_job_template_v2.json`:**
- `test-single-payment.json`
- `test-multi-payment.json`
- `test-signed-contract.json`
- `test-partial-payment.json`
- `test-all-paid.json`

**Location:** `assets/jobs/` (for testing)

---

## Phase 9: Documentation

### 9.1 AI Context Primer

**File:** `assets/docs/AI_CONTEXT_PRIMER_V2.md` (NEW)

**Purpose:** Help AI instances understand the system for future updates (design changes, discount features, etc.)

**Contents:**
- System overview
- Architecture explanation
- Key file locations
- Common patterns
- How to add new features (discounts, etc.)
- Testing procedures

### 9.2 Architecture Documentation

**File:** `assets/docs/ARCHITECTURE.md` (NEW)

**Purpose:** Comprehensive technical documentation

**Contents:**
- System architecture diagram
- Data flow diagrams
- Workflow explanations
- API contracts
- Stripe integration details
- Troubleshooting guide

**Note:** Can be created after testing is complete

---

## Phase 10: Visual Design Updates

**Status:** ⏸️ **Defer until after testing**

**Reference:** See `MODULAR_REFACTOR_PLANNING.md` section "Design UI & UX Flow"

**Planned Updates:**
- Homepage glow effect (mouse pointer interaction)
- Portfolio-inspired aesthetic (gradient depth, cereal colors)
- Professional "banker legitimacy" edge

---

## Implementation Order

1. **Phase 1** - Core Infrastructure (manifest, json_io)
2. **Phase 2** - JavaScript Files (frontend)
3. **Phase 3** - Python Scripts (backend)
4. **Phase 4** - Umbrella Orchestrator (workflow coordination)
5. **Phase 5** - Vercel APIs (serverless functions)
6. **Phase 6** - Git Configuration (auto-pull setup)
7. **Phase 7** - Manifest Strategy (single build)
8. **Phase 8** - Testing (one workflow at a time, with pauses)
9. **Phase 9** - Documentation (after testing)
10. **Phase 10** - Visual Design (after testing)

---

## Critical Notes

1. **Do NOT read old JS files** - Recreate from scratch using only `_job_template_v2.json`
2. **Fix terminology** - Change all `section_updated` → `sync`, `prices` → `price`
3. **Test one workflow at a time** - Pause and verify before proceeding
4. **Debug cancellations** - Don't proceed if workflows cancel
5. **Single push** - Umbrella orchestrator pushes once at end
6. **Stripe sandbox** - All testing in test mode
7. **Commit after each phase** - Allows rollback if issues arise

---

## Success Criteria

- [ ] Manifest generates correctly from new schema
- [ ] Payment lookup works with new field paths
- [ ] Contract page displays and signs correctly
- [ ] Invoice page shows correct payment details
- [ ] Checkout creates payment intent successfully
- [ ] Webhook updates payment status correctly
- [ ] Stripe products/prices sync correctly
- [ ] All workflows run without cancellation issues
- [ ] Single push at end (no multiple pushes)
- [ ] Git auto-pull configured
- [ ] Documentation complete

---

## Files to Archive After Migration

- `.github/workflows/process-job.yml` → `.github/workflows/process-job.yml.old`
- Old test JSON files in `assets/docs/W_I_P/` (keep for reference)

---

## Questions Addressed

### Q: Should sync flags be checked early in workflow?

**A:** Yes - `orchestrate_workflow.py` checks for `sync = true` flags first, then runs `sync_catalog.py` only if needed. This is more efficient than always running `detect_sync_needs.py`.

### Q: Does sync_catalog.py match the simple 5-step logic?

**A:** Yes - After fixing terminology (`section_updated` → `sync`), the logic matches exactly:
- Product: Check ID → Create or Modify → Store ID → Set sync=false
- Price: Check ID → Archive old (if exists) → Create new → Store ID → Set sync=false

### Q: Umbrella orchestrator vs separate workflows?

**A:** ✅ **Umbrella orchestrator is better** - Single push eliminates cancellation issues, cleaner history, no race conditions.

### Q: When should manifest be generated?

**A:** Once at the end of workflow chain, after all other operations complete. No separate manifest workflow needed.

### Q: Does local pull matter for dynamic functionality?

**A:** ❌ No - Dynamic site pulls from GitHub repository, not local files. Local pulls only matter for keeping code in sync for editing.

---

**Ready to proceed with implementation!** 🚀
