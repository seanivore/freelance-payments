# Payments Platform - Complete Technical Documentation

**Last Updated**: 2026-01-19  
**Version**: v5.1.16 (React + Vite + TypeScript)  
**Status**: Production Ready - End-to-End Testing Complete

---

## Executive Summary

A **freelance payment collection micro-site** (`payments.august.style`) that automates contract generation, invoice creation, payment processing, and document management. Built with React 18 + TypeScript + Vite, deployed on Vercel (static frontend + serverless backend), using JSON files as the single source of truth (no database).

**Key Innovation**: Hybrid architecture combining static hosting (GitHub Pages/Vercel) with runtime backend (Vercel serverless functions), using a 404-redirect trick for SPA routing on static hosts.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Flow & State Management](#data-flow--state-management)
3. [File Structure & Role of Each File](#file-structure--role-of-each-file)
4. [User Flow & Job Lifecycle](#user-flow--job-lifecycle)
5. [Event Tracking System](#event-tracking-system)
6. [Payment Processing](#payment-processing)
7. [PDF Generation & Display](#pdf-generation--display)
8. [GitHub Actions Workflows](#github-actions-workflows)
9. [Development Philosophy](#development-philosophy)
10. [Setup & Configuration](#setup--configuration)
11. [Common Tasks & Debugging](#common-tasks--debugging)

---

## Architecture Overview

### System Components

```
┌──────────────────────────────────────────────────────────────────┐
│                    JSON FILES (Source of Truth)                  │
│              assets/jobs/uid-xxx-xxx.json                        │
│  Contains: customer, product, prices, state, docs                │
└──────────────────────────────────────────────────────────────────┘
                          ↕
┌──────────────────────────────────────────────────────────────────┐
│              FRONTEND (React Components)                         │
│                    src/App.tsx                                   │
│  - Fetches JSON via fetchJobData()                               │
│  - Determines which component to show (FluxGate logic)           │
│  - Collects events in buffer (eventBufferRef)                    │
│  - Flushes events to API when needed                             │
└──────────────────────────────────────────────────────────────────┘
                          ↕
┌──────────────────────────────────────────────────────────────────┐
│              BACKEND API (Vercel Functions)                      │
│  - /api/create-checkout-session.js → Creates Stripe session      │
│  - /api/track-event.js → Receives events, dispatches workflow    │
│  - /api/webhook.js → Receives Stripe events (log only)           │
│  - /api/session-status.js → Returns checkout session status      │
└──────────────────────────────────────────────────────────────────┘
                          ↕
┌──────────────────────────────────────────────────────────────────┐
│           GITHUB ACTIONS (Automation)                            │
│  - admin-push.yml → Creates Stripe objects, PDFs                 │
│  - user-exit-events.yml → Updates JSON with event data           │
└──────────────────────────────────────────────────────────────────┘
                          ↕
┌──────────────────────────────────────────────────────────────────┐
│                    JSON FILES (Updated)                          │
│  - state.client_status.* timestamps updated                      │
│  - contract.signatures.client.* updated                          │
│  - price1.active, price2.active, product.active updated          │
└──────────────────────────────────────────────────────────────────┘
```

### Hosting Strategy

**Frontend**: Static files served by Vercel (or GitHub Pages)
- React app compiled to `dist/` directory
- Uses 404-redirect trick for SPA routing
- All routes serve `404.html` → loads React app → React reads URL → shows correct component

**Backend**: Vercel serverless functions
- `/api/*.js` files become serverless endpoints
- Handle secure operations (Stripe API calls, webhooks)
- Cannot run on pure static hosts (requires Node.js runtime)

**Why This Architecture?**
- Free hosting (Vercel free tier)
- Clean URLs (`/uid-xxx-xxx` not `/#/uid-xxx-xxx`)
- Type safety with TypeScript
- Component reusability with React
- No database needed (JSON files are source of truth)

---

## Data Flow & State Management

### The "FluxGate" Pattern

The platform uses a state-based routing system called "FluxGate" that determines which view to show based on `state.client_status` timestamps in the JSON file.

**Gate Logic** (`src/App.tsx`):

```typescript
// Determine initial section based on state.client_status timestamps
if (!client_status.logged_in) {
  initialSection = 'contract'; // First visit
}
if (client_status.contract_signed) {
  initialSection = 'invoice';
}
if (client_status.invoice) {
  initialSection = 'payment1';
}
if (client_status.payment_1) {
  initialSection = data.price2?.id ? 'balance' : 'completion2'; // Two payments vs one
}
if (client_status.balance) {
  initialSection = 'payment2';
}
if (client_status.payment_2) {
  initialSection = 'completion2'; // Final completion
}
```

### State Object Structure

```json
{
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
}
```

### Optimistic UI Updates

When user takes action (signs contract, acknowledges invoice, completes payment), the UI updates immediately (optimistic update) while the backend processes the event in the background.

**Example**:
```typescript
// User signs contract
emitEvent('contract_signed', { legal_name: "...", signed_date: "..." });

// Optimistic update - UI shows invoice immediately
setData(prev => ({
  ...prev,
  state: {
    ...prev.state,
    client_status: {
      ...prev.state.client_status,
      contract_signed: new Date().toISOString()
    }
  }
}));

// Event tracked and flushed later → JSON updated via GitHub Actions
```

---

## File Structure & Role of Each File

### Frontend Source (`src/`)

**`src/App.tsx`** - Main Router/State Machine ("FluxGate")
- Fetches job JSON data using `fetchJobData()`
- Determines current gate based on `state.client_status` timestamps
- Renders appropriate component (ContractView, InvoiceView, PaymentView, etc.)
- Manages event buffering and flushing
- Handles Stripe return URL routing (`?session_id=` query param)

**`src/index.tsx`** - Login Page Entry Point
- Login form with `lastName` and `keyword` inputs
- Loads `manifest.json` to find matching job
- Redirects to `/${job_id}` after successful login

**`src/job.tsx`** - Job Page Entry Point (404 Redirect Handler)
- Loaded by `404.html` when user visits `/${job_id}`
- Initializes React app and renders `App.tsx`

**`src/lib/data.ts`** - Data Fetching & Type Definitions
- `JobData` TypeScript interface (strict type definition for JSON schema)
- `fetchJobData()` function - Always fetches fresh JSON from `/assets/jobs/${job_id}.json`
- Never uses sessionStorage or cache (always fresh data)

**`src/lib/api.ts`** - API Configuration
- `apiUrl()` function - Returns correct API base URL (Vercel backend)
- Handles both development and production environments

**`src/lib/stripe.ts`** - Stripe.js Initialization
- Initializes Stripe.js with publishable key from environment variables
- Exports `stripePromise` for use in CheckoutProvider

**`src/components/ContractView.tsx`** - Contract PDF Gate Component
- Displays contract PDF using `PdfViewer` component
- Shows "Sign Contract" button via `GateBar`
- Opens `SignatureModal` to collect signature, legal name, date
- Tracks `contract_signed` event on signature submission

**`src/components/InvoiceView.tsx`** - Invoice PDF Gate Component
- Displays invoice PDF using `PdfViewer` component
- Shows download/acknowledge buttons via `GateBar`
- Tracks `invoice_acknowledged` event on continue

**`src/components/BalanceView.tsx`** - Balance PDF Gate Component
- Same as InvoiceView but for balance PDF
- Tracks `balance_acknowledged` event on continue

**`src/components/PaymentView.tsx`** - Payment Initiation Component
- Shows payment amount and invoice reference
- "Continue to Checkout" button calls `/api/create-checkout-session`
- Stores `client_secret` in state and renders `CheckoutForm`

**`src/components/CheckoutForm.tsx`** - Stripe Payment Element Form
- Uses `PaymentElement` from `@stripe/react-stripe-js/checkout`
- Email validation with `checkout.updateEmail()`
- Form submission calls `checkout.confirm()` to complete payment
- Styled with Tailwind to match app theme

**`src/components/CompletionView.tsx`** - Completion Pages
- `completion1`: After payment_1, shows message + instructional text
- `completion2`: After payment_2, shows final message + download links for all PDFs

**`src/components/PdfViewer.tsx`** - PDF Rendering Engine
- Uses `pdfjs-dist` (ESM) + Canvas API for client-side rendering
- Multi-page support with vertical scrolling
- HiDPI display support (device pixel ratio)
- Signature overlay capability

**`src/components/SignatureModal.tsx`** - Signature Collection Modal
- Collects: legal name (text input), date (DatePicker), signature (PenCanvas)
- Uses shadcn/ui drawer component
- Passes all three values to `onSign` callback

**`src/components/GateBar.tsx`** - Action Button Bar
- Displays action buttons for each gate (sign, download, continue, pay)
- One primary action button per gate (gate pattern)
- Styled to match design mockups

### Backend API (`api/`)

**`api/create-checkout-session.js`** - Stripe Checkout Session Creation
- Creates Stripe checkout session on-demand with `ui_mode: 'custom'`
- Returns `client_secret` for Stripe Elements
- Sets `return_url` template: `https://payments.august.style/${job_id}?session_id={CHECKOUT_SESSION_ID}`
- Includes `payment_number` in metadata for routing logic

**`api/track-event.js`** - Event Tracking Endpoint (Single Workflow Dispatcher)
- Receives batched events from frontend only (`event_type: "batch"`)
- Validates `job_id` and event array payload
- Dispatches `user-exit-events.yml` GitHub Actions workflow
- Single workflow dispatch per batch (prevents duplicate runs per session)

**`api/webhook.js`** - Stripe Webhook Handler (Log Only)
- Receives Stripe `checkout.session.completed` events
- Verifies webhook signature
- Logs completion for audit/debugging
- Does **not** dispatch workflows (events are persisted via frontend batch)

**`api/session-status.js`** - Checkout Session Status Endpoint (Read-Only)
- GET endpoint: `/api/session-status?session_id=cs_xxx`
- Returns: `status`, `payment_status`, `payment_intent_id`, `amount_total`, `metadata`
- Used by frontend to verify payment completion on return URL (no workflow dispatch)

**`api/google/auth.js`** - Google OAuth Consent URL
- Generates OAuth consent URL for initial authentication
- Used by `admin-push.yml` workflow for Google Docs API access

**`api/google/callback.js`** - Google OAuth Callback
- Handles OAuth callback and exchanges authorization code for tokens
- Stores refresh token for use in GitHub Actions workflows

### Automation Scripts (`.github/scripts/`)

**`.github/scripts/orchestration/admin_push.py`** - Admin Push Workflow Script
- Compares JSON files to Stripe catalog
- Creates missing Stripe objects (product, prices, coupon, customer)
- Generates PDFs (contract, invoice, balance) using Google Docs API
- Updates JSON files with Stripe IDs and PDF metadata
- Creates/updates `manifest.json` for login lookup

**`.github/scripts/orchestration/user_exit_events.py`** - User Event Processing Script
- Processes batched events from frontend
- Updates JSON file with timestamps:
  - `state.client_status.*` timestamps
  - `contract.signatures.client.*` (legal_name, signed_date)
  - `price1.active`, `price2.active`, `product.active` flags (deactivated after payments)
- Handles merge conflicts with git rebase

**`.github/scripts/utils/json_io.py`** - JSON File Operations Utility
- Helper functions for reading/writing JSON files
- Used by both admin_push.py and user_exit_events.py

### Workflow Files (`.github/workflows/`)

**`.github/workflows/admin-push.yml`** - Admin-Initiated Push Workflow
- **Trigger**: Admin pushes any change to repository
- **Purpose**: Creates Stripe objects and PDFs for new jobs
- **Flow**:
  1. Compare JSONs to catalog
  2. Create missing Stripe objects
  3. Generate PDFs using Google Docs API
  4. Update JSON files with artifacts
  5. Create/update manifest.json
  6. Build pages and deploy

**`.github/workflows/user-exit-events.yml`** - User Event Processing Workflow
- **Trigger**: Dispatched by `/api/track-event` or `/api/webhook`
- **Purpose**: Updates JSON files with user events and state changes
- **Flow**:
  1. Receive `job_id` and `payload_json` (array of events)
  2. Read JSON file: `assets/jobs/{job_id}.json`
  3. Process each event, update JSON:
     - Set timestamps in `state.client_status.*`
     - Update `contract.signatures.client.*`
     - Deactivate prices/products after payments
  4. Write JSON file
  5. Commit and push changes (with git rebase to prevent conflicts)

### Static Assets (`assets/`)

**`assets/jobs/uid-xxx-xxx.json`** - Job JSON Files (Source of Truth)
- One JSON file per freelance job
- Contains: customer, product, prices, state, docs, contract, invoice, balance data
- Updated by GitHub Actions workflows (never manually edited after creation)

**`assets/js/manifest.json`** - Login Lookup Manifest (Auto-Generated)
- Maps `login_name` + `login_keyword` → `job_id`
- Generated by `admin-push.yml` workflow
- Used by login form to find matching job

**`assets/pdf/contract/kon-xxx-xxx.pdf`** - Contract PDFs
- Generated by `admin-push.yml` workflow using Google Docs API
- One PDF per job

**`assets/pdf/invoice/inv-xxx-xxx.pdf`** - Invoice PDFs
- Generated by `admin-push.yml` workflow
- One PDF per job

**`assets/pdf/balance/bal-xxx-xxx.pdf`** - Balance PDFs
- Generated by `admin-push.yml` workflow
- One PDF per job (only for two-payment jobs)

**`assets/templates/kon-xxx-xxx.txt`** - PDF Template Placeholders
- Text files showing placeholder format for PDF generation
- Used as reference for understanding template structure

---

## User Flow & Job Lifecycle

### End-to-End Flow

```
ADMIN ADDS PROJECT JOB
  ↓
(01) New Job JSON uploaded → assets/jobs/uid-xxx-xxx.json
  ↓
(02) Admin pushes changes → Triggers admin-push.yml workflow
  ↓
(03) Stripe catalog objects created → Product, Prices, Coupon, Customer
  ↓
(04) Stripe object artifacts added back to JSON
  ↓
(05) Job contract, invoice, and balance PDFs produced → Google Docs API
  ↓
(06) PDF artifacts added to JSON
  ↓
(07) manifest.json updated → Maps login keywords to job_id
  ↓
PLATFORM READY FOR CLIENT
  ↓
(08) Client login → Enters lastName + keyword
  ↓
(09) Login Details Locate JSON → manifest.json lookup
  ↓
(10) JSON Populates Contract Dynamically → Fetches fresh JSON
  ↓
(11) User lands on Contract page → FluxGate routes to contract view
  ↓
(12) User Signs Contract → SignatureModal collects name, date, signature
  ↓
(13) Adds triggered event to collection → contract_signed event buffered
  ↓
(14) User lands on invoice PDF → Optimistic UI update shows invoice
  ↓
(15) User downloads docs or just acknowledges them → GateBar action
  ↓
(16) Adds triggered event to collection → invoice_acknowledged event buffered
  ↓
(17) Next page load starts with Stripe API call → /api/create-checkout-session
  ↓
(18) User lands on initialized Payment_1 checkout Stripe component → CheckoutForm
  ↓
(19) User makes successful payment → Stripe Payment Element confirms payment
  ↓
(20) Adds triggered event to collection → payment_1 event buffered
  ↓
(21) User lands on return_url for payment_1 → ?session_id=cs_xxx query param
  ↓
(22) Session status verified → /api/session-status endpoint
  ↓
(23) User leaves site and all events are written to JSON → 10min inactivity flush
  ↓
CLIENT COMPLETED FIRST PAYMENT, RETURNS LATER TO MAKE SECOND PAYMENT
  ↓
(24) User returns when notified to make final payment → Login again
  ↓
(25) Client login → Login Details Locate JSON
  ↓
(26) JSON referenced to see what state.client_status is next → FluxGate logic
  ↓
(27) User lands on balance PDF document → Routed to balance view
  ↓
(28) User downloads docs or just acknowledges them → GateBar action
  ↓
(29) Adds triggered event to collection → balance_acknowledged event buffered
  ↓
(30) Next page load starts with Stripe API call → /api/create-checkout-session (payment_2)
  ↓
(31) User lands on initialized Payment_2 checkout Stripe component → CheckoutForm
  ↓
(32) User makes successful payment → Stripe Payment Element confirms payment
  ↓
(33) Adds triggered event to collection → payment_2 event buffered
  ↓
(34) User lands on return_url for payment_2 → ?session_id=cs_xxx query param
  ↓
(35) User lands on final return URL type with links for final access to download any PDF → Completion2
  ↓
(36) User leaves site and all events are written to JSON → 10min inactivity flush
  ↓
(37) Workflow processes events → Updates JSON with all timestamps
  ↓
(38) Price deactivation → price1.active=false, price2.active=false, product.active=false
  ↓
(39) Next admin push → Archives Stripe product (active=false)
  ↓
(40) JSON file deleted → Job archived
  ↓
CLIENT COMPLETED PROJECT PAYMENTS AND FLOW
```

### Job Lifecycle States

1. **New Job Created**: JSON file added to `assets/jobs/`, admin pushes → Stripe objects created, PDFs generated
2. **Active Job**: Client can login, view documents, make payments
3. **Payment 1 Complete**: `price1.active=false`, client can return to make payment 2
4. **Payment 2 Complete**: `price2.active=false`, `product.active=false`, job ready for archival
5. **Archived**: Stripe product archived, JSON file deleted from directory

---

## Event Tracking System

### Collection Phase (Frontend)

**File**: `src/App.tsx`

Events are collected in an event buffer stored in `useRef` (not state - avoids re-renders):

```typescript
const eventBufferRef = useRef<Array<{type: string; timestamp: string; data: any}>>([]);
```

**Events Tracked**:
- `logged_in`: On initial JSON load (if timestamp null)
- `contract_signed`: On signature submission (includes `legal_name`, `signed_date`)
- `invoice_acknowledged`: On invoice acknowledge/continue
- `balance_acknowledged`: On balance acknowledge/continue
- `payment_1`: On payment 1 completion (from webhook or return URL)
- `payment_2`: On payment 2 completion (from webhook or return URL)

**Event Buffering**: Events accumulate during session, NOT sent immediately. Batched together for single API call.

### Flush Phase (Frontend → Backend)

**When Events Are Flushed**:
1. **10-minute inactivity** - Timer resets on user activity (mouse, keyboard, scroll, touch)
2. **Browser unload** - `beforeunload`, `pagehide`, `visibilitychange` events (uses `fetch` with `keepalive: true`)

**API Call** (`src/App.tsx` → `api/track-event.js`):
```typescript
POST /api/track-event
{
  job_id: "uid-xxx-xxx",
  event_type: "batch",
  event_data: [
    { type: "logged_in", timestamp: "...", data: {} },
    { type: "contract_signed", timestamp: "...", data: { legal_name: "...", signed_date: "..." } },
    { type: "invoice_acknowledged", timestamp: "...", data: {} }
  ]
}
```

### Processing Phase (Backend → GitHub Actions)

**File**: `api/track-event.js` (single workflow dispatcher)

1. **Receives batch** - Validates `job_id` and event array payload
2. **Dispatches workflow** - Calls GitHub Actions API:
   ```javascript
   POST /repos/{owner}/{repo}/actions/workflows/user-exit-events.yml/dispatches
   {
     inputs: {
       job_id: "uid-xxx-xxx",
       payload_json: JSON.stringify(eventsArray)
     }
   }
   ```

**File**: `.github/workflows/user-exit-events.yml` (single workflow entry)

1. **Workflow triggered** - Receives `job_id` and `payload_json`
2. **Sets environment variables**:
   - `JOB_ID` - Job ID from input
   - `PAYLOAD_JSON` - JSON string of events array
   - `STRIPE_SECRET_KEY` - For price deactivation
3. **Runs Python script** - `.github/scripts/orchestration/user_exit_events.py`

### Persistence Phase (GitHub Actions → JSON)

**File**: `.github/scripts/orchestration/user_exit_events.py`

1. **Reads JSON file** - `assets/jobs/{job_id}.json`
2. **Processes events** - Updates JSON based on event types:
   - `logged_in` → `state.client_status.logged_in = timestamp`
   - `contract_signed` → `state.client_status.contract_signed = timestamp` + `contract.signatures.client.legal_name` + `contract.signatures.client.signed_date`
   - `invoice_acknowledged` → `state.client_status.invoice = timestamp`
   - `payment_1` → `state.client_status.payment_1 = timestamp` + `price1.active = false`
   - `payment_2` → `state.client_status.payment_2 = timestamp` + `price2.active = false` + `product.active = false`
   - `balance_acknowledged` → `state.client_status.balance = timestamp`
3. **Writes JSON file** - Commits and pushes changes
4. **Git rebase** - Prevents merge conflicts (`git pull --rebase`)

---

## Payment Processing

### Stripe Checkout Flow

**Architecture**: Custom UI with Stripe Elements (not hosted checkout)

**Flow**:

1. User clicks "Continue to Checkout" button
2. `createCheckoutSession()` function called in `App.tsx`
3. POST to `/api/create-checkout-session` with `price_id`, `customer_id`, `coupon_id` (for payment_1)
4. API creates Stripe checkout session with `ui_mode: 'custom'`
5. API returns `client_secret` (required for Stripe Elements)
6. `App.tsx` stores `client_secret` in state
7. `CheckoutProvider` wraps `CheckoutForm` with `client_secret`
8. `CheckoutForm` renders `PaymentElement` (shows line items + payment form)
9. User enters card details and submits
10. `checkout.confirm()` called - card is charged
11. Stripe redirects to `return_url` with `?session_id={CHECKOUT_SESSION_ID}`
12. Frontend detects `session_id` query param
13. Fetches session status from `/api/session-status`
14. If `status === 'complete'`, optimistically update `client_status` (payment_1 or payment_2)
15. Track payment event and show next gate

### Return URL Handling

**Format**: `https://payments.august.style/${job_id}?session_id={CHECKOUT_SESSION_ID}`

**Process** (`src/App.tsx`):
1. Check for `session_id` query param on mount
2. Fetch session status from `/api/session-status`
3. Extract `payment_number` from `sessionData.metadata`
4. Update `client_status` optimistically:
   - If `payment_number === 1` → Set `payment_1` timestamp
   - If `payment_number === 2` → Set `payment_2` timestamp
5. Track payment event (`payment_1` or `payment_2`)
6. Clear query param to prevent reload loops
7. Route to appropriate completion view

### Webhook vs Session-Status Endpoint

**Webhook** (`api/webhook.js`):
- Server-side, reliable, handles async payments
- Logs completion for audit/debugging
- Does not dispatch workflow (events are persisted via frontend batch)

**Session-Status Endpoint** (`api/session-status.js`):
- Client-side, immediate feedback
- Shows status on return page
- Used for UI feedback only

**Both are needed**: Webhook ensures backend updates even if user closes browser. Session-status provides immediate UI feedback.

---

## PDF Generation & Display

### PDF Generation (Backend)

**Process** (`.github/scripts/orchestration/admin_push.py`):
1. Reads JSON file data
2. Uses Google Docs API with OAuth refresh token
3. Replaces placeholders in Google Docs template (e.g., `{{customer.name}}`, `{{price1.unit_amount}}`)
4. Exports as PDF
5. Saves to `assets/pdf/contract/`, `assets/pdf/invoice/`, `assets/pdf/balance/`
6. Updates JSON file with PDF metadata (url, id, sha256, created timestamp)

**Templates**: Google Docs templates stored in Google Drive, file IDs stored in environment variables

### PDF Display (Frontend)

**Component**: `src/components/PdfViewer.tsx`

**Technology**: `pdfjs-dist` (ESM) + Canvas API

**Features**:
- Multi-page rendering with vertical scrolling
- HiDPI display support (device pixel ratio)
- Signature overlay capability
- Client-side rendering (no server needed)

**Process**:
1. Fetches PDF from `/assets/pdf/{type}/{id}.pdf`
2. Loads PDF using `pdfjs-dist`
3. Renders each page to separate canvas element
4. Stacks canvases vertically for scrolling
5. Applies signature overlay when contract is signed

---

## GitHub Actions Workflows

### `admin-push.yml`

**Trigger**: Admin pushes any change to repository

**Purpose**: Creates Stripe objects and PDFs for new jobs

**Flow**:
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

### `user-exit-events.yml`

**Trigger**: Dispatched by `/api/track-event` only

**Purpose**: Updates JSON files with user events and state changes from a single batched payload

**Flow**:
1. Receive `job_id` and `payload_json` (array of events)
2. Read JSON file: `assets/jobs/{job_id}.json`
3. Process each event, update JSON:
   - Set timestamps in `state.client_status.*`
   - Update `contract.signatures.client.*` (legal_name, signed_date)
   - Deactivate prices/products after payments
4. Write JSON file
5. Commit and push changes (with git rebase to prevent conflicts)

**Concurrency**: `cancel-in-progress: false` (queues instead of cancels) - prevents multiple simultaneous runs

---

## Development Philosophy

### "Exclusively Executable Plan" Approach

**Core Principle**: Understand everything upfront, resolve unknowns before coding, create complete plan before execution.

**Why This Works**:
- AI can generate 20 files in minutes (old process would take days)
- But AI can also generate 20 WRONG files in minutes
- Planning prevents wrong files
- Planning is faster than debugging wrong code

**Process**:
1. Understand the full system
2. Plan every detail upfront
3. Identify unknowns and resolve them
4. Write complete, correct code
5. Test once, it works

**Benefits**:
- Front-load the thinking, back-load the execution
- Avoid debugging nightmare
- Write fresh code with confidence
- No "unknown unknowns" hiding in old code

### Planning vs Debugging

**Old Development Process** (Debugging-Heavy):
1. Write code
2. Test it
3. Find bugs
4. Fix bugs one by one
5. Repeat until it works
6. **Problem**: Each bug blocks testing, takes hours/days

**Modern AI-Assisted Process** (Planning-Heavy):
1. Understand the full system
2. Plan every detail upfront
3. Identify unknowns and resolve them
4. Write complete, correct code
5. Test once, it works
6. **Benefit**: Front-load the thinking, back-load the execution

### Rewriting vs Patching

**Previous Agent's Work**:
- ❌ Didn't understand Vercel until the end
- ❌ Converted to React without full understanding
- ❌ Made assumptions that were wrong
- ❌ Left broken code expecting us to fix it

**Our Approach**:
- ✅ Full understanding before coding
- ✅ Complete plan before execution
- ✅ Write fresh code with confidence
- ✅ Test after everything works

**Why This is Better**:
- If we need full understanding to fix bugs, we need it to write code anyway
- Writing fresh code is faster than debugging broken code
- We'll have confidence it's correct
- No "unknown unknowns" hiding in old code

---

## Setup & Configuration

### Environment Variables

**Vercel Dashboard → Project Settings → Environment Variables**:

- `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_test_` or `sk_live_`)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (starts with `pk_test_` or `pk_live_`)
- `GITHUB_TOKEN` - GitHub personal access token (for workflow dispatch)
- `GOOGLE_CREDENTIALS` - Google OAuth credentials JSON (for PDF generation)
- `GOOGLE_DRIVE_FOLDER_ID` - Google Drive folder ID (for PDF templates)

**Local Development** (`.env.local`):
- Copy `.example.env` to `.env.local`
- Add same variables as above

### Build Process

**Development**:
```bash
npm run dev
```
- Starts Vite dev server on `http://localhost:5173`
- Hot module replacement (HMR) for instant updates

**Production Build**:
```bash
npm run build
```
- Compiles TypeScript → JavaScript
- Bundles React components
- Outputs to `dist/` directory
- Vercel automatically deploys `dist/` directory

### Dependencies

**Key Packages**:
- `react` + `react-dom` - React framework
- `typescript` - Type safety
- `vite` - Build tool and dev server
- `@stripe/stripe-js` + `@stripe/react-stripe-js` - Stripe integration
- `pdfjs-dist` - PDF rendering
- `tailwindcss` - CSS framework
- `shadcn/ui` - UI component library

**Full list**: See `package.json`

---

## Common Tasks & Debugging

### Using `git smart-push`

Use `git smart-push` for local pushes. It stashes any local changes, rebases from remote, restores the stash, then pushes. If stash pop conflicts, resolve and rerun.

### Adding a New Job

1. **Create JSON file**: Copy `assets/docs/uid-xxx-xxx.json` template to `assets/jobs/uid-xxx-xxx.json`
2. **Fill out required fields**: See `assets/docs/GUIDE_uid-xxx-xxx.json.md` for schema guide
3. **Push to repository**: Admin pushes changes
4. **Workflow runs**: `admin-push.yml` creates Stripe objects and PDFs
5. **Verify**: Check Stripe dashboard, verify PDFs generated, check `manifest.json` updated

### Debugging Event Tracking

**Symptoms**: Events logged to console but not persisting in JSON

**Check**:
1. **Browser Console**: Look for `Event:` logs - confirms events are being collected
2. **Network Tab**: Look for POST to `/api/track-event` - confirms API calls
3. **Vercel Logs**: Check function logs for errors (CORS, module issues, etc.)
4. **GitHub Actions**: Check `user-exit-events.yml` workflow runs - confirms workflow triggered
5. **JSON File**: Check `assets/jobs/uid-xxx-xxx.json` for updated timestamps

**Common Issues**:
- **No API calls**: Check `flushEvents()` is being called (inactivity timer, unload)
- **CORS errors**: Check `api/track-event.js` CORS headers, verify `apiUrl()` points to Vercel backend
- **Workflow not running**: Check GitHub token, workflow file syntax, payload format
- **Events not batched**: Verify `event_type: 'batch'` and `event_data: [array]` in API call

### Debugging React Errors

**Symptoms**: "Minified React error #310" or "Hooks called conditionally"

**Check**:
1. **Hook Order**: All hooks must be called BEFORE any conditional returns
2. **Hook Count**: Same number of hooks must be called on every render
3. **Early Returns**: Move `useEffect`, `useCallback` hooks before `if` statements that return

**Common Issues**:
- **Early returns before hooks**: Move hooks to top of component
- **Conditional hook calls**: Use guards inside hooks, not conditional hook calls
- **Dependency arrays**: Ensure `useEffect`/`useCallback` dependencies are correct

### Debugging PDF Rendering

**Symptoms**: PDF not visible, pixelated, only one page shows

**Check**:
1. **Worker URL**: Verify `GlobalWorkerOptions.workerSrc` points to correct CDN URL
2. **Canvas Refs**: Ensure canvas elements are mounted before rendering
3. **Device Pixel Ratio**: Check HiDPI rendering with `devicePixelRatio`
4. **Multi-page**: Verify separate canvas for each page, `renderAllPages()` function

### Debugging Payment Flow

**Symptoms**: Blank screen after clicking "Continue", checkout form not loading

**Check**:
1. **React Errors**: Check console for hook order errors (#310)
2. **API Calls**: Verify `/api/create-checkout-session` succeeds
3. **Client Secret**: Check `clientSecret` state is set correctly
4. **Component Rendering**: Verify `PaymentView` → `CheckoutProvider` → `CheckoutForm` chain

### Debugging State Management

**Symptoms**: User sees wrong gate, state not updating

**Check**:
1. **JSON File**: Verify `state.client_status.*` timestamps in JSON
2. **Optimistic Updates**: Check if local state updates immediately (should)
3. **Event Tracking**: Verify events are being sent and processed
4. **Workflow Processing**: Check Python script updates JSON correctly

---

## Key Principles (Remember These)

1. **Always Fresh JSON**: Never cache job data. Always fetch from `/assets/jobs/${job_id}.json`
2. **Gate Logic**: Check `state.client_status` timestamps in order to determine current gate
3. **Optimistic UI**: Update state immediately, sync backend in background
4. **One Action Per Gate**: Each gate has exactly one primary action button
5. **Event Tracking**: Buffer events, flush after 10min inactivity or unload
6. **Smart Push**: Use `git smart-push` for local pushes (stash → rebase → restore → push)
7. **Type Safety**: Use TypeScript types everywhere, catch errors early
8. **Planning Over Debugging**: Understand before coding, plan before executing

---

## Related Documentation

- **Testing Logs**: `assets/docs/v5/v5_1_16/testing/LOG_01.md`, `LOG_02.md`
- **Bug Logs**: `assets/docs/v5/v5_1_16/testing/BUG_*.md`
- **Design Updates**: `assets/docs/v5/v5_2_0/DESIGN_UPDATES.md`
- **Email PDF Implementation**: `assets/docs/v5/v5_2_0/IMPL_EMAIL_PDFS.md`
- **Original Architecture**: `assets/docs/RESOURCES/OG_JSON_ARCH_PORTFOLIO.md`

---

_This document consolidates information from `AI_CONTEXT_PRIMER.md`, `CURRENT_STATE.md`, `PROJECT_OVERVIEW.md`, `NECESSARY_CONTEXT.md`, and `EXEC_PLAN_FINAL.md`, eliminating outdated information, updating what needs to be updated, and outputting it into a single comprehensive reference for future AI agents and developers working on this project._
