# Stripe Catalog Sync Bug Issues 

## Overview 

  1. The cause of Stripe API related workflow failures has almost certainly been identified in one script error 
  2. Based on the behavior we're seeing, there are more than just this script managing Stripe Catalog products 
  3. All issues can be overcome by implementing a grossly simplified workflow logic that handles any Catalog issues 
  4. Simply, we over extremely over engineer right now compared to how the Stripe API and our flag system works 

---

## Current Workflow Discoveries 

### Stripe API Dashboard 

  * **I suspect that the responses we expected to get from Stripe were buried in chaos**

  + Our Post products, prices, and even Get requests were all successful 
    - All of the successful calls did receive response 
    - Simultaneously we had *~20 invalid delete calls every minute* we made a call 

  * **Product are in the catalog currently** 

  + There are 19 product objects and all have associated price objects 
    - Products: `assets/docs/reports/products.csv` 
    - Prices: `assets/docs/reports/prices.csv` 
  + API call logs and responses can't be exported 
    - But we can rest assured that we never hit rate limits even with over 600 calls 
    - Everything appears to have functioned as it should on Stripe 
  + Every DELETE request was for a product 
    - The products had prices and couldn't be deleted 
    - The products *were* objects we added today 
  + "Error 1" 
    - According to our python scripts we have responses of 0, 1, and 2 
    - We got 1 which makes sense because deleting products before prices is a validation error 

  * **Mystery becomes, what in the flow is calling delete_product repeatedly?!**

    - The solution provides a more effective complete workaround from whatever was doing it 
    - And can remove other scripts in question, i.e. the successful catalog objects came from somewhere 
    - We will even eliminate the need for a 'cleanup_orphans.py' script for now 

### GitHub Action Summary 

  * **The "Process Job & Update Stripe Catalog" workflow from `process-job.yml`**

  + There is only one job in the workflow called "process-job" 
  + Commit: 79829df "Test: Trigger workflow to see full Stripe API error details #31" 
    - First half of the job steps run smoothly 
    - Handle 'Contract Signing' and 'Payment Update' are skipped, as they should be 
    - Generate manifest `python3 .github/scripts/generate_manifest.py` runs effectively 

  * **First general problem is "Check for manifest changes" using GIT**

  + We don't want to rely on a product like GIT and planned accordingly 
    - Reason we implemented the sync flag system 
    - Worked in my little portfolio project, but not for this project 
  + How to stop this step and method completely are part of the comprehensive, simple solution 

### Next Step "Process Stripe Products" Massive Errors 

  * **The "Run `python3 .github/scripts/process_stripe_products.py`" command**

  + First clue: "📁 Found 0 active job(s) in folder" 
  + It then makes *~40 Delete calls* to remove Price Objects 
    - This is again because of buggy GIT usage in the script 
    - Somehow it was accruing products and they were stacking up from GIT 
    - Every call fails because "type object 'Price' has no attribute 'delete'"
  + After every failed DELETE call, it tried to delete the associated Product Object 
    - Thankfully we'll be able to eliminate this from the flow logic 
    - It isn't clear how multiple Price Objects for a Product Object could be deleted without an error 
  + These DELETE Product Object calls did go through to Stripe API 
    - There are the HUNDREDS of these failed calls 
    - They must be what bogged down things from communicating the object created details we wanted 
    - They all fails because they had active Price Objects 

  * **No payments found in assets/jobs/test-single-payment-v2.json** 
  
  + Another odd clue it then says: 
    - 📁 Found 1 job file(s)
    - ✅ Processed 0 file(s) with Stripe updates

  * **Again, no clue what in the scripts, other than GIT could be the issue, but it doesn't matter** 

  + Ironically after this is does another GIT script call to find changes and discovers "No changes detected" 
    - Though this is partially because it seems to be looking for `"changes:true"` in the JSON files 
    - Changes are currently identified by `"sync":true` 
    - However it is unclear how that script would have handled different files with different number of changes 
  + In the end though, no changes meant no new page build, no push deployed 

---

## Over Engineering Identified As Primary Culprit 

  * **Our solution was actually already planned** 
   
  + It all comes back to creating those `"sync":true` flags 
    - It was intended to be the sole method used to identify changes 
    - JSON schema overhaul's grouping plus flags meant to be sole method to create conditional workflows 
  + For recall, it is `"sync":true` as in, true this needs to be synced 

  * **Poorly communicated solution that could be even bigger but same simplicity** 

  + If `"product.sync": true` follow just five steps 

    1. `sync` = true, then search for matching `stripe_product_id` 
    2. No matches? CREATE NEW PRODUCT 
    3. Find match? OVERWRITE ALL PRODUCT FIELDS PROVIDED 
    4. New product, place `stripe_product_id` on JSON 
    5. New or updated product, change `sync` to FALSE 

  + If `"price.sync": true` the steps are almost identical 

    1. `sync` = true, then search for matching `stripe_price_id`
    2. No matches? CREATE NEW PRICE OBJECT 
    3. Find match? CHANGE IT TO ACTIVE:FALSE AND CREATE NEW PRICE OBJECT 
    4. New price, place stripe_price_id on JSON 
    5. New or updated product, change `sync` to FALSE  
  
  * **Not dynamic and clean, but doesn't cause any issues** 

  + What we wanted is *ONE TRIGGER* and then *ONE ACTION* that solves many possible adjustments 
    - No new price allowed but all other field updates permitted? OH WELL, just always make a new one 
    - Use the action response as opportunity to reset our wildly simple solution 

### Making Super Simple More Robust 

  * **We've come full circle from creating the method to rehashing it for a reason**

  + Now we're going to make it even more all encompassing 
    - No need for a handful of types of Stripe API call scripts 
    - One-size, or solution, fits all is the way to go 
  
  * **Two options, both simple** 

  + Price Object updates can edit any field except the amount 
  1. We could accommodate their versatility, if it benefits us 
    - `"sync": "price change"`
    - `"sync": "new"` 
    - `"sync": "update"` or delete or archive, etc. 
  2. Or we could not care and just over write everything no matter what 

  * **Product update**

    - Include all fields and change only any needed 
    - Or don't and the field doesn't change 

  * **Price update**

    + Include all fields with any changes 
    + Ignore the price stipulations 
      - ALWAYS ARCHIVE 
      - NEVER UPDATE 
    + Then ALWAYS CREATE 
      - Make a new Price Object 
      - Never worry about scripts to check price difference 

### Broadening The Simplicity By Eliminating Unnecessary 

  * **Deleting is overly complicated; let's just always archive**

    - Archive is simple field change to `"active": false` for any Stripe catalog object 
    - Delete `cleanup_orphans.py` 

GET 
/v1/products

import stripe
stripe.api_key = "sk_test_...g"

products = stripe.Product.list(limit=3)


  + DELETE THESE SCRIPTS 
    - archive_price.py
    - delete_price.py
    - list_prices.py 
    - archive_product.py 
    - delete_product.py 
    - list_product.py 

  + KEEP OR CREATE THESE SCRIPTS 
    - create_price.py 
    - modify_price.py 
    - create_product.py 
    - modify_product.py 

```python 
POST /v1/prices/:id

import stripe
stripe.api_key = "sk_test_..."
price = stripe.Price.modify(
  "price_1MoBy5LkdIwHu7ixZhnattbh",
  metadata={"order_id": "6735"},
)
```




-----



When the price with a matching stripe_price_id is found, the script could then see if the amount on the JSON is the same or different than the 