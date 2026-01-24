# Testing Log 06

## Logging Instructions for AI Agents

This log tracks bugs and fixes during v5 testing. Follow these conventions:

- **File Naming**: `LOG_XX.md` where XX is the log number (01, 02, etc.)
- **Bug Numbering**: `BUG_XX_YYY` where XX matches log number, YYY is sequential bug count across all v5 logs
- **Grouping**: Use larger headers (##) for test job file names to group related bugs
- **Content**: Keep entries concise - include user's essential details, expected behavior, actual behavior, and fixes implemented
- **Additional Details**: Log any relevant technical details, console errors, workflow runs, commit hashes, or related context

---

# Testing Log 06 - v5.6.0 Final Validation

**Created**: 2026-01-24  
**Last Updated**: 2026-01-24  
**Status**: Complete - All Tests Passed

**Focus**:

- Full end-to-end validation of event delivery and state management
- Simultaneous mobile and desktop testing
- Confirm all LOG_05 bug fixes are working in production

**Test Files**:

- `uid-fuk-259.json` — Keegan (rodent-fight-club) — Mobile
- `uid-pqu-327.json` — Elsworth (houseplant-boutique) — Desktop

---

## Test Results Summary

### All Events Validated Successfully

| Event             | Mobile | Desktop | Workflow   | JSON Updated |
|-------------------|--------|---------|------------|--------------|
| `logged_in`       | ✅     | ✅       | #149, #150 | ✅           |
| `contract_signed` | ✅     | ✅       | #151, #152 | ✅           |
| `invoice`         | ✅     | ✅       | #153, #154 | ✅           |
| `payment_1`       | ✅     | ✅       | #155, #156 | ✅           |
| `balance`         | ✅     | ✅       | #157, #158 | ✅           |
| `payment_2`       | ✅     | ✅       | #159, #160 | ✅           |

### Key Validations

1. **Single POST API call per event** — No duplicate workflow triggers
2. **Correct state routing** — Each login routed to correct page based on `client_status`
3. **GitHub Pages deployment** — `npm run build` runs after JSON commit, ensuring fresh data
4. **Mobile and Desktop parity** — Both platforms behave identically
5. **Simultaneous testing** — Two users can progress through flow at same time without conflicts

---

## Bug Closure Confirmations

### BUG_05_001 — Modal Jumps Off Screen (iOS Date Input) — CLOSED

**Original Issue**: Modal jumped off screen when focusing date input on iOS due to `vaul` drawer's `shouldScaleBackground={true}` default.

**Fix Applied**: Added `shouldScaleBackground={false}` to Drawer component in `SignatureModal.tsx`.

**Validation**: Mobile test (uid-fuk-259) successfully signed contract with date input working normally. No modal jumping observed.

---

### BUG_05_002 — Modal Jumps with Any Text Input (iOS) — CLOSED

**Original Issue**: Modal jumped with any text input on iOS due to `vaul` drawer's `repositionInputs={true}` default fighting with iOS keyboard handling.

**Fix Applied**: Added `repositionInputs={false}` to Drawer component in `SignatureModal.tsx`.

**Validation**: Mobile test (uid-fuk-259) successfully entered legal name and date without modal movement. Keyboard appeared normally.

---

### BUG_05_003 — Stale JSON After Event Processing — CLOSED

**Original Issue**: User saw old page state because Vercel deployed before GitHub Actions updated JSON. Race condition between deployment and workflow.

**Fix Applied**: Restructured `user-exit-events.yml` to mirror `admin-push.yml` with two-job structure:
1. `process-events` job: Updates JSON, commits, builds site, uploads artifact
2. `deploy` job: Deploys to GitHub Pages after process-events completes

**Validation**: All 12 workflow runs (6 events × 2 users) correctly updated JSON and deployed. Each subsequent login showed correct page state.

---

### BUG_05_004 — Invoice Event Not Sent (OPTIONS Without POST) — CLOSED

**Original Issue**: Only OPTIONS preflight observed, no POST. Page unloaded before preflight completed, preventing event delivery.

**Fix Applied**: 
- Modified `sendEvents` in `App.tsx` to use `navigator.sendBeacon` with `text/plain` content type for unload scenarios
- Updated `api/track-event.js` to parse JSON from `text/plain` body
- `text/plain` is a "simple" CORS content type, avoiding preflight entirely

**Validation**: Invoice event successfully sent on both mobile (#153) and desktop (#154). No preflight issues observed.

---

### BUG_05_005 — Duplicate Payment Event Triggers — CLOSED

**Original Issue**: `payment_1` event sent twice, triggering redundant workflow runs. First workflow processed it, second marked as "already processed".

**Fix Applied**:
- Added `sentEventsRef` (Set) to track events queued in current browser session
- Check `sentEventsRef` before adding any event to buffer
- Removed premature `trackEvent` call in `createCheckoutSession`

**Validation**: Both payment_1 (#155, #156) and payment_2 (#159, #160) events sent exactly once per user. No duplicate workflows.

---

### BUG_05_006 — Balance Event Not Sent (Desktop Only) — RESOLVED

**Original Issue**: Balance event not sent on desktop, but worked on mobile. Suspected browser-specific `sendBeacon` handling.

**Status**: Resolved in v5.6.0 testing. Desktop balance event (#158) sent successfully. Issue may have been related to VPN/network conditions during original testing, as user noted needing to enable VPN for desktop tests to work.

**Validation**: Desktop balance event (uid-pqu-327) successfully triggered workflow #158.

---

### BUG_05_007 — User Not Routed to Payment2 Despite Balance Timestamp — CLOSED

**Original Issue**: User with `balance` timestamp was routed to balance view instead of payment2 view. Routing logic checked `payment_1` without checking if `balance` was already done.

**Fix Applied**: Changed routing condition from `client_status.payment_1` to `client_status.payment_1 && !client_status.balance`:

```typescript
// Before (buggy):
else if (client_status.payment_1) {
  if (balanceAvailable) {
    initialSection = 'balance';  // Always showed balance!
  }
}

// After (fixed):
else if (client_status.payment_1 && !client_status.balance) {
  if (balanceAvailable) {
    initialSection = 'balance';  // Only if balance not yet acknowledged
  }
}
else if (client_status.balance && !client_status.payment_2) {
  initialSection = 'payment2';  // Now correctly reached
}
```

**Validation**: Both users correctly routed to payment2 after balance acknowledgment. Mobile (uid-fuk-259) and desktop (uid-pqu-327) both proceeded to payment2 checkout.

---

## Workflow Run Summary

| Run # | Job ID      | Event           | Timestamp                |
|-------|-------------|-----------------|--------------------------|
| #149  | uid-fuk-259 | logged_in       | 2026-01-24T12:34:21.271Z |
| #150  | uid-pqu-327 | logged_in       | 2026-01-24T12:48:24.511Z |
| #151  | uid-fuk-259 | contract_signed | 2026-01-24T13:02:38.076Z |
| #152  | uid-pqu-327 | contract_signed | 2026-01-24T13:02:38.076Z |
| #153  | uid-fuk-259 | invoice         | 2026-01-24T13:15:24.241Z |
| #154  | uid-pqu-327 | invoice         | 2026-01-24T13:20:15.546Z |
| #155  | uid-fuk-259 | payment_1       | 2026-01-24T13:26:09.457Z |
| #156  | uid-pqu-327 | payment_1       | 2026-01-24T13:31:53.790Z |
| #157  | uid-fuk-259 | balance         | 2026-01-24T13:36:36.065Z |
| #158  | uid-pqu-327 | balance         | 2026-01-24T13:39:50.041Z |
| #159  | uid-pqu-327 | payment_2       | 2026-01-24T13:43:49.264Z |
| #160  | uid-fuk-259 | payment_2       | 2026-01-24T13:46:27.833Z |

---

## Final State

### uid-fuk-259.json (Mobile)
- `state.client_status.logged_in`: ✅
- `state.client_status.contract_signed`: ✅
- `state.client_status.invoice`: ✅
- `state.client_status.payment_1`: ✅
- `state.client_status.balance`: ✅
- `state.client_status.payment_2`: ✅
- `price1.active`: false
- `price2.active`: false
- `product.active`: false

### uid-pqu-327.json (Desktop)
- `state.client_status.logged_in`: ✅
- `state.client_status.contract_signed`: ✅
- `state.client_status.invoice`: ✅
- `state.client_status.payment_1`: ✅
- `state.client_status.balance`: ✅
- `state.client_status.payment_2`: ✅
- `price1.active`: false
- `price2.active`: false
- `product.active`: false

---

## Conclusion

**v5.6.0 is production ready.** All event tracking, state management, and routing logic is working correctly. The platform successfully handles:

- Simultaneous users on different devices
- All 6 client status events tracked exactly once
- Correct page routing based on state
- GitHub Pages deployment after JSON updates
- Mobile and desktop parity

No bugs identified during v5.6.0 testing.
