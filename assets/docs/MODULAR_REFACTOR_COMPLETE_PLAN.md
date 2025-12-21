# Architecture & Modular Workflow Refactor

## Executive Summary

  - A **reusable payment micro-site** for collecting freelance project payments. Clients visit, enter their last name + project keyword, view/sign contracts, view invoices, and pay via Stripe.

  - **Key Innovation:** HTML-first documents with on-demand PDF generation (browser print-to-PDF) - simpler, faster, better UX than pre-generating PDFs.

### Refactoring During Final Testing 

  * **Transform the monolithic automation system into a highly modular, self-documenting architecture where** 

    - Each Stripe API call = one Python script
    - Git-based conditionals → Explicit `section_updated` flags
    - Redundant data eliminated
    - Mirrors Stripe's object model (use their vocabulary)
    - File structure reveals the logic

  * **Goal:** "If I can understand the Python, I know it's simple enough."

### About the Refactoring Updates  

  * **Debugging revealed opportunity to optimize automation flow** 

  + Needed to see the entire picture 
    - Know the trigger (or triggers)
    - Know the actions 
  + Plan the flow logic with conditionality build into the design 
    - Find more stable solutions 
    - Accommodate shortcoming; find simplest, most effective methods 

  * **Changes made will be highlighted as we go through this document** 

  + Current build will need updates 
    - To fit out improvements 
    - Then we can start testing from start again 
  + Changes to expect, generally  
    - Went fully modular with the API scripts 
    - We better grouped and simplified the JSON object 

  * **The nature of creating this document will result in something comprehensive** 

  + We'll be covering how things did work 
  + And then trying to highlight how things should work 

---

1. [The Core Architecture](#the-core-architecture)
2. [Items To Fix Post Refactor](#items-to-fix-post-refactor)
3. [AI Context Primer Common Pitfalls](#ai-context-primer-common-pitfalls)
4. [Design UI & UX Flow, Interrupted](#design-ui--ux-flow-interrupted)
5. [Anatomy Of The Updated Schema](#anatomy-of-the-updated-schema)
6. [New Modular Scripts](#new-modular-scripts)
7. [Update Migration Tasks, Continued](#update-migration-tasks-continued)
8. [Critical Files for Implementation](#critical-files-for-implementation)
9. [Triggers & Actions](#triggers--actions)

---

## The Core Architecture

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

### Two Different Hosts, Two Different Purposes 

  1. GitHub Pages (`payments.august.style`) - FRONTEND
  **What it hosts:**
    - All your HTML files (`index.html`, `contract.html`, `invoice.html`, `checkout.html`)
    - All your JavaScript (`assets/js/*.js`)
    - All your CSS (`assets/css/styles.css`)
    - All your static assets (images, fonts, etc.)

  **What users see:**
    - Users visit `payments.august.style`
    - They see the lookup form, contract, invoice, checkout page
    - This is the **public-facing website**

  2. Vercel (`freelance-payments-neon.vercel.app`) - BACKEND API
  **What it hosts:**
    - Serverless functions in `api/` directory:
    - `/api/create-payment-intent` - Creates Stripe PaymentIntent
    - `/api/sign-contract` - Updates contract signed status
    - `/api/update-payment` - Updates payment status
    - `/api/webhook` - Receives Stripe webhooks

  **What it does:**
    - Handles secure operations (can't expose Stripe secret keys)
    - Processes payments
    - Updates JSON files via GitHub Actions
    - Receives webhooks from Stripe

### How Hosts Work Together 

```
User visits: payments.august.style
     ↓
Frontend (GitHub Pages) loads HTML/JS
     ↓
User fills out lookup form that matches Job JSON file 
     ↓
404-Redirect Dynamically Creates Contract & Invoice from JSON Jobs 
     ↓
Frontend call: freelance-payments-neon.vercel.app/api/ for viewed contract, signed, downloaded 
     ↓
Payment screen triggers frontend call: freelance-payments-neon.vercel.app/api/create-payment-intent
     ↓
Vercel function creates PaymentIntent & returns client_secret to frontend
     ↓
Frontend shows Stripe Payment Element from JSON provided stripe_price_id
     ↓
User completes payment 
     ↓
Stripe sends webhook to: freelance-payments-neon.vercel.app/api/webhook
     ↓
Vercel function updates JSON via GitHub Actions 
```
### Hosts Summary 

  * **FRONTEND:** GitHub Pages Host
    - URL `payments.august.style` 
    - Purpose is what users see and interact with
  * **BACKEND API:** Vercel Host & Stripe API 
    - URL `freelance-payments-neon.vercel.app` 
    - Purpose is handles secure operations, payments 
  * **WEBHOOK:** Vercel host 
    - URL `freelance-payments-neon.vercel.app/api/webhook`
    - Purpose is receives Stripe events

### Setup & Infrastructure 

  - **Tailwind CSS v3** configured with shadcn/ui component styles
  - **Build process** (`npm run build:css`) - CSS compiles from `input.css` → `styles.css`
  - **Portfolio-inspired color scheme** - Dark theme with gradient depth effect and cereal aesthetic colors
  - **Component library** - Button, Input, Card components ready

---

## Items To Fix Post Refactor 

### Core Pages 

  1. **Lookup Page** (`index.html`)
    - shadcn/ui-styled form; Last Name + Project Keyword inputs
    - Error handling; Redirects to payment router

  2. **Payment Router** (`payment-router.html` + `payment-router.js`)
    - State machine logic
    - Routes based on contract signing and payment status
    - Handles: contract → invoice → checkout → completion

  3. **Contract Page** (`contract.html` + `contract-controller.js`)
    - Dynamically populates from JSON
    - Signature fields (typed name + date)
    - Sign button updates sessionStorage
    - Download PDF button (browser print-to-PDF)
    - Navigation links

  4. **Invoice Page** (`invoice.html` + `invoice-controller.js`)
    - Shows specific payment details
    - Payment number, amount, due date/term, status
    - Download PDF button
    - Links to contract/checkout

  5. **Checkout Page** (`checkout.html` + `checkout-controller.js`)
    - Stripe Payment Element integration (ready)
    - Payment form with error handling
    - Success handling (updates sessionStorage)
    - Routes to next payment or completion

  6. **Completion Page** (`completion.html`)
    - Success message for completed payments
    - Contact information

### JavaScript Controllers

  * **`assets/js/payment-lookup.js`** 
    - Lookup form handler, loads manifest, finds JSON
  * **`assets/js/payment-router.js`** 
    - State machine routing logic
  * **`assets/js/contract-controller.js`** 
    - Contract page controller, signature handling
  * **`assets/js/invoice-controller.js`**  
    - Invoice page controller
  * **`assets/js/checkout-controller.js`**  
    - Stripe Payment Element integration

### Data Files

  * **`assets/jobs/*.json`** 
    - One JSON file per client project (see `_job_template.json`)
  * **`assets/js/manifest.json`**  
    - Lookup mapping: `{last_name}-{project_keyword}` → JSON path
  * **`generate_manifest.py`** 
    - Script that generates manifest.json
  * **`.github/workflows/process-job.yml`**
    - Previous COMBINED workflow: Generates manifest & stripe catalog 
  * **`.github/scripts/process_stripe_products.py`** 
    - Stripe catalog sync script

### Automation

  * **`api/*.js`** 
    - Vercel serverless functions

### Templates

  * **`assets/templates/contract-template.html`** 
    - Contract HTML template
  * **`assets/templates/invoice-template.html`** 
    - Invoice HTML template
  * **`assets/jobs/_job_template.json`** 
    - JSON schema template

### Styling

  * **`assets/css/input.css`** 
    - Tailwind CSS source (with custom variables)
  * **`assets/css/styles.css`** 
    - Built CSS (committed to git)
  * **`tailwind.config.js`** 
    - Tailwind configuration
  * **`package.json`** 
    - npm scripts: `build:css`, `watch:css`

### Documentation

  * **`assets/docs/explainers-tasks/`** 
    - Setup guides, architecture docs
  * **`assets/docs/planning-resources/`** 
    - Reference files from portfolio project

---

## AI Context Primer Common Pitfalls

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

### Key Debugging Resources

  - **GitHub Actions**: https://github.com/seanivore/freelance-payments/actions
  - **Stripe Dashboard**: https://dashboard.stripe.com/test/products
  - **Vercel Dashboard**: https://vercel.com/seanivores-projects/freelance-payments
  - **Vercel Logs**: `vercel logs` (CLI) or Dashboard → Functions → Logs

---

## Design UI & UX Flow, Interrupted

### Homepage `index.html` 

  + Client login using their last name and a provided key-phrase 
  + Add a visual effect that stays with the pointer 
    - Create a bright glow behind colored frosted glass 
    - Light from glow reflects and shines around the corners of design elements 

  + Current screenshot 
    `assets/docs/planning-resources/homepage-glow-mouse/example-homepage-glow-mouse-1.jpg`
    - Inspo update screenshots; white is where pointer was 
    `assets/docs/planning-resources/homepage-glow-mouse/example-homepage-glow-mouse-2.jpg`
    - Inspo of same inspo site showing reflecting corners of elements 
    `assets/docs/planning-resources/homepage-glow-mouse/example-homepage-glow-mouse-3.jpg`

### Rest of Micro-Site 

  * **Have not tested far enough to see yet**

  1. Login on homepage as described above 
  2. Contract created dynamically from template and client's job JSON file 
  `assets/templates/contract-template.html` 
  3. Invoice created dynamically from job JSON file 
  `assets/templates/invoice-template.html` 
  4. Users scroll through and then can sign and download 
  5. After signing the payment page loads 
    + Calls Stripe API for 'Product' in Catalog's 'Price' 
      - State management from user interactions for smart loading 
      - Knows if you signed or not 
      - If you did, then shows first payment 
      - If you made first payment, shows section, etc. 

### Embrace Portfolio Style but with "Banker Legitimacy" Edge 

  * **Mint is a great example of amazing design for feeling secure** 

  + Portfolio CSS 
  `assets/docs/planning-resources/styles_example.css`

  + Specifically
    - the background with a gradient stripe down the middle to create curved depth 
    - The "cereal aesthetic" with the three horizontal bars that make a triangle 
    `assets/docs/planning-resources/portfolio-aesthetic-example.jpg`
  
  + Homepage can be improved and then carry through rest of pages 

---

## Anatomy Of The Updated Schema 

  * **Filename saved as Job ID** 

  + Use "Unique ID" generator 
    - Script on local system with custom command 
    - Always random result that is never repeated 

```bash 
  > ~/Development/freelance-payments > uid 
  Generated UID: uid-ccl-405
```

  * **Signable contract, invoice, and payment populated dynamically from JSON** 

  + Users login to the payment portal `payments.august.style` 
    - Client's contact last name and provided `project.keyword` 
    - Searches `assets/jobs/**.json` for their project's job JSON  

```json
{
  // === TOP-LEVEL FIELDS ===
"_metadata":{
    "project_name": "Bob's Roofing AI Voice Sales", // Casual to use on docs 
    "project_keyword": "ai-sells-roofing",  // User payment portal login
    "client_last_name": "Smith",            // Login for payments l 
    "job_id": "uid-abd-123"              // Single ID mentioned once 
},
"client": {
    "business": "Test Client Co",    // This value was called "Name" 
    "contact": { /* ... */ },       // Important accuracy details for docs 
    "address": { /* ... */ }
},

  // === OTHER CONTRACT & INVOICE INFO ===
"contract": {
    "draft_date": "2025-01-15",   // previously just "contract.date" 
    "work_start": "2025-01-20",   // previously just "contract.start_date"
    "work_end": "2025-04-20",   // previously just "contract.end_date"
    "rate_type": "Flat Rate",   // Only option for now
    "work_cost": 5000.0,     // previously just "contract.total_fee"
    "deposit": true,        // True | False 
    "deposit_amount": 1250.00,   // Amount | null 
    "deposit_percent": 25,       // Number | n/a 
    "deposit_pay_by": "work_start",
    "balance_pay_by": "before_launch",
    "balance_pay_days": 14,    // previously "invoice_days" should only apply to balance 
    "late_fee": 100.00,        // Applies to new shorter balance_pay_days 
    "legal_jurisdiction": "Massachusetts",  // previously just "contract.location"
    "maintenance_period_months": 3,
    "maintenance_monthly_fee": 150.00,  // previously just "contract.hourly_fee"
    "signatures": {      // signature fields simplified and made clearer 
        "contractor": { "legal_name" /* ... */ "signed_date" },
        "client": { "legal_name" /* ... */ "signed_date" }, },
    "metadata": {
        "viewed": false,    // True | False; after first login and scroll 
        "downloaded": 0,   // integer; Simple download counter 
        "signed": false  // True | False; tells what loads first next login  
    }
},
  /* all of the above fills in page templates dynamically and require nothing other than manifest build to display — NOTE if needed, dynamic pages can pull from ANYWHERE on the entire JSON */ 
    
  /* all of the below fill in Stripe Catalog entries and require a section_updated flag to direct automations or active:true/false fields, to archive when paid — NOTE if needed, any other fields can fill in a Stripe API call value IF they WILL NOT need later updates */

  // === STRIPE PRODUCT OBJECT ===
"product": {
    "job": "Website Development",   // "Name" of the object 
    "description": "Professional custom-built e-commerce website",
    "active": true,     // FALSE = archive = paid = PRICE OBJECTS archived first 
    "metadata": {
        "stripe_product_id": null, // Added by Stripe entry bounce back 
        "section_updated": false   // TRUE = needs sync to Stripe
    }
},
  /* Organized this way because if anything in this section is updated it can be fixed using very simple logic to keep Stripe Catalog and Jobs Directory in sync. 
      1. `section_updated` = true, then search for matching stripe_product_id 
      2. No matches? CREATE NEW PRODUCT 
      3. Find match? OVERWRITE ALL PRODUCT FIELDS PROVIDED 
      4. New product, place stripe_product_id on JSON 
      5. New or updated product, change `section_updated` to FALSE 
  Always add or update product entry and get the "stripe_product_id" before creating any PRICE OBJECTS for that product */ 

  // === STRIPE PRICE OBJECT ===
"price": [         // Stripe Price Object creation API call uses the 
    {                      // stripe_product_id on this JSON above 
    "nickname": "Deposit (25%)",    // Just an easy, user-friendly way to reference it 
    "unit_amount": 125000,      // cost always in pennies 
    "currency": "usd",           // only option for now 
    "due_date": "2025-01-20",     // or NULL if not stated or implied above 
    "due_date_unix": "1737349200",    // NULL too, or Unix Timestamp Epoch in Seconds 
    "due_type": "date",     // Date | Term; term if date is NULL 
    "due_term": "work start",     // Work start, before launch, etc. 
    "paid_date": null,        // Stripe flow updates to YYYY-MM-DD when paid 
    "paid_date_unix": null,    // Stripe flow updates to Unix Timestamp Epoch in Seconds 
    "paid": false,        // True | False 
    "active": true,       // When paid, workflow changes to false = archive 
    "metadata": {
        "payment_number": 1,  // Site backend uses to know which price object to show
        "stripe_price_id": null, // Added by Stripe (will ask for product too)
        "section_updated": false // flag if new info. or anything is updated 
        } },
      // Payment 2 example, same stripe_product_id and receive custom stripe_price_id
    {
    "nickname": "Balance payment",
    "unit_amount": 375000,
    "currency": "usd",
    "due_date": null,
    "due_date_unix": null,
    "due_type": "term",
    "due_term": "before launch",
    "paid_date": null,
    "paid_date_unix": null,
    "paid": false,
    "active": true,
    "metadata": {
        "payment_number": 2,
        "stripe_price_id": null,
        "section_updated": false } } ],
  /* Grouped this way because if anything in one PRICE OBJECT section is updated it can be fixed using very simple logic to keep Stripe Catalog and Jobs Directory in sync. 
      1. `section_updated` = true, then search for matching stripe_price_id 
      2. No matches? CREATE NEW PRICE OBJECT  
      3. Find match? CHANGE IT TO ACTIVE:FALSE AND CREATE NEW PRICE OBJECT 
      4. New price, place stripe_price_id on JSON 
      5. New or updated product, change `section_updated` to FALSE 
  Always add or update PRODUCT ENTRY including getting the "stripe_product_id" before creating ANY PRICE OBJECTS for this same product */ 
``` 

### Key Simplifications

  1. Use Stripe's Vocabulary
    - `active: true/false` (not custom "archived" state)
    - `section_updated: true/false` (not "needs_sync")
    - Product and Price objects mirror Stripe's structure

  2. Fix the Product → Prices Issue
    - Before:Each price created its own product (no `product` ID provided)
    - Now: Create Product FIRST → Get `stripe_product_id` → ALL prices reference SAME product

  3. Eliminate Duplication
    - `job_id` vs `invoice_number` (same thing)
    - Metadata in JSON AND Stripe (redundant)
    - Utils that are overkill (`metadata_builder.py`, `product_name_builder.py`)
    - Write `job_id` ONCE at top level (no duplication = no typos!)

  4. Simple Sync Logic

  * **PRODUCT OBJECT SECTION `section_updated: TRUE` PROCEDURE** 

    1. `section_updated` = true, then search for matching stripe_product_id 
    2. No matches? CREATE NEW PRODUCT 
    3. Find match? OVERWRITE ALL PRODUCT FIELDS PROVIDED 
    4. New product, place stripe_product_id on JSON 
    5. New or updated product, change `section_updated` to FALSE 

  * **PRICE OBJECT SECTION `section_updated: TRUE` PROCEDURE** 

    1. `section_updated` = true, then search for matching stripe_price_id 
    2. No matches? CREATE NEW PRICE OBJECT  
    3. Find match? CHANGE IT TO ACTIVE:FALSE AND CREATE NEW PRICE OBJECT 
    4. New price, place stripe_price_id on JSON 
    5. New or updated product, change `section_updated` to FALSE 

  * **CRITICAL: Product FIRST, then Prices!**

  **Product Sync (if `product.section_updated = true`):**
  ```python
  # Step 1: Check if product exists in Stripe
  if product.metadata.stripe_product_id:
      # Step 2: Product exists → Modify it
      call modify_product.py
  else:
      # Step 3: Product doesn't exist → Create it
      result = call create_product.py
      # Store the returned stripe_product_id in JSON
      product.metadata.stripe_product_id = result.id

  # Set section_updated = false (sync complete)
  product.section_updated = false
  ```

  **Price Sync (if `price.section_updated = true`):**
  ```python
  # Step 1: Check if price exists in Stripe
  if price.metadata.stripe_price_id:
      # Step 2: Price exists → Archive old, create new
      call archive_price.py(old_price_id)
      result = call create_price.py(
          product=product.metadata.stripe_product_id,  # CRITICAL!
          unit_amount=price.unit_amount
      )
      price.metadata.stripe_price_id = result.id
  else:
      # Step 3: Price doesn't exist → Create it
      result = call create_price.py(
          product=product.metadata.stripe_product_id,  # CRITICAL!
          unit_amount=price.unit_amount
      )
      price.metadata.stripe_price_id = result.id

  # Set section_updated = false (sync complete)
  price.section_updated = false
  ```

**Why this order matters:**
- Product MUST be created FIRST to get `stripe_product_id`
- ALL prices reference the SAME `stripe_product_id` in their `product` field
- This fixes the old bug where each price got its own product


---

## New Modular Scripts

  1. Created `.github/scripts/stripe/` modules (9 scripts)
  2. Created `.github/scripts/state/` modules (3 scripts)
  3. Created `.github/scripts/utils/` modules (2 scripts)
  4. Created `.github/scripts/orchestration/` modules (2 scripts)

  * **Write unit tests for each module**  -- MUST DO 

### Directory Layout Structure 

```
.github/scripts/
├── stripe/
│   ├── product/
│   │   ├── create_product.py      # Product.create()
│   │   ├── modify_product.py      # Product.modify()
│   │   ├── archive_product.py     # Product.modify(active=False)
│   │   ├── delete_product.py      # Product.delete()
│   │   └── list_products.py       # Product.list() with metadata filter
│   └── price/
│       ├── create_price.py        # Price.create()
│       ├── archive_price.py       # Price.modify(active=False)
│       ├── delete_price.py        # Price.delete()
│       └── list_prices.py         # Price.search() by job_id
├── state/
│   ├── update_contract.py         # Contract signing
│   ├── update_payment.py          # Payment status
│   └── detect_sync_needs.py       # Set section_updated flags
├── utils/
│   └── json_io.py                 # Shared JSON read/write (DRY) Prevents duplicate read/write code across all scripts
└── orchestration/
    ├── sync_catalog.py            # Main sync coordinator
    └── cleanup_orphans.py         # Delete orphaned products (edge cases)
```

### Script I/O Contracts

  * **Each script:**

    - Takes CLI args (`--product-id`, `--amount`, etc.)
    - Returns JSON to stdout
    - Uses exit codes (0=success, 1=validation error, 2=API error)
    - Has docstring explaining purpose and usage

  Example:
  ```python
  """
  Create a Stripe Price for a product.

  Usage:
      python3 create_price.py --product-id prod_xxx --amount 125000 --currency usd

  Returns:
      {"price_id": "price_xxx", "amount": 125000, "currency": "usd"}

  Exit codes:
      0 = Success
      1 = Validation error
      2 = Stripe API error
  """
  ```

### Key Scripts

  * **`state/detect_sync_needs.py`** - Replaces git diff logic
    - Compares current JSON to git HEAD
    - If product fields changed → Set `product.section_updated = true`
    - If price fields changed → Set `prices[n].section_updated = true`
    - Commits updated JSON with flags

  * **`orchestration/sync_catalog.py`** - Main coordinator (simple 3-step logic)

  * **`orchestration/cleanup_orphans.py`** - Edge case cleanup
    - Lists all products from Stripe
    - Compares to current JSON files (by job_id in metadata)
    - Deletes orphaned products (and their prices first!)

### Replace Git-Based Conditionals with Section Flags

  * **OLD (complex):**

  ```python
  # Git diff, complex comparisons, fragile logic
  def should_update_stripe_payment(payment, prev_payment):
      if not payment.get('stripe_product_id'): return True
      if prev_payment is None: return True
      if payment.get('amount') != prev_payment.get('amount'): return True
      # ...more conditionals
  ```

  * **NEW (simple):**

  ```python
  # Just check the section_updated flags
  def needs_sync(job_data):
      if job_data['product']['section_updated']:
          return True
      if any(price['section_updated'] for price in job_data['prices']):
          return True
      return False
  ```

### New Workflow Files

  * **`catalog-sync.yml`** - Syncs Stripe catalog on JSON changes

  ```yaml
  on:
    push:
      branches: [freelance-payments]
      paths: ["assets/jobs/*.json"]

  steps:
    - Detect sync needs (detect_sync_needs.py)
    - Commit state flags
    - Sync catalog (sync_catalog.py)
    - Cleanup orphans (cleanup_orphans.py)
    - Commit Stripe updates
  ```

  * **`user-action.yml`** - Handles contract signing, payment updates

  ```yaml
  on:
    workflow_dispatch:
      inputs: [action, invoice_number, payload]

  steps:
    - If action=sign-contract: update_contract.py
    - If action=update-payment: update_payment.py
    - Commit changes
  ```

  * **`manifest-update.yml`** - Generates manifest separately

  ```yaml
  on:
    push:
      paths: ["assets/jobs/*.json", "generate_manifest.py"]

  steps:
    - Generate manifest
    - Commit if changed
  ```

### Vercel Integration Details 

  * **GitHub Pages:** Static hosting only
    - Can only serve HTML/CSS/JS files
    - Cannot run server-side code
    - Cannot store secret keys

  * **Vercel:** Stateless serverless functions (backend API)
    - Creates Stripe Payment Intents (needs `STRIPE_SECRET_KEY` - already configured!)
    - Validates Stripe webhooks (signature verification - already set up!)
    - Triggers GitHub Actions (needs auth)
    - Bridges static frontend → dynamic backend

### Vercel Already Has

  - `STRIPE_SECRET_KEY` configured
  - Webhook set up (payment.succeeded, payment_intent events)
  - Connected to GitHub

### What Vercel Handles

  * **Contract Signing Flow:**
    - User signs → Frontend calls `/api/sign-contract`
    - Vercel triggers GitHub Actions → update_contract.py
    - Updates `contract.signed` and signature fields

  * **Payment Routing Logic:**
    - Already handles: "signed but not paid → route to payment 1"
    - Already handles: "paid payment 1 → route to payment 2"
    - **Verify:** Do we still need this complexity or just check contract.signed?

### Schema & Test JSON 

  1. Need to create new JSON test files with the new schema 
  2. Delete the old 

  * **OLD FOR REFERENCE**
  
    - `assets/docs/W_I_P/test-all-paid.json`
    - `assets/docs/W_I_P/test-already-signed.json`
    - `assets/docs/W_I_P/test-four-payments.json`
    - `assets/docs/W_I_P/test-long-description.json`
    - `assets/docs/W_I_P/test-multi-payment.json`
    - `assets/docs/W_I_P/test-partially-paid.json`
    - `assets/docs/W_I_P/test-single-payment.json`
    - `assets/docs/W_I_P/test-special-chars.json`
  
  * **NEW SCHEMA TEMPLATE** 

    - `assets/jobs/_job_template_v2.json`

---

## Update Migration Tasks, Continued 

**Frontend Updates:**
- `checkout-controller.js`: `stripe_price_id` → `stripe.current_price_id`
- Contract: Update signature paths

**Validation:** Old and new JSON produce identical frontend renders

### Orchestration Integration

Build new orchestrators using modular scripts:

**Tasks:**
1. Implement `detect_sync_needs.py`
2. Implement `sync_catalog.py` (calls modular Stripe scripts)
3. Implement `cleanup_orphans.py` (calls modular Stripe scripts)
4. Test on test data
5. Compare to old system output

**Validation:** New orchestration produces identical Stripe API calls as old

### Workflow Cutover

Replace monolithic workflow with modular workflows:

**Tasks:**
1. Create new workflows (catalog-sync.yml, user-action.yml, manifest-update.yml)
2. Disable old workflow (rename to .old)
3. Enable new workflows
4. Monitor first runs
5. Archive old scripts

**Rollback:** Keep old workflow available, can re-enable instantly

---

## Critical Files for Implementation 

  * **The 5 most important files:**

  1. **`state/detect_sync_needs.py`**
    - Core logic replacing git diff
    - Sets state flags that drive everything

  2. **`orchestration/sync_catalog.py`**
    - Main coordinator replacing process_stripe_products.py
    - Orchestrates all Stripe operations

  3. **`utils/json_io.py`**
    - All scripts depend on this
    - Must handle new schema correctly

  4. **`workflows/catalog-sync.yml`**
    - Primary workflow replacing process-job.yml
    - Coordinates detection → sync → commit

  5. **`migration/migrate_schema.py`**
    - One-time migration to new schema
    - Critical for smooth transition

---

## Triggers & Actions 

| Trigger            | Action(s)                                                             | Implementation                        |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------- |
| Contract opened    | `contract.metadata.viewed = true`                                     |                                       |
| Doc downloaded     | `contract.metadata.downloaded = +1`                                   |                                       |
| Contract signed    | `contract.metadata.signed = true`                                     | Vercel → `update_contract.py`         |
| Product added      | `stripe_product_id` add; `section_updated = false`                    |                                       |
| Product updated    | `section_updated = false`                                             | `detect_sync_needs` → `sync_catalog`  |
| First payment made | `price.paid = true`; `price.active = false`                           |                                       |
| Only payment made  | `price.paid = true`; `price.active = false`; `product.active = false` | `update_payment.py` checks all prices |
| Second payment made| `price.paid = true`; `price.active = false`                           |                                       |
| Final payment made | `price.paid = true`; `price.active = false`; `product.active = false` | Webhook → `update_payment.py`         |
| Price added        | `stripe_price_id` add; `section_updated = false`                      | `sync_catalog.py`                     |
| Price updated      | `section_updated = false`                                             | `detect_sync_needs` → `sync_catalog`  |
| Job JSON Deleted   | First delete product's Price Objects, then delete Product Object      | `cleanup_orphans.py`                  |

### Archive & Delete Stripe Rules 

  1. Must archive or delete all Price Objects related to a product first 
  2. Then you can archive or delete the Product Object 

---

*This file was adapted from Claude Code planning document and then integrated with some of the core architectural information. This was done by a human and therefore needs a thorough review and possible better organization. It might be best to use it as a large resource to pull out finer detailed next step documents, an updated and accurate context primer document, testing materials, and then a new architecture document. Created 2025-12-21 by Sean August Horvath* 