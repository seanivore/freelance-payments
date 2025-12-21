# Modular Refactor Walkthrough

**Last Updated:** 2025-12-20
**Purpose:** Step-by-step implementation guide for the modular refactor
**Related:** See `AI_CONTEXT_PRIMER_V2.md` for complete system reference

---

## Table of Contents

1. [Why This Refactor](#why-this-refactor)
2. [New JSON Schema](#new-json-schema)
3. [Script Organization](#script-organization)
4. [Workflow Flow](#workflow-flow)
5. [Migration Guide](#migration-guide)
6. [Common Operations](#common-operations)

---

## Why This Refactor

### Problems Solved

**Before (Monolithic):**
```
process_stripe_products.py (389 lines)
├── Orphan detection (50 lines)
├── Product creation (80 lines)
├── Price creation (90 lines)
├── Price updates (60 lines)
├── Product deletion (50 lines)
├── JSON updates (40 lines)
└── Git diff logic (39 lines)
```

**Issues:**
- 🔴 Can't tell what Stripe API calls are made
- 🔴 Git diff logic is fragile and complex
- 🔴 "Price Update" is misleading (Stripe doesn't allow price updates)
- 🔴 Redundant data (job_id = invoice_number, metadata duplication)
- 🔴 Hard to debug (everything in one file)
- 🔴 **BUG:** Each price created its own product (no `product` ID provided)

**After (Modular):**
```
.github/scripts/
├── stripe/product/create_product.py (50 lines)
├── stripe/product/modify_product.py (40 lines)
├── stripe/product/archive_product.py (30 lines)
├── stripe/price/create_price.py (50 lines)
├── stripe/price/archive_price.py (30 lines)
└── orchestration/sync_catalog.py (150 lines)
```

**Benefits:**
- ✅ One file = one Stripe API operation (crystal clear)
- ✅ State flags instead of git diff (explicit, simple)
- ✅ Mirrors Stripe's object model (uses their vocabulary)
- ✅ Single source of truth (no duplication)
- ✅ Easy to test each piece independently
- ✅ **FIXED:** One product, multiple prices (all share same product ID)

### Key Insight: Use Stripe's Vocabulary

Instead of inventing custom states (`needs_sync`, `synced`, `archived`), we use Stripe's own fields:

- `active: true/false` - Stripe's archiving mechanism
- `section_updated: true/false` - Our sync flag (simple boolean)

This makes the system self-documenting. If you understand Stripe's API, you understand our JSON.

---

## New JSON Schema

### Structure Overview

```
Top Level
├── job_id (written ONCE, no duplication)
├── project_keyword
├── client { ... }
├── contract { ... }              ← No sync flags (doesn't sync to Stripe)
├── product { ... }                ← Has section_updated and active
├── prices [ ... ]                 ← Each has section_updated and active
└── project_scope_summary/full
```

### Complete Example

  + See template and change_log for attention areas that might effect the contract or invoice, etc. 
  `/Users/seanivore/Development/freelance-payments/assets/jobs/_job_template_v2.json` 
  `/Users/seanivore/Development/freelance-payments/assets/jobs/CHANGE_LOG.md`

### Field Explanations

**job_id**
- Single identifier for the entire job
- Replaces old `invoice_number` (they were duplicates)
- Written ONCE at top level (not repeated in metadata to avoid typos)

**section_updated**
- Where: `product` and each `prices[]` object
- NOT in: `contract` or `client` (they don't sync to Stripe)
- Purpose: Flags what needs syncing to Stripe
- Values: `true` = needs sync, `false` = already synced

**active**
- Where: `product` and each `prices[]` object
- Uses Stripe's vocabulary (not custom "archived")
- Purpose: Archive completed/outdated items
- Values: `true` = active, `false` = archived

**Stripe IDs in metadata**
- `stripe_product_id` in `product.metadata`
- `stripe_price_id` in each `prices[].metadata`
- Stored IN Stripe's metadata object (searchable in dashboard)

---

## Script Organization

### Directory Structure

```
.github/scripts/
├── stripe/
│   ├── product/
│   │   ├── create_product.py      ← stripe.Product.create()
│   │   ├── modify_product.py      ← stripe.Product.modify()
│   │   ├── archive_product.py     ← stripe.Product.modify(active=False)
│   │   ├── delete_product.py      ← stripe.Product.delete()
│   │   └── list_products.py       ← stripe.Product.list()
│   └── price/
│       ├── create_price.py        ← stripe.Price.create()
│       ├── archive_price.py       ← stripe.Price.modify(active=False)
│       ├── delete_price.py        ← stripe.Price.delete()
│       └── list_prices.py         ← stripe.Price.search()
├── state/
│   ├── update_contract.py         ← Contract signing
│   ├── update_payment.py          ← Payment status updates
│   └── detect_sync_needs.py       ← Set section_updated flags
├── utils/
│   └── json_io.py                 ← Shared JSON read/write
└── orchestration/
    ├── sync_catalog.py            ← Main coordinator
    └── cleanup_orphans.py         ← Delete orphaned products
```

### Script I/O Pattern

Every script follows the same pattern:

```python
"""
Script purpose in one sentence.

Usage:
    python3 script_name.py --param1 value1 --param2 value2

Returns (stdout):
    {"result_key": "result_value"}

Exit codes:
    0 = Success
    1 = Validation error
    2 = API error
"""

import sys
import json
import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--param1', required=True)
    # ... add arguments

    args = parser.parse_args()

    try:
        # Do the work
        result = do_thing(args.param1)

        # Return JSON to stdout
        print(json.dumps({"success": True, "data": result}))
        sys.exit(0)

    except ValidationError as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

    except stripe.error.StripeError as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(2)
```

**Why this pattern:**
- Scriptable (can be called from shell or Python)
- Testable (clear inputs, clear outputs)
- Composable (one script calls another)
- Debuggable (stdout/stderr separation, exit codes)

---

## Workflow Flow

### Step-by-Step: Change Detected → Synced

**1. Developer edits job JSON**
```bash
# Edit: Change price amount from $1250 to $1500
vim assets/jobs/uid-abc-123.json
git add assets/jobs/uid-abc-123.json
git commit -m "Update deposit amount to $1500"
git push
```

**2. GitHub Actions: catalog-sync.yml triggers**
```yaml
on:
  push:
    branches: [freelance-payments]
    paths: ["assets/jobs/*.json"]
```

**3. detect_sync_needs.py runs**
```python
# Compares current JSON to git HEAD
old_price = git_head_version['prices'][0]['unit_amount']  # 125000
new_price = current_version['prices'][0]['unit_amount']   # 150000

if old_price != new_price:
    current_version['prices'][0]['section_updated'] = True

# Commits updated JSON with flag set
```

**4. sync_catalog.py runs**
```python
# Reads JSON
job_data = load_job('uid-abc-123')

# Checks price section_updated flag
if job_data['prices'][0]['section_updated']:
    # Archive old price
    old_price_id = job_data['prices'][0]['metadata']['stripe_price_id']
    call_script('archive_price.py', price_id=old_price_id)

    # Create new price
    result = call_script('create_price.py',
        product=job_data['product']['metadata']['stripe_product_id'],
        unit_amount=150000,
        currency='usd'
    )

    # Update JSON with new price ID
    job_data['prices'][0]['metadata']['stripe_price_id'] = result['price_id']
    job_data['prices'][0]['section_updated'] = False

    # Save JSON
    save_job('uid-abc-123', job_data)
```

**5. Auto-commit pushes updated JSON**
```bash
git add assets/jobs/uid-abc-123.json
git commit -m "🤖 Sync Stripe catalog: Updated price"
git push
```

**Result:**
- Old price archived in Stripe (active: false)
- New price created in Stripe (active: true)
- JSON has new `stripe_price_id`
- `section_updated` flag reset to `false`

---

## Migration Guide

### Phase 1: Build Modules in Parallel

**Goal:** Create all new scripts without touching existing system

**Tasks:**
1. Create directory structure
2. Implement Stripe operation scripts (9 files)
3. Implement state scripts (3 files)
4. Implement utils (1 file)
5. Implement orchestration scripts (2 files)
6. Write unit tests

**Files to create:** ~15 scripts

**Validation:**
- Each script runs independently
- Returns expected JSON output
- Exits with correct codes

**Example test:**
```bash
# Test create_product.py
python3 .github/scripts/stripe/product/create_product.py \
  --name "Test Product" \
  --description "Test" \
  --metadata '{"job_id":"test-001"}'

# Should return:
# {"product_id": "prod_xxx", "name": "Test Product"}
# Exit code: 0
```

### Phase 2: Schema Migration

**Goal:** Transform old JSON schema to new schema

**Create migration script:**
```python
# .github/scripts/migration/migrate_schema.py

def migrate_job(old_job):
    new_job = {}

    # 1. Rename invoice_number to job_id
    new_job['job_id'] = old_job['invoice_number']
    new_job['project_keyword'] = old_job['client']['project_keyword']

    # 2. Keep client and contract as-is
    new_job['client'] = old_job['client']
    new_job['contract'] = old_job['contract']

    # 3. Transform product section
    new_job['product'] = {
        'section_updated': False,
        'active': True,
        'name': f"{old_job['client']['name']} - {old_job['client']['project_keyword']}",
        'description': old_job.get('project_scope_summary', ''),
        'metadata': {
            'stripe_product_id': old_job['payments'][0].get('stripe_product_id'),
            'job_id': old_job['invoice_number']
        },
        'created': int(time.time()),
        'updated': int(time.time())
    }

    # 4. Transform payments to prices
    new_job['prices'] = []
    for payment in old_job['payments']:
        price = {
            'payment_number': payment['payment_number'],
            'due_date': payment.get('due_date'),
            'due_type': payment['due_type'],
            'due_term': payment.get('due_term'),
            'payment_status': payment['status'],
            'paid_date': payment.get('paid_date'),
            'paid_date_unix': payment.get('paid_date_unix'),

            'section_updated': False,

            'active': payment.get('status') != 'paid',
            'product': payment.get('stripe_product_id'),  # Will fix in sync
            'unit_amount': int(payment['amount'] * 100),  # Convert to cents
            'currency': payment.get('currency', 'usd'),
            'nickname': payment.get('description', f"Payment {payment['payment_number']}"),
            'metadata': {
                'stripe_price_id': payment.get('stripe_price_id'),
                'payment_number': str(payment['payment_number']),
                'job_id': old_job['invoice_number']
            },
            'created': int(time.time())
        }
        new_job['prices'].append(price)

    # 5. Keep project scope
    new_job['project_scope_summary'] = old_job.get('project_scope_summary', '')
    new_job['project_scope_full'] = old_job.get('project_scope_full', '')

    return new_job
```

**Run migration:**
```bash
# Test on one file first
python3 .github/scripts/migration/migrate_schema.py \
  --input assets/jobs/test-single-payment.json \
  --output assets/jobs/test-single-payment.new.json \
  --dry-run

# Compare outputs
diff assets/jobs/test-single-payment.json assets/jobs/test-single-payment.new.json

# If looks good, run on all files
python3 .github/scripts/migration/migrate_schema.py \
  --jobs-dir assets/jobs \
  --backup-dir assets/jobs.backup
```

**Frontend updates:**
```javascript
// OLD
const priceId = jobData.payments[0].stripe_price_id;
const status = jobData.payments[0].status;

// NEW
const priceId = jobData.prices[0].metadata.stripe_price_id;
const status = jobData.prices[0].payment_status;
```

### Phase 3: Orchestration Integration

**Goal:** Build `sync_catalog.py` using modular scripts

**Critical: Product FIRST, then Prices!**

```python
# sync_catalog.py

def sync_job(job_data):
    # === STEP 1: PRODUCT ===
    if job_data['product']['section_updated']:
        product_id = job_data['product']['metadata'].get('stripe_product_id')

        if product_id:
            # Product exists → Modify
            result = call_script('modify_product.py',
                product_id=product_id,
                name=job_data['product']['name'],
                description=job_data['product']['description']
            )
        else:
            # Product doesn't exist → Create
            result = call_script('create_product.py',
                name=job_data['product']['name'],
                description=job_data['product']['description'],
                metadata={'job_id': job_data['job_id']}
            )
            # CRITICAL: Store the returned product_id
            job_data['product']['metadata']['stripe_product_id'] = result['product_id']

        # Reset flag
        job_data['product']['section_updated'] = False

    # === STEP 2: PRICES (after product has ID!) ===
    product_id = job_data['product']['metadata']['stripe_product_id']

    for price in job_data['prices']:
        if price['section_updated']:
            price_id = price['metadata'].get('stripe_price_id')

            if price_id:
                # Price exists → Archive old, create new
                call_script('archive_price.py', price_id=price_id)

                result = call_script('create_price.py',
                    product=product_id,  # Use product_id from above!
                    unit_amount=price['unit_amount'],
                    currency=price['currency'],
                    metadata={
                        'job_id': job_data['job_id'],
                        'payment_number': str(price['payment_number'])
                    }
                )
                price['metadata']['stripe_price_id'] = result['price_id']
            else:
                # Price doesn't exist → Create
                result = call_script('create_price.py',
                    product=product_id,  # Use product_id!
                    unit_amount=price['unit_amount'],
                    currency=price['currency']
                )
                price['metadata']['stripe_price_id'] = result['price_id']

            # Reset flag
            price['section_updated'] = False

    return job_data
```

**Why this order matters:**
- Product must be created FIRST to get `stripe_product_id`
- ALL prices reference the SAME `product_id`
- This fixes the bug where each price created its own product

### Phase 4: Workflow Cutover

**Goal:** Replace old workflow with new workflows

**Tasks:**
1. Create new workflow files
2. Disable old workflow (rename to `.old`)
3. Test new workflows
4. Monitor first runs
5. Archive old scripts

**Rollback plan:**
```bash
# If needed, revert
mv .github/workflows/process-job.yml.old .github/workflows/process-job.yml
mv .github/workflows/catalog-sync.yml .github/workflows/catalog-sync.yml.disabled
```

---

## Common Operations

### Add a New Job

```bash
# 1. Create JSON file
cp assets/jobs/_job_template.json assets/jobs/uid-new-001.json

# 2. Edit with job details
vim assets/jobs/uid-new-001.json

# 3. Set flags for initial sync
# product.section_updated = true
# prices[0].section_updated = true
# prices[1].section_updated = true

# 4. Commit and push
git add assets/jobs/uid-new-001.json
git commit -m "Add new job: uid-new-001"
git push

# 5. Wait for workflow
# - Product created
# - Prices created
# - JSON updated with Stripe IDs
# - Auto-commit pushes updated JSON
```

### Change Payment Amount

```bash
# 1. Edit JSON
vim assets/jobs/uid-abc-123.json
# Change prices[0].unit_amount from 125000 to 150000
# Set prices[0].section_updated = true

# 2. Commit and push
git add assets/jobs/uid-abc-123.json
git commit -m "Update deposit amount to $1500"
git push

# 3. Workflow handles:
# - Archives old price (active: false)
# - Creates new price (amount: 150000)
# - Updates JSON with new price_id
# - Sets section_updated = false
```

### Delete a Job

```bash
# 1. Delete JSON file
git rm assets/jobs/uid-old-001.json
git commit -m "Delete completed job: uid-old-001"
git push

# 2. cleanup_orphans.py runs:
# - Finds Stripe product without matching JSON
# - Deletes all prices for that product
# - Deletes the product
```

---

## Testing Checklist

### Unit Tests (per script)

```bash
# Test create_product.py
pytest tests/test_create_product.py

# Test create_price.py
pytest tests/test_create_price.py

# ... etc for all scripts
```

### Integration Tests

```bash
# Test sync_catalog.py with test data
python3 .github/scripts/orchestration/sync_catalog.py \
  --jobs-dir tests/fixtures/jobs

# Verify Stripe calls made correctly
# Check JSON files updated
```

### End-to-End Tests

**Test 1: New job**
1. Add new JSON file
2. Verify product created in Stripe
3. Verify prices created
4. Verify JSON updated with IDs

**Test 2: Amount change**
1. Edit price amount
2. Verify old price archived
3. Verify new price created
4. Verify frontend uses new price

**Test 3: Payment completion**
1. Complete payment via Stripe
2. Verify webhook received
3. Verify JSON updated (status = paid, active = false)
4. Verify routing to next payment

---

**End of Walkthrough**

For complete system reference, see `AI_CONTEXT_PRIMER_V2.md`
