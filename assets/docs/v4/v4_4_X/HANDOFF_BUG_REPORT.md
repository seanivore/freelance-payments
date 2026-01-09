# Handoff Bug Report & Status: v4.4.0 Refactor

**Date**: 2026-01-09
**Topic**: Balance Invoice Generation & "clean slate" Architecture

## Current Status
We have just completed a major refactor to eliminate the ambiguous "Invoice 1 / Invoice 2" logic. The system now strictly uses:
*   **Contract** (`kon-xxx`)
*   **Invoice** (`inv-xxx`)
*   **Balance** (`bal-xxx`)

### 1. The Architecture
*   **Backend (`admin_push.py`)**: Now has explicit blocks to generate Contract, Invoice, and Balance PDFs. NO LOOPS.
*   **Schema**: `invoice` and `balance` keys in `docs` and `client_status`.
*   **Frontend**: `payment-router.js` (FluxGate) enforces a 6-step linear flow: Contract -> Invoice -> Pay 1 -> Balance -> Pay 2 -> Complete.

### 2. The Bug / Blockers
*   **Balance PDF Generation**: We failed to generate the `bal-xxx.pdf` on the last run (`uid-yak-909`).
    *   **Root Cause**: The script was looking for `GOOGLE_TEMPLATE_INVOICE_BALANCE_ID` (legacy name), but the environment Variable provided/confirmed by user is `GOOGLE_TEMPLATE_BALANCE_ID`.
    *   **Fix Applied**: `admin_push.py` was updated to check `GOOGLE_TEMPLATE_BALANCE_ID` first. This **should** work on the next run, but has not been verified yet.
*   **Google Auth**: User had to regenerate the Refresh Token. New token logic is confirmed correct (Web App flow), but needs to be tested in the wild.

### 3. Verification Needed
The next developer (or fresh eyes) needs to:
1.  **Push `uid-zoo-101.json`**: This is a clean slate job.
2.  **Monitor Action**: Ensure `Generating Balance Invoice...` appears in logs and does NOT show "Skipping... Missing Template ID".
3.  **Verify PDF**: Check that `assets/pdf/balance/bal-zoo-101.pdf` is created.
4.  **Frontend Test**: Go through the flow.
    *   Sign Contract.
    *   View Invoice.
    *   Pay 1 (Use Stripe Test Card).
    *   **CRITICAL**: Verify the UI transitions to "Balance Invoice" view.
    *   Pay 2.
    *   Verify Completion Page has 3 download links.

### 4. Relevant Files
*   `.github/scripts/orchestration/admin_push.py`: PDF Generation logic.
*   `assets/js/payment-router.js`: Frontend routing logic.
*   `assets/docs/v4/v4_4_0_clean_slate/_job_schema_v4.jsonc`: The Truth.

## Quote
"Yak shaving is complete. Time to shear." - AI 2026
