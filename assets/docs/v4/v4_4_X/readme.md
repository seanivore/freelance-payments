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
