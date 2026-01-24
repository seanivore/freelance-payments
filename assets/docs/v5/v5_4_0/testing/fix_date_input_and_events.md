---
name: Fix Date Input and Events
overview: "Fix three related bugs: replace the problematic date picker with a text input for better signing UX, remove unnecessary events (contract_loaded), and ensure events only trigger once per session."
todos:
  - id: date-input
    content: Replace date picker with text input in SignatureModal.tsx
    status: completed
  - id: remove-contract-loaded
    content: Remove contract_loaded event from PdfViewer.tsx and App.tsx
    status: completed
  - id: event-dedup
    content: Add client_status check in trackEvent to prevent duplicate events
    status: completed
  - id: cleanup-python
    content: Remove contract_loaded handler from user_exit_events.py
    status: completed
  - id: update-log
    content: Document BUG_04_005, BUG_04_006, BUG_04_007 in LOG_04.md
    status: completed
---

# Fix BUG_04_005, BUG_04_006, BUG_04_007

## Problem Summary

Three bugs with interconnected root causes:

- **BUG_04_005**: iOS native date picker overflows viewport (persistent issue across multiple fix attempts)
- **BUG_04_006**: Unnecessary events (`contract_loaded`, already-processed events) trigger API calls
- **BUG_04_007**: Desktop date picker shows double calendar icons and drawer alignment issues

## Solution Approach

### 1. Date Input Redesign (BUG_04_005 + BUG_04_007)

Replace the native date picker with a simple text input. This aligns with the "signing" UX where typing the date feels more authentic than clicking a calendar.

**File: [src/components/SignatureModal.tsx](../../../../../.cursor/plans/src/components/SignatureModal.tsx)**

- Change `<input type="date">` to `<input type="text">`
- Pre-fill with today's date in readable format: "Jan 23, 2026"
- Remove the calendar button and `openDatePicker` function
- Remove `dateInputRef` (no longer needed)
- Add placeholder showing expected format

```tsx
// Before: type="date" with calendar button
// After: type="text" pre-filled with formatted date
const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
const [signedDate, setSignedDate] = useState(() => formatDate(new Date()));
```

### 2. Event Cleanup (BUG_04_006)

Remove `contract_loaded` event entirely and prevent already-recorded events from being queued.

**File: [src/components/PdfViewer.tsx](../../../../../.cursor/plans/src/components/PdfViewer.tsx)**

- Remove line 170: `emitEvent?.('contract_loaded', { page: 1, totalPages: doc.numPages });`

**File: [src/App.tsx](../../../../../.cursor/plans/src/App.tsx)**

- Remove `contract_loaded` case from `emitEvent` (lines 279-282)
- Add check in `trackEvent` to skip events already in `data.state.client_status`
- Clear buffer after unload send to prevent edge-case double-sends

```tsx
// In trackEvent, before adding to buffer:
const clientStatus = data?.state?.client_status;
if (clientStatus) {
  const statusKey =
    type === "contract_signed"
      ? "contract_signed"
      : type === "invoice"
        ? "invoice"
        : type;
  if (clientStatus[statusKey]) return; // Already recorded
}
```

**File: [.github/scripts/orchestration/user_exit_events.py](../../../../../.cursor/plans/.github/scripts/orchestration/user_exit_events.py)**

- Remove `contract_loaded` handler (lines 107-111) - cleanup only, not strictly required

## Files to Modify

| File | Changes |

|------|---------|

| `src/components/SignatureModal.tsx` | Replace date picker with text input |

| `src/components/PdfViewer.tsx` | Remove contract_loaded emit |

| `src/App.tsx` | Remove contract_loaded handling, add client_status check |

| `.github/scripts/orchestration/user_exit_events.py` | Remove contract_loaded handler |

## Expected Outcomes

- Date input works consistently on iOS and desktop (no overflow, no double icons)
- Only meaningful events trigger API calls (logged_in, contract_signed, invoice, payment_1, balance, payment_2)
- Each event type triggers exactly once per job lifecycle
- Single API call per user session exit

## Documentation

Update `LOG_04.md` with bug reports and fix details for BUG_04_005, BUG_04_006, BUG_04_007.
