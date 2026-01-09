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

## Big Picture Overview Planning 

We're doing this to learn for my own payments site, so that we can start a client project needing similar functionality where we'll be using a very similar build. As a result, this process has been incredibly insightful, on one hand. However, on the other hand, the movement through necessary refactoring to implement more functional features, like PDF embeds, and use of Stripe custom components, has left us dealing with so many bugs for days on end now. The issue now is that, as a designer building a client-used payment website, we need to be able to get functionality clean so that we can deal with the, barely-acceptable, visual design of the payments flow pages. 

### Consistent Issues Encountered

  + **From refactoring: Changing schemas to v4 and shifting to 3-action-workflow-type** 
    - There are some simple bug issues from changing schemas 
    - Our new 3-workflow-type simplicity has not been tested enough to confidently say it is bug free 
    - The logging of the new types has made it much easier to identify and locate the issue 
    - Not all edge cases have been found 
  + **Stripe checkout: especially dealing with custom components**
    - The largest number of issues have been due to changing ui-type:embedded to ui-type:custom where we needed to use different API version 
    - We had a successful payment flow once with the old ui-type:embedded but after realizing this wasn't the proper setup we haven't had any 

### High-Level Thoughts 

1. Come in with a **clean-slate to understand the functionality intentions in full**, in their current-and-final evolved-to state, including the final clean and simple logic reached for the steps in the three trigger-type workflows. 

2. Then conduct an **in-depth review** of all the script files looking for bugs and errors, of course, but also opportunities for more logical build that might have been overlooked as the project evolved. 

3. This can start primarily from this document `assets/docs/v4/v4_3_3/LIVING_DEV_PLAN.md` as well as our context-primer `assets/docs/v4/v4_3_0_custom_ui/AI_CONTEXT_PRIMER.md`, then by getting into the other **IMPORTANT FILES** as detailed in the project directory tree here. 

4. **Make any updates needed** if issues or conflicts in logic are found when conducting in-depth review; ideally see if we can find the bugs before testing by knowing what the files should include and then thoroughly combing through them. 

5. Finally, prepare new tests by placing a job JSON file, filled out, in the assets/docs/ directory so that I can move it into assets/jobs/ and we can start a new end-to-end test. Currently, the Stripe catalog has been cleared, remote and local are in sync. 

```
freelance-payments/
├── index.html                       # Login lookup form
├── 404.html                         # SPA routing handler (serves job.html for job URLs)
├── job.html                         # Single-page template (contract, invoice, payment sections)
├── .gitconfig-smart-push.sh         # Git conflict resolution script
├── api/                             # Vercel serverless functions
│   ├── google 
│   │   ├── auth.js                  # OAuth consent URL for initial authentication
│   │   └── callback.js              # OAuth callback and exchanges
│   ├── create-checkout-session.js   # Creates Stripe Checkout Session on-demand
│   ├── sign-contract.js             # Updates contract signed status in JSON file
│   ├── track-event.js               # Tracks user events (loaded, scrolled, viewed, downloads)
│   ├── update-payment.js            # Updates payment status in JSON file via GitHub Actions
│   └── webhook.js                   # Receives payment events and updates JSON files
├── assets/
│   ├── jobs/                        # Job JSON files (one per client project)
│   │   └── uid-xxx-xxx.json
│   ├── js/
│   │   ├── checkout-controller.js   # Stripe Checkout component element integration
│   │   ├── completion-controller.js # Complete message after using state.payment_1 state.payment_2
│   │   ├── contract-controller.js   # Contract signing, PDF display
│   │   ├── event-tracker.js         # Batches behavior event activity for updates
│   │   ├── glow-effect.js           # Dynamic UI design homepage element
│   │   ├── invoice-controller.js    # Loads job to display embedded invoice PDF
│   │   ├── payment-lookup.js        # Login form handler
│   │   ├── payment-router.js        # State machine for routing
│   │   └── manifest.json            # Lookup manifest (generated)
│   ├── pdf/
│   │   ├── contract/                # Contract PDFs (kon-{job_id}.pdf)
│   │   └── invoice/                 # Invoice PDFs (inv-{job_id}.pdf)
│   └── css/
│       ├── input.css 
│       └── styles.css               # Tailwind CSS (includes breakpoints)
├── .github/
│   ├── scripts/
│   │   ├── orchestration/
│   │   │   ├── admin_push.py        # Admin workflow logic
│   │   │   ├── payments.py          # Payment workflow logic
│   │   │   └── user_behavior.py     # User behavior workflow logic
│   │   └── utils/
│   │       └── json_io.py           # JSON file operations
│   └── workflows/
│       ├── admin-push.yml           # Admin-initiated push creates objects, PDFs
│       ├── user-behavior.yml        # User events, contract signing, etc. triggered flow 
│       └── payment.yml              # Triggered flow from payments webhook  
└── assets/docs/
    ├── _job_schema_v4.jsonc         # Comments as guide for required values 
    └── v4
        ├── v4_3_0
        │   └── AI_CONTEXT_PRIMER.md # This file
        └── v4_3_3
            └── LIVING_DEV_PLAN.md   # Version changes, current state
```

--- 

## Updates 

These are either confirmation of updates needed having been made and then clarifications or updates needed to convey that were encountered in the compiling of these documents urging specific areas of careful review. 

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

## Technical Details & Difficulties 

### Stripe Integration
  - **Stripe Elements with `ui_mode: custom`** (Basil API version `2025-03-31.basil`)
  - **Product ID = Job ID** (e.g., `uid-test-001`) if 'job ID' means anything significant in the code, idk why it was maintained 
  - **Only active products** counted for matching logic (prevents new JSONs from being deleted)
  - **Archived products tracked separately** for orphaned product detection
  - **8-step matching logic** to handle all scenarios:
    - Unmatched JSONs (create Stripe objects)
    - Unmatched catalog (archive orphaned products)
    - Matched with mismatched active status (archive/delete as needed)
  + Stripe API Version
    - **Required:** `2025-03-31.basil` (for `ui_mode: custom`)
    - **Used in:** `checkout-controller.js` (Stripe.js script URL) <- not sure what this means but 
    feels like we'd need to be across the board consistent 

### Git Workflow
  - **`git smart-push`** handles conflicts intelligently:      <- has not shown itself to be a full proof solution yet 
    `.gitconfig-smart-push.sh` 
    Full details: `assets/docs/v4/v4_3_3/GIT_WORKFLOW.md` 
    - Preserves intentional changes (staged/committed files)
    - Accepts auto-generated updates (manifest.json, etc.)
    - Properly handles modify/delete conflicts (uses `git rm` for deletions)
    - Checks rebase commit for deleted files during conflict resolution
  - Not sure on this file `.gitattributes` or `assets/jobs/.gitkeep` 
    - Depending on when attributes were added it makes me curious if they might be the cause of the merge errors 
    - Also we have that keeps file in jobs directory, but 'contracts' and 'pdf' keep getting deleted as well at `assets/pdf/...` which typically happens when I need to manually deleted the PDFs in those files, then run the "smart-push" it gets a conflict, wants to put them back and/or updates with the actual containing directory of the deleted PDF removed, but it isn't consistent in its error (both were not deleted the same time even though both were emptied of PDFs and, separately, both have had their directory removed)
  + Regarding "Manifest Conflict Markers" and .gitattributes 
    - **Issue:** Git conflict markers can appear in manifest.json during rebase
    - **Impact:** JSON parse errors prevent workflow from checking Stripe catalog
    - **Fix:** `git smart-push` should handle this, but manual cleanup may be needed
    - **Status:** Fixed in recent update (checks rebase commit for deletions)

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

### Workflow Orchestration
  - **Three separate workflow files** (admin-push, user-behavior, payment) - each self-contained
  - **Sequential execution** with concurrency groups (`freelance-payments-workflows-${{ github.ref }}`)
  - **Workflow-level concurrency** prevents cancellation of in-progress runs
  + Concurrency Groups
    - **All workflows:** `freelance-payments-workflows-${{ github.ref }}`
    - **Cancel in progress:** `false` (protects running workflows)
    - **Note:** Pending runs may still be canceled by GitHub Actions (intended behavior)
  - **Explicit step-by-step logging** for all 12/16/14 steps respectively
  - **Clear RESULT and ARTIFACTS logging** for transparency
  + Steps listed below 
    - Though each workflow has a handful of identical steps, every workflow is created to be wholly independent 
    - If we find a bug and error that we correct in one of the .yml workflows 
    - We will very likely need to make similar updates to the other .yml workflows 

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
      - `state.payment_1.succeeded` or `state.payment_2.succeeded` add timestamp value 
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

## User Flow by File 

  1. `assets/js/glow-effect.js` 
     - User interaction design on homepage of payment site at `index.html` 
     - Creates dynamic light source through frosted glass that follows cursor  
  2. `assets/js/payment-lookup.js` 
      - Homepage user form submission 
      - Finds job via `assets/js/manifests.json` for dynamic elements 
     + shadcn/ui "inspired" — `assets/js/components/button.js` button handled with tailwind classes in `assets/css/styles.css` 
     + shadcn/ui "inspired" — `assets/js/components/card.js` card component 
     + shadcn/ui "inspired" — `assets/js/components/input.js` input component 
  3. `assets/js/payment-router.js` 
    - Uses state management to determine where in process flow to place user 
    - Works for their first visit versus returning after making one payment or even returning after reading but not signing contract  
  4. `assets/js/event-tracker.js` 
    - Batches recorded user-behavior event activity for updates on job JSON state management  
    - Includes: `contract_loaded`, `contract_scrolled_complete`, `invoice_viewed`, `document_downloaded`, `signed_contract`
  5. `assets/js/contract-controller.js` 
    - Loads job to display embedded contract PDF 
    - Uses `job.html` template with #contract which adds to user's URL 
  6. `assets/js/invoice-controller.js` 
    - Loads job to display embedded invoice PDF 
    - Uses `job.html` template with #invoice in URL 
  7. `assets/js/checkout-controller.js` 
    - Creates checkout_session on-demand 
    - Works within `job.html` template with #payment-1, #payment-2 sections 
  8. `assets/js/completion-controller.js` 
    - Complete message after using `state.payment_1`/`state.payment_2` 
    - Works within `job.html` template with #completion 

---

## Next Steps 🎯

### Immediate (After Vercel Rate Limit Expires)
1. **Test archiving:** Push `uid-test-archive-001.json`, then delete it
2. **Test payment flow:** Push `uid-test-payment-001.json`, walk through full flow
3. **Verify Stripe objects:** Check dashboard for correct product/price IDs
4. **Verify manifest:** Ensure manifest.json updates correctly

### Short-term
1. **Fix event tracking:** Prevent early triggers (contract_scrolled_complete firing before scroll)
2. **Improve completion messaging:** Better differentiation between payment 1 and final payment
3. **Test multi-payment flow:** Ensure Payment 2 routing works correctly
4. **Document Stripe webhook setup:** Ensure payment workflow triggers correctly

### Long-term
1. **Optimize deployment strategy:** Reduce Vercel rate limit issues
2. **Add error recovery:** Better handling of workflow failures
3. **Improve logging:** More detailed error messages for debugging
4. **Add monitoring:** Track workflow success/failure rates

---

## Testing Checklist ✅

- [ ] Archive workflow (delete JSON → archive Stripe product)
- [ ] Payment flow (contract → invoice → checkout → payment)
- [ ] Multi-payment jobs (Payment 1 → Payment 2 → archive)
- [ ] Manifest updates correctly
- [ ] PDF generation works
- [ ] Event tracking accurate
- [ ] Completion page messaging correct
- [ ] Git workflow handles conflicts properly

## Notes 📝

- **Stripe Products:** Always use job ID as product ID (e.g., `uid-test-001`)  <-- *perfect example of why it seems like we need fresh eyes on the project, because idk what JOB ID even means other than generally ... we moved to only using Stripe vocabulary in schema v2, but somehow there are notes like this where it is clear from the way it was written that, somewhere, presumably in code, job-id is emphasized heavier which seems clearly an obviously point of facture when nowhere else will you find in docs or front end the job-id used*
- **Manifest:** Auto-generated, don't edit manually
- **Git:** Use `git smart-push` for all pushes (handles conflicts automatically)
- **Workflows:** Wait for each to complete before pushing again (or accept that pending runs may be canceled)
