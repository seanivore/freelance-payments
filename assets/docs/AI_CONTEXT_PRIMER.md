# Freelance Payments Micro-Site Architecture
*Complete reference for AI assistants working on payments.august.style*

**Live Site:** [payments.august.style](https://payments.august.style)

**Purpose:** This document provides everything a new AI instance needs to understand and work on this project effectively. Read this first before making any changes.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Explained](#architecture-explained)
3. [Key Files & Their Purpose](#key-files--their-purpose)
4. [Automation Workflows](#automation-workflows)
5. [Current Status & Known Issues](#current-status--known-issues)
6. [Testing & Debugging](#testing--debugging)
7. [Common Pitfalls](#common-pitfalls)
8. [Quick Start for New AI Instances](#quick-start-for-new-ai-instances)

---

## Project Overview

### What This Is

A **reusable payment micro-site** for collecting freelance project payments. Clients visit, enter their last name + project keyword, view/sign contracts, view invoices, and pay via Stripe.

**Key Innovation:** HTML-first documents with on-demand PDF generation (browser print-to-PDF) - simpler, faster, better UX than pre-generating PDFs.

### The Core Architecture

- **JSON-based** (like portfolio `august.style`)
- **GitHub Pages** for frontend hosting
- **Vercel** for serverless API functions
- **GitHub Actions** for automation (Stripe catalog sync, manifest generation)
- **Stripe Payment Element** for embedded checkout

### How It Works

1. **You create** a JSON file per client project in `assets/jobs/`
2. **GitHub Actions** processes JSON → Creates Stripe products, generates manifest
3. **Client visits** `payments.august.style` → Enters last name + keyword
4. **State machine** routes them: Contract → Invoice → Checkout → Completion
5. **Stripe webhook** updates JSON when payment succeeds

---

## Architecture Explained

### Two-Host System

#### 1. GitHub Pages (`payments.august.style`) - FRONTEND

**What it hosts:**
- All HTML files (`index.html`, `contract.html`, `invoice.html`, `checkout.html`, `payment-router.html`, `completion.html`)
- All JavaScript (`assets/js/*.js`)
- All CSS (`assets/css/styles.css` - built from `input.css` via Tailwind)
- Static assets (favicons, fonts, media)

**What users see:**
- Users visit `payments.august.style`
- They interact with lookup form, contract, invoice, checkout
- This is the **public-facing website**

#### 2. Vercel (`freelance-payments-neon.vercel.app`) - BACKEND API

**What it hosts:**
- Serverless functions in `api/` directory:
  - `/api/create-payment-intent` - Creates Stripe PaymentIntent using `price_id`
  - `/api/sign-contract` - Updates contract signed status via GitHub Actions
  - `/api/update-payment` - Updates payment status (called by webhook)
  - `/api/webhook` - Receives Stripe webhooks, validates signature

**What it does:**
- Handles secure operations (Stripe secret keys, GitHub API calls)
- Processes payments
- Updates JSON files via GitHub Actions API
- Receives webhooks from Stripe

**Users DON'T visit this directly** - it's an API backend

### How They Work Together

```
User visits: payments.august.style (GitHub Pages)
     ↓
Frontend JavaScript loads
     ↓
User fills lookup form (last name + project keyword)
     ↓
Frontend loads manifest.json → Finds JSON file → Loads job data
     ↓
State machine routes: contract → invoice → checkout
     ↓
User clicks "Pay Now"
     ↓
Frontend calls: freelance-payments-neon.vercel.app/api/create-payment-intent
     ↓
Vercel function creates PaymentIntent (has Stripe secret key)
     ↓
Returns client_secret to frontend
     ↓
Frontend shows Stripe Payment Element
     ↓
User completes payment
     ↓
Stripe sends webhook to: freelance-payments-neon.vercel.app/api/webhook
     ↓
Vercel function calls GitHub Actions API → Updates JSON → Commits
```

### Payment Flow State Machine

**Routing Logic** (`assets/js/payment-router.js`):

```
Contract not signed → contract.html
Contract signed + Payment pending → invoice.html → checkout.html
All payments complete → completion.html
```

**State checks:**
- `contract.signed` (boolean)
- `payment.status` ("pending" or "paid")
- `payment.paid_date` (null or ISO date)

**Handles:**
- First visit (contract not signed)
- Return visit (contract signed, payment pending)
- Partial payments (first paid, second pending)
- Completed payments (all paid)

---

## Key Files & Their Purpose

### Core HTML Pages

- **`index.html`** - Payment lookup form (last name + project keyword)
- **`payment-router.html`** - Entry point for state machine routing
- **`contract.html`** - Dynamic contract page (populates from JSON)
- **`invoice.html`** - Dynamic invoice page (shows specific payment)
- **`checkout.html`** - Stripe Payment Element checkout
- **`completion.html`** - Success page (all payments complete)

### JavaScript Controllers

- **`assets/js/payment-lookup.js`** - Lookup form handler, loads manifest, finds JSON
- **`assets/js/payment-router.js`** - State machine routing logic
- **`assets/js/contract-controller.js`** - Contract page controller, signature handling
- **`assets/js/invoice-controller.js`** - Invoice page controller
- **`assets/js/checkout-controller.js`** - Stripe Payment Element integration

### Data Files

- **`assets/jobs/*.json`** - One JSON file per client project (see `_job_template.json`)
- **`assets/js/manifest.json`** - Lookup mapping: `{last_name}-{project_keyword}` → JSON path
- **`generate_manifest.py`** - Script that generates manifest.json

### Automation

- **`.github/workflows/process-job.yml`** - Main workflow (triggers on JSON changes)
- **`.github/scripts/process_stripe_products.py`** - Stripe catalog sync script
- **`api/*.js`** - Vercel serverless functions

### Templates

- **`assets/templates/contract-template.html`** - Contract HTML template
- **`assets/templates/invoice-template.html`** - Invoice HTML template
- **`assets/jobs/_job_template.json`** - JSON schema template

### Styling

- **`assets/css/input.css`** - Tailwind CSS source (with custom variables)
- **`assets/css/styles.css`** - Built CSS (committed to git)
- **`tailwind.config.js`** - Tailwind configuration
- **`package.json`** - npm scripts: `build:css`, `watch:css`

### Documentation

- **`assets/docs/explainers-tasks/`** - Setup guides, architecture docs
- **`assets/docs/planning-resources/`** - Reference files from portfolio project

---

## Automation Workflows

### GitHub Actions: JSON Changes → Stripe Catalog

**Workflow:** `.github/workflows/process-job.yml`

**Trigger:** Any change to `assets/jobs/*.json` files

**Steps:**

1. **Generate Manifest** (`python3 generate_manifest.py`)
   - Scans `assets/jobs/` directory
   - Creates `assets/js/manifest.json` mapping
   - Format: `"{last_name}-{project_keyword}"` → `"assets/jobs/{filename}.json"`

2. **Process Stripe Products** (`python3 .github/scripts/process_stripe_products.py`)
   - **Delete orphaned products**: Compares current folder vs Stripe catalog, deletes products without JSON files
   - **Create/update products**: For each payment in JSON:
     - If no `stripe_product_id` → Create new Product + Price
     - If amount/description changed → Update Product/Price
     - Store `stripe_product_id`, `stripe_price_id`, `stripe_product_name` back in JSON

3. **Commit Changes**
   - Updated `manifest.json` (if changed)
   - Updated JSON files (with Stripe IDs)
   - Commits and pushes automatically

**Key Logic:**
- **Selective updates**: Only creates/updates Stripe products when payment details change
- **Skips Stripe API** when only `contract.signed` or `payment.status` changes
- **Self-healing**: Deletes orphaned products (compares folder state vs catalog)

### Vercel Serverless Functions

**`/api/create-payment-intent`**
- Receives: `price_id`, `metadata` (job_id, payment_number, etc.)
- Retrieves Price from Stripe → Gets amount/currency
- Creates PaymentIntent → Returns `client_secret`
- Called by: `checkout-controller.js`

**`/api/sign-contract`**
- Receives: `job_id`, `signature_data`
- Calls GitHub Actions API (workflow_dispatch)
- Triggers workflow to update JSON file
- Called by: `contract-controller.js`

**`/api/update-payment`**
- Receives: `job_id`, `payment_number`, `payment_data`
- Calls GitHub Actions API (workflow_dispatch)
- Triggers workflow to update JSON file
- Called by: `/api/webhook` (when payment succeeds)

**`/api/webhook`**
- Receives: Stripe webhook events
- Validates webhook signature
- Handles `payment_intent.succeeded` event
- Extracts metadata → Calls `/api/update-payment`
- Called by: Stripe (automatically)

### Stripe Webhook Flow

```
Payment succeeds in Stripe
     ↓
Stripe sends webhook to: freelance-payments-neon.vercel.app/api/webhook
     ↓
Vercel validates signature
     ↓
Extracts: job_id, payment_number from metadata
     ↓
Calls /api/update-payment
     ↓
Calls GitHub Actions API
     ↓
GitHub Action updates JSON: payment.status = "paid", paid_date = today
     ↓
Commits and pushes
```

---

## Current Status & Known Issues

### ✅ What's Working

- Frontend deployed on GitHub Pages (`payments.august.style`)
- Vercel API functions deployed
- GitHub Actions workflow created
- Stripe products created successfully (19 test products in catalog)
- Manifest generation works and updates correctly ✅
- Payment routing logic implemented
- Contract/invoice templates created

### ⚠️ Known Issues

1. **Stripe Publishable Key**
   - Currently hardcoded in `checkout-controller.js` line ~107
   - Should be moved to config file or environment variable

2. **JSON Files Not Updated with Stripe IDs**
   - Products created in Stripe ✅
   - But JSON files still have `stripe_product_id: null`
   - **Cause**: Workflow was canceled before commit step
   - **Status**: Fixed code errors, needs testing

3. **Stripe Products Not Being Deleted**
   - When JSON files removed, products should be deleted from Stripe
   - **Current**: Had to delete manually from Stripe Dashboard
   - **Expected**: Deletion logic should work (compares folder vs catalog)
   - **Status**: Code exists, needs testing

4. **GitHub Pages Build Cancellation**
   - After turning off Vercel "must be authorized" setting, GitHub Pages builds cancel
   - **Behavior**: Your push → Vercel + Process Job run → GitHub Pages builds cancel
   - **Then**: Auto-update commit triggers → GitHub Pages builds successfully
   - **Impact**: Extra workflow run, but eventually works
   - **Note**: This is likely because GitHub Pages builds are triggered by the first push, then canceled when auto-update commit happens

5. **Vercel Deployment Cancellation**
   - "Unverified commit" error (harmless)
   - Vercel cancels deployments from GitHub Actions bot commits
   - **Impact**: None (frontend is on GitHub Pages, APIs already deployed)
   - **Solution**: Ignore or disable Vercel auto-deploy

6. **Contract Signing Not Updating JSON**
   - Currently only updates `sessionStorage`
   - Should call `/api/sign-contract` → GitHub Actions
   - **Status**: Code exists but needs testing

7. **Payment Success Not Updating JSON**
   - Webhook handler exists
   - Should call `/api/update-payment` → GitHub Actions
   - **Status**: Code exists but needs testing

### 🐛 Recent Fixes

- ✅ Fixed `NameError: name 'archived' is not defined` (changed to `deleted`)
- ✅ Fixed glob pattern: `assets/jobs/**/*.json` → `assets/jobs/*.json`
- ✅ Fixed manifest path: `manifest.json` → `assets/js/manifest.json`
- ✅ Refactored deletion logic: Git diff → Compare folder vs catalog (more robust)

---

## Testing & Debugging

### Local Testing

**Start local server:**
```bash
python3 -m http.server 5500 --bind 127.0.0.1
```

**Test pages:**
- `http://localhost:5500/` - Lookup form
- `http://localhost:5500/payment-router.html` - State machine entry

**Note:** GitHub Pages 404 routing doesn't work locally. Use direct page URLs.

### Testing Workflow

1. **Add test JSON file** to `assets/jobs/`
2. **Commit and push**
3. **Check GitHub Actions** - Should run workflow
4. **Check Stripe Dashboard** - Should see new products
5. **Check JSON file** - Should have Stripe IDs added
6. **Check manifest.json** - Should have new entry

### Stripe Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Any expiry date (future), any CVC, any ZIP.

### Debugging Checklist

**If workflow fails:**
- Check GitHub Actions logs
- Verify `STRIPE_SECRET_KEY` secret exists
- Check Python script errors
- Verify JSON file structure matches template

**If products not created:**
- Check Stripe Dashboard → Products
- Check workflow logs for API errors
- Verify Stripe secret key is correct (test mode)

**If manifest not updating:**
- Check if `generate_manifest.py` ran successfully
- Check if manifest.json changed (git diff)
- Verify commit step ran

**If payment fails:**
- Check browser console for errors
- Check Vercel function logs: `vercel logs`
- Verify Stripe publishable key is correct
- Check network tab - is API call succeeding?

**Workflow cancellation pattern:**
- **Normal behavior**: User push with JSON changes → Initial checks may cancel → Auto-update commit → All checks pass
- **This is expected**: The auto-update commit is what actually does the work
- **If all checks pass on user push**: No JSON changes detected, no Stripe operations needed
- **If checks cancel on user push**: JSON changes detected, Stripe operations will happen in auto-update commit

---

## Common Pitfalls

### DO NOT "Fix" These Things

1. **Glob Pattern**
   ```yaml
   paths:
     - "assets/jobs/*.json"  # ← Correct (files directly in folder)
   NOT: "assets/jobs/**/*.json"  # ← Wrong (looks for subdirectories)
   ```

2. **Manifest Path**
   ```python
   output_file = Path('assets/js/manifest.json')  # ← Correct
   NOT: Path('manifest.json')  # ← Wrong
   ```

3. **Stripe Constructor**
   ```javascript
   stripe = Stripe(publishableKey);  # ← Correct (capital S - constructor function)
   NOT: stripe = stripe(publishableKey);  # ← Wrong (lowercase - would be undefined)
   ```
   **Note**: Some IDEs may suggest lowercase, but `Stripe` (capital S) is the correct constructor function from Stripe.js library.

4. **Stripe Amount Conversion**
   ```python
   amount_cents = int(round(amount * 100))  # ← Correct (dollars → cents)
   NOT: amount_cents = amount  # ← Wrong
   ```

5. **Date Formats**
   ```json
   "due_date": "2025-01-20",           // ← ISO format (human-readable)
   "due_date_unix": 1737417600         // ← Unix timestamp (API-ready)
   ```

### Architecture-Specific Notes

- **Frontend calls Vercel API** - Not same domain, use full URL
- **Manifest updates automatically** - Don't manually edit `manifest.json`
- **Stripe products = separate per payment** - Format: `{invoice_number}-{payment_number}`
- **Deletion compares folder vs catalog** - Self-healing, works anytime
- **Workflow runs on JSON changes** - Not on other file changes

### Important Reminders

- **CSS must be built**: Run `npm run build:css` before committing
- **Python uses python3**: Scripts use `python3`, not `python`
- **Branch name**: `freelance-payments` (matches workflow)
- **Test files**: In `assets/docs/W_I_P/` (not in `assets/jobs/`)
- **Stripe constructor**: Use `Stripe()` (capital S) - it's a constructor function, not a variable

### Git Auto-Pull Before Push

To automatically pull before pushing (like portfolio project):

**Option 1: Git config (recommended)**
```bash
git config pull.rebase true
git config push.autoSetupRemote true
```

Then `git push` will automatically rebase local changes on top of remote changes.

**Option 2: Alias**
```bash
git config alias.pushall '!git pull --rebase && git push'
```

Then use `git pushall` instead of `git push`.

**Option 3: VS Code/Cursor setting**
- Settings → Git → `git.rebaseWhenSync: true`
- Then use "Sync" button instead of "Push"

---

## Quick Start for New AI Instances

### If You're a New AI Working on This Project

1. **Read this document first** ✅

2. **Review key files:**
   - `assets/jobs/_job_template.json` - JSON schema
   - `.github/workflows/process-job.yml` - Automation workflow
   - `.github/scripts/process_stripe_products.py` - Stripe sync logic
   - `assets/js/payment-router.js` - State machine logic

3. **Check current issues:**
   - Review GitHub Actions logs for recent failures
   - Check Stripe Dashboard for orphaned products
   - Verify manifest.json is up to date

4. **Understand the flow:**
   - JSON file added → GitHub Actions → Stripe products created
   - User visits → Lookup → Contract → Invoice → Checkout
   - Payment succeeds → Webhook → JSON updated

5. **Before making changes:**
   - Understand why something is the way it is
   - Check if it's an intentional design choice
   - Test locally before pushing
   - Verify workflow still runs after changes

### Key Debugging Resources

- **GitHub Actions**: https://github.com/seanivore/freelance-payments/actions
- **Stripe Dashboard**: https://dashboard.stripe.com/test/products
- **Vercel Dashboard**: https://vercel.com/seanivores-projects/freelance-payments
- **Vercel Logs**: `vercel logs` (CLI) or Dashboard → Functions → Logs

### Important Files to Read

**Architecture:**
- `assets/docs/explainers-tasks/ARCHITECTURE_EXPLAINED.md` - Frontend/backend split
- `assets/docs/explainers-tasks/WORKFLOW_ARCHITECTURE.md` - Complete workflow details

**Setup:**
- `assets/docs/explainers-tasks/VERCEL_SETUP.md` - Vercel configuration
- `assets/docs/explainers-tasks/ENV_VARS_CLARIFICATION.md` - Environment variables

**Testing:**
- `assets/docs/explainers-tasks/TESTING_GUIDE.md` - Step-by-step testing
- `assets/docs/explainers-tasks/TEST_JOBS_README.md` - Test file reference

**Reference:**
- `assets/docs/STRIPE_API_REQUIREMENTS.md` - Stripe API details
- `assets/jobs/README_TEMPLATE_VALUES.md` - JSON field reference

---

## File Structure

```
freelance-payments/
├── index.html                    # Lookup form
├── payment-router.html          # State machine entry
├── contract.html                # Contract page
├── invoice.html                  # Invoice page
├── checkout.html                 # Stripe checkout
├── completion.html               # Success page
├── generate_manifest.py          # Manifest generator
├── package.json                  # npm scripts (CSS build)
├── tailwind.config.js           # Tailwind config
├── vercel.json                  # Vercel config
│
├── .github/
│   ├── workflows/
│   │   └── process-job.yml      # Main automation workflow
│   └── scripts/
│       └── process_stripe_products.py  # Stripe sync script
│
├── api/                          # Vercel serverless functions
│   ├── create-payment-intent.js
│   ├── sign-contract.js
│   ├── update-payment.js
│   └── webhook.js
│
├── assets/
│   ├── css/
│   │   ├── input.css            # Tailwind source
│   │   └── styles.css           # Built CSS (committed)
│   │
│   ├── js/
│   │   ├── manifest.json        # Lookup mapping (auto-generated)
│   │   ├── payment-lookup.js
│   │   ├── payment-router.js
│   │   ├── contract-controller.js
│   │   ├── invoice-controller.js
│   │   └── checkout-controller.js
│   │
│   ├── jobs/
│   │   ├── _job_template.json   # JSON schema template
│   │   └── *.json               # Client project files
│   │
│   ├── templates/
│   │   ├── contract-template.html
│   │   └── invoice-template.html
│   │
│   └── docs/
│       ├── explainers-tasks/    # Setup guides, architecture docs
│       ├── planning-resources/  # Reference files from portfolio
│       └── W_I_P/               # Test JSON files (work in progress)
```

---

## Technology Stack

- **Frontend**: Pure HTML/CSS/JS (no framework)
- **Styling**: Tailwind CSS v3 + shadcn/ui-inspired components
- **Hosting**: GitHub Pages (frontend) + Vercel (API)
- **Payments**: Stripe Payment Element (embedded components)
- **Automation**: GitHub Actions + Python scripts
- **Architecture**: JSON-based dynamic content (like portfolio)

**Philosophy:** "Unconventionally smart" solutions leveraging existing tools creatively. Emphasis on maintainable code, clear architecture, and automation.

---

## Current Bugs to Fix

### High Priority

1. **Stripe IDs not in JSON files**
   - Products created in Stripe ✅
   - But JSON files have `stripe_product_id: null`
   - **Cause**: Workflow was canceled before commit step
   - **Next**: Test workflow with one JSON file, verify IDs get added

2. **Stripe products not being deleted**
   - When JSON files removed, products should auto-delete
   - **Current**: Had to delete manually from Stripe Dashboard
   - **Expected**: Deletion logic compares folder vs catalog, deletes orphans
   - **Next**: Test by removing a JSON file, verify product gets deleted

3. **Contract signing not updating JSON**
   - Code exists in `contract-controller.js`
   - Calls `/api/sign-contract` → Should trigger GitHub Actions
   - **Next**: Test contract signing flow end-to-end

4. **Payment success not updating JSON**
   - Webhook handler exists
   - Should update JSON when payment succeeds
   - **Next**: Test payment flow, verify webhook triggers

### Medium Priority

5. **GitHub Pages build cancellation pattern**
   - **Observation**: When NO JSON changes → All 4 checks pass ✅
   - **Observation**: When JSON changes → Initial push fails/cancels, auto-update commit succeeds ✅
   - **Pattern**: 
     - User push (no JSON) → All checks pass (no Stripe operations needed)
     - User push (with JSON) → Checks cancel/fail → Auto-update commit → All checks pass
   - **Likely cause**: Multiple workflows triggering simultaneously, causing conflicts
   - **Impact**: Extra workflow run, but eventually works correctly
   - **Next**: Investigate if workflow dependencies can prevent conflicts

6. **Vercel deployment cancellation**
   - "Unverified commit" error (harmless but annoying)
   - **Solution**: Ignore or disable Vercel auto-deploy

7. **Stripe publishable key hardcoded**
   - Should be in config file or environment variable
   - **Next**: Create `assets/js/config.js` or use environment

### Low Priority

8. **Test files cleanup**
   - 8 test JSON files in `assets/docs/W_I_P/`
   - 19 test products in Stripe catalog
   - **Next**: Add one test file back, verify deletion logic works

---

## Next Steps for Debugging

1. **Add one test JSON file** to `assets/jobs/`
2. **Push and verify**:
   - GitHub Actions runs successfully
   - Stripe product created
   - JSON file updated with Stripe IDs
   - Manifest updated
3. **Test payment flow**:
   - Lookup → Contract → Invoice → Checkout
   - Use test card: `4242 4242 4242 4242`
   - Verify webhook updates JSON
4. **Test deletion logic**:
   - Remove JSON file
   - Push
   - Verify Stripe product deleted

---

*Document created: 2025-01-17*
*Last updated: 2025-01-17*
*For project: Freelance Payments Micro-Site (payments.august.style)*
*Architecture by: Sean August Horvath + Claude (Composer)*
