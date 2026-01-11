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