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

## Conclusion (Initial Testing)

**v5.6.0 initial testing passed.** All event tracking, state management, and routing logic worked correctly in controlled step-by-step testing.

---

# External User Testing - 2026-01-25

**Test Files**:
- `uid-awi-104.json` — Markham (simple-gardener) — External tester
- `uid-ugz-557.json` — Kelvin (tokenized-social-media) — Self-test

---

## BUG_06_001 — Missing `contract_signed` and `invoice` Events (Markham)

**Reported**: 2026-01-25  
**Status**: Under Investigation

**Observed Behavior**:
- User went through entire payment_1 flow (contract → invoice → payment)
- First API call contained only `logged_in` event
- Second API call contained only `payment_1` event
- `contract_signed` and `invoice` events were **never sent**

**JSON State After Test**:
```json
"client_status": {
  "logged_in": "2026-01-25T19:06:05.259Z",
  "contract_signed": null,  // MISSING
  "invoice": null,          // MISSING
  "payment_1": "2026-01-25T19:10:14.171Z",
  "balance": "2026-01-25T19:25:59.749Z",
  "payment_2": "2026-01-25T19:26:42.385Z"
}
```

**User Notes**: 
- User noted no exit button on Completion1 page
- User pressed back button multiple times trying to exit

**Analysis**:
The events were likely buffered but lost due to one of these scenarios:
1. **Back navigation cleared buffer**: When user pressed back multiple times, React re-rendered and the `eventBufferRef` may have been reset
2. **Stripe redirect timing**: The redirect to Stripe checkout may have occurred before the buffer was flushed
3. **Session storage dedup false positive**: The `shouldSkipFlush` hash check may have incorrectly skipped the flush

**Root Cause Hypothesis**:
The `payment_1` event is tracked on Stripe return and immediately triggers a flush via `sendBeacon`. However, the earlier events (`contract_signed`, `invoice`) were still in the buffer waiting for inactivity timeout. The Stripe redirect (page unload) should have flushed them, but something prevented this.

---

## BUG_06_002 — Split API Calls for payment_2 Flow (Expected Behavior)

**Reported**: 2026-01-25  
**Status**: EXPECTED BEHAVIOR - NOT A BUG

**Observed Behavior**:
- First API call: `balance` event
- Second API call: `payment_2` event

**Analysis**:
This is **correct and expected** behavior for security:
- `balance` event flushes when user exits the balance page (navigates to Stripe)
- `payment_2` event flushes when user returns from Stripe with successful payment

**Why This Is Correct**:
Payment events must be tracked **after** successful Stripe confirmation, not before. If we batched them together, a user could trigger the payment event without actually completing payment.

---

## BUG_06_003 — Split API Calls for payment_1 Flow (Partial Expected Behavior)

**Reported**: 2026-01-25  
**Status**: PARTIALLY EXPECTED

**Observed Behavior** (Kelvin test):
- First API call: 3 events (`logged_in`, `contract_signed`, `invoice`)
- Second API call: 1 event (`payment_1`)

**Analysis**:
- The first batch is correct - all pre-payment events flushed together on Stripe redirect
- The second batch (`payment_1`) is correct - tracked after Stripe return

**Note**: This is the expected behavior. BUG_06_001 (Markham) shows what happens when the first batch fails to send.

---

## BUG_06_004 — Split API Calls for payment_2 Flow (Duplicate of BUG_06_002)

**Status**: EXPECTED BEHAVIOR - Same as BUG_06_002

---

## UX Issue — No Exit Button on Completion Pages

**Reported**: 2026-01-25  
**Status**: FIXED

**Issue**: Users had no clear way to exit after completing payment. This led to back-button navigation which may have contributed to event loss.

**Fix Applied**: Added "Close This Window" button to both `CompletionView` completion1 and completion2 sections.

```typescript
// Added to CompletionView.tsx
<button
  onClick={() => window.close()}
  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-portfolio-accent-mauve/20 hover:bg-portfolio-accent-mauve/30 text-portfolio-text-primary rounded-lg transition-colors border border-portfolio-accent-mauve/30"
>
  <X className="w-5 h-5 text-portfolio-accent-mauve" />
  Close This Window
</button>
```

---

## Summary of Findings

### Expected Behavior (Document for Users)
- **Payment events always send separately**: `payment_1` and `payment_2` events are tracked on Stripe return and flush immediately. This is by design for payment security.
- **Pre-payment events batch together**: `logged_in`, `contract_signed`, `invoice` should all flush together when user navigates to Stripe checkout.
- **Balance event sends separately**: `balance` flushes when navigating to payment_2 checkout.

### Actual Bug to Investigate
- **BUG_06_001**: Why did `contract_signed` and `invoice` events fail to send for Markham but worked for Kelvin?
  - Both users went through the same flow
  - Kelvin's events batched correctly (3 events in first call)
  - Markham's events were lost (only `logged_in` in first call)

### Potential Causes for BUG_06_001
1. **Browser differences**: Different browsers handle `sendBeacon` differently
2. **Network timing**: Slow network may have caused beacon to fail silently
3. **Back button behavior**: Pressing back multiple times may have caused state issues
4. **Session storage collision**: The dedup hash may have incorrectly matched

### Next Steps
1. ✅ Add exit buttons to completion pages (UX improvement)
2. ✅ Persist event buffer to sessionStorage (survives back-button navigation)
3. Test with network throttling to see if timing affects delivery

---

## FIX: Persist Event Buffer to sessionStorage

**Applied**: 2026-01-25

**Problem**: The `eventBufferRef` was an in-memory React ref that reset when the component remounted (e.g., on back-button navigation). Events buffered before navigation were lost.

**Solution**: Persist the event buffer and sent-events set to `sessionStorage`:

```typescript
// Initialize from sessionStorage (survives back navigation)
const getPersistedBuffer = (): Array<{type: string; timestamp: string; data: any}> => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY_BUFFER);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Persist after each event is added
const persistBuffer = useCallback(() => {
  try {
    sessionStorage.setItem(STORAGE_KEY_BUFFER, JSON.stringify(eventBufferRef.current));
  } catch {
    // sessionStorage may be full or unavailable
  }
}, []);
```

**Changes Made**:
1. Added `getPersistedBuffer()` and `getPersistedSentEvents()` to initialize refs from sessionStorage
2. Added `persistBuffer()` and `persistSentEvents()` to save state after changes
3. Call `persistBuffer()` after adding events in `trackEvent()`
4. Call `persistBuffer()` after clearing buffer in `flushEvents()` and `handleUnload()`
5. Clear `STORAGE_KEY_BUFFER` from sessionStorage in `handleUnload()` after sending

**Why This Works**:
- `sessionStorage` persists across same-tab navigation (including back button)
- `sessionStorage` is cleared when the tab closes (so events don't accumulate across sessions)
- Events are now recovered even if user navigates away and back

---

## FIX: Payment Events Sent Immediately (Not Buffered)

**Applied**: 2026-01-25

**Problem**: Payment events (`payment_1`, `payment_2`) were being added to the buffer like other events. This meant:
1. They could get mixed with other events in the same flush
2. If user closed tab immediately after payment, the event might not be sent
3. Could cause "duplicate payment" workflow issues if payment event was in buffer AND triggered separately

**Solution**: Payment events are now sent **immediately** via `fetch()` on Stripe return, completely bypassing the buffer:

```typescript
// In the session status handler:
if (paymentType && Object.keys(updates).length > 0) {
  // Mark as sent to prevent duplicates
  sentEventsRef.current.add(paymentType);
  persistSentEvents();
  
  // Send immediately via fetch (not beacon, not buffered)
  const paymentEvent = {
    type: paymentType,
    timestamp: new Date().toISOString(),
    data: { payment_number: ..., session_id: ... }
  };
  
  // Fire and forget - don't await, don't block UI
  sendEvents([paymentEvent], false).catch(err => {
    console.error('Failed to send payment event:', err);
  });
}
```

**Event Flow Now**:

| Event | When Sent | Method |
|-------|-----------|--------|
| `logged_in` | On page exit | Buffer → sendBeacon |
| `contract_signed` | On page exit | Buffer → sendBeacon |
| `invoice` | On page exit | Buffer → sendBeacon |
| `payment_1` | **Immediately on Stripe return** | Direct fetch |
| `balance` | On page exit | Buffer → sendBeacon |
| `payment_2` | **Immediately on Stripe return** | Direct fetch |

**Why This Is Correct**:
1. **Security**: Payment must be recorded immediately - can't risk losing it if user closes tab
2. **Isolation**: Payment events are completely separate from buffered events
3. **No duplicates**: `sentEventsRef` prevents the same event from being sent twice
4. **Expected behavior**: Users will see 2 API calls for payment_1 flow (buffered events + payment_1) and 2 for payment_2 flow (balance + payment_2)

---

## BUG_06_005 — Events Flushing Individually Instead of Batched

**Reported**: 2026-01-25  
**Status**: FIXED

**Symptoms**:
- Each event (`logged_in`, `contract_signed`, `invoice`, `payment_1`) triggered separate API calls
- GitHub Actions workflow for `invoice` was cancelled with: "Canceling since a higher priority waiting request for user-events-uid-swh-609 exists"
- Page loading very slowly (10+ seconds with spinner)
- Background showing ugly blue before image loads

**Root Cause**: `visibilitychange` event listener

The `handleVisibilityChange` function was calling `handleUnload()` whenever `document.visibilityState === 'hidden'`. This fires:
- During slow page loads when browser is busy
- When switching tabs
- During internal React navigation
- When the page is "backgrounded" for any reason

This caused events to flush prematurely and individually instead of batching.

**Fix Applied**: Removed `visibilitychange` listener entirely

```typescript
// REMOVED:
const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden' && !unloadHandled) {
    handleUnload();
  }
};
window.addEventListener('visibilitychange', handleVisibilityChange);

// NOW: Only listen for actual page unload events
window.addEventListener('pagehide', handleUnload);
window.addEventListener('beforeunload', handleUnload);
```

**GitHub Actions Limitation Discovered**:

`cancel-in-progress: false` only protects **running** workflows, not **pending** ones. When multiple workflows are queued quickly:
- 1 can be running
- 1 can be pending
- Any additional workflows **cancel the pending one**

This is why `invoice` was skipped - it was pending when `payment_1` came in and cancelled it.

**Solution**: Events must batch properly so only 1-2 workflows trigger per session (buffered events + payment event), never 4+ individual workflows.

---

## Slowness Investigation

**Reported**: 2026-01-25  
**Status**: Under Investigation

**Symptoms**:
- Page loads very slowly (10+ seconds)
- Blue background visible before image loads
- Spinner showing for extended time
- Affects both mobile (iPad) and desktop

**Ruled Out**:
- User's internet (200+ Mbps confirmed)
- Image sizes (42-66KB, tiny)
- sessionStorage operations (minimal)
- JSON fetch (simple with cache busting)

**Possible Causes**:
1. Vercel cold start (first request after inactivity)
2. unpkg CDN slowness (PDF worker loaded from there)
3. GitHub Pages CDN issues
4. Build artifact size (job bundle is 552KB)

**Note**: The `visibilitychange` fix may help with perceived slowness since it was causing extra API calls during load.
