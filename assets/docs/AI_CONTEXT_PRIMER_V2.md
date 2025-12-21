# AI Context Primer V2 - Modular Payments System

**Last Updated:** 2025-12-20
**Purpose:** Complete system reference for AI assistants (Cursor Composer, Claude, etc.)
**Related:** See `MODULAR_REFACTOR_WALKTHROUGH.md` for implementation details

---

## Section 1: System Overview

### Architecture (Three-Part System)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  GitHub Pages   │────▶│     Vercel       │────▶│  GitHub Actions     │
│  (Frontend)     │     │  (Backend API)   │     │  (Automation)       │
│  Static Site    │     │  Serverless Fns  │     │  JSON Updates       │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │   Stripe API     │
                        │  (Payments)      │
                        └──────────────────┘
```

**1. GitHub Pages** (`payments.august.style`)
- Hosts: HTML, CSS, JavaScript, static assets
- What users see: Lookup form, contract, invoice, checkout
- Cannot: Run server code, store secrets, process payments

**2. Vercel** (`freelance-payments-neon.vercel.app`)
- Serverless functions: `/api/create-payment-intent`, `/api/sign-contract`, `/api/update-payment`, `/api/webhook`
- Has: `STRIPE_SECRET_KEY` configured
- Does: Creates payment intents, validates webhooks, triggers GitHub Actions
- Users: Never visit directly (it's an API backend)

**3. GitHub Actions**
- Workflows: Manifest generation, Stripe catalog sync, contract signing, payment updates
- Triggers: Push to branch, workflow_dispatch (from Vercel)
- Updates: JSON files in `assets/jobs/`

### Data Flow

**User Action Flow:**
```
User signs contract
  ↓
Frontend calls Vercel /api/sign-contract
  ↓
Vercel triggers GitHub Actions (workflow_dispatch)
  ↓
GitHub Action runs update_contract.py
  ↓
Updates contract.signed in JSON
  ↓
Commits and pushes to repo
  ↓
Next visit: User sees signed status, routes to invoice
```

**Payment Flow:**
```
User completes payment via Stripe
  ↓
Stripe sends webhook to Vercel /api/webhook
  ↓
Vercel triggers GitHub Actions
  ↓
GitHub Action runs update_payment.py
  ↓
Updates price.payment_status = "paid" in JSON
  ↓
Sets price.active = false (archived)
  ↓
If all prices paid → Set product.active = false
  ↓
Commits and pushes
  ↓
Next visit: Routes to next payment or completion
```

### One Product, Multiple Prices Model

**Critical Understanding:**
- ONE Stripe Product per job (e.g., "Website for Everlastings by Emy")
- MULTIPLE Stripe Prices for that product (e.g., Deposit $1250, Final $3750)
- Each price represents a payment milestone
- All prices reference the SAME `product` ID

**Why this matters:**
- Prevents underpayment (each price is locked amount)
- Tracks payment status per milestone
- Enables sequential payment flow

---

## Section 2: Things That Don't Need Fixing

### ✅ Working Correctly - DO NOT CHANGE **BUT NOT TESTED SO...**

**1. Vercel Integration**
- `/api/create-payment-intent.js` - Creates Stripe Payment Intent
- `/api/sign-contract.js` - Triggers contract signing workflow
- `/api/update-payment.js` - Triggers payment update workflow
- `/api/webhook.js` - Receives Stripe webhook events
- `STRIPE_SECRET_KEY` environment variable configured
- Webhook endpoint registered with Stripe

**2. Manifest Lookup System**
- `generate_manifest.py` - Scans jobs, creates lookup map
- Format: `{last_name}-{project_keyword}` → file path
- Frontend uses: User enters last name + keyword → manifest lookup → loads job
- This works perfectly, leave it alone

**3. Contract/Invoice Routing Logic**
- `payment-router.js` - Determines which page to show
- Checks: contract.signed, payment statuses
- Routes: unsigned → contract, signed unpaid → invoice, all paid → completion
- Logic is sound, don't touch

**4. Frontend Stripe Payment Element**
- `checkout-controller.js` - Integrates Stripe Payment Element
- Calls Vercel to create payment intent
- Handles payment success/failure
- Works correctly, just needs to read from new JSON paths

**5. Webhook Flow**
- Stripe → Vercel `/api/webhook` → GitHub Actions → JSON update
- Webhook signature validation working
- Event handling (payment_intent.succeeded) working
- Don't change this flow

---

## Section 3: New JSON Schema Reference

### Complete Schema Structure

  + See new template and change-log for attention areas that might require adjusting templates for contract or invoice 
  `/Users/seanivore/Development/freelance-payments/assets/jobs/_job_template_v2.json` 
  `/Users/seanivore/Development/freelance-payments/assets/jobs/CHANGE_LOG.md` 

### Key Schema Concepts

**1. job_id (Single Source of Truth)**
- Written ONCE at top level
- NOT duplicated in metadata (avoid typos)
- Used by manifest lookup, Stripe metadata, all scripts

**2. section_updated Flag**
- Lives in: `product` object and each `prices[]` object
- NOT in: `contract` or `client` (they don't sync to Stripe)
- Values: `true` = needs sync, `false` = synced
- Set by: `detect_sync_needs.py` (compares to git HEAD)
- Reset by: `sync_catalog.py` (after successful sync)

**3. active Flag**
- Lives in: `product` and each `prices[]` object
- Uses Stripe's vocabulary (not custom "archived" state)
- Values: `true` = active, `false` = archived
- When to set false:
  - Price: When payment completed OR amount changed (old price archived)
  - Product: When ALL prices are archived

**4. Stripe IDs in Metadata**
- `stripe_product_id` stored in `product.metadata`
- `stripe_price_id` stored in each `prices[].metadata`
- This is Stripe's metadata object (searchable in Stripe dashboard)
- Frontend can read from anywhere (doesn't need special metadata)

---

## Section 4: Script Reference

### Quick Lookup: "What script handles X?"

| Task | Script | Location |
|------|--------|----------|
| Create Stripe Product | `create_product.py` | `.github/scripts/stripe/product/` |
| Update Stripe Product | `modify_product.py` | `.github/scripts/stripe/product/` |
| Archive Stripe Product | `archive_product.py` | `.github/scripts/stripe/product/` |
| Delete Stripe Product | `delete_product.py` | `.github/scripts/stripe/product/` |
| List Stripe Products | `list_products.py` | `.github/scripts/stripe/product/` |
| Create Stripe Price | `create_price.py` | `.github/scripts/stripe/price/` |
| Archive Stripe Price | `archive_price.py` | `.github/scripts/stripe/price/` |
| Delete Stripe Price | `delete_price.py` | `.github/scripts/stripe/price/` |
| Search Stripe Prices | `list_prices.py` | `.github/scripts/stripe/price/` |
| Update contract signed | `update_contract.py` | `.github/scripts/state/` |
| Update payment status | `update_payment.py` | `.github/scripts/state/` |
| Detect changes | `detect_sync_needs.py` | `.github/scripts/state/` |
| Load/save JSON | `json_io.py` | `.github/scripts/utils/` |
| Sync to Stripe | `sync_catalog.py` | `.github/scripts/orchestration/` |
| Delete orphans | `cleanup_orphans.py` | `.github/scripts/orchestration/` |

### Stripe Operations (9 scripts)

**Product Operations:**
- `create_product.py` - Calls `stripe.Product.create()`
- `modify_product.py` - Calls `stripe.Product.modify()` (description, metadata)
- `archive_product.py` - Calls `stripe.Product.modify(active=False)`
- `delete_product.py` - Calls `stripe.Product.delete()` (only after prices deleted)
- `list_products.py` - Calls `stripe.Product.list()` with metadata filter

**Price Operations:**
- `create_price.py` - Calls `stripe.Price.create()` (with product ID)
- `archive_price.py` - Calls `stripe.Price.modify(active=False)`
- `delete_price.py` - Calls `stripe.Price.delete()` (only if never used)
- `list_prices.py` - Calls `stripe.Price.search()` with metadata filter

**Critical Rules:**
- Must delete/archive ALL prices before deleting/archiving product
- Prices are immutable (can't change amount) - must archive old, create new
- Always provide `product` ID when creating price

### State Operations (3 scripts)

**`detect_sync_needs.py`**
- Compares current JSON to git HEAD
- If product fields changed → `product.section_updated = true`
- If price fields changed → `prices[n].section_updated = true`
- Commits updated JSON with flags

**`update_contract.py`**
- Updates `contract.signed = true`
- Updates signature fields
- Does NOT interact with Stripe
- Called by: Vercel `/api/sign-contract`

**`update_payment.py`**
- Updates `price.payment_status = "paid"`
- Updates `paid_date` fields
- Sets `price.active = false` (archive paid price)
- If all prices paid → Sets `product.active = false`
- Called by: Vercel `/api/webhook` or `/api/update-payment`

### Utils (1 script)

**`json_io.py`**
- Functions: `load_job(job_id)`, `save_job(job_id, data)`, `find_job_by_id(job_id)`
- Purpose: Shared JSON file I/O (prevents duplicate code)
- Used by: All other scripts

### Orchestration (2 scripts)

**`sync_catalog.py`** - Main sync coordinator

**Logic:**
```python
# Step 1: Process product (if section_updated = true)
if product.section_updated:
    if product.metadata.stripe_product_id:
        modify_product()  # Product exists
    else:
        result = create_product()  # Product doesn't exist
        product.metadata.stripe_product_id = result.id
    product.section_updated = false

# Step 2: Process prices (AFTER product has ID)
for price in prices:
    if price.section_updated:
        if price.metadata.stripe_price_id:
            archive_price(old_id)  # Archive old
            result = create_price(product=product.metadata.stripe_product_id)
            price.metadata.stripe_price_id = result.id
        else:
            result = create_price(product=product.metadata.stripe_product_id)
            price.metadata.stripe_price_id = result.id
        price.section_updated = false
```

**`cleanup_orphans.py`**
- Lists all Stripe products
- Compares to current JSON files (by job_id in metadata)
- Deletes products without matching JSON files
- Deletes all prices first, then product

---

## Section 5: Workflow Reference

### Workflows and Triggers

**`catalog-sync.yml`**
- **Triggers:** Push to `freelance-payments` branch, paths: `assets/jobs/*.json`
- **Does:**
  1. Detect sync needs (set section_updated flags)
  2. Commit flags
  3. Sync catalog (create/update Stripe products/prices)
  4. Cleanup orphans
  5. Commit Stripe updates
- **When:** Anytime job JSON files change

**`user-action.yml`**
- **Triggers:** workflow_dispatch (manual or from Vercel)
- **Inputs:** `action` (sign-contract, update-payment), `job_id`, `payload`
- **Does:**
  - If sign-contract: Runs `update_contract.py`
  - If update-payment: Runs `update_payment.py`
  - Commits changes
- **When:** User signs contract or payment is completed

**`manifest-update.yml`**
- **Triggers:** Push, paths: `assets/jobs/*.json` or `generate_manifest.py`
- **Does:**
  1. Generate manifest.json
  2. Commit if changed
- **When:** Job files or manifest generator changes

### Workflow Coordination

**Sequence matters:**
1. Manifest update (fast, always safe)
2. Detect sync needs (sets flags)
3. Sync catalog (Product FIRST, then Prices)
4. Cleanup orphans (edge cases)

**No race conditions:**
- Each workflow has specific trigger paths
- Commits are sequential (one workflow at a time)
- State flags prevent redundant syncs

---

## Section 6: Common Patterns

### How to Add a New Payment

**Manual Process:**
1. Create/edit job JSON file in `assets/jobs/`
2. Add new price object to `prices[]` array
3. Set `section_updated = true` for new price
4. Set `product.section_updated = true` if product needs update
5. Commit and push

**What Happens:**
1. Push triggers `catalog-sync.yml`
2. `detect_sync_needs.py` confirms flags (or sets them)
3. `sync_catalog.py` creates product (if needed), then creates price
4. JSON updated with Stripe IDs
5. Auto-commit pushes updated JSON

### How to Change a Payment Amount

**Process:**
1. Edit `prices[n].unit_amount` in JSON
2. Set `prices[n].section_updated = true`
3. Commit and push

**What Happens:**
1. `detect_sync_needs.py` sets flag
2. `sync_catalog.py`:
   - Archives old price (active = false)
   - Creates new price with new amount
   - Updates JSON with new stripe_price_id
3. Frontend uses new price for checkout

**Why archive old price:**
- Stripe prices are immutable (can't change amount)
- Old price remains in Stripe (for audit trail)
- New price is active, old price is archived

### How Contract Signing Works

**User Flow:**
1. User fills signature fields on frontend
2. Clicks "Sign Contract"
3. Frontend calls Vercel `/api/sign-contract`

**Backend Flow:**
1. Vercel validates request
2. Triggers GitHub Actions `workflow_dispatch`
3. GitHub Action runs `update_contract.py`
4. Updates `contract.signed = true`, signature fields
5. Commits and pushes
6. Frontend routes to invoice

**Key Point:** NO Stripe sync needed (contract state is local)

### How Payment Completion Works

**User Flow:**
1. User completes payment via Stripe Payment Element
2. Stripe processes payment

**Webhook Flow:**
1. Stripe sends webhook to Vercel `/api/webhook`
2. Vercel validates signature
3. Triggers GitHub Actions `workflow_dispatch`
4. GitHub Action runs `update_payment.py`:
   - Sets `payment_status = "paid"`
   - Sets `paid_date`
   - Archives price (active = false)
   - If all prices paid → Archives product
5. Commits and pushes
6. Frontend routes to next payment or completion

### How Archiving Works

**Price Archiving:**
- **When:** Payment completed OR amount changed (old price)
- **How:** Set `active = false` in JSON, call `archive_price.py`
- **Effect:** Price no longer available for new checkouts

**Product Archiving:**
- **When:** ALL prices archived
- **How:** Set `active = false` in JSON, call `archive_product.py`
- **Effect:** Entire job complete, product archived

**Delete vs Archive:**
- **Archive:** Keep in Stripe (audit trail, history)
- **Delete:** Remove from Stripe (mistakes, test data)
- **Rule:** Must archive/delete ALL prices before product

---

## Section 7: Debugging Guide

### Check Sync Flags First

**If changes not appearing in Stripe:**
1. Check `product.section_updated` - should be `true`
2. Check `prices[n].section_updated` - should be `true` for changed price
3. If flags are `false`, run `detect_sync_needs.py` manually
4. Check GitHub Actions log for `catalog-sync.yml` run

**If flags not being set:**
- Verify file changed (git diff)
- Check `detect_sync_needs.py` comparison logic
- Ensure field is in comparison (might need to add)

### Monitor GitHub Actions Logs

**Find logs:**
1. Go to GitHub repo
2. Click "Actions" tab
3. Find latest workflow run
4. Click on workflow name
5. Expand step logs

**What to look for:**
- "Detect sync needs" output (which flags set)
- "Sync catalog" output (which API calls made)
- Stripe API errors (authentication, rate limits, validation)
- Commit failures (merge conflicts, permissions)

### Verify Stripe Dashboard

**Check product creation:**
1. Go to Stripe Dashboard → Products
2. Search by `job_id` in metadata
3. Verify product name, description, metadata

**Check price creation:**
1. Click on product
2. View prices list
3. Verify amount, currency, active status
4. Check metadata (payment_number, job_id)

**Check archiving:**
- Archived items show "Archived" badge
- Filter by "Active" to hide archived

### Common Issues and Fixes

**Issue: Each price has different product ID**
- **Cause:** Product not created before prices
- **Fix:** Ensure `sync_catalog.py` creates product FIRST, then uses returned ID for all prices

**Issue: Changes not syncing to Stripe**
- **Cause:** `section_updated` flag not set
- **Fix:** Run `detect_sync_needs.py` or manually set flag

**Issue: Can't delete product**
- **Cause:** Active prices still exist
- **Fix:** Archive/delete ALL prices first, then product

**Issue: Webhook not triggering**
- **Cause:** Webhook URL not configured or signature validation failing
- **Fix:** Check Stripe webhook settings, verify secret key

**Issue: Duplicate products created**
- **Cause:** `stripe_product_id` not stored after creation
- **Fix:** Verify `sync_catalog.py` stores returned ID in JSON

---

## Section 8: Migration Notes

### From Old Schema to New Schema

**Key Changes:**
1. `job_id` replaces `invoice_number` (they were duplicates)
2. `payments[]` becomes `prices[]`
3. Stripe IDs move into `metadata` objects
4. `section_updated` flag added to product and prices
5. `active` flag uses Stripe's vocabulary

**Migration Script:**
- Location: `.github/scripts/migration/migrate_schema.py`
- Purpose: One-time transformation of all job JSON files
- Safe: Test on copies first, then run on production

**Frontend Updates Needed:**
- Change `stripe_price_id` → `prices[n].metadata.stripe_price_id`
- Change `payment.status` → `prices[n].payment_status`
- Update any hardcoded field paths

---

## Section 9: Quick Reference

### File Locations

```
freelance-payments/
├── assets/
│   ├── jobs/              # Job JSON files
│   ├── js/
│   │   └── manifest.json  # Generated lookup map
│   └── docs/              # Documentation
├── .github/
│   ├── scripts/
│   │   ├── stripe/        # Stripe API modules
│   │   ├── state/         # State update modules
│   │   ├── utils/         # Shared utilities
│   │   └── orchestration/ # Sync coordinators
│   └── workflows/         # GitHub Actions workflows
├── api/                   # Vercel serverless functions
└── generate_manifest.py   # Manifest generator
```

### Environment Variables

**Vercel:**
- `STRIPE_SECRET_KEY` - Stripe API secret key (already configured)

**GitHub Secrets:**
- `STRIPE_SECRET_KEY` - Same key for GitHub Actions
- `GITHUB_TOKEN` - Auto-provided by GitHub

### Important Commands

**Run sync manually:**
```bash
python3 .github/scripts/orchestration/sync_catalog.py --jobs-dir assets/jobs
```

**Detect sync needs:**
```bash
python3 .github/scripts/state/detect_sync_needs.py --jobs-dir assets/jobs
```

**Generate manifest:**
```bash
python3 generate_manifest.py
```

---

## Appendix: Triggers & Actions Reference

| TRIGGER | ACTION | IMPLEMENTATION |
|---------|--------|----------------|
| JSON file pushed | Detect sync needs | catalog-sync.yml → detect_sync_needs.py |
| `section_updated = true` | Sync to Stripe | catalog-sync.yml → sync_catalog.py |
| Payment completed | Archive price | Webhook → update_payment.py |
| All prices archived | Archive product | update_payment.py checks all |
| Amount changed | Archive old, create new price | detect_sync_needs → sync_catalog |
| Description changed | Modify product | detect_sync_needs → sync_catalog |
| Contract signed | Update contract fields | Vercel → update_contract.py |
| JSON file deleted | Delete Stripe product/prices | cleanup_orphans.py |
| New payment added | Create product, create price | sync_catalog.py |

**Archive/Delete Order:**
1. Archive/delete ALL prices first
2. Then archive/delete product
3. Stripe will reject if prices still active

---

**End of AI Context Primer V2**

For implementation walkthrough, see `MODULAR_REFACTOR_WALKTHROUGH.md`
