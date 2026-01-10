# Comprehensive Project Overview 
*Testing is done live:* `https://payments.august.style`

## Objective 

  + To convey fullest possible understanding of our application platform for Freelance Client Contract and Invoices Payments, including big picture expectations, as well as details on the most recent refactoring changes, logic updates and specifics, and some of the current issues or recurring troublesome functionality areas encountered throughout the build process, so that you can apply your development, engineering, and design expertise to help us round out the final stretch of development and testing, aiming to make the payments platform production-ready for client use 

### Technical Overview 

  1. We use a unique SPA architecture that provides dynamic website functionality on a static GitHub Pages host using a 404-redirect method. 
  2. This build provides a strong foundation for our self-maintaining application, facilitating production, maintenance, and presentation of Freelance Client's contracts and invoices for signature and record-keeping, and then enabling ability to make payments through Stripe Custom Component-based payment processing integration. 
  3. These fully automated processes both use data provided by a single-JSON file per freelance job as well as record new data and artifacts that are needed by the application to drive the various user flows, automated production flows, and tracking workflows. 
  4. These are created through a combination of Vercel serverless functions, from Stripe Webhooks and API calls, and finally, GitHub Actions; together these details help the application know exactly where in the User's process to place them when they leave and return to the platform. 

### User Flow, Data Collections 

  **STEP 1: NEW FREELANCE CLIENT JOB** 
  - Job JSON Uploaded -> Stripe Catalog Objects Created -> Stripe Object Artifacts Added to JSON -> Job Contract and Invoice PDFs Produced -> PDF Artifacts Added to JSON --> **PLATFORM READY FOR CLIENT** 

  **STEP 2: CLIENT USES PLATFORM** 
  - Client Login -> Login Details Locate JSON -> JSON Populates Contract Dynamically -> User Signs Contract -> User Behavior Events Recorded -> JSON Presents Proper Invoice -> User Acknowledges Invoice -> Behavior Recorded -> Checkout Session Initialized -> User Makes Payment -> Payment Recorded --> **PLATFORM READY FOR PAYMENT 2 OF 2**

  **STEP 3: CLIENT PAYS FINAL BALANCE** 
  - Client Login -> Login Details Locate JSON -> JSON Loads Proper Invoice for Client -> User Acknowledges Invoice -> Behavior Recorded -> Checkout Session Initialized -> User Makes Balance Payment -> Payment Recorded --> **PAYMENT PLATFORM COMPLETE**

---

## Simple Steps To Take 

  1. Come in with clean-slate to understand platform in every way 
  2. Conduct in-depth review of all script files 
  3. Simplify, consolidate, and otherwise clean up bugs and errors in scripts 
  4. Ensure that the clear, defined logic is equally clearly implemented 

### Main Goals Coming To Mind 

  1. First, understand the "Process" section commentary 
    - This is the head-space to work from 
    - Opt for writing new files instead of copying various files 
    - Do *NOT* presume the code written was written the best way possible, it was edited along the way over weeks 
    - In general, help us find perfect medium of finishing this build but sort of rebuilding, without actually scrapping it all 
    - Use what we learned and the confidence that comes from knowing we are done making logic and refactoring changes  
  2. Understand current count of events, actions, triggers, and their various files and SIMPLIFY 
    - Eliminate irrational delay in writing events to JSONs via triggered `user-behavior.yml` workflow 
    - Batching is okay, but also things should be grouped and number of files minimized 
    - The logic instead should be that all events are gathered during the user session
    - After no more user events are triggered for X amount of time, then update JSONs
    - The `user-behavior.yml` workflow needs to be updated to reflect this logic
    - A better name might even be `user-exit-events.yml` 
    - Check for any other files involved in batching or events to update or consolidate them 
    - After events are written to JSON, then the same flow of matching JSON to catalog, etc. as `admin-push.yml` runs 
  3. Then use strong frontend user flow understanding in updating code to make full checkout flow functional
    - Review console logs at each step of the frontend user flow to confirm simplest logic was implemented 
    - Run end-to-end tests to confirm full checkout flow is functional 
  4. Pause to request or take screenshots of front end 
    - Remember that this site must be a VERY HIGH BAR for design because that's what clients come to me for 
    - The PDF embed right now uses iFrame and is horrible 
    - The frontend flow action/gate buttons were not all implemented 
    - The "Sign" contract modal is a mess 
  5. What else does the "Process" section commentary call to you to update and clean up or simplify? 
    - We have custom Stripe components to put anywhere on page so lets use them 
    - Homepage invoice.html is good, maybe some touch ups 
    - Use PDF display and action/gate buttons on job.html 
    - Do we need a checkout.html page to fully take advantage of our build 
    - Return URL thank you pages, we need custom messages post payment_1 and payment_2 
  6. Make sure the payment_1 and payment_2 UX are both handled well 

### Development Philosophy & Our Current State  

**UNDERSTAND THE CURRENT PROJECT STATE**
  - Review important files to understand management of workflow actions facilitated, presentation of information, specific functionality logic, and more. Create a full, accurate understanding of the application to identify gaps in the scripts and logic or errors left over from earlier refactoring. 

**CONSIDER WHAT THIS BUILD REPRESENTS**
  - In short, we have refactored and updated or simplified logic of functionality more than five times. This results in a constant "band-aid"-style of development, where we're always adjusting thing and then fixing things that break, constantly finding bugs. This is not idea. 

**WHAT DOES WHAT WE'VE LEARNED REALLY MEAN?**
  - Consider that through the process of getting to this point we have more than climbed necessary learning curves, uncovered essential functionality logic to apply, and discovered simplifications that needed to be made. Now, imagine building the system with what we know now; no refactoring and fixing breaks. Just clean code written in full knowledge of the final system. 

**THINK MODERN INSTEAD** 
  - If the code has a bug? Rewrite it in full. You can do this more than a few times before switching to a specific debugging focus. The "write once, then debug" approach is ingrained in training data because of historic limitations of human-only development. Now that we have agents that can write 5-10 files of code in a minute, and with an understanding of how LLMs work and their limitations, it makes much more logical sense today to write clean code more than a few times instead of once. There are so many instances where countless pages of code in a project are written by AI without error. 

### Current Project Directory Important Files 

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
│   └── webhook.js                   # Receives payment events and updates JSON files
├── assets/
│   ├── jobs/                        # Job JSON files (one per client project)
│   │   └── uid-xxx-xxx.json
│   ├── js/
│   │   ├── components/
│   │   │   ├── button.js            # 
│   │   │   ├── card.js              # 
│   │   │   └── input.js             # 
│   │   ├── checkout-controller.js   # Stripe Checkout component element integration
│   │   ├── completion-controller.js # Complete message after using state.payment_1 state.payment_2
│   │   ├── contract-controller.js   # Contract signing, PDF display
│   │   ├── event-tracker.js         # Batches behavior event activity for updates
│   │   ├── flow-manager.js          # 
│   │   ├── glow-effect.js           # Dynamic UI design homepage element
│   │   ├── invoice-controller.js    # Loads job to display embedded invoice PDF
│   │   ├── payment-lookup.js        # Login form handler
│   │   └── manifest.json            # Lookup manifest (generated)
│   ├── pdf/
│   │   ├── contract/                # Contract PDFs (kon-{job_id}.pdf)
│   │   ├── invoice/                 # Invoice PDFs (inv-{job_id}.pdf)
│   │   └── balance/                 # Balance PDFs (bal-{job_id}.pdf)
│   ├── templates/
│   │   ├── inv-xxx-xxx.pdf          #
│   │   ├── inv-xxx-xxx.txt          #
│   │   └── bal-xxx-xxx.pdf          #
│   │   ├── bal-xxx-xxx.txt          #
│   │   ├── kon-xxx-xxx.pdf          #
│   │   └── kon-xxx-xxx.txt          #
│   └── css/
│       ├── input.css 
│       └── styles.css               # Tailwind CSS (includes breakpoints)
├── .github/
│   ├── scripts/
│   │   ├── orchestration/
│   │   │   ├── admin_push.py        # Admin workflow logic
│   │   │   └── user_behavior.py     # User behavior workflow logic
│   │   └── utils/
│   │       └── json_io.py           # JSON file operations
│   └── workflows/
│       ├── admin-push.yml           # Admin-initiated push creates objects, PDFs
│       └── user-behavior.yml        # User events, contract signing, etc. triggered flow 
└── assets/docs/
    ├── uid-xxx-xxx.json             # Template  
    └── v5/v5_1_0
        └── PROJECT_OVERVIEW.md      # This file 
```

--- 

## JSON File Details & Artifact Creation 

  + Only add new JSON files, never expect any updates made locally to do anything 
  + If the JSON has an error, delete that file and create a new one with new UID 

### Stripe Objects 

  **Creates our Stripe "Objects" needed for payment processing**

  + Created on initial push of new `assets/jobs/uid-xxx-xxx.json` file 
    - Updated based on `admin-push.yml` workflow logic every push 
    - Simply delete the JSON file and the Stripe Product Object will be archived and other objects ignored 

  + All JSON file objects are interconnected 
    - JSON Schema is organized to provide exactly the values required to create the necessary Stripe Objects 
    - Will always create a product object, two price objects, and a customer object 
    - Will create a coupon object if a discount is provided 

### PDF Creation 

  **Three PDF types** 

  1. We need our official freelance independent contractor agreement contract PDF; `kon-{job_id}.pdf`
  2. Then because all jobs currently have two payments, the invoice PDF for payment_1 is created; `inv-{job_id}.pdf`
  3. The final payment invoice is called the balance PDF for payment_2; `bal-{job_id}.pdf`

  **Creates our Contract & Invoices as designed PDFs for download by Clients**

  + Everything needed to create these PDFs are in the JSON file values 
    - Fill out all required values and PDFs will be created 
    - PDFs will be created in the `assets/pdf/` directory 

  + Always runs during `admin-push.yml` workflow 
    - Directly follows creation of Stripe objects and recording their artifacts in JSON 
    - Immediately after creation of PDFs their artifacts are recorded in JSON 

  **PDF generation flow details** 
  
  + Google Docs template-based PDF generation 
    - All placeholders are already mapped to JSON file mapped values 
    - PDF templates have their file ID saved in the environment variables
  + PDFs generated immediately with new JSON job files 
    - PDFs stored only in repository with temporary Google Docs deleted 
    - OAuth refresh token flow is used, not a service account 

### Object ID And File Naming Conventions 

  **Match `product.id` by just changing the prefix to define the object or filetype**

  + `product.id` provided in JSON when creating object is in `uid-xxx-xxx` format 
    - The file name of the JSON should be the same string `assets/jobs/uid-xxx-xxx.json`
    - There is a custom script with the command `uid` you can use to produce the strings `assets/scripts/workflow_id.py` 
  + `customer.id` provided by user in JSON when creating object 
    - Change UID to CUS 
    - `cus-xxx-xxx` 
  + `coupon.id` provided by user in JSON when creating object 
    - Change UID to COU 
    - `cou-xxx-xxx` 
  + `price1.id` and `price2.id` 
    - These are the only two Object IDs that Stripe will create for us 
    - After object creation the JSON is automatically updated where needed with the price IDs 

  **The PDF filenames follow the same pattern as the Object IDs** 

  + `docs.contract.id` 
    - Use the prefix `kon-` replacing `uid-` 
    - For filename `assets/pdf/contract/kon-xxx-xxx.pdf`
  + `docs.invoice.id` 
    - Use the prefix `inv-` replacing `uid-` 
    - For filename `assets/pdf/invoice/inv-xxx-xxx.pdf`
  + `docs.balance.id` 
    - Use the prefix `bal-` replacing `uid-` 
    - For filename `assets/pdf/balance/bal-xxx-xxx.pdf`






---

## Workflow Logic 

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


### ACTION: Syncing JSONs with Stripe via `admin-push.yml` Workflow 

  **ADMIN STARTED: `.github/workflows/admin-push.yml`** 
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

### ACTION: Frontend States with Gates 

  **DELETE** `user-behavior.yml` 
  **CREATE** `user-exit-events.yml`






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

## Note

### When Testing 

  + If testing the backend production of objects, PDFs, and adding of artifacts back to the JSON
    - Delete the previous assets/jobs/ JSON file after each update fixing bugs -> make sure the Stripe object archives as a result 
    - Create a new test in assets/jobs/ that has a new UID and keywords for login -> avoid conflicts in manifest 
    - When testing this functionality, there are too many things created and JSON updates done to use the JSON again after bug updates 
  + If testing the frontend user flow and payments process 
    - Assuming the assets/jobs/ JSON file you're using passed the backend tests 
    - You can just hard-reload the payments page and then start the user flow again from login after pushing bug fixes 

## Next Steps 🎯

### Immediate (After Vercel Rate Limit Expires)
1. **Test archiving:** Create then push `uid-test-archive-001.json`, then delete it
2. **Test payment flow:** Create then push `uid-test-payment-001.json`, walk through full flow
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
