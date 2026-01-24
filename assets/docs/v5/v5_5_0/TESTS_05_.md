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

---

## Continuing Test, Contract - `uid-yvc-829.json`

### Contract Signed

- **TESTING FLOW**
  - User will log in on mobile, sign contract, view invoice but not acknowledge it
  - User exit the site

- **EXPECTED BEHAVIOR**
  - One `/api/track-event` call for event `contract_signed`
  - Activates `user-exit-events.yml` workflow adding timestamp to `state.client_status.contract_signed`
  - No other events and no additional API calls for this session
  - Otherwise normal UI functionality

### Workflow Logs for Contract Signed Event

1. **VERCEL API CALL:** `/api/track-event` ✅ Dispatched workflow with 1 event(s) for job uid-yvc-829
2. **VERCEL DEPLOYMENT:** 8dQ7Kduvyu9GQdG35DPK7QcNDz3D
3. **Deployment Commit:** 5cd44b5

- Shows update to `contract.signatures.client.legal_name` and `contract.signatures.client.signed_date`
- Shows update to `state.client_status.contract_signed`

4. **GitHub Action Workflow:** one workflow running; exit events processed phase

```plaintext
Processing 1 events for uid-yvc-829...
  ✓ Updated contract_signed: 2026-01-24T05:56:14.936Z
  ✓ Updated contract signature legal_name: Dewey Tester
  ✓ Updated contract signature signed_date: Jan 24, 2026
✅ Successfully updated assets/jobs/uid-yvc-829.json
```

5. **GitHub Action Workflow:** changes commited

```plaintext
Run git config --global user.name 'github-actions[bot]'
[freelance-payments 5cd44b5] Update user behavior stats
 1 file changed, 162 insertions(+), 162 deletions(-)
To https://github.com/seanivore/freelance-payments
   77b6441..5cd44b5  freelance-payments -> freelance-payments
✅ Successfully pushed changes
```

6. **GitHub Action Workflow:** trigger Vercel deploy

```plaintext
Run if [ -n "$VERCEL_DEPLOY_HOOK" ]; then
ℹ️  No VERCEL_DEPLOY_HOOK secret configured - relying on push-triggered deploy
```

- **NOTE:** There is no "push-triggered" deploy that happens or has ever happened here in the past; also we removed the deploy hook almost immediately; this means that if this is the cause for the deployment not getting the updated JSON, then it is surprising we didn't see this more often earlier. We did see it often, but it is possible this point right here is where it could be fixed.

---

## Continuing Test, Invoice - `uid-yvc-829.json`

### Acknowledgment of Invoice

- **TESTING FLOW**
  - User will log in on desktop, view and acknowledge invoice
  - User exit the site on payment_1 load

- **EXPECTED BEHAVIOR**
  - One `/api/track-event` call for event `invoice`
  - Activates `user-exit-events.yml` workflow adding timestamp to `state.client_status.invoice`
  - No other events and no additional API calls for this session
  - Otherwise normal UI functionality

### Actual Behavior

- **BUG_05_003** User loaded and set to contract instead of invoice page
  - Console log

```plaintext
uid-yvc-829:1  GET https://payments.august.style/uid-yvc-829 404 (Not Found)
job-6Iq9Yn9s.js:59 Vite: job.tsx loaded
job-6Iq9Yn9s.js:1 ✅ Loaded job data for uid-yvc-829: {logged_in: '2026-01-21T13:18:44.844Z', contract_signed: null, invoice: null, payment_1: null, balance: null, …}
```

- This means the workflow triggered from contract_signed event is not grabbing the updated JSON file with the contract_signed timestamp
- However, it is notable that the deployment links to the proper commit 5cd44b5
- But based on the sequence of events, it seems like it links to that commit, before that commit is complete — **is that possible?**
- Because **AFTER** deployment, then the GitHub Action Workflow runs
- In the workflow it edited the JSON and **THEN** it commits to the same commit; 5cd44b5
- How legitimate is the sequence I see versus what actually happens? Because it seems strange that, if the commit that the deployment (which includes running `npm run build`) is ALWAYS after the build runs in the deploy, then how is it ever getting the accurate JSON file that was updated in that exact same commit? Or wait, how does `npm run build` work regarding what JSON it grabs? Because I just ran it on my own terminal, but I haven't pulled the latest changes from the repo yet so it is not updated with the latest changes. I guess I'll run a deployment now. Which should work regardless and we'll have to try the experiment again.
- Console log

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
job-6Iq9Yn9s.js:59 Vite: job.tsx loaded
job-6Iq9Yn9s.js:1 ✅ Loaded job data for uid-yvc-829: {logged_in: '2026-01-21T13:18:44.844Z', contract_signed: '2026-01-24T05:56:14.936Z', invoice: null, payment_1: null, balance: null, …}
```

- So correct, this time it had the proper JSON in the deployment
- The question remains if it is always grabbing the proper JSON file from the commit that was deployed because if the deployment really does run before the edited JSON is commited, then it would be grabbing the old JSON file instead of the new one

### Actually Acknowledge Invoice This Time

- **TEST FLOW**

- This time we'll actually acknowledge the invoice and be routed to payment_1, then exit
- We'll exit and it should trigger one API call for one event and start the workflow
- It should then add the timestamp to `state.client_status.invoice`

- **If this is caused by the JSON being updated after the deployment, then when logging in next, we'll be sent to invoice again**

- A `OPTIONS /api/track-event` ran but no `POST /api/track-event` request was made — I don't know the difference other than every POST has an option show before it, but this is the first i've seen an option without a post
- Does `track-event.js` file not get called? We acknowledged the invoice, but the event was not recorded because the API call was not completed

- **Main questions:**

* Does the sequence of events of `API call -> deployment -> GitHub Action Workflow run -> JSON file update -> commit -> push` happen in that order? Or is it possible for the GitHub Action Workflow to run before the deployment is complete? It seems like it has worked sometimes in the past, but based on the sequence of events, it appears like it should _NEVER_ have worked.
* How does the flow of the workflow work now? Does Vercel deploy always need to happen before GitHub action workflow runs? If it does, then maybe we do need the deploy hook back. Either we we should address that there _IS_ no push-triggered deploy that is in the logs.

---

## Testing Again, Invoice - `uid-yvc-829.json`

### Acknowledgment of Invoice

- **TESTING FLOW**
  - User will log in on desktop, view and acknowledge invoice
  - User exit the site on payment_1 load

- **EXPECTED BEHAVIOR**
  - One `/api/track-event` call for event `invoice`
  - Activates `user-exit-events.yml` workflow adding timestamp to `state.client_status.invoice`
  - No other events and no additional API calls for this session
  - Otherwise normal UI functionality

- **ACTUAL BEHAVIOR**
  - Only an OPTIONS request was made and no POST request (again, we just tried to fix this)
  - Because no event was POST requested, nothing triggered a workflow run an nothing was recorded
  - Just to be sure things were working, I went in, acknowledge the invoice and then also made payment_1 then exited
  - This time it worked and the event was recorded and the workflow ran and the timestamp was added to the JSON file

### Workflow Logs

- **Vercel API Calls & Webhooks**

1. `/api/create-checkout-session`
2. OPTIONS `/api/session-status` **THAT WAS ALL, SO I DID IT AGAIN WITH THE PAYMENT**
3. `/api/track-event` ✅ Dispatched workflow with 2 event(s) for job uid-yvc-829 **GOOD**
4. `/api/webhook` ℹ️ Payment event will be included in frontend event batch (not triggering separate workflow)
5. `/api/webhook` ✅ Payment completed: uid-yvc-829 - Payment 1
6. `/api/track-event` ✅ Dispatched workflow with 1 event(s) for job uid-yvc-829 **EXTRA**

- **Vercel Deployment**
  - Deployment: EYNFQYeHNu425BfPW6phtGbt82Tn
  - Commit: eb92b43
  - Good, updated JSON as expected
    - `state.client_status.invoice` timestamp added
    - `state.client_status.payment_1` timestamp added
    - `price1.active` set to `false`

- **GitHub Action Workflow**

* User Exit Events #146 **THIS ONE IS GOOD, EXPECTED**
  - Process exit events

```plaintext
Processing 2 events for uid-yvc-829...
  ✓ Updated invoice: 2026-01-24T08:43:56.069Z
  ✓ Updated payment_1: 2026-01-24T08:43:56.069Z
  ✓ Deactivated price1
✅ Successfully updated assets/jobs/uid-yvc-829.json
```

- Commit Changes

```plaintext
Run git config --global user.name 'github-actions[bot]'
[freelance-payments eb92b43] Update user behavior stats
 1 file changed, 3 insertions(+), 3 deletions(-)
To https://github.com/seanivore/freelance-payments
   8641157..eb92b43  freelance-payments -> freelance-payments
✅ Successfully pushed changes
```

- Build **YAY GOOD NEW ADDITION**

```plaintext
Run npm run build

> freelance-payments@1.0.0 build
> tsc && vite build

vite v7.3.1 building client environment for production...
transforming...
✓ 1792 modules transformed.
rendering chunks...
computing gzip size...
dist/job.html                                          0.83 kB │ gzip:   0.48 kB
dist/index.html                                        0.83 kB │ gzip:   0.47 kB
dist/404.html                                          1.40 kB │ gzip:   0.71 kB
dist/assets/favicon-96x96-BQSJKgjw.png                 3.97 kB
dist/assets/favicon-j6RYy6ev.ico                      15.09 kB
dist/assets/AgencyFB-RegularCompressed-C6uPkfQL.otf   18.04 kB
dist/assets/AgencyFB-RegularCondensed-C51SxG21.otf    23.26 kB
dist/assets/favicon-B1_Cm7fM.svg                     142.44 kB │ gzip:  96.53 kB
dist/assets/index-BaoJo0Xu.css                        31.67 kB │ gzip:   6.73 kB
dist/assets/main-BgpHDfX3.js                           5.11 kB │ gzip:   2.11 kB
dist/assets/index-C8XLP5Y7.js                        194.90 kB │ gzip:  61.47 kB
dist/assets/job-6Iq9Yn9s.js                          552.87 kB │ gzip: 162.61 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
[vite-plugin-static-copy] Copied 21 items.
✓ built in 4.41s
```

- User Exit Events #147 **NOT EXPECTED; SECOND WORKFLOW DIDN'T WANT**
  - Process exit events

```plaintext
Processing 1 events for uid-yvc-829...
  ⏭️  Skipping payment_1 - already processed at 2026-01-24T08:43:56.069Z
ℹ️  No state changes required.
```

- Commit Changes

```plaintext
Run git config --global user.name 'github-actions[bot]'
ℹ️  No local changes to commit
```

- **BUG_05_004** Invoice Event Not Sent
  - OPTIONS Without POST request again
  - I tried to just trigger this event again
  - Everything loaded, I acknowledged the invoice
  - Checkout session loaded and it took me to the payment_1
  - Then I exited before paying
  - **ONLY** the OPTIONS request was made and no POST request was made **BAD**

- **BUG_05_005** Second Payment_1 Event Sent, triggered second workflow run
  - Since just invoice wouldn't trigger, I went to acknowledge the invoice again
  - This time I paid after the checkout session loaded
  - This flushed both events so we got the POST request with both events in it **GOOD**
  - After payment, there was another event triggered for "Skipping payment_1 - already processed" **BAD**
  - So the payment was triggered twice; this second one triggered a second workflow to run

### Login Again to Test JSON File Update

- **EXPECTED BEHAVIOR**
  - I was sent to the balance page as expected

```plaintext
uid-yvc-829:1  GET https://payments.august.style/uid-yvc-829 404 (Not Found)
job-6Iq9Yn9s.js:59 Vite: job.tsx loaded
job-6Iq9Yn9s.js:1 ✅ Loaded job data for uid-yvc-829: {logged_in: '2026-01-21T13:18:44.844Z', contract_signed: '2026-01-24T05:56:14.936Z', invoice: '2026-01-24T08:43:56.069Z', payment_1: '2026-01-24T08:43:56.069Z', balance: null, …}
```

### Thoughts

- **OVERVIEW**

* The addition of 'NPM RUN BUILD' to the workflow seems to have worked. But the fix to get the 'invoice' event to flush when I exited after acknowledging it did not work. However, when I went and did the next event, too, by making payment_1, then exited, it did flush both events as expected. But, after that it triggered a second payment_1 event and passed it as "already processed" — this second API call created an entire second workflow run in GitHub Actions which we do not want to happen. I thought was had fixed this already but it doesn't seem to have applied to all cases.

- **UNEXPECTED**

* Weird — pushing to save this file and it appears that last push only saved edits to `.github/workflows/user-exit-events.yml` and `assets/docs/v5/v5_5_0/TESTS_05_.md` — but that was it. I noticed because when saving the changes to this file in a push it saved changes to `api/track-event.js`, `assets/docs/v5/v5_5_0/LOG_05.md` , `assets/docs/v5/v5_5_0/TESTS_05_.md`, and `src/App.tsx` — which all should have gone through before my testing.

- **NEXT**

* I'll share these just to make sure that, if there is behavior that wasn't addressed in those files last fix, then we can address those cases too.
* Looks like I'll have to retest to see if something like the "invoice" event going through properly by it self is still an issue.
