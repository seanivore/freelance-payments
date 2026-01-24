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

### View Contract, Cancel, Exit

- **EXPECTED BEHAVIORS**
  - No events for just looking at contract anymore, so the session should not trigger `user-exit-events.yml` or any API calls
  - Desktop drawer modal should be centered
  - iOS native date field should be present and working as expected

- **TESTING FLOW**
  - User log in on mobile, view contract, try to sign but cancel
  - User exit the site
  - User log in on desktop, view contract, try to sign but cancel
  - User exit the site

### ACTUAL BEHAVIORS

- **BUG_05_001** Modal jump off screen when clicking into date field on iOS
  - Everything worked as expected except for strange jumping of screen input area and field when clicking into the date field on iOS
  - Something about an aria-hidden attribute was mentioned in the console, not sure if it is relevant to the above behavior on mobile
  - `assets/docs/v5/v5_5_0/testing/IMG_BUG_05_001-1.jpg` shows where I clicked
  - `assets/docs/v5/v5_5_0/testing/IMG_BUG_05_001-2.jpg` shows how the modal jumped up
  - When the modal was pulled back down to use it, it closed the modal and I had to click to sign again to open it

### Console Log

```plaintext
  GET https://payments.august.style/uid-yvc-829 404 (Not Found)
S @ assets/main-BgpHDfX3.js:1
await in S
pv @ index-C8XLP5Y7.js:8
(anonymous) @ index-C8XLP5Y7.js:8
Bi @ index-C8XLP5Y7.js:8
Qc @ index-C8XLP5Y7.js:8
Pc @ index-C8XLP5Y7.js:9
Z1 @ index-C8XLP5Y7.js:9
job-D5d5ncxB.js:59 Vite: job.tsx loaded
job-D5d5ncxB.js:1 ✅ Loaded job data for uid-yvc-829: {logged_in: '2026-01-21T13:18:44.844Z', contract_signed: null, invoice: null, payment_1: null, balance: null, …}
uid-yvc-829:1 Blocked aria-hidden on an element because its descendant retained focus. The focus must not be hidden from assistive technology users. Avoid using aria-hidden on a focused element or its ancestor. Consider using the inert attribute instead, which will also prevent focus. For more details, see the aria-hidden section of the WAI-ARIA specification at https://w3c.github.io/aria/#aria-hidden.
Element with focus: <button.inline-flex items-center justify-center whitespace-nowrap text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 bg-portfolio-accent-mauve hover:bg-portfolio-accent-mauve/80 text-portfolio-bg-dark font-semibold px-4 py-2 rounded-lg transition-all duration-300>
Ancestor with aria-hidden: <div#root> <div id=​"root" data-aria-hidden=​"true" aria-hidden=​"true">​…​</div>​
```
