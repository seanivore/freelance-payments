# v5 Updated AI Context Primer 

**Last Updated**: 2026-01-10
**System Version**: v5.0.0 (React/Vite Architecture)
**Status**: Production Ready (Requires Vercel Deployment)

---

## Executive Summary

  A **freelance payment collection micro-site** (`payments.august.style`) that automates contract generation, invoice creation, payment processing, and document management.

  **Key Pivot in V5**: The system moved from a loose collection of Vanilla JS scripts to a structured **React 18 Single Page Application (SPA)** built with **Vite**. This ensures type safety, component reusability, and robust state management via the "FluxGate" pattern.

### **Architecture** 

  + **Host**: Hybrid. Static Frontend (GitHub Pages/Vercel) + Runtime Backend (Vercel Node.js).
  + **Data**: JSON-driven. No database. `assets/jobs/*.json` is the source of truth.
  + **Frontend**: React + TypeScript + Tailwind + shadcn/ui.
  + **PDFs**: Rendered client-side via `pdfjs-dist` (ESM).
  + **Payments**: Stripe Checkout Sessions generated on-demand via Vercel API.

---

## v5 Data Schema (`src/lib/data.ts`)

  + The JSON schema remains the core driver 
  + The TypeScript interface `JobData` in `src/lib/data.ts` is the strict definition 

  **State Object (The "FluxGate" Driver)**

  + The `client_status` object determines which "Gate" (View) the user sees 
    - Timestamps indicate progression 
    - Each view only gets one action step or button item that directs them to next view 
    - There are return_url's displayed after payment_1 and payment_2 
    - After all state events triggered, all payments done, the final return URL will always display 

```json
"state": {
  "client_status": {
    "logged_in": "ISO-TIMESTAMP",       // Gate 1: Show Contract
    "contract_signed": "ISO-TIMESTAMP", // Gate 2: Clicked Sign and Signed, now load Invoice
    "invoice": "ISO-TIMESTAMP",         // Gate 3: Clicked Download Docs yes or no buttons, now load Payment_1 checkout_session 
    "payment_1": "ISO-TIMESTAMP",       // Gate 4: Clicked and completed PAY, now load return URL type 1 
    "balance": "ISO-TIMESTAMP",         // Gate 5: Clicked Download Docs yes or no button, now load Payment_2 checkout_session 
    "payment_2": "ISO-TIMESTAMP"        // Gate 6: Clicked and completed PAY, now load final return URL type 
  }
}
```

---

## Architecture Overview

### System Flow

```
User visits Site
  ↓
Login Form (src/index.tsx) → Fetches JSON via matching login keywords to manifest.json
  ↓
React Router (App.tsx) loads Job JSON for each next phase's frontend needs 
  ↓
"FluxGate" Logic checks state.client_status to know where to place client returning to payment site 
  ↓
Renders Component (PdfViewer, PaymentGate, etc.) dynamically pulled from JSON 
  ↓
User Action (Sign/Pay) → Optimistic UI Update + Background API Call
```

### Core Components

  **1. The "FluxGate" (`src/App.tsx`)**

  + **Role**: Central Router and State Machine.
  + **Logic**: Pure function of `JobData`. `fn(data) -> View`
  + **Features**:
    - Optimistic UI: Instantly unlocks the next gate on user interaction.
    - Inactivity Tracker: Buffers events and flushes to GitHub Actions after 10m idle.

  **2. PDF Engine (`src/components/PdfViewer.tsx`)**

  + **Role**: Displays Contract/Invoice/Balance PDFs
  + **Tech**: `pdfjs-dist` (ESM) + Canvas API
  + **Features**: Pen tool for signatures, Client-side rendering

  **3. Backend API (Vercel Serverless)**

  + `/api/create-checkout-session` 
    - Generates fresh Stripe sessions 
    - **Crucial**: Must run on valid Node handler (must be discussed)
  + `/api/track-event`: Queues events for GitHub Actions
  + `/api/webhook`: Handling Stripe `checkout.session.completed`

---

## Key Rules for AI Agents

### 1. The "Src" Rule
  
  + **DO NOT** edit files in `assets/js.old` or `assets/js` 
    - All active frontend code is in `src/` 
    - The build process (`npm run build`) compiles `src/` to `dist/` 

### 2. The Vercel Requirement (**AGAIN THIS MUST BE DISCUSSED**)

  + The "Pay" button relies on `/api/create-checkout-session` 
    - This API **cannot run on GitHub Pages** 
    - Attempting to run the full payment flow on a static host will fail 
    - The repository must be deployed to Vercel (or a Node.js environment) 
  + Feels like the logic and requirements of the buttons and page loads are being over simplified 

### 3. JSON is Truth

  + There is no database 
    - If you need to verify a state, check the JSON file in `assets/jobs/` 
    - If you need to update state permanently, trigger a GitHub Action to update that JSON file 

### 4. Build Before Verifying

  + Because this is a compiled project (TypeScript -> JavaScript) 
    - You **MUST** run `npm run build` after making changes to `src/` 
    - This is to verify that types are correct and the bundle is generated 

---

## Common Pitfalls

  + **Admin Push vs Runtime** 
    - `admin_push.py` creates *Static Objects* (Product, Price, Coupon) 
    - It does *NOT* create Checkout Sessions. Sessions are created at Runtime via API.
    - **AGAIN MUST DISCUSS BECAUSE CHECK SESSION IS ALSO A STATIC OBJECT BASED ON THE JSON FILE VALUES**
  + **PDF Generation** 
    - PDFs are generated by Python scripts (`admin_push.py` -> Google Docs API) 
    - *Not* by the React Frontend 
    - The Frontend only *displays* them as embeds 
  + **Event Persistence** 
    - On static hosts, event tracking logs to console but fails to persist 
    - This is expected behavior unless connected to Vercel 
    - **THIS NOTE IS HUGE REASON WE ENDED THIS SESSION: We have always been connected to Vercel, so using the term "expected behavior" is very misleading** 

---

## File Structure Reference

```
freelance-payments/
├── src/                  # SOURCE CODE (React)
│   ├── App.tsx           # Main Router/Logic
│   ├── index.tsx         # Login Page Logic
│   ├── components/       # UI Components (PdfViewer, GateBar, etc.)
│   └── lib/              # Utilities & Type Definitions
├── api/                  # BACKEND CODE (Vercel Functions)
│   └── create-checkout-session.js
├── .github/              # ORCHESTRATION
│   └── scripts/          # Python Logic (admin_push.py)
├── assets/               # STATIC DATA
│   ├── jobs/             # The "Database" (JSON files)
│   └── pdf/              # Generated PDFs
└── dist/                 # BUILD OUTPUT (Do not edit)
```

---

## Workflow Logic 

  + There are two workflows based on the trigger source 

    1. `admin-push` full logic sequence of updates after any push 
    2. `user-exit-events` collection of events as they work through frontend, sent out after session ends 

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
