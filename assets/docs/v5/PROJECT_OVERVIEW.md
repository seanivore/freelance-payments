# Comprehensive Project Overview 
*Testing is completed on the liv site:* `https://payments.august.style`

## Summary 

  + Payments site for freelance clients. Login, get contract PDF, sign it, get invoice PDFs, then make payments

## Objective 

  + Convey full understanding of platform for Freelance Client Contract and Invoices Payments; from big picture expectations, to details about recent refactoring changes, logic updates made, and some current and persistent issue areas encountered throughout the build process 
  + This prepares you to apply your development, engineering, and design expertise to help us through final stretch 
  + Please keep clear planing, bug fixing, refactoring updates, and testing details 
    - Put in organized files within our new `docs/v5` directory 
    - Ensures that we can track progress and understand the full scope of the project as it evolves 

### Technical Overview 

  1. We use a unique SPA architecture that provides dynamic website functionality on a static GitHub Pages host using a 404-redirect method  
  2. This build provides a strong foundation for our self-maintaining application, facilitating production, maintenance, and presentation of Freelance Client's contracts and invoices for signature and record-keeping, and then enabling ability to make payments through Stripe Custom Component-based payment processing integration 
  3. These fully automated processes both use data provided by a single-JSON file per freelance job as well as record new data and artifacts that are needed by the application to drive the various user flows, automated production flows, and tracking workflows 
  4. These are created through a combination of Vercel serverless functions, from Stripe Webhooks and API calls, and finally, GitHub Actions; together these details help the application know exactly where in the User's process to place them when they leave and return to the platform 

  **IMPORTANT:** 
    + Always use `git add .` 
    + Then normal `git commit -m "Your message"` 
    + Then always `git smart-push` 
      - Intelligently sorts which conflict updated files to keep from remove versus local 
      - Created to prevent a TON of merged file errors 

### End-to-End Data & User Flow 

- **ADMIN ADDS PROJECT JOB** -> `(01)` New Job JSON uploaded -> `(02)` Stripe catalog objects created -> `(03)` Stripe object artifacts added back to JSON -> `(04)` Job contract, invoice, and balance PDFs produced -> `(05)` PDF artifacts added to JSON -> **PLATFORM READY FOR CLIENT** -> `(06)` Client login -> `(07)` First user workflow event trigger collected until end of user session -> `(08)` Login Details Locate JSON -> `(09)` JSON Populates Contract Dynamically -> `(10)` User lands on Contract page -> `(11)` User Signs Contract -> `(12)` Adds triggered event to collection during flow -> `(13)` User lands on invoice PDF -> `(14)` User downloads or rejects download of docs -> `(14)` Adds triggered event to collection during flow -> `(15)` Next page load starts with Stripe API call to create checkout session -> `(16)` User lands on initialized Payment_1 checkout Stripe Embedded component -> `(17)` User makes successful payment -> `(18)` Adds triggered event to collection during flow -> `(19)` User lands on return_url for payment_1 -> `(20)` User leaves site and all events are written to JSON -> `(21)` User returns when notified to make final payment -> `(22)` Client login -> `(23)` Login Details Locate JSON -> `(24)` JSON referenced to see what state.client_status is next -> `(25)` User lands on balance PDF document -> `(26)` User downloads or rejects download of docs -> `(27)` Adds triggered event to collection during flow -> `(28)` Next page load starts with Stripe API call to create checkout session -> `(29)` User lands on initialized Payment_2 checkout Stripe Embedded component -> `(30)` User makes successful payment -> `(31)` Adds triggered event to collection during flow -> `(32)` User lands on return_url for payment_2 with links for final access to download any PDF -> `(33)` User leaves site and all events are written to JSON -> **CLIENT COMPLETED PROJECT PAYMENTS AND FLOW**

---

## Generalized Goals & Tips for Approach 

  1. Get your head space right 
    + Many of the old files are still in the project directory so understand the architecture `assets/docs/v5/CURRENT_STATE.md` 
    + Understand the JSON and 404-redirect dynamic architecture `assets/docs/v5/AI_CONTEXT_PRIMER.md` 
    + Consider if it makes more sense to rewrite a file in full instead of getting into repeated debugging 
      - With todays products, LLM output rate, and LLM tendency to go down wrong path 
      - Simple process to follow is that when bug identified, read full script to look for similar bugs and rewrite in full if there is more than one 
      - This will save us multiple rebuilds and testing rounds which take at least 10 minutes every bug round  
  2. Understand new build, don't presume code is accurate 
    + Conduct in-depth review of ALL script files 
      - Understand the new build well enough to check the previous AIs work 
      - Know where to pick things up easily 
      - Check in with User instead of making assumptions when things aren't clear enough 
    + Logic written in this file is explicit for a reason 
      - Often the AI writes the script not fully understanding the depth of the logic 
      - They won't immediately see purpose of specifics and will skip to simplify code, always causing bugs 
      - The written logic includes exactly what is needed and nothing extra and nothing missing 
  3. Focus on executing plan not proposing solutions in plan 
    + Don't propose plan as solution, create intentional detailed plan to execute instead 
    + If the directions or next steps are not clear 
      - Avoid on-the-fly solutions and building code 
      - Do not make assumptions or presume what to do 
    + Always pause and get with user to fully discuss what the plan should be 
      - Do all necessary research and find all code snippets and patterns needed 
      - Together, EXPLICITLY PLAN next steps 
    + Don't create huge implementation plan addressing everything needed by coming up with solutions in the plan 
      - Instead, stop, talk it out with User, be exact 
      - Engage user for planning steps, don't create list of steps and then ask for review 
    + Engagement to plan concrete steps together is best 
      - Then when you start working all you are doing is executing 
      - This should eliminate so many bugs 
    + Get with User to walk through human friendly only checkout_session code creation tool, for example 
    + Talk out all previous AI concerns with Sean 
  4. User works and thinks with a design-first mentality 
    + Understand the importance of high bar 
    + Current new homepage is ugly colors 
    + PDF viewer is clunky not minimal and clean 
    + These are clients paying me to do design work for them 

### Current Project Directory Important Files 

```
freelance-payments/
├── index.html                       # User login 
├── 404.html                         # SPA routing handler 
├── job.html                         # Currently only template 
├── api/                             # Vercel serverless functions
│   ├── google/                      # Google OAuth
│   │   ├── auth.js                  # OAuth consent URL for initial authentication
│   │   └── callback.js              # OAuth callback and exchanges
│   ├── create-checkout-session.js   # Creates Stripe Checkout Session on-demand
│   ├── sign-contract.js             # Updates contract signed status in JSON file
│   ├── track-event.js               # Tracks user events (loaded, scrolled, viewed, downloads)
│   └── webhook.js                   # Receives payment events and updates JSON files
├── assets/
│   ├── jobs/
│   │   └── uid-xxx-xxx.json         # Job JSON files (one per client project) 
│   ├── js/
│   │   ├── checkout-controller.js   # Stripe Checkout component element integration
│   │   ├── completion-controller.js # Complete message after using state.payment_1 state.payment_2
│   │   ├── contract-controller.js   # Contract signing, PDF display
│   │   ├── event-tracker.js         # Batches behavior event activity for updates
│   │   ├── flow-manager.js          # Manages user frontend flow and gating logic 
│   │   ├── glow-effect.js           # Dynamic UI design homepage element
│   │   ├── invoice-controller.js    # Loads job to display embedded invoice PDF
│   │   ├── payment-lookup.js        # Login form handler 
│   │   └── manifest.json            # Lookup manifest (generated)
│   ├── pdf/
│   │   ├── contract/
│   │   ├── invoice/
│   │   └── balance/
│   ├── templates/                   # Preview template if you want to understand or double-check {{placeholders}}
│   │   ├── inv-xxx-xxx.pdf
│   │   ├── inv-xxx-xxx.txt
│   │   ├── bal-xxx-xxx.pdf
│   │   ├── bal-xxx-xxx.txt
│   │   ├── kon-xxx-xxx.pdf
│   │   └── kon-xxx-xxx.txt
│   └── css/
│       ├── input.css 
│       └── styles.css
├── src/
│   ├── components/
│   │   ├── ui/ 
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   └── popover.tsx 
│   │   ├── DatePicker.tsx
│   │   ├── GateBar.tsx
│   │   ├── PdfViewer.tsx
│   │   ├── PenCanvas.tsx
│   │   ├── SignatureModal.tsx
│   │   └── Toolbar.tsx
│   ├── config/
│   │   └── pdfViewer.config.json
│   ├── App.tsx
│   ├── index.css
│   ├── index.tsx
│   ├── job.tsx
│   ├── vite-env.d.ts
│   └── lib/
│       ├── data.ts
│       ├── pdf-utils.ts
│       └── utils.ts
├── .github/
│   ├── scripts/
│   │   ├── orchestration/
│   │   │   ├── admin_push.py
│   │   │   ├── user_exit_events.py
│   │   │   └── user_behavior.py
│   │   └── utils/
│   │       └── json_io.py           # JSON file operations
│   └── workflows/
│       ├── admin-push.yml           # Admin-initiated push creates objects, PDFs
│       └── user-exit-events.yml     # User events, contract signing, etc. triggered flow 
└── assets/docs/
    ├── uid-xxx-xxx.json             # Template JSON file to copy when creating new job JSON files 
    └── v5/
        ├── AI_CONTEXT_PRIMER.md
        ├── CURRENT_STATE.md
        └── PROJECT_OVERVIEW.md      # This file 
```

--- 

## JSON Files 

### No Admin JSON File Updates 

  + Only add new JSON files 
    - JSON file updates come only from automations 
    - Mistakes mean delete the JSON and create new file with new UID 
  + Fill out new JSON files completely 
    - Create uid-xxx-xxx for product.id 
    - Change "uid" to represent what the id of other objects and pdf are 
    - Coupon = cou-xxx-xxx 
    - Customer = cus-xxx-xxx 
    - Price **is only one created by Stripe and added to JSON after by automation**
    - Contract = kon-xxx-xxx 
    - Invoice = inv-xxx-xxx 
    - Balance = bal-xxx-xxx 

### All Necessary Data Accounted For 

  **Both Stripe objects and PDFs are created on `admin-push.yml` workflow** 

  + JSON values have everything needed to create all Stripe Objects 
  + Values have all required to create Contract, Invoice, Balance PDFs from Templates 
  + Artifacts, IDs and other updates to the JSON files follow creation of Objects and PDFs 

### PDFs Created  

  **Three PDFs Needed Per Job** 

  1. We need our official freelance independent contractor agreement contract PDF; `kon-{job_id}.pdf`
  2. Then because all jobs currently have two payments, the invoice PDF for payment_1 is created; `inv-{job_id}.pdf`
  3. The final payment invoice is called the balance PDF for payment_2; `bal-{job_id}.pdf`

  **PDF generation flow details** 
  
  + Google Docs template-based PDF generation 
    - All placeholders are already mapped to JSON file mapped values 
    - PDF templates have their file ID saved in the environment variables
  + PDFs generated immediately with new JSON job files 
    - PDFs stored only in repository with temporary Google Docs deleted 
    - OAuth refresh token flow is used, not a service account 

---

## User Flow 

  + Events identify where to place user if they leave and return 
  + Events are collected, once each, during user-interaction and then added to JSON upon their session end 

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

### Event, Meaning, Next Step, Required Action 

  + Meaning of layout below 

  1. `tracked event` = MEANING OF TRACKED EVENT
    --> where user goes next automatically after padding ONLY ACTION STEP GATE BUTTON ON PAGE 

  + User automatically moves to next phase when action gate step is completed 
  + Each event is only triggered and counted once 

  1. `state.client_status.logged_in` = USER LOGGED IN THE FIRST TIME 
    --> continues to contract automatically 
  2. `state.client_status.contract_signed` = USER SIGNED CONTRACT PDF 
    --> continues to invoice automatically after action gate for SIGNING  
  3. `state.client_status.invoice` = USER DOWNLOADED OR ACKNOWLEDGED INVOICE PDF 
    --> continues to payment 1 automatically after action gate for DOWNLOAD DOCS OR ACKNOWLEDGE AND MOVE ON 
  4. `state.client_status.payment_1` = USER PAYMENT 1 CHECKOUT SESSION IS SUCCESSFULLY COMPLETED 
    --> continues to `checkout_session_1.return_url= https://payments.august.style/uid-cat-202#completion-1` automatically on payment completion 
    --> URL shows small buttons to continue to balance and final payment 
  5. `state.client_status.balance` = USER DOWNLOADED OR ACKNOWLEDGED BALANCE PDF 
    --> continues to payment 2 automatically after action gate for DOWNLOAD DOCS OR ACKNOWLEDGE AND MOVE ON 
  6. `state.client_status.payment_2` = USER PAYMENT 2 CHECKOUT SESSION IS SUCCESSFULLY COMPLETED 
    --> continues to `checkout_session_2.return_url= https://payments.august.style/uid-cat-202#completion-2` automatically on payment completion 
    --> URL shows clear buttons to download previous PDFs and no other page is ever loaded 

---

## Testing Checklist 

- [X] Archive workflow (delete JSON → archive Stripe product)
- [ ] Payment flow (contract → invoice → checkout → payment) 
- [ ] Multi-payment jobs (Payment 1 → Payment 2 → archive) 
- [X] Manifest updates correctly
- [X] PDF generation works
- [ ] Event tracking accurate 
- [ ] Completion page messaging correct 
- [X] Git smart-push workflow handles conflicts properly

  + If testing the backend production of objects, PDFs, and adding of artifacts back to the JSON
    - Make bug fix in directory files 
    - Delete the previous Job JSON used in testing 
    - Create a new job JSON to test these items and the bug patch 
  + If testing the frontend user flow and payments process
    - Make bug fix in directory files 
    - Use the same job JSON testing frontend live 
    - Only need a new job JSON if you are fixing bugs in the event tracking triggers recorded 

--- 
*Updated by Sean August Horvath on 2026-01-11*