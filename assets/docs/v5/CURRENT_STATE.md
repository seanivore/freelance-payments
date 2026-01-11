# v5 Architecture's Current State for Handoff

**Date:** 2026-01-10
**Version:** v5.0.0 (React + Vite Pivot)

## 1. High-Level Summary

  The application has been migrated from legacy Jekyll/Vanilla JS "patchwork" build to a modern **React 18 + Vite + TypeScript** Single Page Application (SPA). This architecture, internally codenamed "Foggy Glass", prioritizes robustness, type safety, and a premium UI.

  **Key Achievement:** The logic is no longer scattered across multiple conflicting JS controllers. It is centralized in a strict "FluxGate" router (`App.tsx`) that determines the user's state based on the JSON data.

## 2. Technical Stack 

  **"✅ Implemented" does not mean that all testing and adjustments have been completed or even started**

| Layer           | Old V4                | **New V5**                           | Status              |
| --------------- | --------------------- | ------------------------------------ | ------------------- |
| **Framework**   | Jekyll + Vanilla JS   | **React 18 + Vite**                  | ✅ Implemented      |
| **Language**    | JavaScript (Loose)    | **TypeScript (Strict)**              | ✅ Implemented      |
| **Styling**     | Tailwind (CDN/Mix)    | **Tailwind + shadcn/ui**             | ✅ Implemented      |
| **PDF Engine**  | iFrame                | **react-pdf / pdfjs-dist (ESM)**     | ✅ Implemented      |
| **Routing**     | File-based + 404 Hack | **React State Router ("FluxGate")**  | ✅ Implemented      |
| **Data Source** | JSON Files            | JSON Files                           | Unchanged           |
| **Hosting**     | Vercel (Runtime)      | Vercel (Runtime) + GH Pages (Static) | Unchanged           |

## 3. Core Components

### A. The "FluxGate" Router (`src/App.tsx`)

Instead of imperative "Instruction Manual" logic (e.g., "If button clicked, hide X, show Y"), the application uses **Declarative State Logic**

  1.  **Input**: Fetches `uid-xxx.json`.
  2.  **Analysis**: Reads timestamps in `state.client_status`.
  3.  **Output**: Renders the strictly correct view (Contract, Invoice, Checkout 1, Balance, Checkout 2, Completion).
  4.  **Optimistic UI**: When an action is taken (Sign/Pay), the local state updates *immediately* to show the next step, while the backend processes the event in the background.

### B. PDF Viewer (`src/components/PdfViewer.tsx`)

A custom React component utilizing `pdfjs-dist`

  * **Features**: Canvas rendering, "Pen" overlay for signatures, Date stamping.
  * **Performance**: Uses ESM workers for non-blocking rendering 

### C. Backend API (`api/`)

Serverless functions running on Vercel (Node.js) 

  + `create-checkout-session.js` 
    - **CRITICAL WORKFLOW NOT CONFIRMED** 
    - Generates Stripe Checkout Sessions on demand 
    - Requires runtime execution (Node.js).
  + `track-event.js` 
    - Buffers user events 
    - Pushes them to GitHub Actions 
  + `webhook.js` 
    - Listens for Stripe payments 
    - Triggers GitHub Actions to update JSON 

## 4. Current Status 

  + AI added the status far more optimistically that seemed realistic so I adjusted them 
  + We have yet to push a new JSON job to confirm that the Stripe Objects and PDF creation flow are still functional 

| Feature            | Status      | Notes                                                                      |
| ------------------ | ----------- | --------------------------------------------------------------------------- |
| **Build System**   | 🟢 Stable   | `npm run build` runs cleanly                                                |
| **Login**          | 🟢 Stable   | Fetches JSON from Manifest correctly                                        |
| **Contract Flow**  | 🟡 Partial  | PDF render ❌, Signs Pen only ❌, Optimistic update only ❌                  |
| **Invoice View**   | 🔴 Untested | Transition from Contract to Invoice is smooth                               |
| **Payment Button** | 🔴 Untested | Calls `/api/create-checkout-session`. **MUST DISCUSS**                      |
| **Persistence**    | 🔴 Untested | Event tracking logs to console, requiring Vercel to proxy to GitHub Actions |

## 5. Deployment Note (AI felt this was CRITICAL; requires discussion)

  + The repository is still connected to Vercel 

  **Ensure the Output Directory in Vercel is set to `dist`** --> (Sean unsure what this even means)

  + The "Static" version on GitHub Pages is useful for previewing UI, but the **"Pay" button will only work on the Vercel deployment** because it requires the `/api` functions to run server-side 
    - AI was really stuck on this concept and it seems potentially flawed 
    - The Pay button is essentially a next button like normal 
    - Then actual page load would trigger checkout session initialization 
    - It seems no different than Stripe Object creations 

  + Stripe has this page `https://docs.stripe.com/payments/quickstart-checkout-sessions` 
    - I want to go through it step by step with AI 
    - AI helps and updates code it generates that I copy over 
    - This should create a fairly fool proof checkout session build 


## 6. Documentation Discrepancies
*Audit of `assets/docs/v5/PROJECT_OVERVIEW.md` vs Current Reality*

  + The `PROJECT_OVERVIEW.md` is largely accurate in *intent*, but the *implementation details* have changed:

    1. **"Controllers" are Dead**: The doc references `assets/js/*.js` (contract-controller, invoice-controller, etc.). **These are DEPRECATED.** Logic is now in `src/App.tsx` and React components 
    2. **Event Tracking**: The doc mentions `user-exit-events` logic. Use `src/App.tsx` (lines 34-80) as the source of truth for how inactivity works (buffering -> batch send) 
    3. **Frontend Files**: References to `job.html` or `index.html` as templates are slightly misleading. Vite compiles everything into a single JS bundle that *injects* into these HTML files
    4. **Flow Logic**: The "Five Step Gate" logic described in the overview is **exactly implemented** in `App.tsx`. Use the code in `App` as the definitive reference for the precise `if/else` logic of the gates.

## 7. Next Steps for AI Agent

  1. **Do not create new JS files in `assets/js`**. Work strictly in `src/`.
  2. **Respect the Vercel API**: If debugging payment, remember the code expects to hit `/api/...`.
  3. **Run Build**: Always run `npm run build` before verification to catch TypeScript errors.

---
