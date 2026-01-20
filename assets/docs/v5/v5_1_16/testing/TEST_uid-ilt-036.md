# Testing `assets/jobs/uid-ilt-036.json` Feedback

## Summary 

Details tracking what is and isn't working end-to-end, after the addition of a new job, through to payment completion, if possible, and where the blocker(s) were located, if not possible to complete job payments. "Admin" = human or AI manual action. 

---

## Test Confirmations Structure 

### **PHASE 1:** Backend New Job Setup 

  1. Admin job JSON file and directory updates 
  2. GitHub `admin-push.yml` Workflow Stripe catalog objects created 
  3. GitHub `admin-push.yml` Workflow Stripe object ID artifacts added to JSON 
  4. GitHub `admin-push.yml` Workflow contract created, added to repository, JSON artifacts added 
  5. GitHub `admin-push.yml` Workflow invoice created, added to repository, JSON artifacts added 
  6. GitHub `admin-push.yml` Workflow balance created, added to repository, JSON artifacts added 
  7. GitHub `admin-push.yml` Workflow manifest updated 

### **PHASE 2:** Frontend Functionality 

  1. User login, `user-exit-events.yml` event collection, 

.... 
  2. User exit 10-min delayed JSON updated `state.client_status.logged_in` event 
  3. User login, GitHub `user-exit-events.yml` Workflow Triggered, User signs contract page and directed to invoice page 
  4. User exit 10-min delayed JSON updated `state.client_status.contract_signed` event 
  5. User login, GitHub `user-exit-events.yml` Workflow Triggered, User download/acknowledge invoice and directed to payments 
  6. Payments page load triggers Stripe object `checkout_session_1` initialization 
  7. Payment_1 complete, user sent to `checkout_session_1.return_url` 
  8. User exit 10-min delayed JSON updated `state.client_status.invoice` and `state.client_status.payment_1` events; price1.active=false 
  9. User login sent to balance page, GitHub `user-exit-events.yml` Workflow Triggered, User download/acknowledge directed to payments 
  10. Payments page load triggers Stripe object `checkout_session_2` initialization 
  11. Payment_2 complete, user sent to `checkout_session_2.return_url` 
  12. User exit delayed JSON updated `state.client_status.balance` and `state.client_status.payment_2` events; price2.active=false, product.id.active=false 

--- 

## Test Phase 1: Backend Job Setup Flow

### Step 1 — Admin Edits Job Directory JSON Files

  1. Deleted old job `assets/jobs/uid-jqf-256.json`
  2. Setup for new job creation, copied `assets/docs/uid-xxx-xxx.json` 
  3. Got new UID and placed new job JSON file `assets/jobs/uid-ilt-036.json`
  4. New JSON values added using `assets/docs/GUIDE_uid-xxx-xxx.json.md` guide
  5. Admin uses `git add .` with commit message
  6. Admin uses special `git smart-push`

### Step 2 — Workflow `admin-push.yml` Stripe Objects Created 

  1. Stripe API Request for Catalog product object archived, ID `req_hW6BSHnA9xMT9l`
  2. Product object created, ID `req_dcoV7PhpOT54OU`
  3. Associated customer object created, ID `req_8ylP23udHPCc20` 
  4. Associated price1 object created, ID `req_JSlug1HEzQVLjw` 
  5. Associated price2 object created, ID `req_1oyybUuUuph1GX` 
  6. Associated coupon object created, ID `req_0DlwyD6JQvT6bJ` 

### Step 3 — JSON Updates After `admin-push.yml` Stripe Object Creation 

  1. `state.objects.created` got timestamp 
  2. `state.objects.product` added product.id as confirmation 
  3. `state.objects.price_1` received newly created Stripe price object ID for price1
  4. `state.objects.price_2` received newly created Stripe price object ID for price2
  5. `state.objects.customer` added customer.id as confirmation 
  6. `state.objects.coupon` added coupon.id as confirmation 
  7. `price1.id` newly created price object id added 
  8. `checkout_session_1.line_items.price` newly created price1.id added 
  9. `price2.id` newly created price object id added 
  10. `checkout_session_2.line_items.price` newly created price2.id added 

### Step 4 — Workflow `admin-push.yml` Contract Setup

  1. Contract created and added to repository `assets/pdf/contract/kon-ilt-036.pdf`
  2. JSON contract artifact `docs.contract.id` added "kon-ilt-036"
  3. JSON contract artifact `docs.contract.pdf` added "assets/pdf/contract/kon-ilt-036.pdf"
  4. JSON contract artifact `docs.contract.file_id` added "1VyV6DjLplQC-kZSbRCBkJB3c9jMBjK_0Ts7c8I8Aibk"
  5. JSON contract artifact `docs.contract.url` added "https://payments.august.style/assets/pdf/contract/kon-ilt-036.pdf" 
  6. JSON contract artifact `docs.contract.sha256` added "ae05ad3a03252d6de984da26d29f99a42e777717fd059d431ff498f7dce6000a"
  7. JSON contract artifact `docs.contract.created` added "2026-01-11T17:43:01.196442Z" 

### Step 5 — Workflow `admin-push.yml` Invoice Setup 

  1. Contract created and added to repository `assets/pdf/invoice/inv-ilt-036.pdf`
  2. JSON contract artifact `docs.contract.id` added "inv-ilt-036"
  3. JSON contract artifact `docs.contract.pdf` added "assets/pdf/invoice/inv-ilt-036.pdf"
  4. JSON contract artifact `docs.contract.file_id` added "13P0eWNHs5QL4iOi7E97Hm0yrlkLdmb4OYnWjw4jc3UI"
  5. JSON contract artifact `docs.contract.url` added "https://payments.august.style/assets/pdf/invoice/inv-ilt-036.pdf"
  6. JSON contract artifact `docs.contract.sha256` added "f97b8fe2132f514824a8965afaddc9967d139317d145a371d5c1f9b983ad91ba"
  7. JSON contract artifact `docs.contract.created` added "2026-01-11T17:43:06.376271Z" 

### Step 6 — Workflow `admin-push.yml` Balance Setup 

  1. Contract created and added to repository `assets/pdf/balance/bal-ilt-036.pdf`
  2. JSON contract artifact `docs.contract.id` added "bal-ilt-036"
  3. JSON contract artifact `docs.contract.pdf` added "assets/pdf/balance/bal-ilt-036.pdf"
  4. JSON contract artifact `docs.contract.file_id` added "1JeNZ13UckOP7IX3WffW2YNF3O9NKT4VtOOYUDPtTRRQ"
  5. JSON contract artifact `docs.contract.url` added "https://payments.august.style/assets/pdf/balance/bal-ilt-036.pdf" 
  6. JSON contract artifact `docs.contract.sha256` added "34a397ff889749eed4953005b59c1d977532d9cb0542dd10cbabb8de21ded709"
  7. JSON contract artifact `docs.contract.created` added "2026-01-11T17:43:11.632112Z" 

### Step 7 — Workflow `admin-push.yml` Completes With Accurate Manifest 

  1. Updated `assets/js/manifest.json` 
  2. Confirmed `assets/jobs/uid-jqf-256.json` not present on manifest 
  3. Confirmed `assets/jobs/uid-ilt-036.json` added to manifest 

---

## Test Phase 2: Frontend Functionality

### Step 1 — Login for Job `assets/jobs/uid-ilt-036.json`

  1. Load index.html at `payments.august.style` with login form
  2. Successful login using `uid-ilt-036.json`'s `product.login_name` = 'Great' and `product.login_keyword` = 'tester-job' 
  3. Login searches `assets/js/manifest.json` using 'great tester job' finding `job.great-tester-job.job_id` to load `uid-ilt-036` data 

### Step 2 — Loads `job.great-tester-job.job_id` Contract

  1. Normal `GET https://payments.august.style/uid-ilt-036 404 (Not Found)` calls `assets/js/payment-lookup.js` to handle form submission and job lookup via manifest — **NOTE: this was old architecture flow**

**CONSOLE LOG ERROR** 

```plaintext 
  GET https://payments.august.style/uid-ilt-036 404 (Not Found)
j @ assets/main-Bp3rihTn.js:1
await in j
pv @ assets/index-B6Js_b1r.js:8
(anonymous) @ assets/index-B6Js_b1r.js:8
Bi @ assets/index-B6Js_b1r.js:8
Qc @ assets/index-B6Js_b1r.js:8
Pc @ assets/index-B6Js_b1r.js:9
Z1 @ assets/index-B6Js_b1r.js:9
job-D0UhcQRj.js:100 Vite: job.tsx loaded
index-B6Js_b1r.js:8 Uncaught Error: Minified React error #310; visit https://react.dev/errors/310 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at gl (index-B6Js_b1r.js:8:49133)
    at an (index-B6Js_b1r.js:8:55626)
    at Object.kf [as useEffect] (index-B6Js_b1r.js:8:55850)
    at P1.B.useEffect (index-B6Js_b1r.js:1:12303)
    at iO (job-D0UhcQRj.js:100:71655)
    at Vf (index-B6Js_b1r.js:8:47863)
    at ic (index-B6Js_b1r.js:8:70601)
    at Yy (index-B6Js_b1r.js:8:80928)
    at mv (index-B6Js_b1r.js:8:116580)
    at t1 (index-B6Js_b1r.js:8:115643)
gl @ index-B6Js_b1r.js:8
an @ index-B6Js_b1r.js:8
kf @ index-B6Js_b1r.js:8
P1.B.useEffect @ index-B6Js_b1r.js:1
iO @ job-D0UhcQRj.js:100
Vf @ index-B6Js_b1r.js:8
ic @ index-B6Js_b1r.js:8
Yy @ index-B6Js_b1r.js:8
mv @ index-B6Js_b1r.js:8
t1 @ index-B6Js_b1r.js:8
Hc @ index-B6Js_b1r.js:8
fv @ index-B6Js_b1r.js:8
Ov @ index-B6Js_b1r.js:8
At @ index-B6Js_b1r.js:1
```