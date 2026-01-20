# Current State - Architecture Overview

**Last Updated**: 2026-01-15  
**Version**: v5.0.0 (React + Vite + TypeScript)

---

## Executive Summary

A freelance payment collection micro-site (`payments.august.style`) built with React 18 + Vite + TypeScript. The system automates contract generation, invoice creation, payment processing, and document management using JSON files as the data source (no database).

**Key Architecture**: Hybrid hosting - Static frontend (GitHub Pages/Vercel) + Runtime backend (Vercel serverless functions). Uses 404-redirect trick for SPA routing on static hosts.

---

## How Files Fit Together

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    JSON FILES (Source of Truth)              │
│              assets/jobs/uid-xxx-xxx.json                    │
│  Contains: customer, product, prices, state, docs          │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (React Components)                      │
│                    src/App.tsx                               │
│  - Fetches JSON via fetchJobData()                          │
│  - Determines which component to show (FluxGate logic)       │
│  - Collects events in buffer (eventBufferRef)                │
│  - Flushes events to API when needed                         │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API (Vercel Functions)                  │
│  - /api/create-checkout-session.js → Creates Stripe session │
│  - /api/track-event.js → Receives events, dispatches workflow│
│  - /api/webhook.js → Receives Stripe events, dispatches workflow│
│  - /api/session-status.js → Returns checkout session status │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│           GITHUB ACTIONS (Automation)                        │
│  - admin-push.yml → Creates Stripe objects, PDFs           │
│  - user-exit-events.yml → Updates JSON with event data      │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                    JSON FILES (Updated)                      │
│  - state.client_status.* timestamps updated                  │
│  - contract.signatures.client.* updated                      │
│  - price1.active, price2.active, product.active updated      │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App.tsx (Main Router/State Machine)
├── ContractView
│   └── PdfLoader
│       └── PdfViewer
│           └── SignatureModal (when signing)
├── InvoiceView
│   ├── PdfLoader
│   └── GateBar (download docs, continue)
├── BalanceView
│   ├── PdfLoader
│   └── GateBar
├── PaymentView
│   └── CheckoutProvider (Stripe)
│       └── CheckoutForm
│           └── PaymentElement (Stripe)
├── CompletionView
└── Complete (return URL handler)
```

---

## Event Tracking Flow

### Collection Phase (Frontend)

**File**: `src/App.tsx`

1. **Event Collection**: Events collected via `trackEvent()` function
   - Events pushed to `eventBufferRef.current` (useRef, not state)
   - Events: `logged_in`, `contract_signed`, `invoice_acknowledged`, `balance_acknowledged`, `payment_1`, `payment_2`

2. **Inactivity Timer**: 10-minute timer resets on user activity
   - Activity events: `mousedown`, `keydown`, `scroll`, `touchstart`
   - Timer stored in `timerRef.current`

3. **Event Buffering**: Events accumulate during session
   - NOT sent immediately
   - Batched together for single API call

### Flush Phase (Frontend → Backend)

**When Events Are Flushed**:
1. **10-minute inactivity** - Timer expires, calls `flushEvents()`
2. **Payment completion** - Immediate flush via `flushOnPayment()` callback
3. **Browser unload** - `beforeunload`, `pagehide`, `visibilitychange` events

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

**File**: `api/track-event.js`

1. **Receives batch** - Validates `job_id`, `event_type`, `event_data`
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

**File**: `.github/workflows/user-exit-events.yml`

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

## State Management (FluxGate Pattern)

**File**: `src/App.tsx`

The "FluxGate" is a state-based router that determines which component to show based on `state.client_status` timestamps in the JSON file.

### Gate Logic

```typescript
// Determine initial section based on state.client_status timestamps
if (client_status.contract_signed) {
  initialSection = 'invoice';
}
if (client_status.invoice) {
  initialSection = 'payment1';
}
if (client_status.payment_1) {
  initialSection = 'balance';
}
if (client_status.balance) {
  initialSection = 'payment2';
}
if (client_status.payment_2) {
  initialSection = 'completion2';
}
```

### Optimistic Updates

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

## API Endpoints

### `/api/create-checkout-session` (POST)

**Purpose**: Creates Stripe Checkout Session on-demand

**When Called**: User clicks "Continue" on InvoiceView or BalanceView

**Request**:
```json
{
  "job_id": "uid-xxx-xxx",
  "price_id": "price_xxx",
  "customer_id": "cus_xxx",
  "coupon_id": "cou_xxx",  // Only for payment_1
  "payment_number": 1
}
```

**Response**:
```json
{
  "client_secret": "cs_test_xxx_secret_yyy"
}
```

**What Happens**: 
- Creates Stripe checkout session with `ui_mode: 'custom'`
- Returns `client_secret` for Stripe Elements
- Frontend stores `client_secret` in state, renders `CheckoutForm`

### `/api/track-event` (POST)

**Purpose**: Receives batched events, dispatches GitHub Actions workflow

**When Called**: When events are flushed (inactivity, payment, unload)

**Request**:
```json
{
  "job_id": "uid-xxx-xxx",
  "event_type": "batch",
  "event_data": [
    { "type": "logged_in", "timestamp": "...", "data": {} },
    { "type": "contract_signed", "timestamp": "...", "data": { "legal_name": "...", "signed_date": "..." } }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Event tracked and queued for processing"
}
```

**What Happens**:
- Validates events
- Dispatches `user-exit-events.yml` workflow with events payload
- Workflow processes events and updates JSON

### `/api/webhook` (POST)

**Purpose**: Receives Stripe webhook events (payment completion)

**When Called**: Stripe sends webhook when payment completes

**Request**: Stripe webhook payload (signed)

**What Happens**:
- Verifies webhook signature
- Dispatches `user-exit-events.yml` workflow with payment event
- Workflow updates JSON with payment timestamp and deactivates prices

### `/api/session-status` (GET)

**Purpose**: Returns Stripe checkout session status

**When Called**: User returns from Stripe payment (return URL)

**Request**: `?session_id=cs_test_xxx`

**Response**:
```json
{
  "status": "complete",
  "payment_status": "paid",
  "amount_total": 30000
}
```

**What Happens**: Used by `Complete` component to verify payment and show success message

---

## Workflow System

### `admin-push.yml`

**Trigger**: Admin pushes any change to repository

**Purpose**: Creates Stripe objects and PDFs for new jobs

**Flow**:
1. Compare JSON files to Stripe catalog
2. Create missing Stripe objects (product, prices, coupon, customer)
3. Generate PDFs (contract, invoice, balance) using Google Docs API
4. Update JSON files with Stripe IDs and PDF metadata
5. Commit and push changes

**Files Used**:
- `.github/scripts/orchestration/admin_push.py`
- Google OAuth credentials (for Docs API)

### `user-exit-events.yml`

**Trigger**: Dispatched by `/api/track-event` or `/api/webhook`

**Purpose**: Updates JSON files with user events and state changes

**Flow**:
1. Receive `job_id` and `payload_json` (array of events)
2. Read JSON file: `assets/jobs/{job_id}.json`
3. Process each event, update JSON:
   - Set timestamps in `state.client_status.*`
   - Update `contract.signatures.client.*` (legal_name, signed_date)
   - Deactivate prices/products after payments
4. Write JSON file
5. Commit and push changes (with git rebase to prevent conflicts)

**Files Used**:
- `.github/scripts/orchestration/user_exit_events.py`
- Stripe secret key (for price deactivation)

---

## Common Tasks

### Adding a New Feature

1. **Understand data flow**: Where does data come from? Where does it go?
2. **Identify files**: Which components, APIs, workflows are involved?
3. **Update types**: Modify `JobData` type in `src/lib/data.ts` if needed
4. **Implement**: Write code following existing patterns
5. **Test**: Verify end-to-end flow works
6. **Document**: Update relevant docs

### Debugging Event Tracking

1. **Check console**: Look for `Event:` logs
2. **Check network**: Look for POST to `/api/track-event`
3. **Check Vercel logs**: Function errors, CORS issues
4. **Check GitHub Actions**: Workflow runs, Python script output
5. **Check JSON**: Verify timestamps updated correctly

### Debugging React Errors

1. **Hook order errors (#310)**: Move hooks before early returns
2. **Type errors**: Check TypeScript types match JSON schema
3. **Rendering issues**: Check component hierarchy, state updates
4. **API errors**: Verify `apiUrl()` points to Vercel backend

### Testing Payment Flow

1. **Create test job**: Use `assets/docs/uid-xxx-xxx.json` template
2. **Push to trigger admin-push**: Creates Stripe objects and PDFs
3. **Login**: Use login keywords from JSON
4. **Complete flow**: Sign contract, acknowledge invoice, make payment
5. **Verify JSON**: Check `state.client_status.*` timestamps updated
6. **Verify Stripe**: Check dashboard for session, payment

---

## Key Concepts

### React States vs JSON State

- **React States**: Temporary, in-memory (lost on page reload)
  - `const [data, setData] = useState<JobData>(...)` - Current job data
  - `const [clientSecret, setClientSecret] = useState(null)` - Stripe session
- **JSON State**: Permanent, persisted (survives page reloads)
  - `state.client_status.logged_in` - Timestamp when user logged in
  - `state.client_status.contract_signed` - Timestamp when contract signed

React states drive the UI, JSON state drives the routing logic.

### Event Buffering

Events are NOT sent immediately. They're collected in a buffer (`eventBufferRef`) and sent as a single batch when:
- User becomes inactive (10 minutes)
- Payment completes
- Browser closes

This prevents multiple workflow runs and merge conflicts.

### Optimistic Updates

UI updates immediately when user takes action, before backend confirms. This provides instant feedback while backend processes in background.

### 404-Redirect Routing

Static hosts (GitHub Pages) can't handle dynamic routes. Solution: All routes serve `404.html`, which loads React app. React reads URL and shows correct component.

---

## File Locations Reference

**Frontend Source**: `src/`
- Main router: `src/App.tsx`
- Components: `src/components/`
- Utilities: `src/lib/`

**Backend APIs**: `api/`
- Checkout: `api/create-checkout-session.js`
- Events: `api/track-event.js`
- Webhook: `api/webhook.js`
- Session status: `api/session-status.js`

**Automation**: `.github/`
- Workflows: `.github/workflows/`
- Scripts: `.github/scripts/orchestration/`

**Data**: `assets/`
- Jobs: `assets/jobs/uid-xxx-xxx.json`
- PDFs: `assets/pdf/contract/`, `assets/pdf/invoice/`, `assets/pdf/balance/`
- Manifest: `assets/js/manifest.json`

**Build Output**: `dist/` (generated, don't edit)

---

## For Visual Design Work

If you're working on visual design:
- **Styling**: Tailwind CSS classes in component files
- **Components**: `src/components/` - Each component is self-contained
- **UI Library**: shadcn/ui components in `src/components/ui/`
- **PDF Viewer**: `src/components/PdfViewer.tsx` - Canvas rendering, signature overlay
- **Gate Components**: `InvoiceView.tsx`, `BalanceView.tsx`, `ContractView.tsx` - PDF display + action buttons

---

## For Feature Implementation

If you're implementing features:
- **State Management**: `src/App.tsx` - FluxGate router logic
- **Event Tracking**: `src/App.tsx` - Event buffering and flushing
- **API Integration**: `src/lib/api.ts` - API base URL configuration
- **Data Types**: `src/lib/data.ts` - `JobData` type definition
- **Backend**: `api/*.js` - Vercel serverless functions

---

## For Debugging

If you're debugging:
- **Console logs**: Look for `Event:` logs, React errors
- **Network tab**: Check API calls to `/api/*` endpoints
- **Vercel logs**: Function execution logs, errors
- **GitHub Actions**: Workflow runs, Python script output
- **JSON files**: Verify `state.client_status.*` timestamps

---

_This document provides a high-level overview. For detailed implementation details, see `EXEC_PLAN_FINAL.md`. For component-specific details, see `AI_CONTEXT_PRIMER.md`._
