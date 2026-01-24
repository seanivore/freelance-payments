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
**Last Updated**: 2026-01-23  
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

## Observations

### Event System Validation (Pending Full Test)
- User logged in twice (mobile + desktop), viewed contract, opened signature modal, cancelled
- No `/api/track-event` calls observed (as expected - `logged_in` already recorded, no other trackable events)
- Full flow test pending to confirm single-batch behavior on actual state changes
