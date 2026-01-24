# Testing Notes for v5.6.0

+ **Testing Date:** 2026-01-24
+ **Logging:** `LOG_06.md`

## Focus Areas During Testing 

+ **Event delivery and state management** 
  - Trigger one event for each session, then exit the site 
  - One POST API call in Vercel is made for the event 
  - This should trigger single `user-exit-events.yml` workflow run 
  - Each event's workflow edits the JSON file in all appropriate places 
  - New edit to workflow should 'npm run build' after JSON commit push within GH 
  - Next login should route to correct page based on state.client_status
  - After payment_2, no events were dispatched 
+ **Main remaining issues**
  - After INVOICE alone, no events were dispatched 
  - After BALANCE alone, no events were dispatched 
  - Login after PAYMENT_1 and BALANCE needs to route to PAYMENT_2 
  - After PAYMENT_2, no events were dispatched 
+ **Problem areas from previous tests**
  - `assets/docs/v5/v5_5_0/LOG_05.md` of `assets/docs/v5/v5_5_0/TESTS_05_.md` 
  - `assets/docs/v5/v5_4_0/LOG_04.md` 
  - `assets/docs/v5/v5_2_0/testing/LOG_03.md` 
  - OLDER: `assets/docs/v5/v5_1_16/testing/LOG_01.md` and `assets/docs/v5/v5_1_16/testing/LOG_02.md`

### New Test Files 

+ `uid-fuk-259.json` - Keegan; rodent-fight-club
+ `uid-pqu-327.json` - Elsworth; houseplant-boutique

---

## TESTING: Login Only

  + MOBILE: `uid-fuk-259.json`
  + DESKTOP: `uid-pqu-327.json`

### Expected Behavior

+ User logs in and is routed to the contract page 
+ User has no issue entering date and name to sign contract 
+ User cancels signing contract and exits the site 
+ All events are flushed on user exit 
+ Vercel has 1 POST API call for `state.client_status.logged_in` 
+ Workflow runs and updates the JSON file with the timestamp for `state.client_status.logged_in` 
+ `NPM RUN BUILD` is run after JSON update ensuring next login routes user to contract again 

### Actual Behavior

+ **Mobile**

  1. User logs in, starts contract, cancels and exits 
  2. Vercel has 1 POST API call: ✅ Dispatched workflow with 1 event(s) for job uid-fuk-259
  3. Vercel deployment (Bjz8YdJJ95BNC6zt5g2fJAwekMZS) with commit 32f7132 
  4. Commit shows JSON accurately updated with timestamp for `state.client_status.logged_in` 
  5. GitHub Action "User Exit Events #149" is "Processing 1 events for uid-fuk-259" 
  6. GitHub Action event "Updated logged_in: 2026-01-24T12:34:21.271Z" and "Successfully pushed changes" before `NPM RUN BUILD`
  7. Went to login again and was routed to the contract page; logged_in timestamp visible in console log 

+ **Desktop**
  1. User logs in, starts contract, cancels and exits 
  2. Nothing happens in incognito Chrome window; no API calls, no workflow runs, no JSON updates
  3. I saved this document by pushing manually, then turned on my VPN, and then used Dia/Arc/TheBrowserCompany incognito window to test again 
  4. Vercel has 1 POST API call: ✅ Dispatched workflow with 1 event(s) for job uid-pqu-327 
  5. Vercel deployment (DYuyJBRsar9m69wRKCXXUpwgmJvP) with commit 7505d1f 
  6. Commit shows JSON accurately updated with timestamp for `state.client_status.logged_in` 
  7. GitHub Action "User Exit Events #150" is "Processing 1 events for uid-pqu-327" 
  8. GitHub Action event "Updated logged_in: 2026-01-24T12:48:24.511Z" and "Successfully pushed changes" before `NPM RUN BUILD`
  9. Went to login again and was routed to the contract page; logged_in timestamp visible in console log 

### RESULTS: Successful expected behavior 💎 ✅

+ All events are flushed on user exit 
+ Vercel has 1 POST API call for `state.client_status.logged_in` 
+ Workflow runs and updates the JSON file with the timestamp for `state.client_status.logged_in` 
+ NPM RUN BUILD is run after JSON update ensuring next login routes to correct page

---

## TESTING: Sign Contract Only 

  + MOBILE: `uid-ugz-557.json`
  + DESKTOP: `uid-pqu-327.json`

### Expected Behavior

+ User logs in and is routed to the contract page 
+ User has no issue entering date and name to sign contract 
+ Submission of contract signature successfully routes use to invoice page next 
+ User scrolls invoice, but does not click to acknowledge invoice; leaves website 
+ All events are flushed on user exit 
+ Vercel has 1 POST API call for `state.client_status.contract_signed` 
+ Workflow runs and updates the JSON file with the timestamp for `state.client_status.contract_signed` 
+ `NPM RUN BUILD` is run after JSON update ensuring next login routes user directly to invoice page 

### Actual Behavior

+ **Mobile**

  1. User logs in, starts contract, enters date and name to sign contract, submits signature 
  2. Vercel has 1 POST API call: ✅ Dispatched workflow with 1 event(s) for job uid-fuk-259
  3. Vercel deployment (Cu1GN375eCGXDu7y5f1SWG4Hq69U) with commit 6900d6f 
  4. Commit shows JSON accurately updated: 
    - Timestamp for `state.client_status.contract_signed` 
    - Full name for `contract.signatures.client.legal_name` 
    - Signed date for `contract.signatures.client.signed_date` 
  5. GitHub Action "User Exit Events #151" is "Processing 1 events for uid-fuk-259" 
    - Updated contract_signed: 2026-01-24T13:02:38.076Z
    - Updated contract signature legal_name: Kevin Keegan
    - Updated contract signature signed_date: Jan 24, 2026
  6. GitHub Action event "Successfully pushed changes" before `NPM RUN BUILD`
  7. Went to login again and was routed to the invoice page

+ **Desktop**

  1. User logs in, starts contract, enters date and name to sign contract, submits signature 
  2. Vercel has 1 POST API call: ✅ Dispatched workflow with 1 event(s) for job uid-pqu-327
  3. Vercel deployment (9Mvwy8Mtc7KFET7Wyw4ykdGkY8tw) with commit b478107
  4. Commit shows JSON accurately updated: 
    - Timestamp for `state.client_status.contract_signed` 
    - Full name for `contract.signatures.client.legal_name` 
    - Signed date for `contract.signatures.client.signed_date`
  5. GitHub Action "User Exit Events #152" is "Processing 1 events for uid-pqu-327" 
    - Updated contract_signed: 2026-01-24T13:02:38.076Z
    - Updated contract signature legal_name: Elsworth
    - Updated contract signature signed_date: Jan 24, 2025
  6. GitHub Action event "Successfully pushed changes" before `NPM RUN BUILD`
  7. Went to login again and was routed to the invoice page

### RESULTS: Successful expected behavior 💎 ✅

+ All events are flushed on user exit 
+ Vercel has 1 POST API call for `state.client_status.contract_signed` 
+ Workflow runs and updates the JSON file with the timestamp for `state.client_status.contract_signed` 
+ `NPM RUN BUILD` is run after JSON update ensuring next login routes user directly to invoice page 

---

## TESTING: Acknowledge Invoice Only 

  + MOBILE: `uid-fuk-259.json`
  + DESKTOP: `uid-pqu-327.json`

### Expected Behavior

+ User logs in and is routed to the invoice page 
+ User has no issue acknowledging invoice, which redirects her to checkout for payment_1 where user exits
+ All events are flushed on user exit 
+ Vercel has 1 POST API call for `state.client_status.invoice`, along with API call for starting the checkout session 
+ Workflow runs and updates the JSON file with the timestamp for `state.client_status.invoice` 
+ `NPM RUN BUILD` is run after JSON update ensuring next login routes user directly to payment_1 page 

### Actual Behavior

+ **Mobile**

  1. User logs in, starts invoice, acknowledges invoice, let's payment_1 page load, then exits the site  
  2. Vercel has 1 POST API call: ✅ Dispatched workflow with 1 event(s) for job uid-fuk-259
  3. Vercel deployment (Eg3vmo4eu9gTjPqy1jjGwfgmnGZu) with commit 1d81fbb 
  4. Commit shows JSON accurately updated: 
    - Timestamp for `state.client_status.invoice` 
  5. GitHub Action "User Exit Events #153" is "Processing 1 events for uid-fuk-259" 
    - Updated invoice: 2026-01-24T13:15:24.241Z 
  6. GitHub Action event "✅ Successfully pushed changes" before `NPM RUN BUILD`
  7. Went to login again and was routed directly to payment_1 checkout page

+ **Desktop**

  1. User logs in, starts invoice, acknowledges invoice, let's payment_1 page load, then exits the site  
  2. Vercel has 1 POST API call: ✅ Dispatched workflow with 1 event(s) for job uid-pqu-327
  3. Vercel deployment (Bd3rxr3vkNmvVH4kLvmVRBzKLq1S) with commit 1f17186
  4. Commit shows JSON accurately updated: 
    - Timestamp for `state.client_status.invoice` 
  5. GitHub Action "User Exit Events #154" is "Processing 1 events for uid-pqu-327" 
    - Updated invoice: 2026-01-24T13:20:15.546Z 
  6. GitHub Action event "✅ Successfully pushed changes" before `NPM RUN BUILD`
  7. Went to login again and was routed directly to payment_1 checkout page

### RESULTS: Successful expected behavior 💎 ✅

+ All events are flushed on user exit 
+ Vercel has 1 POST API call for `state.client_status.invoice`, along with API call for starting the checkout sessions 
+ Workflow runs and updates the JSON file with the timestamp for `state.client_status.invoice` 
+ `NPM RUN BUILD` is run after JSON update ensured next login routes user directly to payment_1 page 

---

## TESTING: Make Payment_1 Only 

  + MOBILE: `uid-fuk-259.json`
  + DESKTOP: `uid-pqu-327.json`

### Expected Behavior

+ User logs in and is routed to the payment_1 checkout page 
+ User has no issue making payment_1, the Completion1 page loads, and then user exits the site 
+ All events are flushed on user exit 
+ Vercel has 1 POST API call for `state.client_status.payment_1` 
+ Workflow runs and updates the JSON file with the timestamp for `state.client_status.payment_1` 
+ `NPM RUN BUILD` is run after JSON update ensuring next login routes user directly to completion1 page 

### Actual Behavior

+ **Mobile**

  1. User logs in, starts payment_1 checkout, makes payment_1, gets Completion1 page load, then exits the site  
  2. Vercel has 1 POST API call: ✅ Dispatched workflow with 1 event(s) for job uid-fuk-259 
  3. Vercel deployment (Fuk5tCiJ5yFQt3HkiQbYXFchY2yo) with commit a247f8d
  4. Commit shows JSON accurately updated:
    - Timestamp for `state.client_status.payment_1`
    - Deactivated `price1.active`: `true`
  5. GitHub Action "Exit Events #155" is "Processing 1 events for uid-fuk-259" 
    - Updated payment_1: 2026-01-24T13:26:09.457Z
    - Deactivated price1
  6. GitHub Action event "✅ Successfully pushed changes" before `NPM RUN BUILD`
  7. Went to login again and was routed directly to balance page 

+ **Desktop**

  1. User logs in, starts payment_1 checkout, makes payment_1, gets Completion1 page load, then exits the site  
  2. Vercel has 1 POST API call: ✅ Dispatched workflow with 1 event(s) for job uid-pqu-327
  3. Vercel deployment (EVdPxAw16mx4Un7kS3EkruiLeNnU) with commit bbfcaa0
  4. Commit shows JSON accurately updated:
    - Timestamp for `state.client_status.payment_1`
    - Deactivated `price1.active`: `true`
  5. GitHub Action "User Exit Events #156" is "Processing 1 events for uid-pqu-327" 
    - Updated payment_1: 2026-01-24T13:31:53.790Z
    - Deactivated price1
  6. GitHub Action event "✅ Successfully pushed changes" before `NPM RUN BUILD`
  7. Went to login again and was routed directly to balance page 

### RESULTS: Successful expected behavior 💎 ✅

+ All events are flushed on user exit 
+ Vercel has 1 POST API call for `state.client_status.payment_1` 
+ Workflow runs and updates the JSON file with the timestamp for `state.client_status.payment_1` 
+ `NPM RUN BUILD` is run after JSON update ensuring next login routes user directly to balance page 

---

## TESTING: Accept Balance Only 

  + MOBILE: `uid-fuk-259.json`
  + DESKTOP: `uid-pqu-327.json`

### Expected Behavior

+ User logs in and is routed to the balance page 
+ User has no issue accepting balance, which redirects to checkout for payment_2 where user exits the site
+ All events are flushed on user exit 
+ Vercel has 1 POST API call for `state.client_status.balance` 
+ Workflow runs and updates the JSON file with the timestamp for `state.client_status.balance` 
+ `NPM RUN BUILD` is run after JSON update ensuring next login routes user directly to payment_2 page 

### Actual Behavior

+ **Mobile**

  1. User logs in, starts balance, accepts balance, let's payment_2 page load, then exits the site  
  2. Vercel has 1 POST API call: ✅ Dispatched workflow with 1 event(s) for job uid-fuk-259
  3. Vercel deployment (FqebfaRwYLPBWzNbQVPqtRGTKvGy) with commit f770e83
  4. Commit shows JSON accurately updated:
    - Timestamp for `state.client_status.balance`
  5. GitHub Action "User Exit Events #157" is "Processing 1 events for uid-fuk-259" 
    - Updated balance: 2026-01-24T13:36:36.065Z
  6. GitHub Action event "✅ Successfully pushed changes" before `NPM RUN BUILD`
  7. Went to login again and was routed directly to payment_2 checkout page

+ **Desktop**

  1. User logs in, starts balance, accepts balance, let's payment_2 page load, then exits the site  
  2. Vercel has 1 POST API call: ✅ Dispatched workflow with 1 event(s) for job uid-pqu-327
  3. Vercel deployment (6RLuro7pnexrxriAdQZp5xehrdyy) with commit f408bc2
  4. Commit shows JSON accurately updated:
    - Timestamp for `state.client_status.balance`
  5. GitHub Action "User Exit Events #158" is "Processing 1 events for uid-pqu-327" 
    - Updated balance: 2026-01-24T13:39:50.041Z
  6. GitHub Action event "✅ Successfully pushed changes" before `NPM RUN BUILD`
  7. Went to login again and was routed directly to payment_2 checkout page

### RESULTS: Successful expected behavior 💎 ✅

+ All events are flushed on user exit 
+ Vercel has 1 POST API call for `state.client_status.balance` 
+ Workflow runs and updates the JSON file with the timestamp for `state.client_status.balance` 
+ `NPM RUN BUILD` is run after JSON update ensuring next login routes user directly to payment_2 page 

---

## TESTING: Make Payment_2 to finish flow 

  + MOBILE: `uid-fuk-259.json`
  + DESKTOP: `uid-pqu-327.json`

### Expected Behavior

+ User logs in and is routed directly to checkout for payment_2  
+ User has no issue making payment_2, the Completion2 page loads, and then user exits the site 
+ All events are flushed on user exit 
+ Vercel has 1 POST API call for `state.client_status.payment_2` 
+ Workflow runs and updates the JSON file with the timestamp for `state.client_status.payment_2` 
+ `NPM RUN BUILD` is run after JSON update  

### Actual Behavior

+ **Mobile**

  1. User logs in, starts payment_2 checkout, makes payment_2, gets Completion2 page load, then exits the site  
  2. Vercel has 1 POST API call: ✅ Dispatched workflow with 1 event(s) for job uid-fuk-259
  3. Vercel deployment (EvMCaoszPp4bxZZHbq4oxvqq1KGq) with commit 56bfae5
  4. Commit shows JSON accurately updated:
    - Timestamp for `state.client_status.payment_2`
    - Deactivated `price2.active`: `true`
    - Deactivated `product.active`: `true`
  5. GitHub Action "User Exit Events #160" is "Processing 1 events for uid-fuk-259" 
    - Updated payment_2: 2026-01-24T13:46:27.833Z
    - Deactivated price2
    - Deactivated product
  6. GitHub Action event "✅ Successfully pushed changes" before `NPM RUN BUILD`

+ **Desktop**

  1. User logs in, starts payment_2 checkout, makes payment_2, gets Completion2 page load, then exits the site  
  2. Vercel has 1 POST API call: ✅ Dispatched workflow with 1 event(s) for job uid-pqu-327
  3. Vercel deployment (AAmWA52ftqLkRzi6jkapKac9FrgH) with commit 508c49d
  4. Commit shows JSON accurately updated:
    - Timestamp for `state.client_status.payment_2`
    - Deactivated `price2.active`: `true`
    - Deactivated `product.active`: `true`
  5. GitHub Action "User Exit Events #159" is "Processing 1 events for uid-pqu-327" 
    - Updated payment_2: 2026-01-24T13:43:49.264Z
    - Deactivated price2
    - Deactivated product
  6. GitHub Action event "✅ Successfully pushed changes" before `NPM RUN BUILD`

### RESULTS: Successful expected behavior 💎 ✅

+ All events are flushed on user exit 
+ Vercel has 1 POST API call for `state.client_status.payment_2` 
+ Workflow runs and updates the JSON file with the timestamp for `state.client_status.payment_2` 
+ `NPM RUN BUILD` is run after JSON update  