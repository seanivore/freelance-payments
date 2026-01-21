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
**Last Updated**: 2026-01-21  
**Status**: In Progress - bugs identified, fixes pending

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
