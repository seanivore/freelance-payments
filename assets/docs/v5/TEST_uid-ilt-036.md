# Testing `assets/jobs/uid-ilt-036.json` Feedback

## Summary 

Details tracking what is and isn't working end-to-end, after the addition of a new job, through to payment completion, if possible, and where the blocker(s) were located, if not possible to complete job payments. "Admin" = human or AI backend manual action. 

### Testing Structure 

  **PHASE 1: Backend New Job Setup** 

  1. Admin job JSON file and directory updates 
  2. GitHub `admin-push.yml` Workflow Stripe catalog objects created 
  3. GitHub `admin-push.yml` Workflow Stripe object ID artifacts added to JSON 
  4. GitHub `admin-push.yml` Workflow contract created, added to repository, JSON artifacts added 
  5. GitHub `admin-push.yml` Workflow invoice created, added to repository, JSON artifacts added 
  6. GitHub `admin-push.yml` Workflow balance created, added to repository, JSON artifacts added 
  7. GitHub `admin-push.yml` Workflow manifest updated 

  **PHASE 2: Frontend User

  1. Live `payments.august.style` site login 

--- 

## Test Results 

### Phase 1: Backend Setup With JSON Confirmations 

  1. Admin removes and creates new freelance job files — all completed accurately ✅
    - Deleted `assets/jobs/uid-jqf-256.json`
    - Copied `assets/docs/uid-xxx-xxx.json` to `assets/jobs/uid-ilt-036.json`
    - New JSON values added using `assets/docs/GUIDE_uid-xxx-xxx.json.md` guide 
    - Admin uses `git add .` with commit message 
    - Admin uses special `git smart-push` 
  2. GitHub Action `admin-push.yml` Workflow activated — Stripe API Requests accurate ✅
    - Catalog product object archived, ID `req_hW6BSHnA9xMT9l`
    - Product object created, ID `req_dcoV7PhpOT54OU` 
    - Associated customer object created, ID `req_8ylP23udHPCc20` 
    - Associated price1 object created, ID `req_JSlug1HEzQVLjw` 
    - Associated price2 object created, ID `req_1oyybUuUuph1GX` 
    - Associated coupon object created, ID `req_0DlwyD6JQvT6bJ` 
  3. GitHub Action `admin-push.yml` Workflow — JSON updated accordingly ✅ 
    - `state.objects.created` got timestamp 
    - `state.objects.product` added product.id as confirmation 
    - `state.objects.price_1` received newly created Stripe price object ID for price1
    - `state.objects.price_2` received newly created Stripe price object ID for price2
    - `state.objects.customer` added customer.id as confirmation 
    - `state.objects.coupon` added coupon.id as confirmation 
    - `price1.id` newly created price object id added 
    - `checkout_session_1.line_items.price` newly created price1.id added 
    - `price2.id` newly created price object id added 
    - `checkout_session_2.line_items.price` newly created price2.id added 
  4. GitHub Action `admin-push.yml` Workflow — contract setup as needed ✅
    - Contract created and added to repository `assets/pdf/contract/kon-ilt-036.pdf` 
    - JSON contract artifact `docs.contract.id` added "kon-ilt-036"
    - JSON contract artifact `pdf` added "assets/pdf/contract/kon-ilt-036.pdf"
    - JSON contract artifact `file_id` added "1VyV6DjLplQC-kZSbRCBkJB3c9jMBjK_0Ts7c8I8Aibk"
    - JSON contract artifact `url` added "https://payments.august.style/assets/pdf/contract/kon-ilt-036.pdf" 
    - JSON contract artifact `sha256` added "ae05ad3a03252d6de984da26d29f99a42e777717fd059d431ff498f7dce6000a"
    - JSON contract artifact `created` added "2026-01-11T17:43:01.196442Z" 
  5. GitHub Action `admin-push.yml` Workflow — invoice setup as needed ✅
    - Contract created and added to repository `assets/pdf/invoice/inv-ilt-036.pdf` 
    - JSON contract artifact `docs.contract.id` added "inv-ilt-036"
    - JSON contract artifact `pdf` added "assets/pdf/invoice/inv-ilt-036.pdf"
    - JSON contract artifact `file_id` added "13P0eWNHs5QL4iOi7E97Hm0yrlkLdmb4OYnWjw4jc3UI"
    - JSON contract artifact `url` added "https://payments.august.style/assets/pdf/invoice/inv-ilt-036.pdf" 
    - JSON contract artifact `sha256` added "f97b8fe2132f514824a8965afaddc9967d139317d145a371d5c1f9b983ad91ba"
    - JSON contract artifact `created` added "2026-01-11T17:43:06.376271Z" 
  6. GitHub Action `admin-push.yml` Workflow — balance setup as needed ✅
    - Contract created and added to repository `assets/pdf/balance/bal-ilt-036.pdf` 
    - JSON contract artifact `docs.contract.id` added "bal-ilt-036"
    - JSON contract artifact `pdf` added "assets/pdf/balance/bal-ilt-036.pdf"
    - JSON contract artifact `file_id` added "1JeNZ13UckOP7IX3WffW2YNF3O9NKT4VtOOYUDPtTRRQ"
    - JSON contract artifact `url` added "https://payments.august.style/assets/pdf/balance/bal-ilt-036.pdf" 
    - JSON contract artifact `sha256` added "34a397ff889749eed4953005b59c1d977532d9cb0542dd10cbabb8de21ded709"
    - JSON contract artifact `created` added "2026-01-11T17:43:11.632112Z" 
  7. GitHub Action `admin-push.yml` Workflow — manifest updated accurately ✅ 
    - Updated `assets/js/manifest.json` 

### Phase 2: Frontend User Flow Functionality 