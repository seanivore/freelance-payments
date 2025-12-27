# Stripe Catalog-Sync Bug Issue Review & Solution 

## Overview 

  **TESTING ISSUES ENCOUNTERED**
  1. JSON files were not updated with details confirming Stripe catalog Product Object creation 
  2. In subsequent testing it appeared Stripe API calls were not followed by response or were followed by error response 

  **POST-TESTING REVIEW DISCOVERIES**
  3. Stripe API functioning properly, calls and responses present and accurate, Stripe catalog created Product Objects as intended 
  4. Our workflow scripts sent hundreds of API calls per minute; response quantity likely blocked our automation's progress 
  5. API error responses caused by COUNTLESS Product Object delete calls preempted by an unsuccessful Price Deletion call 
  6. While one script was identified as being problematic, it is clear there is at least one other script with bugs 

  **PLANNED COMPREHENSIVE SOLUTION** 
  7. Simply, we over-engineered the necessary flow of triggers and action-created JSON file updates 
  8. Design of heavily-simplified workflow with fully defined automation map eliminates need of other buggy scripts 

### Summary 

Previously planned automation "simplification" and modular rebuild led to convoluted workflow resulting in bugs during testing. Post-testing review illuminated the issue and confirmed accurate tool functioning, i.e. Stripe API/SDK connection is working properly. The system has been replanned and our new logic is carefully defined below; it comes with a collection of overall simplifications that should, hopefully, allow us to build a more robust automated backend set of workflows. 

### Jump Through (1) Discovery, (2) Solution, (3) Implementation Specifics, (4) Simplest Automation Cycle Map Ever 

  - (1) What was [going wrong](#buggy-workflow-discoveries)
  - (2) A much easier way [to fix everything](#new-script--workflows)
  - (3) Step-by-step API Stripe Object [creation guide](#job-json-stripe-setup)
  - (4) Overall flow breakdown showing 2-distinct [automation cycle start-to-end](#comprehensive-flow-breakdown) 

### Old System Versus New System 

  * **These are the big picture changes from current system to the new system** 

  1. No use of 'DELETE' Stripe catalog objects at all
    - We will only ARCHIVE Stripe Product Object via 'Modify' `active: false | true` 
    - No need to update Price Objects, Coupon Objects, etc. 
  2. All Freelance Payments will have TWO 'initial' and 'balance' 
    - Initial payment will always start work; we should only loosely allude to this as a deposit in contract 
    - Balance payment will always be due to complete work, we can hardcode that this has a 14-day due date range upon receipt, and $150/late fee 
    - In all logic for UX state management directing user to certain page or payment, use Payment 1 and Payment 2 
    - Product meta data still says total number of payments as well, but other than this, no additional future prep need be designed into the system 
  3. The job JSON file Schema is remade to focus on STATE MANAGEMENT and STRIPE OBJECT CREATION 
    - All vocabulary should reflect Stripe; all values that can be in a Stripe Object, are now planned to be in a Stripe Object 
    - Top of schema 'identifying information' for contract and invoice, and scope options at bottom are the only values not in a Stripe Object 
  4. All Stripe Objects created IMMEDIATELY before adding to manifest; this includes Checkout Sessions 
    - (1) project object, (2) customer object, (3-4) initial and balance payment, (5) coupon object 
    - (6-7) checkout session object 
    - The first payment must always include any discount, with project cost totals reflecting pre-discount, too keep taxes accurate 
  5. The Contract and Invoice templates should be updated accordingly 
    - We need to check we are writing them out according to the information we are already collecting 
    - Instead of collecting a bunch of unnecessary extra, or even duplicate, information 
    - Flag if there are any essentials missing that are needed for these two documents, that weren't just simplified 
  6. JSON files and Stripe Objects are ARCHIVED and REPLACED with a new uid-xxx-xxx only 
    - No more looking for small changes on JSON files at all 
    - User needs to fix a JSON object? The old one is archived and completely replaced by new entry 
      (1) They can copy the file, make all the changes they could possibly need 
      (2) Give it a new Job ID uid-xxx-xxx; then DELETE the old Job JSON file
      (3) Update all applicable Stripe Objects in JSON that fit the uid-xxx-xxx structure 
          - Price Object for payment 1 uid-xxx-xxx-1 and payment 2 uid-xxx-xxx-2 
          - Customer Object uid-xxx-xxx-client 
          - Discount Coupon Object uid-xxx-xxx-coupon 
    - The `uid-xxx-xxx` is what the job/JSON is saved as, i.e. `assets/jobs/uid-xxx-xxx.json` 
    - The manifest lists JSON by `uid-xxx-xxx` which is used as part of the payment page's URL  
    - With each manifest entry is the `product_object.metadata.login-keyword` and `product_object.metadata.login-name`
    - Simple workflow and triggers defined in detail below but basically 
      (1) Gather filenames in `assets/jobs/...` directory 
      (2) Compare to current, not-yet-updated, manifest and ignore all entries with a matching file name 
      (3) If an entry has no filename match, use simple archive command for the Product Object only 
      (4) If a filename has no manifest match, create all required Stripe objects needed 
      (5) After all objects created, there are JSON updates to be made in state management; queue these 
      (6) After all new JSON have all required Stripe Objects created, then all JSON files state management should be updated in batch 
      (6) Only then, upon completion, is the NEW manifest created 

### Planning Next Steps For New System  

  * **What do we prepare and update to integrate the new schema, update trigger logic, actions, and workflows?**

  1. Examine in detail the newly planned flow in this document 
  2. Compare old `assets/jobs/_job_template_v2.json` with new `assets/jobs/_job_template_v3.json` to identify specific changes 
  3. As mentioned, schema `v3` is built to first to MANAGE STATE and second to GROUP STRIPE OBJECTS 
    - Triggered actions in the workflow add details to the state management section 
    - This way, state management section can inform logic needed to know exactly what page/payment a User logging in should be sent to 
  4. Make sure new mapped workflow cycle's `trigger, flow, action, cont.` needs are provided for; reviewing all old files for accuracy 
    - `api/create-payment-intent.js`, `api/webhook.js`, `api/update-payment.js`, and `api/sign-contract.js` 
    - `.github/workflows/orchestrate.yml` and `.github/workflows/process-job.yml` 
  4. Eliminate all current automation scripts and workflows, noting what needs to be rewritten and what novel files are needed 
     - `./.github/scripts/...` and `.github/workflows/...` 
  5. Find the JS files that need to be updated, as well as the template files, and any HTML files 
     - `assets/js/...` and `assets/js/components` 
     - The `assets/js/manifest.json` wil have a new structure 
     - `assets/templates/contract-template.html` and `assets/templates/invoice-template.html` 
     - `checkout.html`, `completion.html`, `contract.html`, `index.html`, `invoice.html`, and `payment-router.html` 
  6. What other elements are missing from this update? Old documents from previous refactor and bug fixes to check for any missing concepts. 
    - `assets/docs/planning-resources/PREVIOUS_REFACTORING/AI_CONTEXT_PRIMER.md`
    - `assets/docs/planning-resources/PREVIOUS_REFACTORING/MODULAR_REFACTOR_PLANNING.md`
    - `assets/docs/planning-resources/PREVIOUS_REFACTORING/SCHEMA_MIGRATION_RECOVERY.md`
    - `assets/docs/planning-resources/PREVIOUS_REFACTORING/TESTING_DEBUGGING_STATUS.md` 
  7. Create new triggers, actions, and workflows 
    + Check the map defined at bottom of page 
    + If possible, name each step as accurately as possible, for ease of communicating between AI and my Web Browser 
      - So that when we see things running and fail in GitHub actions 
      - So that it is obvious what exactly is which trigger 
      - Able to identify which files exactly are each action step 
    + Before building the workflows, evaluate if they are simple as possible 
      - Do we need an overarching orchestrator again or not 
      - There are two distinctly different flows, only one is admin triggered by push 
      - Discuss and strategize best way to queue actions that need to run, to efficiently run them together, appropriate amount of time, etc. 
  8. Create new tests using the new v3 schema. These are the old tests for reference. 
    - `assets/docs/planning-resources/W_I_P/test-all-paid.json`
    - `assets/docs/planning-resources/W_I_P/test-already-signed.json`
    - `assets/docs/planning-resources/W_I_P/test-four-payments.json`
    - `assets/docs/planning-resources/W_I_P/test-long-description.json`
    - `assets/docs/planning-resources/W_I_P/test-multi-payment.json`
    - `assets/docs/planning-resources/W_I_P/test-partially-paid.json`
    - `assets/docs/planning-resources/W_I_P/test-single-payment-v2.json`
    - `assets/docs/planning-resources/W_I_P/test-single-payment.json`
    - `assets/docs/planning-resources/W_I_P/test-special-chars.json` 
  9. Test each step in the workflow separately; we didn't do that last time and ended up wishing we did 
    - Note that we test on the live site 
    - We've not yet gotten past testing the addition/removal of JSON files and syncing of Stripe Catalog 

### Current Project Directory 

```plaintext 
.
├── _config.yml                   <-- GitHub Pages build guide 
├── CNAME                         <-- GitHub Pages custom domain 
├── .cursor/plans/
│   └── freelance_payments_micro-site_afd10b54.plan.md   <-- Exists, but is dated; use for outline only, only if needed
├── .env
├── .env.local
├── .example.env
├── .github
│   ├── scripts
│   │   ├── generate_manifest.py
│   │   ├── orchestration
│   │   │   ├── cleanup_orphans.py
│   │   │   ├── orchestrate_workflow.py
│   │   │   └── sync_catalog.py
│   │   ├── process_stripe_products.py
│   │   ├── state
│   │   │   ├── detect_sync_needs.py
│   │   │   ├── update_contract.py
│   │   │   └── update_payment.py
│   │   ├── stripe
│   │   │   ├── price
│   │   │   │   ├── archive_price.py
│   │   │   │   ├── create_price.py
│   │   │   │   ├── delete_price.py
│   │   │   │   └── list_prices.py
│   │   │   └── product
│   │   │       ├── archive_product.py
│   │   │       ├── create_product.py
│   │   │       ├── delete_product.py
│   │   │       ├── list_products.py
│   │   │       └── modify_product.py
│   │   ├── update_job_json.py
│   │   └── utils
│   │       └── json_io.py
│   └── workflows
│       ├── orchestrate.yml
│       └── process-job.yml
├── .gitignore
├── .vercel
│   ├── project.json
│   └── README.txt
├── api
│   ├── create-payment-intent.js
│   ├── sign-contract.js
│   ├── update-payment.js
│   └── webhook.js
├── assets
│   ├── css
│   │   ├── input.css
│   │   └── styles.css
│   ├── docs
│   │   ├── BUG_WORKFLOW_FIX.md                   <-- THIS DOCUMENT 
│   │   ├── planning-resources
│   │   │   ├── EXAMPLE_FILES                     <-- `404_example.html`, `data-loader_example.js`, etc. five others 
│   │   │   ├── IMAGE_VISUAL_DESIGN_GUIDE 
│   │   │   ├── ORIGINAL_PLANNING_DOCS
│   │   │   ├── PREVIOUS_REFACTORING
│   │   │   │   ├── AI_CONTEXT_PRIMER.md          <-- Dated from previous rebuild, need updated version 
│   │   │   │   ├── MODULAR_REFACTOR_PLANNING.md  <-- Reason for previous refactor before bug 
│   │   │   │   ├── SCHEMA_MIGRATION_RECOVERY.md  <-- Worked through before testing that led to bugs 
│   │   │   │   └── TESTING_DEBUGGING_STATUS.md   <-- Where we were before this document 
│   │   │   ├── reports
│   │   │   └── W_I_P                             <-- Old test JSON files 
│   │   └── stripe_docs_llm.txt                   <-- Written for LLMs using Stripe Dev Docs  
│   ├── favicon
│   ├── fonts 
│   ├── jobs
│   │   ├── _job_template_v2.json
│   │   └── _job_template_v3.json
│   ├── js
│   │   ├── checkout-controller.js
│   │   ├── components
│   │   │   ├── button.js
│   │   │   ├── card.js
│   │   │   └── input.js
│   │   ├── contract-controller.js
│   │   ├── invoice-controller.js
│   │   ├── manifest.json
│   │   ├── payment-lookup.js
│   │   └── payment-router.js
│   ├── media
│   └── templates
│       ├── contract-template.html
│       └── invoice-template.html
├── checkout.html
├── completion.html
├── contract.html
├── index.html
├── invoice.html
├── package-lock.json
├── package.json
├── payment-router.html
├── postcss.config.js
├── tailwind.config.js
└── vercel.json
```

---

## Buggy Workflow Discoveries 

### Stripe API Dashboard 

  * **Overwhelmed system that appears to have been working properly regardless** 

  + Our successful calls and call responses went through both ways 
    - Our POST product and price object creation, and even GET product object list requests were all successful and received response 
    - Simultaneously we had more than 20 invalid DELETE calls every minute that we made other calls; probably from another script 
  + The only call responses we got were regarding the DELETE product object calls 
    - These were accurate and expected based on the error 
    - The script causing them tried to delete prices before the product but it rejected the price calls outright 
    - Re: "Error 1" -- according to our python scripts we have responses of 0, 1, and 2 and we got 1 which is accurate 
  + We created 19 products that were visible in the Stripe Catalog 
    - Exported cvs reports confirm this: `assets/docs/reports/products.csv`, `assets/docs/reports/prices.csv` 
    - Actual API call logs can't be exported and not all call responses are saved 

  * **The real mystery becomes, what in the flow was calling delete_product repeatedly** 

  + We can eliminate the `cleanup_orphans.py` script from use with the new system; and it was something in `process-job.yml` workflow 

### GitHub Action Summary 

  * **The "Process Job & Update Stripe Catalog" workflow from `process-job.yml`**

  + Contains one workflow job called "process-job"; commit: 79829df "Test: Trigger workflow to see full Stripe API error details #31" 
    - First half of the job steps run smoothly, 'Contract Signing' and 'Payment Update' are skipped, as they should be
    - Generate manifest `python3 .github/scripts/generate_manifest.py` runs effectively 
  
  * **"Check for manifest changes" job the follows uses GIT** 

  + We created the "sync" flagging system specifically to find a way to completely remove relying on GIT in our scripts 
  + This "sync" flag system was still overly complex and the new system avoids this; we should still try to avoid using GIT in scripts 

  * **Next job in flow "Process Stripe Products" has massive amount of errors**

  + Started mid-flow with `run python3 .github/scripts/process_stripe_products.py` command 
    - First clue was it says: 📁 Found 0 active job(s) in folder" 
    - Then makes over 40 delete calls to remove price objects which is because of the buggy GIT method in the script 
    - Every call fails because "type object 'Price' has no attribute 'delete'"
    - After every failed DELETE call, it tried to delete the associated Product Object, which was a validation error 
  + These DELETE Product Object calls did go through to Stripe API
    - There are the HUNDREDS of these failed calls, which must have bogged down the back-and-forth communication we were looking for 
    - Thankfully we'll be able to eliminate this completely from our new logic flow 
  + Then another odd issue said: No payments found in assets/jobs/test-single-payment-v2.json
    - Followed by: 📁 Found 1 job file(s), ✅ Processed 0 file(s) with Stripe updates -- none of which reflects what happened 

  * **Our new flow makes finding the specific issue in this workflow and script irrelevant** 

  + We should straight up delete all of the scripts and workflows from this error ridden build 
  + Then we should build the new based on the updated logic you'll find detailed below 

### Primary Culprit Seems To Have Been Over Engineering 

  * **The logic we meant to implement in the simplest form possible ** 
  
  + If `"product.sync": true` follow just five steps 

    1. `sync` = true, then search for matching `stripe_product_id` 
    2. No matches? CREATE NEW PRODUCT 
    3. Find match? OVERWRITE ALL PRODUCT FIELDS PROVIDED 
    4. New product, place `stripe_product_id` on JSON 
    5. New or updated product, change `sync` to FALSE 

  + If `"price.sync": true` the steps are almost identical 

    1. `sync` = true, then search for matching `stripe_price_id`
    2. No matches? CREATE NEW PRICE OBJECT 
    3. Find match? CHANGE IT TO ACTIVE:FALSE AND CREATE NEW PRICE OBJECT 
    4. New price, place stripe_price_id on JSON 
    5. New or updated product, change `sync` to FALSE  
   
  + It all comes back to creating those `"sync":true` flags 
    - It was intended to be the sole method used to identify changes 
    - JSON schema overhaul's grouping plus flags meant to be sole method to create conditional workflows 
  + For recall, it is `"sync":true` as in, true this needs to be synced 

  * **Poorly communicated solution, not dynamic and clean, shouldn't have caused issues, but we can do better anyway** 

  + We wanted one trigger, one action that solves any possible adjustments to Stripe catalog 
  + Our new plan is going to completely eliminate making updates at all 

---

## Forgotten HTML Essentials 
*Sneaking this in here; please add these in when reviewing and updating the HTML files to update for the new logic*

### Favicon Full Collection HTML 

```html 
<link rel="icon" type="image/png" href="/assets/favicon/favicon-96x96.png" sizes="96x96" />
<link rel="icon" type="image/svg+xml" href="/assets/favicon/favicon.svg" />
<link rel="shortcut icon" href="/assets/favicon/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-title" content="Payments" />
<link rel="manifest" href="/assets/favicon/site.webmanifest" />
```

### Meta Data & Thumbnail 

```html 
<title>Payments to Sean August Horvath</title>
<meta name="description" content="Architect of your digital business needs. Consulting and freelance custom web development, AI and end-to-end automation solutions, social production, viral strategy, user design, digital marketing optimization">
<meta property="og:image" content="https://raw.githubusercontent.com/seanivore/freelance-payments/refs/heads/freelance-payments/assets/media/thumbnail-image-bauhaus-banking.webp">
``` 

*Now, back to business* 

---

## New Script & Workflows 

  --> [STATE MANAGEMENT FOR USER FLOW & TRIGGER IDS](#create-state-management-section-on-json)
  --> [JOB JSON STRIPE SETUP STEPS](#job-json-stripe-setup)
  --> [COMPREHENSIVE FLOW BREAKDOWN](#comprehensive-flow-breakdown)

### We Don't Even Need "SYNC'ed" Value 

  * **After preparing the JOB JSON STRIPE SETUP STEPS (API walkthrough) below, I'm not sure we need "synced", it just seems complicated** 

  + Unnecessary scripts 
    - Create and Update might be the only scripts absolutely needed 
    - Eliminate "delete" logic in every case; always opt to archive, which is "modify" anyway 
    - e.g. breakdown of `archive_price.py`, `modify_product.py`, `create...`, `delete...` is excessive 
  + Remove any stress over keeping a perfect Stripe Catalog 
    - All that matters is that when it goes to pull up the client's payments it is accurate 
    - No need for excessive `cleanup_orphans.py` or `orchestrate_workflow.py` or `sync_payment.py` 
  + Keep old manifest, compare to directory, make all updates, end with manifest new copy creation 
    - Gather the filenames from JSON directory (which are the same as the product ID)  
    - Manifest should be each job's product ID, then login-keyword and login-name 
    - Matching ID (`uid-xxx-xxx`) in directory and JSON? If active=false, archive. If active=true, ignore. 
    - Archiving? Run the simple bash `stripe products update uid-xxx-xxx --active=false` 
  + Creating Job Stripe OBJECTS and CHECKOUT SESSION 
    - Add the product, all prices, coupon, and can even create checkout session IMMEDIATELY 
    - Only after creating in Stripe is successful, then batched JSON updates with ID numbers, etc., THEN create new manifest 

### Create "State Management" Section On JSON 

  * **To tell payments website what page or payment to load for the client**

    - "initial_payment_intent" is "succeeded" --> User visiting `payments.august.style` --> checkout_session for "uid-xxx-xxx-2" 
    - "client_status" is "logged_in" --> next login to `payments.august.style` --> shows welcome back instead of onboarding 
    - "client_status" viewed both docs and downloaded --> next `payments.august.style` login --> straight to page anchor for signing 

  * **Each sub-section represents an event's trigger that starts an automation's action** 

    - state_management.object's all come from API completion confirmation response 
    - user behavior on the frontend of the website notifies Vercel endpoints that activate GitHub Actions for JSON updates 
    - all payment_intent represent Stripe webhooks caught by Vercel that activate JSON updating GitHub Actions 

```json
{
"state_management": {
  "object": {                 // API response details collected, queued in time-delayed GitHub Action; manifest updated only after JSON updates 
    "created": 2026-01-02,    // null | DATE ... all objects created together on
    "product": "uid-xxx-xxx", // We provide ID in job's single product object create API call 
    "price": [                // array to add object ID for each ... informs payment count logic
      "uid-xxx-xxx-1", 
      "uid-xxx-xxx-2"
    ],
    "coupon": "uid-xxx-xxx-coupon", // null or include ID we provide when creating job's single coupon object 
    "checkout_session": [           // one for each product price representing payment count 
      "cs_test_a1Ha56WztK7GrOLUJFRAx89BbKMvyv8BYMASk68qfrWxu1AKIiSJlgTJGG",
      "cs_test_a1n62RmIax5Djhyz0PmAo4RfNMHYK5xFJlgS9MZtdPYbdF3Uf7mBYhgJes"
    ],
  },
  "client_status": {              // Frontend event notifies serverless Vercel endpoint, activating GitHub Action to update status 
    "logged_in": 2026-01-03,      // null | DATE ... show "welcome back" versus onboarding next login 
    "viewed_contract": true,      // false | true ... if contract scrolled to end, next login direct to invoice 
    "viewed_invoice": true,       // false | true ... if invoice loaded, next login can jump to page anchor for signing and PDF download 
    "downloaded_docs": 0,         // count clicks on contract and invoice PDF download button 
    "signed_contract": 2026-01-05 // null | DATE ... navigate user to next payment using `stripe checkout sessions retrieve cs_...`
  },
  "initial_payment_intent": {   // Stripe webhook event caught by Vercel, activates GitHub Action to update these dates
    "created": 2026-01-04,      // null | DATE 
    "processing": 2026-01-05,   // null | DATE 
    "succeeded": 2026-01-06     // null | DATE ... set `initial_payment.active=false`and use second `stripe checkout sessions retrieve cs_...`
  },
  "balance_payment_intent": {
    "created": null,      // null | DATE 
    "processing": null,   // null | DATE 
    "succeeded": null     // null | DATE ... then update payment 2 `balance_payment.active=false` and `product_object.active=false` 
  }
}
}
```

### Update Payment Intent Events 

I see the following on `assets/js/checkout-controller.js` 

```js
  /**
   * Create PaymentIntent via serverless function
   * Uses stripe_price_id from JSON to ensure correct payment amount
   * 
   * Flow: Frontend → Serverless Function → Stripe API → Returns client_secret
   */
  async function createPaymentIntent(jobData, price) {
    // Vercel API endpoint (backend serverless functions)
    // Frontend is on GitHub Pages, API is on Vercel
    const serverlessEndpoint = 'https://freelance-payments-neon.vercel.app/api/create-payment-intent';
``` 

And I do remember originally saying we'd need the serverless function for frontend triggered "signed contract" or just "viewed but didn't sign contract" — since both of those would be needed for state management if they left and came back after either of those it would know to route them to payment-1 or to the contract to sign it. 

But I noticed information about payment intent messages and webhooks when running a test payment. We have two webhook events set up but maybe we want to look at these others we could add. 

We currently have two, but these are the other options. Seems like we should probably use as many events straight from/in Stripe as possible, right? Wdyt? 

  - `payment_intent.canceled`
  Occurs when a *PaymentIntent* is canceled.
  - `payment_intent.created` --> **ALREADY ON**
  Occurs when a new *Paymentintent* is created.
  - `payment_intent.processing`
  Occurs when a *PaymentIntent* has started processing.
  - `payment_intent.requires_action`
  Occurs when a *Paymentintent* transitions to *requires_action* state
  - `payment_intent.succeeded` --> **ALREADY ON**
  Occurs when a *PaymentIntent* has successfully completed payment.

---

## Job JSON Stripe Setup 

  * **Step 1:** [Review all the job JSON filenames](#1-collect-job-json-directory-ids)
  * **Step 2:** [Archive the inactive JSON files you found](#2-run-simple-archive-command)
  * **Step 3:** [Jobs get a series of Stripe "objects"](#3-create-jobs-stripe-object-series)
  * **Step 4:** [Every job gets one Product Object](#4-create-product)
  * **Step 5:** [Customer Object client contract details](#5-create-client)
  * **Step 6:** [Create a Price Object for Product's first job payment](#6-create-prices-initial-payment-first)
  * **Step 7:** [Final balance payment for the Product gets a second Price Object](#7-create-final-balance-payment-price-object)
  * **Step 8:** [If there is a discount, create a Coupon Object for the Product](#8-create-coupon-discount)
  * **Step 9:** [Create a Checkout Object for the first Payment Object and Coupon Object](#9-prepare-initial-checkout-ahead-of-time)
  * **Step 10:** [Create second Checkout Object for balance payment Price Object](#10-prepare-final-balance-checkout-ahead-of-time)
  * **[COMPREHENSIVE FLOW BREAKDOWN](#comprehensive-flow-breakdown)**

### 1. Collect Job JSON Directory IDs 
[top](#job-json-stripe-setup)

  * **New job JSON creation and updating job JSON files; WHOLE UPDATES only** 
  
  1. All "updates" needed to be made to jobs by creating a NEW JOB JSON COMPLETELY 
    - The JSON can be copied, and all changes made 
    - Then a new job number ID and all object ID that fit the pattern must be replaced 
    - This means creating new `uid-xxx-xxx` for the Product Object 
    - Replace Payment 1's `uid-xxx-xxx-1` Price Object ID
    - Replace Payment 2's `uid-xxx-xxx-2` Price Object ID 
    - Replace Client's `uid-xxx-xxx-client` Customer Object ID 
    - Replace Discount's `uid-xxx-xxx-coupon` Coupon Object ID 
  2. All job JSON are saved with the filename reflecting the UID `assets/jobs/uid-xxx-xxx.json` 
  2. Then DELETE the old JSON file completely out of the `assets/jobs/...` directory 

  * **Trigger looks simply for commit pushing ANY changes to the `assets/jobs/...` directory**

    - Ignore tracking anything about the specifics of the change 
    - We don't need those details and keeping more details than needed is not worth the complication risks 

  * **Simple UPDATE logic for catalog syncing** 

    1. Gather JSON directory filenames 
    2. Of JSON directory filenames with matching entry in `assets/js/manifest.json` 
       - HOLD TO ARCHIVE any that have payment 2 set to `balance_price_object.active=false` 
       - HOLD TO ARCHIVE any that have `product_object.active=false` 
       - IGNORE any that have only `product_object.active=true` and `balance_price_object.active=true`
    3. Of JSON directory filenames that DO NOT have a matching entry in `manifest.json` 
       - HOLD TO ARCHIVE  
    4. Of JSON directory filenames that do not have a `manifest.json` match 
       - HOLD TO HAVE STRIPE OBJECTS CREATED 

  * **Do not update the manifest.json yet, that will be done LAST** 

### 2. Run Simple Archive Command 
[top](#job-json-stripe-setup)

  * **Use quick BASH command or python stripe.Product.modify() API/SDK call to archive PRODUCT OBJECT** 

  + Command pattern is `stripe` `api resource` `operation` `object id` `argument/flag parameters` 
  + `stripe products update uid-xxx-xxx --active="false"`

  + Locate object ID from the file name 
    - The Stripe `product_object.id` is the same as the JSON filename 
    - Just remove `.json` from `uid-xxx-xxx.json` 
    - The `uid-xxx-xxx` is how Stripe identifies the product 
    
  + Change "active" value to "false" 
    - If it isn't active, it is "archived" 
    - This only needs to be done to the Stripe Catalog's PROJECT OBJECT 
    - All associated price objects, coupon objects, or checkout session objects in Stripe are archived by implication 
    - Stripe keeps all archived (inactive) objects INDEFINITELY for amazing record-keeping 

  * **Simply do this for all the entries on the manifest.json that did not have a matching JSON filename in the directory** 
    

```bash
stripe products update uid-xxx-xxx --active="false"
```

```python
product = stripe.Product.modify(
  "uid-xxx-xxx",
  active=False,
)
```

### 3. Create Job's Stripe Object Series 
[top](#job-json-stripe-setup)

  * **All the filenames that weren't already on `assets/js/manifest.json` now go through these steps** 

  + New job JSON files are only added to the manifest **AFTER** creating their objects 
    - This prevents errors 
    - Ensures only fully ready to go jobs are accessible from the front end 
  + Every JOB gets a single JSON file, which in Stripe gets a few "OBJECTS" 
    1. PRODUCT OBJECT: the main information about the client's job 
    2. CUSTOMER OBJECT: adding the client info to Stripe to make taxes easier down the line since we have the details handy 
    2. INITIAL & BALANCE PRICE OBJECT: to sell a product, it gets a "price object"; most jobs have two but only one is needed 
    4. COUPON OBJECT: if the client is getting a discount, make sure it is on the books; include the amount in the first price object 
    5. CHECKOUT SESSION OBJECT: create one of these for each price object 
  + Use the bash custom command we have `uid` to come up with always unique identifier 
    - In many cases where Stripe offers an ID for the object, you can preemptively provide what you want it to be 
    - In a few other cases, though not listed in the docs, you can provide --id="uid..." and it will do the same 
    - Only in very few cases would it not let me propose my own ID; this happened for the checkout_sessions 

```bash
> ~/Development/freelance-payments > uid 
Generated UID: uid-rju-024
Mathematical operations: r(56079)=153144 → j(153144)=21 → u(21)=24
```

### 4. Create Product 
[top](#job-json-stripe-setup)

  + Simple name of service 
    - Will be active by default 
    - Description is like "SEO Description" style about the service 
  + Use the bash `uid` command to provide an ID 
    - This same ID will be provided for the other elements 
    - Payment 1 = `uid-1`
    - Payment 2 = `uid-2`
    - Coupon discount = `uid-coupon`
    - Client reference ID (also used when setting up checkout session) = `uid-client`
  + Add the metadata 
    - For easy reference during rest of setup 
    - For future understandability 
  + Metadata keys and values 
    - `login_keyword` 
    - `login_name` 
    - `service_usd` = full cost of service before discount 
    - `total_payments` = planned number of payments in contract 
    - `discount_usd` = planned discount in contract, if applicable 
    - For metadata, keep everything human-readable, e.g. "$2,000" instead of "200000" 
  + `unit_label` = each time they pay, they "get" ... well for a service they're just making a payment 

    ```python
    import stripe
    stripe.api_key = "{{TEST_SECRET_KEY}}"

    product = stripe.Product.create(
      name="Online Shop",
      active=True,
      description="Development and launch of website for client company artwork sales and brand story.",
      id="uid-amx-856",
      metadata={
        "login_keyword": "art-store",
        "login_name": "smith",
        "service_usd": "$2,000",
        "total_payments": "2",
        "discount_usd": "$1,000",
      },
      type="service",
      unit_label="Payment",
    )
    ```

  * **API response to successful product creation** 

    + Success response = full product object 
      - "livemode" should say "true" 
      - Otherwise everything else should look the same but with created/updated times 
    + Safely ignored unless it is an error 

```json
{
  "id": "uid-amx-856",
  "object": "product",
  "active": true,
  "attributes": [],
  "created": 1766585456,
  "default_price": null,
  "description": "Development and launch of website for client company artwork sales and brand story.",
  "images": [],
  "livemode": false,
  "marketing_features": [],
  "metadata": {
    "discount_usd": "$1,000",
    "login_keyword": "art-store",
    "login_name": "smith",
    "service_usd": "$2,000",
    "total_payments": "2"
  },
  "name": "Online Shop",
  "package_dimensions": null,
  "shippable": null,
  "tax_code": null,
  "type": "service",
  "unit_label": "Payment",
  "updated": 1766585456,
  "url": null
}
```

### 5. Create Client 

  + Information needed across documents so might as well add it here for record-keeping and tax purposes 

```python
import stripe
stripe.api_key = "{{TEST_SECRET_KEY}}"

customer = stripe.Customer.create(
  address={
    "city": "Boston", 
    "line1": "123 Main St", 
    "state": "MA", 
    "postal_code"= "02101", 
    "country": "US"
  },
  business_name="Bob's Roofing LLC",
  description="Met in Philadelphia",
  email="bob@bobdoesroofing.com",
  individual_name="Bob Smith",
  name="Managing Owner",
  phone="323-442-9485",
  id="uid-amx-856-client",
)
```

  * **RESPONSE CONFIRMING CLIENT/CUSTOMER CREATION**

```json
{
  "id": "uid-amx-856-client",
  "object": "customer",
  "address": {
    "city": "Boston",
    "country": null,
    "line1": null,
    "line2": null,
    "postal_code": null,
    "state": null
  },
  "balance": 0,
  "business_name": "Bob's Roofing LLC",
  "created": 1766611965,
  "currency": null,
  "customer_account": null,
  "default_source": null,
  "delinquent": false,
  "description": "Met in Philadelphia",
  "discount": null,
  "email": "bob@bobdoesroofing.com",
  "individual_name": "Bob Smith",
  "invoice_prefix": "JKFWFHOL",
  "invoice_settings": {
    "custom_fields": null,
    "default_payment_method": null,
    "footer": null,
    "rendering_options": null
  },
  "livemode": false,
  "metadata": {},
  "name": "Bob's Roofing LLC",
  "next_invoice_sequence": 1,
  "phone": "323-442-9485",
  "preferred_locales": [],
  "shipping": null,
  "tax_exempt": "none",
  "test_clock": null
}
```

### 6. Create Prices: Initial Payment First 
[top](#job-json-stripe-setup)

  + Currency USD and active = true should be default, add per_unit type 
  + Add metadata continuing the details in the product object 
    - payment_number = # of total given in product object 
    - payment_usd = amount of this payment should include discount 
    - balance_usd = what is left after payment (included discount below but either way)
  + "Nickname" = what the client will see when they pay, so something like initial or final payment 
  + Provide the ID used in product object for "product" 
  + "unit_amount" is payment amount in pennies 
  + Include `id="uid-xxx-xxx-1` or `-2` to represent payment number associated with the same product UID ID 

```python 
import stripe
stripe.api_key = "{{TEST_SECRET_KEY}}"

price = stripe.Price.create(
  currency="usd",
  active=True,
  billing_scheme="per_unit",
  metadata={"payment_number": "1", "payment_usd": "$1,500", "balance_usd": "$500"},
  nickname="Initial Payment",
  product="uid-amx-856",
  id="uid-amx-856-1",
  unit_amount=150000,
)
```
  * **API response to successful price object creation** 

    + Again successful response is the object sent back 
    + Ignore unless it is an error 

```json 
{
  "id": "uid-amx-856-1",
  "object": "price",
  "active": true,
  "billing_scheme": "per_unit",
  "created": 1766585859,
  "currency": "usd",
  "custom_unit_amount": null,
  "livemode": false,
  "lookup_key": null,
  "metadata": {
    "balance_usd": "$500",
    "payment_number": "1",
    "payment_usd": "$1,500"
  },
  "nickname": "Initial Payment",
  "product": "uid-amx-856",
  "recurring": null,
  "tax_behavior": "unspecified",
  "tiers_mode": null,
  "transform_quantity": null,
  "type": "one_time",
  "unit_amount": 150000,
  "unit_amount_decimal": "150000"
}
``` 

### 7. Create Final, Balance Payment Price Object 
[top](#job-json-stripe-setup)

  * **Created the same way, with the remaining balance, and no discount, using `uid-xxx-xxx-2`**

```python
import stripe
stripe.api_key = "{{TEST_SECRET_KEY}}"

price = stripe.Price.create(
  currency="usd",
  active=True,
  billing_scheme="per_unit",
  metadata={
    "payment_number": "2",
    "payment_usd": "$500",
    "balance_usd": "$0 after discount",
  },
  nickname="Final Payment",
  product="uid-amx-856",
  id="uid-amx-856-2",
  unit_amount=50000,
)
```

  * **Response is object, and id was labeled correctly = all good** 

```json
{
  "id": "uid-amx-856-2",
  "object": "price",
  "active": true,
  "billing_scheme": "per_unit",
  "created": 1766586240,
  "currency": "usd",
  "custom_unit_amount": null,
  "livemode": false,
  "lookup_key": null,
  "metadata": {
    "balance_usd": "$0 after discount",
    "payment_number": "2",
    "payment_usd": "$500"
  },
  "nickname": "Final Payment",
  "product": "uid-amx-856",
  "recurring": null,
  "tax_behavior": "unspecified",
  "tiers_mode": null,
  "transform_quantity": null,
  "type": "one_time",
  "unit_amount": 50000,
  "unit_amount_decimal": "50000"
}
```

### 8. Create Coupon Discount 
[top](#job-json-stripe-setup)

  + One time usage that applies to the specific product created 
    - Create random "name" though the client will see this listed on the itemization 
    - Again, the amount is in pennies so 100000 = $1,000 
  + Make sure to use the SAME `uid` as the Product Object with `-coupon` for the ID 

```python 
import stripe
stripe.api_key = "{{TEST_SECRET_KEY}}"

coupon = stripe.Coupon.create(
  amount_off=100000,
  applies_to={"products": ["uid-amx-856"]},
  currency="usd",
  duration="once",
  id="uid-amx-856-coupon",
  max_redemptions=1,
  name="HAPPY-NEW-YEAR",
)
```
  * **API response to coupon discount object creation** 

  + As always with stripe, if you get the actual object back, it worked 
  + Ignore unless it returns an error 

```json
{
  "id": "uid-amx-856-coupon",
  "object": "coupon",
  "amount_off": 100000,
  "created": 1766586458,
  "currency": "usd",
  "duration": "once",
  "duration_in_months": null,
  "livemode": false,
  "max_redemptions": 1,
  "metadata": {},
  "name": "HAPPY-NEW-YEAR",
  "percent_off": null,
  "redeem_by": null,
  "script": null,
  "times_redeemed": 0,
  "type": "amount_off",
  "valid": true
}
```

### 9. Prepare Initial Checkout Ahead Of Time 
[top](#job-json-stripe-setup)

  + Successful response will be checkout.session object 
    - Must save checkout.session's `id` to JSON 
    - User login finds JSON and loads proper line-item checkout based on state_management 
  + Make sure the FIRST checkout uses the FULL service cost and discount 
  + Client Secret if needed is provided in response confirmation 
  + Branding 
    - Cant use a logo or icon for embedded check out type 
    - I didn't add other details in example below 
    - I did add details in balance payment example down further 
    - This should be carefully filled in IRL to match site 

```python
import stripe
stripe.api_key = "{{TEST_SECRET_KEY}}"

session = stripe.checkout.Session.create(
  client_reference_id="uid-amx-856-client",
  currency="usd",
  customer_creation="always",
  discounts=[{"coupon": "uid-amx-856-coupon"}],
  line_items=[{"price": "uid-amx-856-1", "quantity": 1}],
  mode="payment",
  return_url="https://payments.august.style/payment-success.html",
  submit_type="pay",
  ui_mode="embedded",
)
```
  * **API response confirming session created** 

  + The long CHECKOUT.SESSION ID string is the most important keeper thing here 
  + And possibly the client secret 
  + Need to confirm the "Return URL" -- I guessed 

```json 
{
  "id": "cs_test_a1Ha56WztK7GrOLUJFRAx89BbKMvyv8BYMASk68qfrWxu1AKIiSJlgTJGG",
  "object": "checkout.session",
  "adaptive_pricing": {
    "enabled": true
  },
  "after_expiration": null,
  "allow_promotion_codes": null,
  "amount_subtotal": 150000,
  "amount_total": 50000,
  "automatic_tax": {
    "enabled": false,
    "liability": null,
    "provider": null,
    "status": null
  },
  "billing_address_collection": null,
  "branding_settings": {
    "background_color": "#ffffff",
    "border_style": "rounded",
    "button_color": "#0074d4",
    "display_name": "Sean August Horvath sandbox",
    "font_family": "default",
    "icon": null,
    "logo": null
  },
  "cancel_url": null,
  "client_reference_id": "uid-amx-856-client",
  "client_secret": "cs_test_a1Ha56WztK7GrOLUJFRAx89BbKMvyv8BYMASk68qfrWxu1AKIiSJlgTJGG_secret_fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdkdWxOYHwnPyd1blpxYHZxWjA0VmdvbWI8Y2lvck03M0ZVbjBVVE5jcXVIZFNUMkEybkxNNko2cVxTQENWbkp%2FU2F0TDBBUnFRMkBIZk9BUHRUSU5AYkxqdn0ydDFrY2Jvd0c0TkhjPTA0NTVSdnBSQ05LdycpJ3BsSGphYCc%2FJ2BoZ2BhYWBhJyknaWR8anBxUXx1YCc%2FJ3Zsa2JpYFpscWBoJyknd2BhbHdgZnFKa0ZqaHVpYHFsamsnPydkaXJkfHYnKSdnZGZuYndqcGthRmppancnPycmY2NjY2NjJ3gl",
  "collected_information": null,
  "consent": null,
  "consent_collection": null,
  "created": 1766586691,
  "currency": "usd",
  "currency_conversion": null,
  "custom_fields": [],
  "custom_text": {
    "after_submit": null,
    "shipping_address": null,
    "submit": null,
    "terms_of_service_acceptance": null
  },
  "customer": null,
  "customer_account": null,
  "customer_creation": "always",
  "customer_details": null,
  "customer_email": null,
  "discounts": [
    {
      "coupon": "uid-amx-856-coupon",
      "promotion_code": null
    }
  ],
  "expires_at": 1766673091,
  "invoice": null,
  "invoice_creation": {
    "enabled": false,
    "invoice_data": {
      "account_tax_ids": null,
      "custom_fields": null,
      "description": null,
      "footer": null,
      "issuer": null,
      "metadata": {},
      "rendering_options": null
    }
  },
  "livemode": false,
  "locale": null,
  "metadata": {},
  "mode": "payment",
  "origin_context": null,
  "payment_intent": null,
  "payment_link": null,
  "payment_method_collection": "if_required",
  "payment_method_configuration_details": {
    "id": "pmc_1SbjiE9fljwH26CPmMKxs5qZ",
    "parent": null
  },
  "payment_method_options": {
    "affirm": {},
    "card": {
      "request_three_d_secure": "automatic"
    }
  },
  "payment_method_types": [
    "card",
    "klarna",
    "link",
    "affirm",
    "cashapp",
    "amazon_pay"
  ],
  "payment_status": "unpaid",
  "permissions": null,
  "phone_number_collection": {
    "enabled": false
  },
  "recovered_from": null,
  "redirect_on_completion": "always",
  "return_url": "https://payments.august.style/payment-success.html",
  "saved_payment_method_options": {
    "allow_redisplay_filters": [
      "always"
    ],
    "payment_method_remove": "disabled",
    "payment_method_save": null
  },
  "setup_intent": null,
  "shipping_address_collection": null,
  "shipping_cost": null,
  "shipping_options": [],
  "status": "open",
  "submit_type": "pay",
  "subscription": null,
  "success_url": null,
  "total_details": {
    "amount_discount": 100000,
    "amount_shipping": 0,
    "amount_tax": 0
  },
  "ui_mode": "embedded",
  "url": null,
  "wallet_options": null
}
```
### 10. Prepare Final Balance Checkout Ahead Of Time 
[top](#job-json-stripe-setup)

  + Create using second Price Objects with different ID

```python 
import stripe
stripe.api_key = "{{TEST_SECRET_KEY}}"

session = stripe.checkout.Session.create(
  automatic_tax={"enabled": True, "liability": {"type": "self"}},
  billing_address_collection="required",
  branding_settings={
    "font_family": "noto_sans",
    "background_color": "#1f1f1f",
    "border_style": "pill",
    "button_color": "#9C528B",
    "display_name": "august.style designs",
  },
  client_reference_id="uid-amx-856-client",
  currency="usd",
  customer_creation="always",
  mode="payment",
  redirect_on_completion="always",
  return_url="https://payments.august.style/payment-success.html",
  submit_type="pay",
  ui_mode="embedded",
  custom_text={"after_submit": {"message": "Time to create magic 💎"}},
  line_items=[{"price": "uid-amx-856-2", "quantity": 1}],
  name_collection={
    "individual": {"enabled": True},
    "business": {"enabled": True, "optional": True},
  },
)
```

  + Bash with Stripe CLI can do the same. I ran this in the Sandbox Workspace 

```bash
stripe checkout sessions create --automatic-tax.enabled=true --billing-address-collection="required" --branding-settings.font-family="noto_sans" --branding-settings.background-color="#1f1f1f" --branding-settings.border-style="pill" --branding-settings.button-color="#9C528B" --branding-settings.display-name="august.style designs" --client-reference-id="uid-amx-856-client" --currency="usd" --customer-creation="always" --mode="payment" --redirect-on-completion="always" --return-url="https://payments.august.style/payment-success.html" --submit-type="pay" --ui-mode="embedded" -d "automatic_tax[liability][type]=self" -d "custom_text[after_submit][message]=Time to create magic 💎" -d "line_items[0][price]=uid-amx-856-2" -d "line_items[0][quantity]=1" -d "name_collection[individual][enabled]=true" -d "name_collection[business][enabled]=true" -d "name_collection[business][optional]=true"
```

```json
{
  "id": "cs_test_a1n62RmIax5Djhyz0PmAo4RfNMHYK5xFJlgS9MZtdPYbdF3Uf7mBYhgJes",
  "object": "checkout.session",
  "adaptive_pricing": {
    "enabled": true
  },
  "after_expiration": null,
  "allow_promotion_codes": null,
  "amount_subtotal": 50000,
  "amount_total": 50000,
  "automatic_tax": {
    "enabled": true,
    "liability": {
      "type": "self"
    },
    "provider": "stripe",
    "status": "requires_location_inputs"
  },
  "billing_address_collection": "required",
  "branding_settings": {
    "background_color": "#1f1f1f",
    "border_style": "pill",
    "button_color": "#9c528b",
    "display_name": "august.style designs",
    "font_family": "noto_sans",
    "icon": null,
    "logo": null
  },
  "cancel_url": null,
  "client_reference_id": "uid-amx-856-client",
  "client_secret": "cs_test_a1n62RmIax5Djhyz0PmAo4RfNMHYK5xFJlgS9MZtdPYbdF3Uf7mBYhgJes_secret_fid1d2BpamRhQ2prcSc%2FJ0tqcWolVmRrdicpJ2dqd2Fgd1ZxfGlgJz8nd2pwa2EnKSdkdWxOYHwnPyd1blpxYHZxWjA0VmdvbWI8Y2lvck03M0ZVbjBVVE5jcXVIZFNUMkEybkxNNko2cVxTQENWbkp%2FU2F0TDBBUnFRMkBIZk9BUHRUSU5AYkxqdn0ydDFrY2Jvd0c0TkhjPTA0NTVSdnBSQ05LdycpJ3BsSGphYCc%2FJ2BoZ2BhYWBhJyknaWR8anBxUXx1YCc%2FJ3Zsa2JpYFpscWBoJyknd2BhbHdgZnFKa0ZqaHVpYHFsamsnPydkaXJkfHYnKSdnZGZuYndqcGthRmppancnPycmNGM0YzRjJ3gl",
  "collected_information": null,
  "consent": null,
  "consent_collection": null,
  "created": 1766596347,
  "currency": "usd",
  "currency_conversion": null,
  "custom_fields": [],
  "custom_text": {
    "after_submit": {
      "message": "Time to create magic 💎"
    },
    "shipping_address": null,
    "submit": null,
    "terms_of_service_acceptance": null
  },
  "customer": null,
  "customer_account": null,
  "customer_creation": "always",
  "customer_details": null,
  "customer_email": null,
  "discounts": [],
  "expires_at": 1766682747,
  "invoice": null,
  "invoice_creation": {
    "enabled": false,
    "invoice_data": {
      "account_tax_ids": null,
      "custom_fields": null,
      "description": null,
      "footer": null,
      "issuer": null,
      "metadata": {},
      "rendering_options": null
    }
  },
  "livemode": false,
  "locale": null,
  "metadata": {},
  "mode": "payment",
  "name_collection": {
    "business": {
      "enabled": true,
      "optional": true
    },
    "individual": {
      "enabled": true,
      "optional": false
    }
  },
  "origin_context": null,
  "payment_intent": null,
  "payment_link": null,
  "payment_method_collection": "if_required",
  "payment_method_configuration_details": {
    "id": "pmc_1SbjiE9fljwH26CPmMKxs5qZ",
    "parent": null
  },
  "payment_method_options": {
    "affirm": {},
    "card": {
      "request_three_d_secure": "automatic"
    }
  },
  "payment_method_types": [
    "card",
    "klarna",
    "link",
    "affirm",
    "cashapp",
    "amazon_pay"
  ],
  "payment_status": "unpaid",
  "permissions": null,
  "phone_number_collection": {
    "enabled": false
  },
  "recovered_from": null,
  "redirect_on_completion": "always",
  "return_url": "https://payments.august.style/payment-success.html",
  "saved_payment_method_options": {
    "allow_redisplay_filters": [
      "always"
    ],
    "payment_method_remove": "disabled",
    "payment_method_save": null
  },
  "setup_intent": null,
  "shipping_address_collection": null,
  "shipping_cost": null,
  "shipping_options": [],
  "status": "open",
  "submit_type": "pay",
  "subscription": null,
  "success_url": null,
  "total_details": {
    "amount_discount": 0,
    "amount_shipping": 0,
    "amount_tax": 0
  },
  "ui_mode": "embedded",
  "url": null,
  "wallet_options": null
}
```

---

## Comprehensive Flow Breakdown 
[BACK TO TOP](#we-dont-even-need-synced-value)

### Two Main Paths With Tiny Overlap 

  * **CYCLE A: Starting because of organic, admin/internal PUSH with changes to JSON directory**

  1. Collect JSON directory filenames to compare to old/current manifest.json **cont. cycle B for potential archives**

  2. Archive the old or any `product_object.active=false`, and create all new Stripe objects 

  3. API response details collected for state management, queued for GitHub Action updating all JSON file and object ID additions together

  4. After all new JSON files have their appropriate Stripe Objects created, then update all JSON files back-to-back 
  
  5. After JSON files updated back-to-back, now add new JSON IDs by filename to the MANIFEST each with their login-keyword and login-name

  6. Automated push: JSON, manifest updates, rebase setup for later push --> **RECOGNIZED AS AUTOMATED, DOESN'T TRIGGER #1 AGAIN; natural end point**

  * **CYCLE B: Starting because frontend user behavior across contract, invoice, and payments triggered required JSON updates** 
  
  7. User interactions tracked by serverless Vercel events trigger a queued GitHub Action to update JSON file; hold until ~15min inactivity passes 

  8. Payment behavior events from Stripe Webhooks caught by Vercel also queue JSON file updates, queued and held, too; activity restarts counter  

  9. Collected JSON updates to `state_management.client_status` or `state_management.[initial/balance]_payment_intent` being held are released 

  10. All JSON files updated back-to-back, including any JSON files now `"active"=false`, **NOW continue at #1, probably just for archiving if needed**

### Automation Cycles Defined 

  * **CYCLE A** 
    - Runs from #1 through #6 
    - Simple 
  * **CYCLE B** 
    - Runs from #7 through #6 
    - In every case (I can think of) it is just for #1/#2 and then jumps to #6 for the push update 
    - But there should be no harm in it going through #3, #4, #5 if they are all working correctly they should just pass 

---
*Detailed outline of Stripe API/SDK calls and responses, along with new cycle flow logic, completed by Sean August Horvath on 2025-12-27*