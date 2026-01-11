# V5 Architecture: Current State & Handoff

**Date:** 2026-01-10
**Version:** V5.0.0 (React + Vite Pivot)

## 1. High-Level Summary
The application has been successfully migrated from a legacy Jekyll/Vanilla JS "patchwork" to a modern **React 18 + Vite + TypeScript** Single Page Application (SPA). This architecture (internally codenamed "Foggy Glass") prioritizes robustness, type safety, and a premium UI.

**Key Achievement:** The logic is no longer scattered across multiple conflicting JS controllers. It is centralized in a strict "FluxGate" router (`App.tsx`) that determines the user's state based on the JSON data.

## 2. Technical Stack
| Layer | Old V4 | **New V5** | status |
| :--- | :--- | :--- | :--- |
| **Framework** | Jekyll + Vanilla JS | **React 18 + Vite** | ✅ Implemented |
| **Language** | JavaScript (Loose) | **TypeScript (Strict)** | ✅ Implemented |
| **Styling** | Tailwind (CDN/Mix) | **Tailwind + shadcn/ui** | ✅ Implemented |
| **PDF Engine** | PDF.js (Global/CDN) | **react-pdf / pdfjs-dist (ESM)** | ✅ Implemented |
| **Routing** | File-based + 404 Hack | **React State Router ("FluxGate")** | ✅ Implemented |
| **Data Source** | JSON Files | JSON Files | Unchanged |
| **Hosting** | Vercel (Runtime) | Vercel (Runtime) + GH Pages (Static) | **Vercel Required** |

## 3. Core Components

### A. The "FluxGate" Router (`src/App.tsx`)
Instead of imperative "Instruction Manual" logic (e.g., "If button clicked, hide X, show Y"), the application uses **Declarative State Logic**:
1.  **Input**: Fetches `uid-xxx.json`.
2.  **Analysis**: Reads timestamps in `state.client_status`.
3.  **Output**: Renders the strictly correct view (Contract, Invoice, Checkout 1, Balance, Checkout 2, Completion).
4.  **Optimistic UI**: When an action is taken (Sign/Pay), the local state updates *immediately* to show the next step, while the backend processes the event in the background.

### B. PDF Viewer (`src/components/PdfViewer.tsx`)
A custom React component utilizing `pdfjs-dist`.
-   **Features**: Canvas rendering, "Pen" overlay for signatures, Date stamping.
-   **Performance**: Uses ESM workers for non-blocking rendering.

### C. Backend API (`api/`)
Serverless functions running on Vercel (Node.js).
-   `create-checkout-session.js`: **CRITICAL**. Generates Stripe Checkout Sessions on demand. Requires runtime execution (Node.js).
-   `track-event.js`: Buffers user events and pushes them to GitHub Actions.
-   `webhook.js`: Listens for Stripe payments and triggers GitHub Actions to update JSON.

## 4. Current Status

| Feature | Status | Notes |
| :--- | :--- | :--- |
| **Build System** | 🟢 Stable | `npm run build` runs cleanly. |
| **Login** | 🟢 Stable | Fetches Manifest & JSON correctly. |
| **Contract Flow** | 🟢 Stable | PDF renders, Signs, Optimistic update works. |
| **Invoice View** | 🟢 Stable | Transition from Contract to Invoice is smooth. |
| **Payment Button** | 🟢 Ready | Calls `/api/create-checkout-session`. **Requires Vercel Deployment to function.** |
| **Persistence** | 🟡 Partial | Event tracking logs to console. Requires Vercel to proxy to GitHub Actions. |

## 5. Deployment Note (CRITICAL)
The repository is connected to Vercel. **Ensure the Output Directory in Vercel is set to `dist`**.
-   The "Static" version on GitHub Pages is useful for previewing UI, but the **"Pay" button will only work on the Vercel deployment** because it requires the `/api` functions to run server-side.

---

## 6. Documentation Discrepancies
*Audit of `assets/docs/v5/PROJECT_OVERVIEW.md` vs Current Reality*

The `PROJECT_OVERVIEW.md` is largely accurate in *intent*, but the *implementation details* have changed:

1.  **"Controllers" are Dead**: The doc references `assets/js/*.js` (contract-controller, invoice-controller, etc.). **These are DEPRECATED.** Logic is now in `src/App.tsx` and React components.
2.  **Event Tracking**: The doc mentions `user-exit-events` logic. Use `src/App.tsx` (lines 34-80) as the source of truth for how inactivity works (buffering -> batch send).
3.  **Frontend Files**: References to `job.html` or `index.html` as templates are slightly misleading. Vite compiles everything into a single JS bundle that *injects* into these HTML files.
4.  **Flow Logic**: The "Five Step Gate" logic described in the overview is **exactly implemented** in `App.tsx`. Use the code in `App` as the definitive reference for the precise `if/else` logic of the gates.

## 7. Next Steps for AI Agent
1.  **Do not create new JS files in `assets/js`**. Work strictly in `src/`.
2.  **Respect the Vercel API**: If debugging payment, remember the code expects to hit `/api/...`.
3.  **Run Build**: Always run `npm run build` before verification to catch TypeScript errors.
