# Defining Our Adaptive Planning 

**AIM:** Create living, changing source of truth document. 

## Objective 

  + Previous versioning documentation captures essence of changes but are never kept completely accurate post implementation changes
  + As a result, looking back to understand the application functioning in current state was unreliable and led to inaccuracy 
  + This document should clearly define exact expectations, technical specifics, all workflow trigger and action specifics 

### v4 Goals 

  1. Integrate new v4 schema to include artifacts for PDF production, with no need for backwards functionality to previous schemas. 
  2. Contract and Invoice PDF production using an OAuth Google connection and Google Doc templates with {{placeholders}}. 
  3. Strategic, intentionally explicit, use of three `.github/workflows` that fit three distinct triggers. 
  4. Recognition of need for Stripe build `ui-type: custom`'s API requirements, not previous `ui-type: embedded`, through full lifecycle. 

### Process 

Link files managing flow of actions being facilitated. Through this detailing and confirming of actions and files, create a fuller, more accurate understanding of the application, and identify gaps in the scripts and logic, or errors left over from earlier builds. 

--- 

## Updates 

### Functional Blank Job v4 Schema 

  + There were some values removed in active job JSON files from updating to "ui-type: custom" instead of "embedded" 
    - Those changes are now reflected in the current job JSON template file 
    - It has been changed to a .JSONC file simply so that it could remain blank, but include details for each value 
  + Recreate from the new .JSONC 
    `assets/docs/v4/_job_schema_v4.jsonc` 
    - Create as .JSON only 
    - The old versions have been renamed and moved here if needed for reference 
      `assets/docs/v4/v4_0_0_schema/old-blank-version-4-schema.json`
      `assets/docs/v4/v4_0_0_schema/old-examples-version-4-schema.json` 

### Webhooks 

  **Active Stripe Webhook Events** 
  1. `checkout.session.completed`
  2. `checkout.session.async_payment_succeeded` (for bank transfers)
  3. `checkout.session.async_payment_failed` (for failed async payments)

  **Removed Old Webhook Events** 
  - `payment_intent.succeeded` (not sent for Checkout Sessions)
  - `payment_intent.payment_failed` (not sent for Checkout Sessions)

  **FULL DETAILS** `assets/docs/v4/v4_2_0_workflow_trio/WEBHOOK_CONFIGURATION.md` 

### Test Job JSON Inaccuracies 

  + These missing values cause downstream effects like inaccurate Stripe catalog records or even improperly created document PDFs. 
    - The test job JSON objects were specifically missing the checkout_session's "price" value where it needs to reference the price object's ID 
    - The checkout_session is tied to the price object by ID, the price object ID references the Product Object; missing one element breaks the chain 
    - Check that the following logic, stipulations, and artifact creation confirmation JSON updates are completed accurately to cover all bases 

  **During Stripe object creation flow, `price1` and `price2` objects are created**
  + Artifacts returned to JSON must include: 
    - `price1.id` or `price2.id` filled out to replace 'null' (must be completed for possible future flow functions referencing this id via this location)
    - `checkout_session_1.line_items` array must include adding the `price1.id` to `price` in the array next to the `quantity: 1` value (must be added so that upon checkout the Stripe catalog accuracy is maintained)
    - `checkout_session_2.line_items` array must include adding the `price2.id` to `price` in the array next to the `quantity: 1` value (must be added so that upon checkout of this item the Stripe catalog accuracy is maintained by knowing the product object now has no active price objects)
    - Add the `price1.id` or `price2.id` respectively to `state.objects.price_1` or `state.objects.price_2`
  
  **Confirm accuracy of other `state.object` values created** 
  + The following fields are updated upon creation of Stripe objects for confirmation 
    - `state.objects.created` = timestamp confirming creation 
    - `state.objects.product` = add `product.id` to confirm creation 
    - `state.objects.price_1` and `state.objects.price_2` defined above, added when created 
    - `state.objects.customer` = add `customer.id` to confirm creation 
    - `state.objects.coupon` = add `coupon.id` to confirm creation if applicable 
  
  **Remaining `state.object` values created**
    - `state.objects.checkout_session.payment_1` and `state.objects.checkout_session.payment_2` 
    - We can remove these items as they were initially created with the understanding that we could create checkout_sessions ahead of time 
    - If we want to record the checkout_session ID provided upon response it should be added to the `checkout_session_1` and `checkout_session_2` objects near bottom as `id` but with opening for an array since checkout sessions could be created as many times as the user logs in to go pay, but then backs out to come back to pay later; i.e. there could be more than one `checkout_session_1/2.id` 
    - Indication of payment will be recorded via a different artifact 

  **Payment confirmation in the `state` section** 
    - `state.payment_1.intent` and `state.payment_2.intent` are not currently used 
    - `state.payment_1.processing` and `state.payment_2.processing` not currently used 

  **When a payment is complete, via the Stripe webhook event** 
  + If it was `checkout_session_1` 
    - Meaning it should have had the line item accurately referencing the Price Object being paid for at `line_items` array for `price` and `quantity` --> Change `price1.active= true` to `price1.active= false`
    - If the `price1.product.products` array containing the `product.id` references a Product Object with `product.total_payments` <= 1 --> Change that `product.active= true` to `product.active = false`
    - Add a timestamp to `state.payment_1.succeeded` 

  + If it was `checkout_session_2` 
    - Meaning it should have had the line item accurately referencing the Price Object being paid for at `line_items` array for `price` and `quantity` --> Change `price2.active= true` to `price2.active= false` 
    - In the `price2.product.products` array containing the `product.id` --> change that product object `product.active= true` to `product.active= false` 
    - Add a timestamp to `state.payment_2.succeeded` 

### Three Workflow Step Accuracies 

  + In placing the workflows below there were areas unclear or lacking detail 
  + Please confirm that the logic described below for each of the three reflects the actual steps and labels of the steps for each of the different workflows so that User can easily debug or see what is happening in the workflow logs 

---

## Current State & Next Steps

  **Version:** v4.3.3  
  **Date:** 2026-01-05  
  **Status:** Testing & Refinement Phase

### Workflow Orchestration
  - **Three separate workflow files** (admin-push, user-behavior, payment) - each self-contained
  - **Sequential execution** with concurrency groups (`freelance-payments-workflows-${{ github.ref }}`)
  - **Workflow-level concurrency** prevents cancellation of in-progress runs
  - **Explicit step-by-step logging** for all 12/16/14 steps respectively
  - **Clear RESULT and ARTIFACTS logging** for transparency

### Stripe Integration
  - **Stripe Elements with `ui_mode: custom`** (Basil API version `2025-03-31.basil`)
  - **Product ID = Job ID** (e.g., `uid-test-001`)
  - **Only active products** counted for matching logic (prevents new JSONs from being deleted)
  - **Archived products tracked separately** for orphaned product detection
  - **8-step matching logic** correctly handles all scenarios:
    - Unmatched JSONs (create Stripe objects)
    - Unmatched catalog (archive orphaned products)
    - Matched with mismatched active status (archive/delete as needed)

### Git Workflow
  - **`git smart-push`** handles conflicts intelligently:
    - Preserves intentional changes (staged/committed files)
    - Accepts auto-generated updates (manifest.json, etc.)
    - Properly handles modify/delete conflicts (uses `git rm` for deletions)
    - Checks rebase commit for deleted files during conflict resolution

### PDF Generation
  - **Google Docs template-based** PDF generation
  - **OAuth refresh token flow** (no service account needed)
  - **PDFs generated immediately** after Stripe objects created
  - **Stored only in repository** (temporary Google Docs deleted)

### Frontend
  - **Stripe Elements** properly initialized with `fetchClientSecret`
  - **Event tracking** (contract_loaded, contract_scrolled_complete, contract_signed, invoice_viewed)
  - **Completion page** messaging for single vs multi-payment jobs
  - **Homepage UI** improvements (glow effects, updated copy)

---

## Technical Details 

### Stripe API Version
- **Required:** `2025-03-31.basil` (for `ui_mode: custom`)
- **Used in:** `checkout-controller.js` (Stripe.js script URL)

### Concurrency Groups
- **All workflows:** `freelance-payments-workflows-${{ github.ref }}`
- **Cancel in progress:** `false` (protects running workflows)
- **Note:** Pending runs may still be canceled by GitHub Actions (intended behavior)

### Three Workflow Steps 

**1. ADMIN STARTED: `.github/workflows/admin-push.yml`** 
  + TRIGGER=admin-push
  + When: Admin pushes JSON files to repo 
  + Behavior: Starts immediately when admin pushes
  + Flow:
    1. Compare JSONs to catalog 
      - 'Unmatched' = a product.id in either location but not both 
      - 'Matched' = a product.id in both locations 
      - For each situation, the secondary parameter `active=true/false` defines the action 
    2. Unmatched: JSON but no catalog, if `json.active=true` → create catalog object, create PDF contract and invoice 
      - Add new Stripe Catalog object artifacts to JSON 
      - Add new Contract and Invoice PDF artifacts to JSON 
    3. Unmatched: JSON but no catalog, if `json.active=false` → delete JSON file 
    4. Unmatched: Catalog but no JSON, if `catalog.active=true` → modify catalog `active=false`
    5. Unmatched: Catalog but no JSON, if `catalog.active=false` → ignore (this is good, accurate completed job)
    6. Matched: `catalog.active=false`, `json.active=true` → delete JSON
    7. Matched: `catalog.active=false`, `json.active=false` → delete JSON
    8. Matched: `catalog.active=true`, `json.active=false` → modify catalog to `active=false`, delete JSON
    9. Matched: `catalog.active=true`, `json.active=true` → ignore (this is good, accurate, active job)
    10. Create new manifest that reflects resulting JSON directory
    11. Build pages
    12. Deploy

**2. USER-BEHAVIOR NON-PAYMENT EVENTS STARTED: `.github/workflows/user-behavior.yml`**
  + TRIGGER=user-behavior
  + When: User behavior events (contract loaded, scrolled, signed, etc.)  
  + Behavior: Waits for 2 minutes of inactivity, then processes
  + Flow: 
    1. Events arrive from frontend (already batched client-side: 5 min OR page unload)
    2. Queue events in backend
    3. Wait 2 minutes of no new events (allows user to wrap up their session)
    4. After inactivity period → update JSONs with all queued event artifacts to monitor state 
    5. Compare JSONs to catalog 
      - Same flow as `admin-push` workflow
      - 'Unmatched' = a product.id in either location but not both 
      - 'Matched' = a product.id in both locations 
      - For each situation, the secondary parameter `active=true/false` defines the action 
    6. Unmatched: JSON but no catalog, if `json.active=true` → create catalog object, create PDF contract and invoice
      - Add new Stripe Catalog object artifacts to JSON 
      - Add new Contract and Invoice PDF artifacts to JSON 
    7. Unmatched: JSON but no catalog, if `json.active=false` → delete JSON file 
    8. Unmatched: Catalog but no JSON, if `catalog.active=true` → modify catalog `active=false`
    9. Unmatched: Catalog but no JSON, if `catalog.active=false` → ignore (this is good, accurate completed job)
    10. Matched: `catalog.active=false`, `json.active=true` → delete JSON
    11. Matched: `catalog.active=false`, `json.active=false` → delete JSON
    12. Matched: `catalog.active=true`, `json.active=false` → modify catalog to `active=false`, delete JSON
    13. Matched: `catalog.active=true`, `json.active=true` → ignore (this is good, accurate, active job)
    14. Create new manifest that reflects resulting JSON directory
    15. Build pages
    16. Deploy

**3. STRIPE WEBHOOK PAYMENT EVENT STARTED: `.github/workflows/payment.yml`**
  + TRIGGER=payment
  + When: Payment completes (Stripe webhook) 
  + Behavior: Processes within 1 minute (doesn't need to interrupt, but fast)
  + Flow:
    1. Webhook event arrives (payment succeeded)
    2. Queue events in backend 
    3. Wait 1 minute (allows user to wrap up their session)
    4. After 1 minute period → update payment status in JSON 
      - `state.payment_1.succeeded` or `state_payment_2.succeeded` add timestamp value 
      - If `price1` paid, then update `price1.active= true` to `price1.active= false`
      - If `price2` paid, then update `price2.active= true` to `price2.active= false` 
      - If `price1.count` <= `product.total_payments` then change `product.active= true` to `product.active= false`
      - If `price1.count` > `product.total_payments` then leave `product.active= true` as is 
    5. Compare JSONs to catalog
      - Same flow as `admin-push` workflow
      - 'Unmatched' = a product.id in either location but not both 
      - 'Matched' = a product.id in both locations 
      - For each situation, the secondary parameter `active=true/false` defines the action 
    6. Unmatched: JSON but no catalog, if `json.active=true` → create catalog object, create PDF contract and invoice
      - Add new Stripe Catalog object artifacts to JSON 
      - Add new Contract and Invoice PDF artifacts to JSON 
    7. Unmatched: JSON but no catalog, if `json.active=false` → delete JSON
    8. Unmatched: Catalog but no JSON, if `catalog.active=true` → modify catalog `active=false`
    9. Unmatched: Catalog but no JSON, if `catalog.active=false` → ignore
    10. Matched: `catalog.active=false`, `json.active=true` → delete JSON
    11. Matched: `catalog.active=false`, `json.active=false` → delete JSON
    12. Matched: `catalog.active=true`, `json.active=false` → modify catalog to `active=false`, delete JSON
    13. Matched: `catalog.active=true`, `json.active=true` → ignore
    14. Create new manifest that reflects resulting JSON directory
    15. Build pages
    16. Deploy

--- 

## Known Issues 

### Vercel Rate Limits
- **Issue:** Vercel deployment rate limits (currently 3 hours)
- **Impact:** Blocks testing when multiple workflows run quickly
- **Workaround:** Wait for rate limit to expire before next test
- **Future:** May need to batch deployments or use different deployment strategy

### Manifest Conflict Markers
- **Issue:** Git conflict markers can appear in manifest.json during rebase
- **Impact:** JSON parse errors prevent workflow from checking Stripe catalog
- **Fix:** `git smart-push` should handle this, but manual cleanup may be needed
- **Status:** Fixed in recent update (checks rebase commit for deletions)

### Workflow Logic Edge Cases
- **Issue:** When JSON deleted but Stripe product exists, workflow should archive it
- **Status:** Logic exists (Step 4: orphaned products), but needs verification
- **Test:** `uid-test-archive-001.json` will be deleted to test this

---