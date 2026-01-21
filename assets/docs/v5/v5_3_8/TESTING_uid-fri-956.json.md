# Testing uid-fri-956.json

**TEST JOB STATE:** New job, user first login 
**LOGIN NAME-KEYWORD:** Clayton more-ceramics

## First `admin-push.yml` Workflow Run 

+ User added new JSON file and pushed to activate `admin-push.yml` 

### Vercel Deployments 

+ Vercel deployment: Cz1Hs7F1RwBGdTc4cN3kQYerhXp2 
  - Commit 22a19c3
  - Implemented the stabilization plan by... 
+ Vercel deployment: EiNT1eMYRLjxVWxUqHuKAM8UUnnk
  - Commit c4db4ab: 
  - Auto-update: Stripe catalog sync and manifest update

### Stripe Catalog 

+ New JSON in `admin-push.yml` create objects 
  - product.created: evt_1Srqow9fljwH26CPTqzdOqkb
  - customer.created: evt_1Srqow9fljwH26CP5QRgdHbD
  - price.created: evt_1Srqow9fljwH26CPhbjgf1zH
  - price.created: evt_1Srqow9fljwH26CPxLe52BdS
  - coupon.created: evt_1Srqox9fljwH26CPSVE4X0pJ

### GitHub Actions 

+ Admin Push Workflow #195 
  - Commit 22a19c3 
+ Auto-update: Stripe catalog sync and manifest update 
  - Commit c4db4ab

---

## Admin Push Saving This Document 

+ Activates `admin-push.yml` workflow 

### Vercel Deployments 

+ Vercel deployment: 2nh1LW1EnDXc4MFu3PAbmBhM3QY2
  - Commit ba57902
  - Started new testing log
+ Vercel deployment: AEQFPqTj9MTrg2Dj3ecz2xLqK73g
  - Commit e1328ef
  - Auto-update: Stripe catalog sync and manifest update

### GitHub Actions 

+ Admin Push Workflow #196 
  - Commit ba57902
+ Auto-update: Stripe catalog sync and manifest update
  - Commit e1328ef

---

## User First Payment Flow

+ User login, signs contract, views invoice, and makes payment_1 then exits; exit triggers `user-exit-events.yml` flushes events  

### Vercel API Calls & Webhooks 

1. `/api/create-checkout-session`
2. `/api/session-status`
3. `/api/track-event` ✅ Dispatched workflow with 6 event(s) for job uid-fri-956
4. `/api/webhook` ℹ️  Payment event will be included in frontend event batch (not triggering separate workflow)
5. `/api/webhook` ✅ Payment completed: uid-fri-956 - Payment 1
6. `/api/track-event` ✅ Dispatched workflow with 3 event(s) for job uid-fri-956

### GitHub Actions Workflows 

+ User Exit Events #133
  - Commit e1328ef 
  - Process Exit Events 

```plaintext 
Run echo "🧾 Job ID: $JOB_ID"
🧾 Job ID: uid-fri-956
🧮 Payload event count: 6
🔐 Payload sha256: 278dc788494321b5bb145ed6f4b4c3dd02231872b3aa22560f0e7caf82365847
From https://github.com/seanivore/freelance-payments
 * branch            freelance-payments -> FETCH_HEAD
From https://github.com/seanivore/freelance-payments
 * branch            freelance-payments -> FETCH_HEAD
Already up to date.
Processing 6 events for uid-fri-956...
  ✓ Updated logged_in: 2026-01-21T02:31:37.864Z
  ℹ️  Skipping contract_loaded - informational event only
  ✓ Updated contract_signed: 2026-01-21T02:32:02.415Z
  ✓ Updated contract signature legal_name: Clayton Claymore
  ✓ Updated contract signature signed_date: 2026-01-21
  ℹ️  Skipping contract_loaded - informational event only
  ✓ Updated invoice: 2026-01-21T02:32:21.629Z
  ✓ Updated payment_1: 2026-01-21T02:32:21.630Z
  ✓ Deactivated price1
✅ Successfully updated assets/jobs/uid-fri-956.json
```
  - Commit changes 

```plaintext 
Run git config --global user.name 'github-actions[bot]'
[freelance-payments 8954f7e] Update user behavior stats
 1 file changed, 163 insertions(+), 163 deletions(-)
To https://github.com/seanivore/freelance-payments
   e1328ef..8954f7e  freelance-payments -> freelance-payments
✅ Successfully pushed changes
```
  - Trigger Vercel Deploy 

```plaintext 
Run if [ -n "$VERCEL_DEPLOY_HOOK" ]; then
ℹ️  No VERCEL_DEPLOY_HOOK secret configured - relying on push-triggered deploy
```

+ User Exit Events #134
  - Commit e1328ef
  - Process Exit Events 

```plaintext 
Run echo "🧾 Job ID: $JOB_ID"
🧾 Job ID: uid-fri-956
🧮 Payload event count: 3
🔐 Payload sha256: 5b632136d0f3329d579f163562398706ff47d9091a7fe9dcec942ccaf2b4440a
From https://github.com/seanivore/freelance-payments
 * branch            freelance-payments -> FETCH_HEAD
From https://github.com/seanivore/freelance-payments
 * branch            freelance-payments -> FETCH_HEAD
Already up to date.
Processing 3 events for uid-fri-956...
  ⏭️  Skipping logged_in - already processed at 2026-01-21T02:31:37.864Z
  ℹ️  Skipping contract_loaded - informational event only
  ⏭️  Skipping payment_1 - already processed at 2026-01-21T02:32:21.630Z
ℹ️  No state changes required.
``` 

  - Commit Changes 

```plaintext 
Run git config --global user.name 'github-actions[bot]'
ℹ️  No local changes to commit
```

### Vercel Deployments 

+ Vercel deployment: 7fKVJj74yF6Kas2ejinoh9UnBLnX
  - Commit 8954f7e
  - "Update user behavior stats" 
  - Added two values to Added two `contract.signatures.client`
  - Added `state.client_status.logged_in`, `contract_signed`, `invoice`, `payment_1` timestamps 
  - Updated `price1.active` to `false` 

### Stripe Events 

+ payment_intent.created: evt_3SrrDf9fljwH26CP1bHhnx6I
+ coupon.updated: evt_1SrrDi9fljwH26CPaYRdrMpd
+ customer.discount.created: evt_1SrrDi9fljwH26CPrE0ekFha
+ charge.succeeded: evt_3SrrDf9fljwH26CP1Te1BMQt
+ payment_intent.succeeded: evt_3SrrDf9fljwH26CP1svoQjMR
+ checkout.session.completed: evt_1SrrDi9fljwH26CPSHUZuoUP (webhook events sent)
+ charge.updated: evt_3SrrDf9fljwH26CP1IF1cC7Z

---

## Admin Push Saving Changes To This Document 

+ Activates `admin-push.yml` workflow 

### Vercel Deployments 

+ Vercel deployment: 7q64TxkbmNwKE1NzXjKNt1SPR4cr
  - Commit 8040bc1
  - Updated testing document
+ Vercel deployment: EsKF9hKLaRTV8WD3ie2YQm6nwn2e
  - Commit 6621a7c
  - Auto-update: Stripe catalog sync and manifest update

### GitHub Actions 

+ Admin Push Workflow #197  
  - Commit 8040bc1
+ Auto-update: Stripe catalog sync and manifest update
  - Commit 6621a7c

---

## User Second Payment Flow 

+ User login, views balance PDF, and makes payment_2 then exits; exit triggers `user-exit-events.yml` flushes events 

### Browser Console Logs 

+ Loaded balance PDF after login 

```plaintext 
  GET https://payments.august.style/uid-fri-956 404 (Not Found)
S @ assets/main-BgpHDfX3.js:1
await in S
pv @ index-C8XLP5Y7.js:8
(anonymous) @ index-C8XLP5Y7.js:8
Bi @ index-C8XLP5Y7.js:8
Qc @ index-C8XLP5Y7.js:8
Pc @ index-C8XLP5Y7.js:9
Z1 @ index-C8XLP5Y7.js:9
job-BG2VgR8M.js:59 Vite: job.tsx loaded
job-BG2VgR8M.js:1 ✅ Loaded job data for uid-fri-956: {logged_in: '2026-01-21T02:31:37.864Z', contract_signed: '2026-01-21T02:32:02.415Z', invoice: '2026-01-21T02:32:21.629Z', payment_1: '2026-01-21T02:32:21.630Z', balance: null, …}
```

+ Made payment_2 
+ Completion2 loaded 
+ User exited 

### Vercel API Calls & Webhooks 

1. `/api/create-checkout-session`
2. `/api/session-status`
3. `/api/track-event` ✅ Dispatched workflow with 3 event(s) for job uid-fri-956
4. `/api/webhook` ℹ️  Payment event will be included in frontend event batch (not triggering separate workflow)
5. `/api/webhook` ✅ Payment completed: uid-fri-956 - Payment 2
6. `/api/track-event` ✅ Dispatched workflow with 2 event(s) for job uid-fri-956

### GitHub Actions Workflows 

+ User Exit Events #135 **EVENT LINKS TO OLD COMMIT** 
  - Commit 6621a7c
  - Auto-update: Stripe catalog sync and manifest update 
  - Process Exit Events **interesting that it says "ALREADY PROCESSED"; missing deactivated price2 and product**

```plaintext 
Run echo "🧾 Job ID: $JOB_ID"
🧾 Job ID: uid-fri-956
🧮 Payload event count: 3
🔐 Payload sha256: b547361b462e3ec247540cb628644678386125d4becc6b339791e35dcca7c763
From https://github.com/seanivore/freelance-payments
 * branch            freelance-payments -> FETCH_HEAD
From https://github.com/seanivore/freelance-payments
 * branch            freelance-payments -> FETCH_HEAD
Already up to date.
Processing 3 events for uid-fri-956...
  ℹ️  Skipping contract_loaded - informational event only
  ✓ Updated balance: 2026-01-21T03:00:24.907Z
  ⏭️  Skipping payment_2 - already processed at 2026-01-21T03:00:38.182Z
✅ Successfully updated assets/jobs/uid-fri-956.json
```

  - Commit Changes **Doesn't match commit linked in events, but they are accurate here**

```plaintext 
Run git config --global user.name 'github-actions[bot]'
[freelance-payments 071e938] Update user behavior stats
 1 file changed, 1 insertion(+), 1 deletion(-)
To https://github.com/seanivore/freelance-payments
   d20810a..071e938  freelance-payments -> freelance-payments
✅ Successfully pushed changes
```
  - Trigger Vercel Deploy 

```plaintext 
Run if [ -n "$VERCEL_DEPLOY_HOOK" ]; then
ℹ️  No VERCEL_DEPLOY_HOOK secret configured - relying on push-triggered deploy
```

+ User Exit Events #136
  - Commit 6621a7c **Links to wrong commit again**
  - Auto-update: Stripe catalog sync and manifest update 
  - Process Exit Events **this one has correct file updates, but was in second batch**

```plaintext 
Run echo "🧾 Job ID: $JOB_ID"
🧾 Job ID: uid-fri-956
🧮 Payload event count: 2
🔐 Payload sha256: 8fe04410fd09d8bf2479f9bb502236f2034d6053f5041a3ace2a083998416c7d
From https://github.com/seanivore/freelance-payments
 * branch            freelance-payments -> FETCH_HEAD
From https://github.com/seanivore/freelance-payments
 * branch            freelance-payments -> FETCH_HEAD
Already up to date.
Processing 2 events for uid-fri-956...
  ℹ️  Skipping contract_loaded - informational event only
  ✓ Updated payment_2: 2026-01-21T03:00:38.182Z
  ✓ Deactivated price2
  ✓ Deactivated product
✅ Successfully updated assets/jobs/uid-fri-956.json
```

  - Commit Changes **First commit number matches one linked in both events (update of manifest timestamp) and second is accurate**

```plaintext 
Run git config --global user.name 'github-actions[bot]'
[freelance-payments d20810a] Update user behavior stats
 1 file changed, 3 insertions(+), 3 deletions(-)
To https://github.com/seanivore/freelance-payments
   6621a7c..d20810a  freelance-payments -> freelance-payments
✅ Successfully pushed changes
```

  - Trigger Vercel Deploy 

```plaintext 
Run if [ -n "$VERCEL_DEPLOY_HOOK" ]; then
ℹ️  No VERCEL_DEPLOY_HOOK secret configured - relying on push-triggered deploy
```
+ **NOTE:** On the front end of GitHub, top of the repo where it shows the most recent commit, it says: 
  - github-actions[bot] 
  - Update user behavior stats 
  - Commit 071e938 
  - It shows `state.client_status.balance` updated with timestamp 
  - **NO OTHER CHANGES** 
+ Then when you click through that commit to see the list of commits to the repo in order the next is 
  - Commit d20810a
  **THIS IS ACCURATE AND INCLUDES REMAINING FILE UPDATES** 

### Vercel Deployments 

+ Vercel deployment: 4Fe8Hri7JSNCZ3RcMSAfj1d2HH1u
  - Commit d20810a
  - "Update user behavior stats" 
  - Added `state.client_status.payment_2` timestamp
  - Deactivated `price2.active` and `product.active` to `false` 
+ Vercel deployment: G8iR5L1MCaMEoxQ2YoNrUGqZyyXG
  - Commit 071e938
  - "Update user behavior stats" 
  - Added `state.client_status.balance` timestamp 

### Stripe Events 
+ payment_intent.created: evt_3Srrep9fljwH26CP0INdPVGq
+ charge.succeeded: evt_3Srrep9fljwH26CP0ouwM754
+ payment_intent.succeeded: evt_3Srrep9fljwH26CP02CTTfSc
+ checkout.session.completed: evt_1Srrer9fljwH26CPGVX9pe8T (webhook events sent)
+ charge.updated: evt_3Srrep9fljwH26CP0JKo5Od6

---

## Conclusions 

### Results 

  + ✅ Testing went smoothly with no errors on the User end 
  + ❌ Events were still in two batches, two deployments, two workflows, two commits 

### Observations From Comparing Logs 

- ❌ The events were still separated into two batches 
- ✅ Vercel shows the deployments in correct order, links to correct commits, shows file updates in correct order 
- ❌ GitHub Actions workflows are backwards, linked to incorrect commits which show file update to manifest timestamp
- ✅ The commits show in the actual workflow of the two batches appear to be accurate  
- ✅ Repository Commit log is accurate and links to proper file updates matching Vercel 

### Thoughts 

- The inaccurate matching of Commits to Events didn't cause issue this time, but it makes me think this is the kind of thing that happened in the previous bug. 
- I suspect and am hoping that the reason this flow was successful was because of the changes to the Git command used in the workflow. If we could confirm this, it should mean that we won't run into the previous bug's conflict again. 

### Can We Answer Any of the Following Questions?

  1. Why the commits linked in the GitHub Actions are incorrect? 
    - Is this cause for concern? 
  3. Why the events are still in two batches? 
    - Does it change anything to know that getting them to one batch has *apparently* been a struggle for many agents in many bug patches? 
    - Is it a cause for concern or are the following questions enough to potentially clear any concern? 
  4. Does the updated git command eliminate need to worry about conflicts from these multiple batches? 
  5. Given the logic of the process flow shown at line 222 of `assets/docs/v5/v5_2_0/testing/BUG_03_009.md`, should we be okay with just simplified git commands? 
    - If so should we update the `admin-push.yml` workflow's git command? 
    - And review for possible updates to the "git smart-push" command that we use: `.gitconfig-smart-push.sh`? 
  6. The core of the issue was that the dist copy of the JSON file was not updated accurately, most recently in a bug where it had a copy of the JSON in a state that none of our logs showed being created. 
    - Knowing that the core issue is rather simple, is there a way to create better visibility into the JSON files being updated in dist after building and deploying? 
    - If so, does that mean there would be a method to create a validation check before workflow runs proceed or after they complete? 
    - In general, are there other ways to think about solutions considering we know this core cause, but are foggy on reliability of it always being accurate? 

* **Given the answers to those questions and the results of this testing, what would you advise?**