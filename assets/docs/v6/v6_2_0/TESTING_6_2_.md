# Testing v6.2.0

---

## Testing Notes 
+ **Testing Date:** 2026-01-30
+ **Status:** Testing UI updates from `TESTING_06_01_.md` 
+ **Logging:** `LOG_06_02.md`
+ **Test Files:** 
  - `uid-alw-779.json` - Wilson; alw-social-media
  - `uid-gmq-600.json` - Dave; gmq-website

### Testing Focus 

+ Removed the mid-flow PDF downloads and updated the toolbar and completion page download experience.
  - New copy for the toolbar on contract, invoice, and balance pages. 
  - New copy for the completion page download button. 

* **Download button on Completion1 and Completion2 pages should download a combined PDF of the contract, invoice, and balance.**

---

## Test: "uid-alw-779.json" 
+ Wilson, alw-social-media

### Events Needed
+ Session #1
  - API call — `state.client_status.logged_in`, `state.client_status.invoice`, `state.client_status.contract_signed`, `contract.signatures.client.legal_name`, `contract.signatures.client.date_signed` 
  - API call — `state.client_status.payment_1`, `price1.active = "false"`
+ Session #2
  - API call — `state.client_status.balance` 
  - API call — `state.client_status.payment_2`, `price2.active = "false"`, `product.active = "false"` 

### Environment
+ Mobile, incognito window, Safari, iOS 26.2.1

### Test 
+ Session #1  
+ Session #2 

### Notes 

---

### Test: "uid-gmq-600.json" 
+ Dave, gmq-website

### Events Needed
+ Session #1
  - API call — `state.client_status.logged_in`, `state.client_status.invoice`, `state.client_status.contract_signed`, `contract.signatures.client.legal_name`, `contract.signatures.client.date_signed` 
  - API call — `state.client_status.payment_1`, `price1.active = "false"`
+ Session #2
  - API call — `state.client_status.balance` 
  - API call — `state.client_status.payment_2`, `price2.active = "false"`, `product.active = "false"` 

### Environment
+ Desktop, incognito window, Safari, macOS Tahoe 26.2

### Test 
+ Session #1 
+ Session #2 

### Notes 

---
