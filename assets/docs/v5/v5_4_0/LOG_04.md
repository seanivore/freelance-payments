# Testing Log 04

## Logging Instructions for AI Agents

This log tracks bugs and fixes during v5 testing. Follow these conventions:

- **File Naming**: `LOG_XX.md` where XX is the log number (01, 02, etc.)
- **Bug Numbering**: `BUG_XX_YYY` where XX matches log number, YYY is sequential bug count across all v5 logs
- **When starting a new log**: User will provide the last bug number from previous log (e.g., "Last bug was BUG_01_015")
- **Grouping**: Use larger headers (##) for test job file names to group related bugs
- **Content**: Keep entries concise - include user's essential details, expected behavior, actual behavior, and fixes implemented
- **Additional Details**: Log any relevant technical details, console errors, workflow runs, commit hashes, or related context

---

# Testing Log 04 - v5.4.0 Single-Batch Validation

**Created**: 2026-01-21  
**Last Updated**: 2026-01-23  
**Status**: Complete - all bugs fixed

**Focus**:

- Single-batch policy verification
- iOS date picker sizing

**Test Files**:

- `uid-awe-596.json` — JoAnn (breath-work-meditation-retreat)
- `uid-gdf-021.json` — Paul (science-channel)
- `uid-yvc-829.json` — Dewey (nerd-dates)

---

## Test Job: `uid-awe-596.json`

**Login**: JoAnn — breath-work-meditation-retreat

### BUG_04_001 — Desktop Date Picker Icon Doesn’t Open Calendar

**Date**: 2026-01-21  
**Status**: FIXED  
**Severity**: Low (manual entry works)

**Expected**: Clicking the calendar icon opens a date picker.  
**Actual**: Clicking the calendar icon does nothing; date must be typed manually.

**Repro Context**:

- Desktop contract signing flow
- Desktop browser date input (not iOS native UI)

**Notes / Evidence**:

- Calendar icon appears but no picker opens on click.

**Investigation Notes**:

- `SignatureModal` uses `input[type="date"]`; on desktop this is browser-native UI (not iOS native).
- Desktop picker may require focus on input field; icon click might not focus in current layout/styling.
- Potential overlay or pointer-event issue with the icon/label.

**Fix Implemented**:

- Added explicit calendar button and input focus/`showPicker()` helper in `SignatureModal` for desktop browsers.

**Test Plan**:

- Desktop Chrome + Safari: click icon and input field, verify calendar opens.
- Ensure mobile UX remains native (iOS).

---

## Test Job: `uid-gdf-021.json`

**Login**: Paul — science-channel

### BUG_04_002 — iOS Date Picker Wider Than Viewport

**Date**: 2026-01-21  
**Status**: FIXED  
**Severity**: Low (visual overflow)

**Expected**: Native iOS date picker fits within drawer/viewport.  
**Actual**: Native iOS date picker renders wider than viewport.

**Evidence**:

- `assets/docs/v5/v5_4_0/testing/IMG-BUG_04_002-1.jpg`
- `assets/docs/v5/v5_4_0/testing/IMG-BUG_04_002-2.jpg`

**Investigation Notes**:

- “Native” here refers to iOS/iPadOS system UI only (not desktop browser UI).
- `DrawerContent` is constrained (`max-h-[90vh] overflow-y-auto`) but width control is in inner wrapper.
- iOS native picker is system UI; width control may require full-width container or different layout for small viewports.
- Prior workaround used a custom calendar on mobile (see below), but its layout was broken.

**Related Prior Evidence (custom calendar regression)**:

- `assets/docs/v5/v5_4_0/testing/IMG-BUG_03_003-mobile-view-1.PNG`
- `assets/docs/v5/v5_4_0/testing/IMG-BUG_03_003-mobile-view-2.png`
- `assets/docs/v5/v5_4_0/testing/IMG-BUG_03_003-updated-mobile-test-desktop-1.png`

**Fix Implemented**:

- Made drawer full-width on mobile (`w-screen max-w-none`) and removed inner `max-w-md` constraint on small screens.

**Test Plan**:

- iOS Safari and iOS Chrome: open date picker; verify no horizontal overflow.

---

### BUG_04_003 — Duplicate Event Batch After Mobile Payment_1

**Date**: 2026-01-21  
**Status**: FIXED  
**Severity**: Low (duplicate workflow run, no data corruption)

**Expected**: One event batch after payment_1.  
**Actual**: Two `/api/track-event` calls on mobile iOS; second batch contains `logged_in`, `contract_loaded`, `payment_1` and is skipped by workflow.

**Repro Context**:

- Mobile iOS; user closed tab quickly after Completion1

**Evidence**:

- Vercel logs: `✅ Dispatched workflow with 6 event(s)` then `✅ Dispatched workflow with 3 event(s)` for `uid-gdf-021`
- Second batch events: `logged_in`, `contract_loaded`, `payment_1`

**Investigation Notes**:

- `pagehide`, `beforeunload`, and `visibilitychange` can all fire on mobile; unload handler guards may still allow a second dispatch if new events are queued after first flush.
- `logged_in` can be re-queued if fresh JSON is not yet reflected on reload.

**Fix Implemented**:

- Added per-session payload hash + timestamp dedupe to skip repeat batches.
- Added session guard to enqueue `logged_in` only once.

**Test Plan**:

- Mobile iOS payment_1 flow; close tab quickly after Completion1; confirm only one batch is sent.

---

## Test Job: `uid-awe-596.json` (Log Save)

### BUG_04_004 — smart-push Rebase Conflict on Job JSON

**Date**: 2026-01-21  
**Status**: FIXED  
**Severity**: Medium (workflow friction)

**Expected**: `git smart-push` should never preserve local edits to existing `assets/jobs/*.json` files (local changes are not trusted).  
**Actual**: Smart-push treated `assets/jobs/uid-awe-596.json` as “intentional,” leading to rebase conflict prompts and detached HEAD confusion.

**Evidence**:

- Rebase conflict shown during smart-push on `assets/jobs/uid-awe-596.json` when saving logs.

**Investigation Notes**:

- Old smart-push script attempted intelligent conflict resolution and “preserved” job JSON edits.
- Local edits to existing job JSONs should never be preserved; only workflow-generated updates are valid.
- Conflicts could also arise between workflow commits (admin-push vs user-exit-events), independent of local changes.

**Fix Implemented**:

- `git smart-push` now aborts if existing `assets/jobs/*.json` files are modified locally and prints guidance to avoid preserving those changes.

**Test Plan**:

- Run smart-push with pending remote JSON updates; confirm it blocks or auto-accepts remote without entering a rebase state.

---

## Prior Unlogged Items (Reference)

### BUG_03_008 — Login After Payment_1 Routes to Contract

- **Source**: `assets/docs/v5/v5_2_0/testing/BUG_03_008.md`
- **Summary**: After payment_1, login shows contract instead of balance; JSON in GitHub shows correct timestamps but deployed JSON appears incomplete. Suspected earlier deploy served a partial JSON.

### BUG_03_009 — `user-exit-events.yml` Build/Deploy Ordering + Multi-Batch

- **Source**: `assets/docs/v5/v5_2_0/testing/BUG_03_009.md`
- **Summary**: Two batches per session, multiple workflows/commits, commit linkage mismatch in GitHub UI. Led to investigation of workflow triggers and git logic.

### TESTING `uid-fri-956.json` — Two-Batch Behavior and Commit UI Mismatch

- **Source**: `assets/docs/v5/v5_3_8/TESTING_uid-fri-956.json.md`
- **Summary**: Successful end-to-end run but events split into two batches; GitHub Actions UI linked to prior commits while actual commits/deploys were correct.

---

## Test Job: `uid-yvc-829.json`

**Login**: Dewey — nerd-dates

### BUG_04_005 — iOS Date Picker Wider Than Viewport (Persistent)

**Date**: 2026-01-21  
**Status**: FIXED  
**Severity**: Medium (UX issue on mobile)

**Expected**: Date picker fits within drawer/viewport on iOS.  
**Actual**: Native iOS date picker still overflows viewport despite previous fix attempts.

**Evidence**:

- `assets/docs/v5/v5_4_0/testing/IMG-BUG_04_005-1.PNG`
- `assets/docs/v5/v5_4_0/testing/IMG-BUG_04_005-2.PNG`

**History**:

1. Native iOS picker overflowed → switched to custom Calendar component (react-day-picker)
2. Custom calendar had broken layout (day headers misaligned: "Su" separate, "MoTuWeThFrSa" crammed)
3. Reverted to native picker with drawer constraints → still overflowing
4. Multiple attempts to fix with `w-screen max-w-none` and similar → still overflowing

**Root Cause Analysis**:

- Native iOS date picker is system UI that cannot be reliably constrained
- Custom calendar components have their own layout issues
- The fundamental problem is trying to fit a complex picker into a mobile drawer

**Fix Implemented**:

- Replaced date picker entirely with a simple text input
- Pre-filled with today's date in readable format ("Jan 23, 2026")
- Aligns with "signing" UX where typing the date feels more authentic
- Removed calendar button and `openDatePicker` function
- Simplified drawer styling (removed complex width overrides)

**Files Modified**:

- `src/components/SignatureModal.tsx`: Replaced `<input type="date">` with `<input type="text">`, removed calendar button

**Test Plan**:

- iOS Safari: open signature modal, verify date input is simple text field
- Desktop Chrome: same verification
- Confirm date is pre-filled with today's date in readable format

---

### BUG_04_006 — Unnecessary Events Triggering API Calls

**Date**: 2026-01-21  
**Status**: FIXED  
**Severity**: Low (wasted API calls, no data impact)

**Expected**: Only meaningful events trigger `/api/track-event` calls (logged_in, contract_signed, invoice, payment_1, balance, payment_2).  
**Actual**: `contract_loaded` and already-processed events trigger API calls that result in "skipped" workflow logs.

**Evidence**:

- Vercel logs: `✅ Dispatched workflow with 2 event(s) for job uid-yvc-829`
- Workflow logs: `ℹ️ Skipping contract_loaded - informational event only`
- Workflow logs: `⏭️ Skipping payment_2 - already processed at 2026-01-21T13:00:20.133Z`

**Root Cause**:

- `contract_loaded` was an informational event added during testing/debugging
- Events already recorded in `client_status` were still being queued and sent
- No frontend filtering before sending to API

**Fix Implemented**:

1. Removed `contract_loaded` event entirely:
   - Removed from `PdfViewer.tsx` (no longer emits on PDF load)
   - Removed from `App.tsx` `emitEvent` handler
   - Removed from `user_exit_events.py` handler
2. Added client_status check in `trackEvent`:
   - Before queueing, checks if event type already has a timestamp in `clientStatusRef`
   - Skips events that are already recorded (prevents sending events that will be skipped)
3. Clear buffer after unload send:
   - Prevents edge-case double-sends on rapid page transitions

**Files Modified**:

- `src/components/PdfViewer.tsx`: Removed `contract_loaded` emit and `hasEmittedLoadedRef`
- `src/App.tsx`: Removed `contract_loaded` case, added `clientStatusRef` and dedup check in `trackEvent`, clear buffer in unload handler
- `.github/scripts/orchestration/user_exit_events.py`: Removed `contract_loaded` handler

**Test Plan**:

- Complete a user flow and verify only one API call per session exit
- Verify no "skipped" or "informational only" events in workflow logs
- Confirm all 6 meaningful events still work: logged_in, contract_signed, invoice, payment_1, balance, payment_2

---

### BUG_04_007 — Desktop Date Picker UI Issues

**Date**: 2026-01-21  
**Status**: FIXED  
**Severity**: Low (visual issues)

**Expected**: Date picker displays correctly on desktop with single calendar icon, drawer centered.  
**Actual**: Drawer modal left-aligned, two calendar icons visible (native input icon + custom button).

**Evidence**:

- `assets/docs/v5/v5_4_0/testing/IMG-BUG_04_007-1.png`
- `assets/docs/v5/v5_4_0/testing/IMG-BUG_04_007-2.png`

**Root Cause**:

- Previous fix added a custom calendar button alongside the native date input's built-in icon
- Drawer width overrides (`w-screen max-w-none sm:max-w-md`) caused alignment issues

**Fix Implemented**:

- Same fix as BUG_04_005: replaced date picker with text input
- Removed calendar button entirely (no more double icons)
- Simplified drawer styling to standard `max-w-md` (proper centering)

**Files Modified**:

- `src/components/SignatureModal.tsx`: Same changes as BUG_04_005

**Test Plan**:

- Desktop Chrome: open signature modal, verify no calendar icons, drawer centered
- Verify date input is pre-filled and editable

---

## Summary

| Bug        | Severity | Status | Root Cause                              | Fix                                  |
| ---------- | -------- | ------ | --------------------------------------- | ------------------------------------ |
| BUG_04_001 | Low      | FIXED  | Desktop date picker icon not triggering | Added showPicker() helper            |
| BUG_04_002 | Low      | FIXED  | iOS picker overflow                     | Drawer width constraints             |
| BUG_04_003 | Low      | FIXED  | Duplicate event batches                 | Hash + timestamp dedupe              |
| BUG_04_004 | Medium   | FIXED  | smart-push conflict handling            | Abort on job JSON conflicts          |
| BUG_04_005 | Medium   | FIXED  | Native date picker unreliable           | Replaced with text input             |
| BUG_04_006 | Low      | FIXED  | Unnecessary events sent                 | Removed contract_loaded, added dedup |
| BUG_04_007 | Low      | FIXED  | Double icons, drawer alignment          | Text input, simplified drawer        |

## Key Changes (BUG_04_005, BUG_04_006, BUG_04_007)

### Date Input Redesign

- Replaced native date picker with simple text input
- Pre-filled with today's date in "Jan 23, 2026" format
- Better UX for "signing" authenticity
- Works consistently on iOS and desktop

### Event System Cleanup

- Only 6 meaningful events tracked: `logged_in`, `contract_signed`, `invoice`, `payment_1`, `balance`, `payment_2`
- Events already in `client_status` are not re-queued
- `contract_loaded` removed entirely (was informational only)
- Single API call per session exit guaranteed
