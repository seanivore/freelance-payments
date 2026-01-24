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

---

## Continuing Test - `uid-yvc-829.json`

- **TESTING FLOW**
  - User will log in on mobile, sign contract, view invoice but not acknowledge it
  - User exit the site

- **EXPECTED BEHAVIOR**
  - One `/api/track-event` call for event `contract_signed`
  - Activates `user-exit-events.yml` workflow adding timestamp to `state.client_status.contract_signed`
  - No other events and no additional API calls for this session
  - Otherwise normal UI functionality

### ACTUAL BEHAVIOR

- **BUG_05_002** Modal jump off screen when clicking into either text input field on iOS
  - This behavior is the same as BUG_05_001, but it is happening with the name and date fields instead of the date field
  - Meaning I don't think it is related to that aria-hidden attribute, but good we fixed that
  - `assets/docs/v5/v5_5_0/testing/IMG_BUG_05_002-1.jpg` loads like this
  - `assets/docs/v5/v5_5_0/testing/IMG_BUG_05_002-2.jpg` when you clicked into the name field
  - I'm not sure what it is trying to display below the modal on mobile; possibly keeping the bottom of it aligned to the top of the keyboard
  - But there is just the big gap instead; you can't scroll down in the modal though you can see it cut off the bottom of the modal
  - Pulling the modal back down makes it think the user is trying to swipe it closed, I think
  - It seems like it is used to showing the full modal, but now it has some kind of padding it needs to show when active or when 'focused'

* **THOUGHTS**
  - Please just review all related code to the modal functioning
  - It seems like this bug arose from changing the date selector so many times
  - I think in one of the updates something wasn't cleaned up or was added in error
  - Or just write all the associated code for that functionality and UI view as new code
  - Is there a padding that or something that can become visible when "focused"?
  - Other ideas?
