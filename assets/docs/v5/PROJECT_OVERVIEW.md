# Comprehensive Project Overview 
*Testing is done live:* `https://payments.august.style`

## Objective 

  + To convey fullest possible understanding of our application platform for Freelance Client Contract and Invoices Payments, including big picture expectations, as well as details on the most recent refactoring changes, logic updates and specifics, and some of the current issues or recurring troublesome functionality areas encountered throughout the build process, so that you can apply your development, engineering, and design expertise to help us round out the final stretch of development and testing, aiming to make the payments platform production-ready for client use 

### High Level Conceptual Approach To Take 

  **BASIC CONCEPT** 

  + Payments site for freelance clients. Login, get contract PDF, sign it, get invoice PDFs, then make payments 

  **CONCEPTUAL THINKING FIRST** 

  1. Try to review and understand from this document the building blocks of the system and how they work together
  2. And then sketch out an ideal implementation of what we're working with 

  + 404-redirection SPA architecture on static GitHub Pages host 
    - Template HTML pages that 404 provides URL build for 
    - JavaScript that dynamically populates pages with data from JSON files 
    - PDF viewer, signed, downloaded on initial pages 
    - Then Stripe ui-type: custom components build for payment processing 
  + JSON files for data output and input 
    - The only thing that is managed ongoing that influences all needs 
    - Feeds out data to all automations to create Stripe needs, contracts, invoices PDFs 
    - Pulls in data from object creation artifacts and user-behavior event tracking for state management 
  + Automations and connections 
    - Stripe API and webhooks 
    - Vercel serverless functions and specific custom API needs 
    - GitHub Actions to maintain file updates and all legwork for production 

  3. Pay particular attention to the very carefully, foolproof process of elimination logic for user events on front end and github action workflows 
  4. Understand that logic is sound, all it needs is in JSON, all everything needs is in JSON 
  5. Know that it can all be done without paying for any services 

  + What is the most logical, sensible, clean, effective implementation look like? 
  + Understand and have a mental map of that before digging into the current state 
  + Current state was initially simple
    - Required many schema updates, countless refactoring 
    - The good is that you know that we have baked down to the core logic and simplified functions that are all foolproof 
    - The bad is that this kind of patchwork building is just not how one would ever go about building something well 
    - We basically said "oh this needs to be like this" and then figured out how to make it work, then debugged forever 

  **CURRENT STATE COMPREHENSION SECOND** 

  6. Now you should really thoroughly review this entire document 
  7. Explore important files that are referenced and in the project directory tree 
  8. See critiques on certain files and final perfected logic to be implemented 

  - More files than needed, redundant code in places 
  - Final payments not fully bug free because of the convoluted building 
  - Need to implement more designer friendly PDF viewer, plan supplied 
  - Need to update the user-behavior frontend event tracking workflow for logical planning 

  **PLANNING PAYMENT PLATFORM FINAL ADJUSTMENTS AND TESTING** 

  9. Ideally you'll be able to come at this with a better, fresh perspective 
  10. Avoid just pushing things along the way they are just because they were started that way 

  + Consider the modern era of development and coding 
    - You can write over 20 files in minutes 
    - Most times you do this with full understanding it results in bug free code 
    - We're in an age where rewriting a script in full as a way to debug isn't nonsense 
  + The old methods of patchwork finding bugs and patching them is ingrained in training data 
    - But do they really fit how our tools work today? 
    - Consider this when putting together our final build for final testing and then deployment 

### Development Philosophy & Our Current State  

**UNDERSTAND THE CURRENT PROJECT STATE**
  - Review important files to understand management of workflow actions facilitated, presentation of information, specific functionality logic, and more. Create a full, accurate understanding of the application to identify gaps in the scripts and logic or errors left over from earlier refactoring. 

**CONSIDER WHAT THIS BUILD REPRESENTS**
  - In short, we have refactored and updated or simplified logic of functionality more than five times. This results in a constant "band-aid"-style of development, where we're always adjusting thing and then fixing things that break, constantly finding bugs. This is not idea. 

**WHAT DOES WHAT WE'VE LEARNED REALLY MEAN?**
  - Consider that through the process of getting to this point we have more than climbed necessary learning curves, uncovered essential functionality logic to apply, and discovered simplifications that needed to be made. Now, imagine building the system with what we know now; no refactoring and fixing breaks. Just clean code written in full knowledge of the final system. 

**THINK MODERN INSTEAD** 
  - If the code has a bug? Rewrite it in full. You can do this more than a few times before switching to a specific debugging focus. The "write once, then debug" approach is ingrained in training data because of historic limitations of human-only development. Now that we have agents that can write 5-10 files of code in a minute, and with an understanding of how LLMs work and their limitations, it makes much more logical sense today to write clean code more than a few times instead of once. There are so many instances where countless pages of code in a project are written by AI without error. 

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

## Generalized Goals And Flow For Approach (many details and specifics to follow)

  1. Get your head space right 
    - Opt for writing new files instead of copying various old files 
    - Don't presume the code written was written the best way possible, it was edited along the way over weeks 
    - Find the perfect medium of finishing this build VERSUS rebuild from scratch 
    - Use what we learned and the confidence that comes from knowing we are done making logic and refactoring changes  
  2. Understand current system with all its flaws 
    - Conduct in-depth review of ALL script files
    - Eliminate irrational delay in writing events to JSONs triggered by `user-behavior.yml` workflow 
    - Instead apply logic of collecting those events and then updating the JSON with them when User leaves naturally  
    - Simplify and consolidate where possible, particularly the events 
  3. Understand current system or newly provided ROCK SOLID logic for flows 
    - Really make sure that the logic in the file is as explicit and defined as it is in writing 
    - Were do files overlap or even conflict, not matching the cleanliness of the flow logic 
    - Review updates for the deletion of `user-behavior.yml` for creation of `user-exit-events.yml`
    - Cleanup code looking for bugs or errors 
  4. Use strong frontend user flow understanding in updating code to make full checkout flow functional
    - Review console logs at each step of the frontend user flow to confirm simplest logic was implemented
    - Run end-to-end tests to confirm full checkout flow is functional
    - Make sure the payment_1 and payment_2 UX are both handled well
    - Return URL thank you pages, we need custom messages post payment_1 and payment_2
  5. Review the provided update to PDF viewing functionality provided by Dia 
    - Implementation details are below and have been triple checked against this document 
    - All files provided created in structure provided within new `src/` directory
    - Remember that this site must be a VERY HIGH BAR for design because that's what clients come to me for
  6. What else does PROCESS section above commentary call to you to update and clean up or simplify 
    - Pause to request or take screenshots of front end; the sign contract modal is gross 
    - We have custom Stripe components to put anywhere on page so lets use them
    - Homepage invoice.html is good, maybe some touch ups
    - Do we need a checkout.html page to fully take advantage of our build

### Current Project Directory Important Files 

```
freelance-payments/
├── index.html                       # User login form
├── 404.html                         # SPA routing handler gives job.html proper URL
├── job.html                         # Currently only template for contract, invoice, payment sections
├── .gitconfig-smart-push.sh         # Git conflict resolution script 
├── api/                             # Vercel serverless functions
│   ├── google/                      # Google OAuth
│   │   ├── auth.js                  # OAuth consent URL for initial authentication
│   │   └── callback.js              # OAuth callback and exchanges
│   ├── create-checkout-session.js   # Creates Stripe Checkout Session on-demand
│   ├── sign-contract.js             # Updates contract signed status in JSON file
│   ├── track-event.js               # Tracks user events (loaded, scrolled, viewed, downloads)
│   └── webhook.js                   # Receives payment events and updates JSON files
├── assets/
│   ├── jobs/                        # Job JSON files (one per client project)
│   │   └── uid-xxx-xxx.json         # Example job JSON filename that is current and up-to-date
│   ├── js/
│   │   ├── components/
│   │   │   ├── button.js            # shadcn/ui-"inspired" Button Component **WE DON'T WANT "INSPIRED" WE WANT REAL**
│   │   │   ├── card.js              # shadcn/ui-"inspired" Card Component **WE DON'T WANT "INSPIRED" WE WANT REAL**
│   │   │   └── input.js             # shadcn/ui-"inspired" Input Component **WE DON'T WANT "INSPIRED" WE WANT REAL**
│   │   ├── checkout-controller.js   # Stripe Checkout component element integration
│   │   ├── completion-controller.js # Complete message after using state.payment_1 state.payment_2
│   │   ├── contract-controller.js   # Contract signing, PDF display
│   │   ├── event-tracker.js         # Batches behavior event activity for updates
│   │   ├── flow-manager.js          # Manages user frontend flow and gating logic 
│   │   ├── glow-effect.js           # Dynamic UI design homepage element
│   │   ├── invoice-controller.js    # Loads job to display embedded invoice PDF
│   │   ├── payment-lookup.js        # Login form handler **OF ALL JS FILES, THIS IS THE ONLY ONE THAT ABSOLUTELY WORKS PERFECTLY**
│   │   └── manifest.json            # Lookup manifest (generated)
│   ├── pdf/
│   │   ├── contract/                # Contract PDFs (kon-{job_id}.pdf)
│   │   ├── invoice/                 # Invoice PDFs (inv-{job_id}.pdf)
│   │   └── balance/                 # Balance PDFs (bal-{job_id}.pdf)
│   ├── templates/                   # Preview template if you want to understand or double-check {{placeholders}}
│   │   ├── inv-xxx-xxx.pdf          # Invoice PDF template 
│   │   ├── inv-xxx-xxx.txt          # Invoice TXT template
│   │   └── bal-xxx-xxx.pdf          # Balance PDF template
│   │   ├── bal-xxx-xxx.txt          # Balance TXT template
│   │   ├── kon-xxx-xxx.pdf          # Contract PDF template
│   │   └── kon-xxx-xxx.txt          # Contract TXT template
│   └── css/
│       ├── input.css 
│       └── styles.css               # Tailwind CSS (includes breakpoints)
├── src/                             # PDF.js implementation code
│   ├── components/
│   │   ├── DatePicker.tsx           # Date picker for signing contract 
│   │   ├── GateBar.tsx              # User frontend flow gate button management 
│   │   ├── PdfViewer.tsx            # PDF viewer
│   │   └── Toolbar.tsx              # Toolbar for PDF viewer 
│   ├── config/
│   │   └── pdfViewer.config.json    # PDF viewer configuration
│   └── lib/
│       └── pdf-utils.ts             # PDF viewer utilities
├── .github/
│   ├── scripts/
│   │   ├── orchestration/
│   │   │   ├── admin_push.py        # Admin workflow logic **FUNCTIONING PROPERLY**
│   │   │   └── user_behavior.py     # User behavior workflow logic
│   │   └── utils/
│   │       └── json_io.py           # JSON file operations
│   └── workflows/
│       ├── admin-push.yml           # Admin-initiated push creates objects, PDFs
│       └── user-behavior.yml        # User events, contract signing, etc. triggered flow 
└── assets/docs/
    ├── uid-xxx-xxx.json             # Template JSON file to copy when creating new job JSON files 
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

### Committing to Git 

  **Pushes to GitHub while resolving any conflicts intelligently**

  + Use `git add .` 
  + Add message with `git commit -m "Your commit message"` 
  + Then use special command `git smart-push` 

---

## Workflow Logic 

  + There are two workflows based on the trigger source 

    1. `admin-push` full logic sequence of updates after any push 
    2. `user-behavior` collection of events as they work through frontend 

  + Sequential execution **ONLY**
    - Concurrency groups (`freelance-payments-workflows-${{ github.ref }}`)
    - **Cancel in progress:** `false` (protects running workflows)
    - **Note:** Pending runs may still be canceled by GitHub Actions (intended behavior)

  + Workflows have explicit step-by-step logging for transparency so anyone looking can understand 
    - Clear RESULT and ARTIFACTS logging
    - Full steps for each listed below 
    - Though each workflow has a handful of identical steps, every workflow is created to be wholly independent
    - If we find a bug and error that we correct in one of the .yml workflows, we will need to fix the other in most cases 

### ACTION: Admin Uses Smart-Push Commit **FUNCTIONING PROPERLY**

  **WORKFLOW ACTIVATED: `.github/workflows/admin-push.yml`** 
  + TRIGGER=admin-push
  + When: Admin pushes **ANY CHANGE** because logic handles every possible change 
  + Behavior: Starts immediately when admin pushes, unless there is a workflow running to wait to finish 
  + Flow:
    1. Compare JSONs to catalog 
      - 'Unmatched' = a product.id in either location but not both 
      - 'Matched' = a product.id in both locations 
      - For each situation, the secondary parameter `active=true/false` defines the action 
    2. Unmatched: JSON but no catalog, if `json.active=true` → create catalog object, create PDF contract, invoice, balance
      - Add new Stripe Catalog object artifacts to JSON 
      - Add new Contract, Invoice, Balance PDF artifacts to JSON 
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

### ACTION: User-Behavior Frontend Event Triggers 

  **NEEDS UPDATE** 

  + OLD flawed logic: 
    - This workflow currently gathers and batches updates to JSON every X minutes 
    - Does not make functionality of site in the moment simple and there is a more logical solution 
  + NEW logic: 
    - User-behavior events collect throughout the user's interaction with the site's frontend 
    - Do not process updates to JSON files until there has been inactivity of any frontend events for X minutes 
    - This should denote that the user reached the natural conclusion of their interaction this session 
    - Leave it open to the User as to where to stop 
    - Action/button/gate progress permits user to next state of frontend flow in-the-moment 
    - All ISO timestamps can be added to JSON file using the same timestamp 

  **DELETE** `user-behavior.yml` 
  **CREATE** `user-exit-events.yml`

  + From the old flow logic to be removed or otherwise updated and integrated 
    - `assets/js/event-tracker.js`

### ACTION: Frontend State Event Collection Inactive for 10 Minutes 

  **WORKFLOW ACTIVATED: `.github/workflows/user-exit-events.yml`** 
  + TRIGGER=user-exit-events
  + When: Complete inactivity of frontend events for 10 minutes, after **ANY** activity 
  + Behavior: Starts at 10 minute inactivity mark, unless there is a workflow running to wait to finish
  + Flow:
    1. User login, collect confirmation for `state.client_status.logged_in` value 
      - Continue collecting events in the following steps as they are triggered 
      - Only collect one event trigger for each `state.client_status` value 
      - At any point if no new events are triggered for 10 minutes, complete workflow with only collected events at that point 
    2. User contract sign, add confirmation to collection, including for `state.client_status.contract_signed` value 
    3. User invoice download/acknowledge, add confirmation to collection, including for `state.client_status.invoice` value 
    4. User payment_1, add confirmation to collection, including for `state.client_status.payment_1` value 
    5. User balance download/acknowledge, add confirmation to collection, including for `state.client_status.balance` value 
    6. User payment_2, add confirmation to collection, including for `state.client_status.payment_2` value 
    7. Update JSON file with ISO timestamp for all `state.client_status` values 
      - If all events are collected, complete workflow and add ISO timestamp to all `state.client_status` values 
      - If after at least one event trigger, 10 minutes of inactivity pass, complete workflow and add ISO timestamp to ONLY collected events 
    8. Update other JSON value based on if event collected includes `state.client_status.contract_signed` 
      - Give ISO timestamp to `contract.signatures.client.signed_date` 
      - Give ISO timestamp to `contract.signatures.contractor.signed_date` 
    9. Additional payment completion JSON values if event collected for `state.client_status.payment_1`
      - When event not collected for `state.client_status.payment_2` then change `price1.active= true` to `price1.active= false` 
      - When `price1.count` <= `product.total_payments` then change `product.active= true` to `product.active= false`
      - When `price1.count` > `product.total_payments` then leave `product.active= true` as is  
    10. Additional payment completion JSON values if event collection for `state.client_status.payment_2`
      - Change `price2.active= true` to `price2.active= false`
      - Change `product.active= true` to `product.active= false`
    11. Compare JSONs to catalog 
      - 'Unmatched' = a product.id in either location but not both 
      - 'Matched' = a product.id in both locations 
      - For each situation, the secondary parameter `active=true/false` defines the action 
    12. Unmatched: JSON but no catalog, if `json.active=true` → create catalog object, create PDF contract and invoice 
      - Add new Stripe Catalog object artifacts to JSON 
      - Add new Contract and Invoice PDF artifacts to JSON 
    13. Unmatched: JSON but no catalog, if `json.active=false` → delete JSON file 
    14. Unmatched: Catalog but no JSON, if `catalog.active=true` → modify catalog `active=false`
    15. Unmatched: Catalog but no JSON, if `catalog.active=false` → ignore (this is good, accurate completed job)
    16. Matched: `catalog.active=false`, `json.active=true` → delete JSON
    17. Matched: `catalog.active=false`, `json.active=false` → delete JSON
    18. Matched: `catalog.active=true`, `json.active=false` → modify catalog to `active=false`, delete JSON
    19. Matched: `catalog.active=true`, `json.active=true` → ignore (this is good, accurate, active job)
    20. Create new manifest that reflects resulting JSON directory
    21. Build pages
    22. Deploy 

---

## User-Behavior Frontend Event Trigger Flow 

### "FluxGate" Frontend Routing **THIS LOOKS LIKE IT NEEDS TO BE CAREFULLY REVIEWED AND GIVEN SOME MINOR UPDATES** `assets/js/flow-manager.js`
- **New Architecture**: `PaymentRouter` (aka FluxGate) determines user location strictly based on the presence of timestamps in `client_status`.
- **Flow**: Contract -> Invoice (Payment 1) -> Invoice (Payment 2) -> Completion.
- **UI**: Hidden redundant navigation bar to enforce the gated flow.

  **CURRENT STATE CHECKED** -- login seems to work but nothing loads on next page after login; here is the console output

    ```
    uid-jqf-256:1  GET https://payments.august.style/uid-jqf-256 404 (Not Found)
    flow-manager.js:94 FlowManager: Active Step contract
    ```

### Events, Meaning, And Action Gate Progression 

  **Simply put, these are the events collected, once each** 

  + When collected during active user flow, automatic progression follows each phases action event button --> to next phase 

  1. `state.client_status.logged_in` = USER LOGGED IN THE FIRST TIME 
    --> continues to contract automatically 
  2. `state.client_status.contract_signed` = USER SIGNED CONTRACT PDF 
    --> continues to invoice automatically after signing 
  3. `state.client_status.invoice` = USER DOWNLOADED OR ACKNOWLEDGED INVOICE PDF 
    --> continues to payment 1 automatically after downloading/instantly acknowledging 
  4. `state.client_status.payment_1` = USER PAYMENT 1 CHECKOUT SESSION IS SUCCESSFULLY COMPLETED 
    --> continues to `checkout_session_1.return_url= https://payments.august.style/uid-cat-202#completion-1` automatically on payment completion 
    --> URL shows small buttons to continue to balance and final payment 
  5. `state.client_status.balance` = USER DOWNLOADED OR ACKNOWLEDGED BALANCE PDF 
    --> continues to payment 2 automatically after downloading/instantly acknowledging 
  6. `state.client_status.payment_2` = USER PAYMENT 2 CHECKOUT SESSION IS SUCCESSFULLY COMPLETED 
    --> continues to `checkout_session_2.return_url= https://payments.august.style/uid-cat-202#completion-2` automatically on payment completion 
    --> URL shows clear buttons to download previous PDFs and no other page is ever loaded 

### ISO Timestamp Values In JSON Schema 

  + Each value would receive an ISO timestamp when triggered or when collected events are dispatched 

```json 
    "state": {
        "client_status": {
            "logged_in": null,
            "contract_signed": null,
            "invoice": null,
            "payment_1": null,
            "balance": null,
            "payment_2": null
        }
    }
```

### Use Of Event Triggers For Two Purposes 

  **Used in GitHub workflow and in user return placement likely managed by flow-manager.js** 

  + This logic is used when **collecting events during** the `user-exit-events.yml` workflow 
    - Count trigger events only one, only in sequential order, never skipping any events 
    - User clicks "action gate button" during flow, confirming movement to next step
    - As indicated in workflow above, timeout of 10 minutes after last event triggers completion of workflow 
    - Or workflow is completed when all events are collected and they reached the #completion-2 URL 
    - Event timestamps are not referenced for passing to next state of flow ever 

  + This logic is used to determine **where to place a user** that is returning to the site, partially managed by `assets/js/flow-manager.js`
    - Event timestamps are only used to determine where the user jumps back into the flow 
    - Event timestamps are not referenced for passing to next state of flow ever 
    - These events are only skipped because they have complete indication from ISO timestamp value added 
    - Wherever the user jumps back into the flow, the above logic flow is used, where events are collected live in the moment, until timeout 
  
  + We have not yet been able to successfully move from payment 1 through to payment 2 completion 
    - These old files should be altered, updated, integrated, or deleted after careful review 
    - `assets/js/checkout-controller.js`

  + Not clear if this file manages the return URL for both completion-1 and completion-2 
    - Again we have yet to be able to see them successfully complete, when first payment does complete successfully, it is not displayed 
    - Altered, updated, deleted an integrated elsewhere -- any way they need to be improved based on newly provided logic details 
    - `assets/js/completion-controller.js` 

  + Inaccurate "bainaid" logic applied and needs to be removed, altered, or deleted and integrated elsewhere 
    - Instead of using the actual simple flow logic described above, never referencing the timestamp values for passing along in flow 
    - `assets/js/contract-controller.js` 

  + This event tracker is dated based on the new logic 
    - Should be deleted and integrated elsewhere in more comprehensively concise way for full flow and events 
    - `assets/js/event-tracker.js`

  + Included checkout initialization logic that has not worked properly in any tests yet 
    - Review thoroughly and then update, change, or delete and integrate logic elsewhere 
    - `assets/js/invoice-controller.js` 

### User Flow Progression With Gates And Progression Phase 

  1. User login, all `state.client_status` objects are null 
    - User is directed to the **CONTRACT** 
    - Action gate button is **SIGN** 
    - After signing user directed to **INVOICE**  
  2. User login, `state.client_status.logged_in` has timestamp, other objects null 
    - Timestamp reflects their first login 
    - All null objects mean the user has not yet signed the contract 
    - User is directed to the **CONTRACT** 
    - Action gate button is **SIGN** 
    - After signing user directed to **INVOICE**  
  3. User login, `state.client_status.contract_signed` has timestamp, and previous values, following objects null 
    - Timestamp reflects their first contract signature 
    - User is directed to the **INVOICE** 
    - Action gate button is **Download your documents: Yes | No** 
    - After clicking either button, the `checkout_session_1` is initialized 
    - Then user is directed to **CHECKOUT** page for payment_1  
  4. User login, `state.client_status.invoice` has timestamp, and previous values, following objects null 
    - Timestamp reflects acknowledging and/or downloading INVOICE  
    - The `checkout_session_1` is initialized 
    - User is directed to **CHECKOUT** page for payment_1 
    - Action gate button is **PAY** 
    - After paying user is directed to the **#completion-1** thank you page 
    - This completion-1 page is never show again 
    - The **#completion-1** page depicts soft call to action gate button to continue to **BALANCE** and `checkout_session_2` 
    - This is not something we are requesting they do, but it should be available if a user wants to pay the for service in full 
  5. User login, `state.client_status.payment_1` has timestamp, and previous values, follow objects null 
    - Timestamp reflects paying payment_1 and having loaded completion-1 page 
    - User is directed to the **BALANCE** 
    - Action gate button is **Download your documents: Yes | No** 
    - After clicking either button, the `checkout_session_2` is initialized 
    - Then user is directed to **CHECKOUT** page for payment_2 
  6. User login, `state.client_status.balance` has timestamp, and previous values, following objects null 
    - Timestamp reflects acknowledging and/or downloading BALANCE 
    - The `checkout_session_2` is initialized 
    - User is directed to **CHECKOUT** page for payment_2 
    - Action gate button is **PAY** 
    - After paying user is directed to the **#completion-2** thank you page 
    - This is the final page in the flow and will be shown every time they visit in the future
    - The **#completion-2** thank you page should include hyperlinks to download the contract, invoice, and balance PDFs 
    - These are merely provided for future reference if needed before project launches 
  7. User login, `state.client_status.payment_2` has timestamp, and previous values (all values)
    - Timestamp reflects paying payment_2 and having loaded completion-2 page 
    - User is directed to the **#completion-2** thank you page again 
    - There are no further steps for the user to take 
    - All values are now present and timestamped

---

## Update PDF Embedding Methodology

### Using PDF.js Plan Created By Dia  

  + PDF.js is an open-source JavaScript PDF viewer with edit UI 
    - `https://github.com/mozilla/pdf.js`

  + Dia: "Got it. Let’s reset and ship a clean, fully working React + shadcn/ui PDF viewer with pen, date picker, and “action/gate” buttons that fit your SPA flow. This replaces the previous “mimic shadcn” approach with real shadcn/ui components, Tailwind, and lucide icons." 

  **PLAN** 

  1. Files: PdfViewer (viewer), PenCanvas (drawing), Toolbar (actions), GateBar (per-section actions), DatePicker (sign date), utils, config JSON. 
  2. Real shadcn/ui: button, input, slider, dialog/sheet, calendar date picker, and Lucide icons. 
  3. PDF.js render + pen overlay; flatten strokes into PDF via pdf-lib; download. 
  4. SPA flow hooks: emit events for contract/invoice gates, ready to connect to your existing controllers. 
  5. Clean Tailwind styles; no CDN for PDF.js—you’ll import modules cleanly.

  **INSTALL** 

  + Run in your Vite React + TS project (you already have Tailwind).
  + Install deps:
    - shadcn/ui core + calendar + utilities
    - lucide-react
    - pdf.js
    - pdf-lib
    - date-fns

  **COMMANDS**

```bash
npm install pdfjs-dist pdf-lib lucide-react date-fns
```

  + If you don’t have shadcn/ui set up yet:

```bash 
npm install tailwindcss postcss autoprefixer
npm install -D @types/node
``` 

  + Ensure your Tailwind is working (you already have tailwind.config.js and postcss.config.js). If needed, I can add those next.

  **FILES**

  + `src/config/pdfViewer.config.json` 
  + `src/lib/pdf-utils.ts` 
  + `src/components/ui.tsx` 
  + `src/lib/utils.ts` 
  + `src/components/PenCanvas.tsx` 
  + `src/components/GateBar.tsx` 

  + Dia: "Great—yes, I’ll drop updated, full ESM versions for PdfViewer.tsx and Toolbar.tsx that compile cleanly with Vite + TS + Tailwind, using proper pdfjs-dist ESM imports (no globals), and pdf-lib. They match your src/components paths." 

  **PLAN** 

  1. PdfViewer.tsx: ESM PDF.js worker import, render, pen overlay integration, flatten + download, gate emit hooks, date picker slot.
  2. Toolbar.tsx: real component with Tailwind styling and lucide-react icons.
  3. Notes: tsconfig hints + worker import details.

  **FILES** 

  + `src/components/Toolbar.tsx` 
  + `src/components/PdfViewer.tsx` 

  + "Notes to keep TypeScript happy and Vite bundling correct" 
    - tsconfig.json: set “module”: “esnext”, “moduleResolution”: “bundler”.
    - Ensure you have “strict”: true or at least JSX/TSX config correct.
    - The line import ‘pdfjs-dist/build/pdf.worker.mjs’ must be present exactly once in your app bundle (PdfViewer.tsx is fine). It allows Vite to include the worker ESM. The GlobalWorkerOptions.workerSrc override is harmless but not required when using the ESM import.
    - No window globals for PDF.js or pdf-lib are used; all imports are ESM.

  + "Wire emitEvent to your SPA/Vercel" 
    - For example, pass emitEvent={(name, payload) => fetch(’/api/track-event’,{method:‘POST’,headers:{‘Content-Type’:‘application/json’},body:JSON.stringify({name,payload})})}
    - Use gate identifiers aligned to your new schema (invoice_1, invoice_2 steps) or map Gate to your desired event keys.

  + "If you want, I can add an optional prop to PdfViewer to accept a Uint8Array for the initial PDF and a function to return the flattened Uint8Array to your contract/invoice controllers. Also happy to add a “Sign” button that packages the signDate + current page strokes into a single payload for /api/sign-contract." 

  **SHARED CSS FILES WITH DIA** 

  + Your CSS foundation looks solid and won’t conflict with the React components I sent. Keep the breakpoints and theme tokens as-is. The PdfViewer/Toolbar/GateBar/DatePicker will adopt your Tailwind utilities without needing breakpoint edits. If you later want responsive tweaks, add md/lg classes directly to those components; nothing in pdfjs-dist or pdf-lib is breakpoint-sensitive.
  
  + Key compatibility notes:
    - Your CSS defines variables and component classes that complement Tailwind; the React files rely on utility classes, so they’ll blend cleanly.
    - The ESM worker import for PDF.js is independent of CSS, so the viewer will render identically across breakpoints.
    - Gate actions and date picker styling inherit your base theme; their layout is already responsive via flex and gap.
  + I’ll proceed with this setup and only touch breakpoints if you want specific layout shifts (e.g., toolbar condenses on small screens, gate bar stacks on mobile). Otherwise, you’re good.

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

### Stripe Products 

  + Always use job ID as product ID (e.g., `uid-test-001`) 

### Manifest 

  + Auto-generated, don't edit manually 

### Git 

  + Use `git smart-push` for all pushes (handles conflicts automatically) 

## Next Steps 

  + **SHOULD BE CLEARLY PLANNED** 

---

## Testing Checklist **ADD ANY NEW ITEMS WITH UPDATE** 

- [X] Archive workflow (delete JSON → archive Stripe product)
- [ ] Payment flow (contract → invoice → checkout → payment) **DOES NOT WORK**
- [ ] Multi-payment jobs (Payment 1 → Payment 2 → archive) **FLOW EXAMPLE NOT ACCURATE OR DETAILED ENOUGH**
- [X] Manifest updates correctly
- [X] PDF generation works
- [ ] Event tracking accurate **NEEDS NEW LOGIC AND FILES**
- [ ] Completion page messaging correct **SHOULD HAVE TWO AND DETAILED COPY EXPLANATION IS ABOVE**
- [X] Git smart-push workflow handles conflicts properly

--- 
*Updated by Sean August Horvath on 2026-01-10 with as best as I can tell, our current state and all detailed functionality logic*