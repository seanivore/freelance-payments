# Testing Log 05

## Logging Instructions for AI Agents

This log tracks bugs and fixes during v5 testing. Follow these conventions:

- **File Naming**: `LOG_XX.md` where XX is the log number (01, 02, etc.)
- **Bug Numbering**: `BUG_XX_YYY` where XX matches log number, YYY is sequential bug count across all v5 logs
- **Grouping**: Use larger headers (##) for test job file names to group related bugs
- **Content**: Keep entries concise - include user's essential details, expected behavior, actual behavior, and fixes implemented
- **Additional Details**: Log any relevant technical details, console errors, workflow runs, commit hashes, or related context

---

# Testing Log 05 - v5.5.0 Event Cleanup Validation

**Created**: 2026-01-23  
**Last Updated**: 2026-01-24  
**Status**: In Progress

**Focus**:
- Validate single-batch event policy (no unnecessary API calls)
- Validate drawer modal fixes on iOS

**Test Files**:
- `uid-yvc-829.json` — Dewey (nerd-dates)

---

## Test Job: `uid-yvc-829.json`

**Login**: Dewey — nerd-dates

### BUG_05_001 — Modal Jumps Off Screen When Focusing Text Input on iOS

**Date**: 2026-01-23  
**Status**: FIXED  
**Severity**: Medium (blocks form input on iOS)

**Expected**: Tapping on text input in signature modal focuses the field normally.  
**Actual**: Modal jumps off screen when tapping the date field on iOS. Pulling the modal back down closes it.

**Evidence**:
- `assets/docs/v5/v5_5_0/testing/IMG_BUG_05_001-1.jpg` - Where user clicked
- `assets/docs/v5/v5_5_0/testing/IMG_BUG_05_001-2.jpg` - Modal jumped up off screen

**Console Error**:
```
Blocked aria-hidden on an element because its descendant retained focus.
Ancestor with aria-hidden: <div#root> <div id="root" data-aria-hidden="true" aria-hidden="true">
```

**Root Cause**:
The `vaul` drawer library's `shouldScaleBackground={true}` (default) causes two issues:
1. Sets `aria-hidden="true"` on the root element when drawer is open
2. When iOS tries to focus a text input, it conflicts with the drawer's gesture handling and the aria-hidden state
3. iOS scroll/zoom behavior to focus inputs fights with the drawer's transform

**Fix Implemented**:
Added `shouldScaleBackground={false}` to the Drawer component in SignatureModal.tsx. This:
- Disables the background scaling animation
- Prevents `aria-hidden` from being applied to the root element
- Allows iOS to handle text input focus normally

**Trade-off**: We lose the subtle background scaling effect when the drawer opens, but this is a minor visual detail compared to fixing the broken input experience on iOS.

**Files Modified**:
- `src/components/SignatureModal.tsx`: Added `shouldScaleBackground={false}` to Drawer

**Test Plan**:
- iOS Safari: Open signature modal, tap on name and date fields, verify no jumping
- Desktop: Verify drawer still opens/closes normally

---

### BUG_05_002 — Modal Still Jumps When Focusing Any Text Input on iOS

**Date**: 2026-01-24  
**Status**: FIXED  
**Severity**: Medium (blocks form input on iOS)

**Expected**: Tapping on any text input in signature modal focuses the field normally without modal movement.  
**Actual**: Modal jumps up off screen when tapping either the name or date field on iOS. Large gap appears below modal. Pulling modal back down closes it.

**Evidence**:
- `assets/docs/v5/v5_5_0/testing/IMG_BUG_05_002-1.jpg` - Modal loads normally
- `assets/docs/v5/v5_5_0/testing/IMG_BUG_05_002-2.jpg` - Modal jumps up when clicking into name field, gap appears below

**Root Cause**:
The `vaul` drawer library has automatic input repositioning (`repositionInputs={true}` by default) that tries to adjust the drawer position when the iOS keyboard opens. This repositioning fights with iOS's native keyboard handling, causing:
1. Modal to jump up excessively
2. Large gap between modal and keyboard
3. Swipe-to-close gesture triggered when user tries to pull modal back down

The `shouldScaleBackground={false}` fix from BUG_05_001 addressed the aria-hidden issue but not the repositioning conflict.

**Fix Implemented**:
Added `repositionInputs={false}` to the Drawer component in SignatureModal.tsx. This:
- Disables vaul's automatic keyboard repositioning
- Lets iOS handle keyboard appearance natively
- Prevents the modal from jumping when inputs are focused

**Files Modified**:
- `src/components/SignatureModal.tsx`: Added `repositionInputs={false}` to Drawer

**Test Plan**:
- iOS Safari: Open signature modal, tap on name and date fields, verify no jumping
- Verify keyboard appears normally and modal stays in place
- Desktop: Verify drawer still opens/closes normally

---

### BUG_05_003 — Stale JSON After Event Processing (Deployment Timing)

**Date**: 2026-01-24  
**Status**: FIXED  
**Severity**: High (causes user to see wrong page state)

**Expected**: After signing contract and exiting, user should see invoice page on next login.  
**Actual**: User saw contract page again because the deployed JSON didn't have the `contract_signed` timestamp.

**Root Cause**:
Race condition between Vercel deployment and GitHub Actions workflow:
1. User triggers `contract_signed` event → API dispatches `user-exit-events.yml`
2. Vercel auto-deploys on the initial push (before workflow runs)
3. GitHub Actions workflow updates JSON and commits
4. But Vercel already deployed with the old JSON

The `user-exit-events.yml` workflow was missing a dedicated GitHub Pages deployment step after committing JSON changes. Unlike `admin-push.yml` which has a two-job structure (process → deploy), `user-exit-events.yml` only had the processing step.

**Fix Implemented**:
Restructured `user-exit-events.yml` to mirror `admin-push.yml`:
1. Added `deploy` job that runs after `process-events` job
2. `process-events` job now builds the site and uploads artifact
3. `deploy` job deploys to GitHub Pages using `actions/deploy-pages@v4`
4. Both jobs are conditional on changes being committed

**Files Modified**:
- `.github/workflows/user-exit-events.yml`: Added two-job structure with GitHub Pages deployment

---

### BUG_05_004 — Invoice Event Not Sent (OPTIONS Without POST)

**Date**: 2026-01-24  
**Status**: FIXED  
**Severity**: High (event not recorded)

**Expected**: When user acknowledges invoice and exits, `invoice` event should be sent via POST to `/api/track-event`.  
**Actual**: Only OPTIONS preflight request observed, no POST request made.

**Root Cause**:
CORS preflight race condition with `fetch` + `keepalive`:
1. User acknowledges invoice → `invoice` event queued
2. User exits page → `handleUnload` fires
3. `sendEvents` called with `keepalive: true`
4. Browser sends OPTIONS preflight to cross-origin API
5. **Page unloads before OPTIONS response arrives** → POST never sent

The `keepalive` flag only keeps the POST alive after page unload, but doesn't help if the preflight hasn't completed.

**Fix Implemented**:
Use `navigator.sendBeacon` with `text/plain` content type for unload scenarios:
1. `sendBeacon` is specifically designed for unload scenarios
2. Using `text/plain` avoids CORS preflight (it's a "simple" content type)
3. Server parses JSON from the text/plain body
4. Falls back to `fetch` with `keepalive` if `sendBeacon` fails

**Files Modified**:
- `src/App.tsx`: Updated `sendEvents` to use `sendBeacon` with `text/plain` for unload
- `api/track-event.js`: Added handling for `text/plain` content type (parses JSON from body)

**Technical Details**:
- `sendBeacon` returns `true` if the request was successfully queued
- `text/plain` is a "simple" content type per CORS spec, no preflight needed
- Server checks `Content-Type` header and parses accordingly

---

### BUG_05_005 — Duplicate Payment Event Triggers Second Workflow

**Date**: 2026-01-24  
**Status**: FIXED  
**Severity**: Medium (causes unnecessary workflow run)

**Expected**: After completing payment, only one `payment_1` event should be sent, triggering one workflow run.  
**Actual**: Two workflow runs occurred - first with `[invoice, payment_1]`, second with `[payment_1]` (marked as "already processed").

**Test Flow**:
1. User acknowledges invoice → `invoice` event buffered
2. User completes payment → returns from Stripe
3. Session status check runs → `trackEvent('payment_1')` called → event buffered
4. User exits → both events sent → Workflow #146 runs
5. User returns to site (or page reloads) → session status check runs again
6. `trackEvent('payment_1')` called again (local state shows `payment_1: null` because JSON not re-fetched)
7. User exits → `payment_1` sent again → Workflow #147 runs (skips as "already processed")

**Root Cause**:
The deduplication in `trackEvent` only checked `clientStatusRef` (which reflects the JSON data) and `loggedInQueuedRef` (for logged_in only). When a user returns from Stripe:
1. The session status check calls `trackEvent('payment_1')`
2. `clientStatusRef.current.payment_1` is still `null` (JSON not re-fetched)
3. The event passes the check and gets buffered
4. If the user navigates or the page reloads, the same check runs again

**Fix Implemented**:
Added `sentEventsRef` - a Set that tracks which event types have been queued in the current browser session:
1. Before adding any event to the buffer, check if it's already in `sentEventsRef`
2. After adding an event, add its type to `sentEventsRef`
3. This prevents the same event type from being queued twice in a single session

**Files Modified**:
- `src/App.tsx`: Added `sentEventsRef` and check in `trackEvent`

**Also Fixed**:
Removed premature `trackEvent` call in `createCheckoutSession` - payment events should only be tracked on successful return from Stripe, not when starting checkout (prevents false positives if user abandons checkout).

---

### BUG_05_006 — Balance Event Not Sent (Desktop Only)

**Date**: 2026-01-24  
**Status**: PENDING INVESTIGATION  
**Severity**: Medium

**Expected**: After acknowledging balance and exiting, `balance` event should be sent.  
**Actual**: On desktop, no event was sent (no OPTIONS, no POST). On mobile, it worked correctly.

**Notes**:
- Different behavior between desktop and mobile is unusual
- May be related to how different browsers handle `sendBeacon` or page unload events
- Could also be timing-related with checkout session loading
- Needs further testing to reproduce and diagnose

---

### BUG_05_007 — User Not Routed to Payment2 Despite Balance Timestamp

**Date**: 2026-01-24  
**Status**: FIXED  
**Severity**: High (blocks user flow)

**Expected**: When user logs in with `balance` timestamp present but no `payment_2`, they should be routed to `payment2` view.  
**Actual**: User was routed to `balance` view again, even though console showed `balance: '2026-01-24T10:01:39.007Z'`.

**Root Cause**:
Bug in the state-based routing logic in `App.tsx`. The routing checks were ordered incorrectly:

```typescript
else if (client_status.payment_1) {
  // This block was entered because payment_1 has a timestamp
  if (balanceAvailable) {
    initialSection = 'balance';  // Always set to balance!
  }
}
else if (client_status.balance && !client_status.payment_2) {
  // This was never reached because the previous block caught it
  initialSection = 'payment2';
}
```

The `payment_1` check didn't account for whether `balance` was already acknowledged. It assumed "if payment_1 done, show balance view" without checking if balance was already done.

**Fix Implemented**:
Changed the condition from `client_status.payment_1` to `client_status.payment_1 && !client_status.balance`:

```typescript
else if (client_status.payment_1 && !client_status.balance) {
  // Only show balance view if balance NOT yet acknowledged
  if (balanceAvailable) {
    initialSection = 'balance';
  }
}
else if (client_status.balance && !client_status.payment_2) {
  // Now this is reached when balance is done but payment_2 is not
  initialSection = 'payment2';
}
```

**Files Modified**:
- `src/App.tsx`: Fixed routing condition to check `!client_status.balance`

---

## Observations

### Event System Validation (Pending Full Test)
- User logged in twice (mobile + desktop), viewed contract, opened signature modal, cancelled
- No `/api/track-event` calls observed (as expected - `logged_in` already recorded, no other trackable events)
- Full flow test pending to confirm single-batch behavior on actual state changes
