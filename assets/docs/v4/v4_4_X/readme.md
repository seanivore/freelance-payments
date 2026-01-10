# v4.4.X - Post-Consolidation fixes

This directory contains documentation for bug fixes, tweaks, and iterations following the major "State Management Refactor" and "Workflow Consolidation" of v4.4.0.

## Current State (v4.4.0)

- **State Management**: Simplified to `client_status` (ISO timestamps only).
- **Routing**: `FluxGate` (strict linear flow: Contract -> Invoice -> Payment -> Completion).
- **Workflows**: Consolidated into:
    - `admin-push.yml` (Content/PDFs)
    - `user-behavior.yml` (Events AND Payments)
- **APIs**:
    - `api/webhook.js` -> Triggers `user-behavior.yml` (Action: `update-payment`)
    - `api/track-event.js` -> Triggers `user-behavior.yml` (Action: `track-event`)
    - `api/sign-contract.js` -> Triggers `user-behavior.yml` (Action: `sign-contract`)

## Known To-Dos / Watchlist

- [ ] **PDF Generation**: Verify two invoice generation logic in `admin_push.py` (referenced in feedback).
- [ ] **Currency Math**: Verify `price1.unit_amount` includes discount logic in `admin_push.py` or manual entry.
- [ ] **Date Formatting**: Verify contract signature dates are formatted correctly.

---

# State Refactoring & Workflow Consolidation (v4.4.0)

## Objective
Simplify the project's state management, consolidate backend workflows, and ensure a strict, sequential user experience ("FluxGate").

## Key Changes

### 1. Unified State Management (`client_status`)
- **Change**: Transitioned from boolean flags and redundant event types to strictly **ISO Timestamps** in `client_status`.
- **New Structure**:
  ```json
  "client_status": {
      "logged_in": "ISO-TIMESTAMP",
      "contract_signed": "ISO-TIMESTAMP",
      "invoice": "ISO-TIMESTAMP",
      "payment_1": "ISO-TIMESTAMP",
      "balance": "ISO-TIMESTAMP",
      "payment_2": "ISO-TIMESTAMP"
  }
  ```
- **Removed**: `state.payment_1` and `state.payment_2` usage in backend scripts.
- **Removed**: Redundant boolean flags (`viewed_invoice`, `contract_viewed`, etc.).

### 2. Consolidated Workflows
- **Merged**: Logic from `payments.py` into `user_behavior.py`.
- **Deleted**: `payments.py` and `.github/workflows/payment.yml`.
- **Updated**: `api/webhook.js` now triggers `user-behavior.yml` with `action: update-payment`.
- **Benefit**: Single "Event Handler" for all user actions (Behavior + Payments).

### 3. "FluxGate" Frontend Routing
- **New Architecture**: `PaymentRouter` (aka FluxGate) determines user location strictly based on the presence of timestamps in `client_status`.
- **Flow**: Contract -> Invoice (Payment 1) -> Invoice (Payment 2) -> Completion.
- **UI**: Hidden redundant navigation bar to enforce the gated flow.

### 4. Git Smart Push 2.0
- **Enhancement**: Updated `.gitconfig-smart-push.sh` to automatically resolve conflicts for `manifest.json`, PDF files, and Jobs by prioritizing the **REMOTE** version.

## Verification
- **Test File**: `assets/docs/v4/v4_4_X/uid-tst-005.json` prepared as a "Clean Slate" test.
- **Next Steps**: Move `uid-tst-005.json` to `assets/jobs/` to begin Test 005.

## Documentation
- Created `assets/docs/v4/v4_4_X/readme.md` to track v4.4.X iterations.