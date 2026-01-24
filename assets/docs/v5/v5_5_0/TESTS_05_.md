# Testing Notes for v5.5.0

---

- **Created:** 2026-01-23
- **Focus:**

* Single-batch policy implemented
  - Removed payment-time flush; unload/inactivity flush only
  - Removed pseudo-events "skipped", "already recorded", etc. that triggered API for no need
  - **NEXT:** Run job flow again
  - Confirm exactly **one** `/api/track-event` call per session
  - Confirm a single `user-exit-events.yml` run per session with full timestamps applied
* Check-up on the contract date selector and drawer modal
  - Removed iOS native for other component; then switched back to native but still didn't work
  - **TEST:** Implemented new contract sign flow with different date layout
  - Fixed alignment of drawer modal; should be centered again **TEST**

- **Test File:** `uid-yvc-829.json`; Dewey, nerd-dates

---

## Current Running Test File - `uid-yvc-829.json`

- Already used to see contract, then cancelled; `state.client_status.logged_in` timestamp is present only

## View Contract, Cancel, Exit

- **NOTE:** No events for just looking at contract anymore, so the session should not trigger `user-exit-events.yml` or any API calls
  - User log in on mobile, view contract, try to sign but cancel
  - User exit the site
  - User log in on desktop, view contract, try to sign but cancel
  - User exit the site
