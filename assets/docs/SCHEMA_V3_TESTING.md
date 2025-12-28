# Testing Feedback 

## Summary 

Feedback from testing after we made the most recent updates to accommodate the v3 schema `assets/jobs/_job_template_v3.json` and altered the workflow planning according the the details in our `assets/docs/BUG_WORKFLOW_FIX.md` plan. 

### "Ghost" Workflow That Always Fails 

  - The first one always fails and is always before the commit message orchestrator -- it seems like a pointless ghost I'm not sure what it should ever be doing 
  - The second one often does create Products in Catalog, but fails in GitHub Actions -- it seems like the first actual intended workflow after push 
  - The third one is usually a success and creates an accurate manifest each time 

  + Please see the logs for all three workflows that activate every push here: `assets/docs/CANCELED_FIRST_FLOW.md`

  - NOTE: The first one ONLY works successfully when it is running because of a push to build the website that DID NOT INVOLVE ANY UPDATES TO THE JSON DIRECTORY. Is it possible to add logic to this first basic website build flow so that, if there are changes coming because of the push having changes to the JSON directory, then completely skip the initial pointless build. Where is this action even coming from? Is it just built into any github pages site? 

  - AH HA! So this first build, meant for normal website building but not necessary when an actual automation is running because of updates to the JSON directory or because of frontend behavior triggering update (we haven't even tested the second option yet) — then it says **Triggered via dynamic** 
  - The build we intended to run because of push or from front end behavior -- that says **Triggered via Push** 
  - The final automated one that rebuilds the site says **Triggered via GitHub Pages** and is the bot workflow 

  - What is the solution? 

### Price Object ID

  * **Providing Stripe a predetermined Price Object ID is seen as an 'unknown parameter'** 

  + Providing ID works for...
    - Product Object ID = `uid-xxx-xxx` 
    - Customer Object ID = `uid-xxx-xxx-client` 
    - Coupon Object ID = `uid-xxx-xxx-coupon` 

  + Providing an ID does not work for Price Object ID 
    1. Used `uid-xxx-xxx-1`, `uid-xxx-xxx-2`, etc. 
    2. API call fails for "unknown parameter: ID" 
    3. API call immediately repeats with no Price Object ID value provided 
    4. Stripe creates `price_xyz...` string 

  * **Research first: I'm curious because using bash it does work**

  + Product Object ID creation says 
    "You can optionally override this ID, but the ID must be unique across all products in your Stripe account." 

  + Coupon Object ID creation says 
  "Unique string of your choice that will be used to identify this coupon when applying it to a customer. If you don’t want to specify a particular code, you can leave the ID blank and we’ll generate a random code for you." 

  + Customer Object creation does not mention ID but does permit you to provide custom ID 

  + Price Object ID only says "Unique identifier for the object." 

  **THIS WORKS**

```bash 
  stripe prices create  --currency="usd" --product="uid-xxx-xxx" --id="uid-xxx-xxx-1"
```

  **THIS DOES NOT WORK** 

```python 
  price = stripe.Price.create(
    currency="usd",
    product="uid-xxx-xxx",
    id="uid-xxx-xxx-1" 
  )
```

  * **If there is no workaround: Action steps to adjust flow to accommodate this** 

  + Price Object created 
    - API confirmation response includes their randomly created Price Object ID string 
    - Triggers automated JSON update to add to file and state_management 
  
  + Save to that same `product_object.id` JSON file 
    - `state_management.price=["initial"=price_xyz..."]` or `state_management.price=["balance"=price_xyz..."]`
    - `initial_price_object.id` or `balance_price_object.id` 

### Queued Flow Batch Confirmation 

  * **Please have a think and consider the best move forward** 

  + Am I being overly cautious and overthinking the 'queued' 'batch' updates? 
    - Which is simpler/more effective: 

    1. Get new JSON file, create all necessary Stripe catalog Objects, Immediately add Object IDs to JSON file, then move to next new JSON file 
    2. Get new JSON files, create all necessary Stripe catalog Objects for each JSON file saving Object ID JSON file updates for after, then make all JSON file updates adding appropriate Object IDs to appropriate JSON file 
  
  + I'm having second thoughts only because the second now seems more complex for the script to have to:
    - Keep the "need to update" Object IDs in some sort of 'memory' 
    - Know which Object IDs go onto which Project Object ID's JSON file 

  + If either method is not overly complex, compute intense, or somehow more prone to error, then we'll leave things as they are now with batches 

### File Removed from `assets/jobs/...` 

  * **Behavior currently is...** 

  I reset everything for my next test to be completely clean and simpler to track, but when I removed 1 JSON from the directory last time, all of the objects EXCEPT for the one I removed from the file had NEW Stripe Catalog Objects created. It hit an error for every reuse of an Object ID and the API just retried with no provided Object ID, allowing for the catalog to create all of the Products, Prices, Coupons, and Customers again, but with new, Stripe provided random strings of text for their Object IDs. 

  None of that should have happened. 

  Significantly, the JSON filename that was removed from the directory did NOT have its Product Object in the Stripe catalog changed from `active=true` to `active=false`, effectively archiving it from the catalog. 

  * **Behavior should be...** 

  This is found on our `assets/docs/BUG_WORKFLOW_FIX.md` document at lines 478 to 495. Under the bold bullet heading "Simple UPDATE logic for catalog syncing" this is to be done BEFORE a new manifest.json is created; that is done last. 

  Please review these and confirm understanding. Then please identify what script holds this logic and share with me so I understand. Make any updates to that logic needed for this to function properly. 

  1. First, gather the filenames of the JSON files in the `assets/jobs/...` directory and compare them to the `assets/js/manifest.json` 

  2. Of those JSON directory filenames that **DO HAVE A MATCHING** Product ID entry in `assets/js/manifest.json` 

     + Script must look at the actual JSON file to find `product_object.active` value and then: 
    
     + Any that have the product marked "false" meaning the payments are complete, HOLD TO ARCHIVE using that Product ID/JSON filename 
       - `product_object.active=false` = archive 

     + If the product or payment 2 are marked true, meaning they already exist in the catalog, IGNORE THAT JSON FILE/PRODUCT ID 
       - `product_object.active=true` and `balance_price_object.active=true` = ignore meaning no change 
       - Meaning THIS IS ALREADY IN THE CATALOG 

  3. Of those Product ID on the `assets/js/manifest.json` that **DO NOT HAVE A MATCHING** JSON directory filename 

    + This means that there is a Product Object with an ID in the Stripe catalog, but NOT matching JSON directory filename 
      - HOLD IT TO BE ARCHIVED 
      - The JSON was probably deleted and thus the product in the Stripe catalog is no longer relevant 

  4. Of the JSON directory filenames that **DO NOT HAVE A MATCHING** Product ID entry on `assets/js/manifest.json` 

    + If there is a JSON filename in the directory and no matching entry on the Manifest 
      - THAT MEANS it is a NEW PRODUCT 
      - HOLD to have ALL STRIPE OBJECT CREATED for that new JSON 
      - It will be added to the manifest last 

  5. Archive any Stripe catalog Product Object ID 

     + From #2 with "product_object.active=false" on the JSON 
     + Or from #3 who do not have a matching JSON file 
     + `stripe products update uid-xxx-xxx --active="false"`

  6. The only remaining are JSON files that don't have a matching manifest entry yet, thus must have all Stripe Objects created 
