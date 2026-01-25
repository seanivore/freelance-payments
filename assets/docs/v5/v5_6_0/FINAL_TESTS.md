# Final Tests for v5.6.0

## Testing Notes:

+ **Testing Date:** 2026-01-24
+ **Logging:** `LOG_06.md`
+ **Test Files:** 
  - `uid-awi-104.json` - Markham; simple-gardener
  - `uid-ugz-557.json` - Kelvin; tokenized-social-media

---

## Testing Full Flow with Break

### Expected Behavior

+ Payment_1
  - User logs in and is routed to the contract page 
  - User has no issue entering date and name to sign contract 
  - User signs contract and is taken to invoice page 
  - User acknowledges invoice and is taken to payment_1 page 
  - User makes payment_1 and is taken to completion1 page, then exits
  - All events are flushed on user exit 
+ Payment_2
  - User logs in and is routed to the balance page 
  - User has no issue accepting balance and is taken to payment_2 page 
  - User makes payment_2 and is taken to completion2 page, then exits
  - All events are flushed on user exit 

### Actual Behavior - `uid-awi-104.json`

+ **BUG_06_001** - The `signed_contract` and `invoice` events weren't in the API call 
  - User went all the way through to payment_1 and Completion1 page 
  - User noted that there was no EXIT option on the Completion1 page so she went back a bunch of times; while this won't necessarily happen much in real cases, it does make sense to have an exit option on both the Completion1 and Completion2 pages 
  - Not sure why, but there were two API calls and the first was just for `logged_in` 
  - Then there was a second API call for `payment_1` 
  - User was able to go in for payment_2 because it checks for payment_1 completion which was logged 
  - **NEED TO FIND MISSING API CALLS AND SEE IF THEY CAN BE ONE BATCH; or actually maybe we just make it rule that payment event(s) updates are always at payment confirmation because I'm pretty sure that is why they're not grouping with teh exit events; but for security we need to keep that event at payment completion** 

+ **BUG_06_002** - The API events were in two separate API calls for payment_2 flow 
  - User went all the way through to payment_2 and Completion2 page 
  - The first API call had 1 event and the JSON was updated at `state.client_status.balance`
  - The second API call had 1 event and the JSON was updated at `state.client_status.payment_2` and then it changed `price2.active` to `false` and `product.active` to `false`
  - **Actually, I guess for security we need the payment completion flush for the last event, otherwise it could be completed in error and someone might get away with not paying; in that case, this would no longer be a bug other than we need to make it clear that this is expected behavior; but also we need an exit button on Completion2** 

### Actual Behavior - `uid-ugz-557.json`

+ **BUG_06_003** - The API events were in two separate API calls for payment_1 flow 
  - User went all the way through to payment_1 and Completion1 page 
  - The first API call had 3 events and the JSON was updated at `contract.signatures.client.legal_name` and `contract.signatures.client.signed_date`, `state.client_status.logged_in`, and `state.client_status.invoice` 
  - The second API call had 2 event and the JSON was updated at `state.client_status.payment_1` and then it changed `price1.active` to `false` 
  - **Actually, I guess for security we need the payment completion flush for the last event, otherwise it could be completed in error and someone might get away with not paying; in that case, this would no longer be a bug other than we need to make it clear that this is expected behavior; but also we need an exit button on Completion1** 

+ **BUG_06_004** - The API events were in two separate API calls for payment_2 flow 
  - User went all the way through to payment_2 and Completion2 page 
  - The first API call had 1 event and the JSON was updated at `state.client_status.balance`
  - The second API call had 1 event and the JSON was updated at `state.client_status.payment_2` and then it changed `price2.active` to `false` and `product.active` to `false` 
  - **Actually, I guess for security we need the payment completion flush for the last event, otherwise it could be completed in error and someone might get away with not paying; in that case, this would no longer be a bug other than we need to make it clear that this is expected behavior; but also we need an exit button on Completion2** 

* **OVERVIEW** 
  - We need exit buttons on both completion pages that close the browser tab or window 
  - We need to make it clear that the expected behavior for the 1 event with multiple updates for payment_1 and payment_2 is expect behavior for security; then ensure all others are grouped for flushing 
  - I have no idea why it skipped those events for my friends test -- wdyt? 