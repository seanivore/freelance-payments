# Application Flow 

## Objective 

Simplicity in comprehensive comprehension of feature functionality of this SPA payments platform. 

I honestly think we need to prepare a truly simple defining of this project, with the details including as defined a flow map as possible. Like I wanted to put the name of the files that handle the different parts of the automations next to those spots on the "map". But then like I look at sync_catalog.py for example and it has become so unnecessarily complex from refactoring multiple times -- for instance "job ID" is nothing anymore so all the confusing if statements are just extra logic to unnecessarily navigate when the script runs. The debug thing I don't actually understand well like maybe we could name the workflows and actions and even in the details of the scripts make it user friendly for debugging. Then like 'jobs_processed' versus 'created' versus 'modified' versus 'archived' -- like it all means the same thing. It just seems like it should all be written directly from the actual triggers and API call names -- which is what I started to lay out below. I got the first "Cycle" done really well. I think we need the fully trigger, action step, in entirely written out like I did below for each type of Stripe Object creation , listed exactly what is needed to be added to the JSON after creating it. 

OH PS THOUGH -- the updates of the JSON just haven't worked period since before creating this file: `.github/scripts/utils/json_io.py` so I wonder if that is a huge part of the problem. 

And then we haven't gotten to `.github/scripts/state/update_state.py` at all. And I mentioned in this — the feedback doc that broke my camel-back: `assets/docs/planning-resources/adding-removing-json/NEW_JSON_CATALOG_BACK_UPDATE.md` all the different ways we confirmed these little details updating JSON files as we do existed, but then I can't even find them in the `.github/scripts/orchestration/sync_catalog.py` 

What do you think? My reason for doing this is because we have been running into bugs, nonstop, for actual full days now, multiple days. Its never ending. 

My thinking is that if you could help me create something like below, that then also integrating information about the architecture like we had in the original AI_CONTEXT_PRIMER document (about the 404.html redirect and stuff). 

And we'd include what we learned and only the final decisions stuff. Something substantial enough that I could take the document or two and create an completely fresh instance with AI and have them review it, create much more concise scripts .. like I can't write python but I understand enough to be able to tell when it is overly convoluted. I imagine a world where the names of the scripts even make sense with what they're doing, now that we really have it al nailed down. 

Okay the main reason I am getting to this feeling of "SCRAP WHAT ISN'T PERFECT, KEEP THE PERFECT LOGIC, NOW SUPER SIMPLIFIED, AND REBUILD" again because, we just tried to fix the functionality of adding a JSON to the directory twice in a row, and tried to fix the removal twice in a row, and it still doesn't work and — my incredible frustration — is coming from the fact that, this really is and has only become an even more, simple system. I think things just got confusing from all the updates and I feel like there is no other way to get away from the mess. 

AM I BEING CRAZY or might this actually finally get us to completion instead of a 5th full day of debugging? 

If so, or maybe either way, maybe you could help me finish up the breakdown explainer below. And then the AI context primer. Because even if it isn't starting from TOTAL scratch, I am stating to think that a properly prepared fresh AI instance with no knowledge of all the previous iterations might help sort this out easier. 

I guess I'm also harping on this a bit though because we did have a context primer doc earlier and I tried a new AI instance and they were SO SO SO clueless that the questions they were asking were clearly dangerous to our build -- and that is when I cam back to our chat.

Okay, so many feelings. So much pressure because I should have had this done by now it's been weeks and though I've learned A LOT that will help with the client project, i really need to do the client project. 

Then if this doesn't work, this last attempt, i'm prepared to gut the automations for the time being and just get it functional. I'm not mentally ready to do that just yet, i think we need one more very well thought out try. 

So many thoughts. Wdyt? Honest opinions. I can't figure out why this is so much more complicated and problematic than it should be. 

OH right and as a super very last measure I did grab these details though didn't stop and really dig into how it might help yet. It seems like extra to use it but idk at this point `assets/docs/FINAL_CLEANUP/CLAUDE_CODE_GITHUB_ACTIONS.md` 


### Essentials 

  + UNIQUE IDENTIFIER FOR JOB ENTRIES 
    - Created by calling custom bash script `uid`, comes in unique `uid-abc-123` format 
    - Used in Stripe as the Project Object ID, and internally as the job's JSON file's filename `assets/jobs/uid-abc-123.json` 
    - Use Stripe vocabulary everywhere; replace old terminology if found in code and helpful, e.g. 'job id' is generic, not special 
  + CLIENT LOGIN KEYWORD IDENTIFIERS 
    - Clients login to `payments.august.style` by filling in two text fields with simple keywords 
    - `product_object.metadata.login_name` is the last name of the client 
    - `product_object.metadata.login_keyword` is a simple hyphenated two-word phrase that fits the job 
  + JOB JSON FILES AND URLS ON MANIFEST 
    - After a job has Stripe catalog objects created, it is added to `assets/js/manifest.json` 
    - Entries are listed by the "URL" which consists of `login_name`-`login_keyword` 
    - The URL informs the 404.html redirect what the URL should be, e.g. `payments.august.style/horvath-client-billing`
    - Each entry simply lists the job JSON filename's relative path, e.g. `assets/jobs/uid-abc-123.json` 
    - In the URL, the first word will always be the last name, the next two words will always be the hyphenated keyword 

  **OLD = UNNECESSARILY LONG** 

    ```json
    { "jobs": {
    "doe-single-test": {
      "file_path": "assets/jobs/uid-test-001.json",
      "job_id": "uid-test-001",
      "login_keyword": "single-test",
      "login_name": "doe" } } } 
    ```
  **NEW = SHORT, SIMPLE, UNAMBIGUOUS** 

    ```json 
    { "jobs": {"smith-single-test": "assets/jobs/uid-abd-123.json"}, }
    ```

---

## CYCLE A: Triggered On Admin Push 

### Compare Job Directory Files With Current Manifest 

  1. Gather list of job JSON files in job directory `assets/jobs/...`
  2. Compare to list of job JSON files on manifest `assets/js/manifest.json`
  3. There are only four possible next step options 
     + (A) Manifest lists a file with **NO MATCH** in the job directory file list 
     + (B) Job directory lists a file with **NO MATCH** on the manifest file list 
     + (C) Job directory file **MATCHES** a file on the manifest; the file contents have value `project_object.active= true`
     + (D) Job directory file **MATCHES** a file on the manifest; the file contents have value `project_object.active= false`

  * **OPTION A** 
  + This is an ORPHANED PRODUCT in the Stripe Catalog 
    - It MUST BE ARCHIVED by making it INACTIVE 
    - Active = false is how Stripe Catalog archives product; all of the product's associate objects (prices, coupons) can be ignored 
    
    1. Get the `project_object.id` by removing `.json` from the filename 
    2. Use `product = stripe.Product.modify("uid-abc-123", active=False,)`
    3. Bash also works: `stripe products update uid-abc-123 --active="false"` 

  * **OPTION B** 
  + This is a NEW JOB 
    - Create a Stripe catalog PRODUCT with other essential other objects 
    - Receive creation confirmation response from API of full object with all values 
    - Copy the final object's ID and paste into the job's JSON state management section 
    - Add date for 'created', then save and exit the JSON before moving on to the next 

    1. Use `product = stripe.Product.create()` with all `product_object` details from the JSON schema 
    2. Paste response's "ID" value to `state_management.object_id.product` (usually looks like uid-xxx-xxx)

    3. Use `customer = stripe.Customer.create()` with all `customer_object` details from the JSON schema 
    4. Paste response's "ID" value to `state_management.object_id.customer` (usually looks like uid-xxx-xxx-client)

    5. Use `price = stripe.Price.create()` with all `initial_price_object` details from the JSON schema 
    6. Paste response's "ID" value to `state_management.object_id.initial_price` (usually looks like price_abc123...)

    7. Use `price = stripe.Price.create()` with all `balance_price_object` details from the JSON schema *IF APPLICABLE* 
    8. Paste response's "ID" value to `state_management.object_id.balance_price` (usually looks like price_abc123...)

    9. Use `coupon = stripe.Coupon.create()` with all `coupon_object` details from the JSON schema *IF APPLICABLE* 
    10. Paste response's "ID" value to `state_management.object_id.coupon` (usually looks like uid-xxx-xxx-coupon)

    11. When all steps above are complete, add the YYYY-MM-DD date to `state_management.object_id.created`

  * **OPTION C** 
  + This is an ACTIVE JOB 
    - It already has a Stripe Product created  
    - It already has all necessary catalog objects 
    - Nothing more to do here 

  * **OPTION D** 
  + This is an INACTIVE JOB 
    - It had all Stripe Objects created already 
    - Client has made all necessary payments 
    - Make Stripe Product inactive to match 

    1. Get the `project_object.id` by removing `.json` from the filename 
    2. Use `product = stripe.Product.modify("uid-abc-123", active=False,)`
    3. Bash also works: `stripe products update uid-abc-123 --active="false"`
    4. Upon receipt of confirmation response, delete the JSON file from the job directory 

### Create New Manifest 

  * **Now all active, remaining JSON files in the `assets/jobs/...` directory should be updated on `assets/js/manifest.json`** 

  1. Each entry is one line with the "URL" on the left and the "File path" on the right 
  2. The URL consists of hyphenated "login-name" and "login-keyword" 
  3. "login-name" will always be one word and "login-keyword" will always be two words 
  4. The file path is just the simple, relative path to that JSON file 
  5. The time in 'generated_at' is updated 

```json 
{
  "jobs": {
    "smith-single-test": "assets/jobs/uid-abc-123.json",
    "horvath-client-billing": "assets/jobs/uid-sbo-729.json"
  },
  "generated_at": "2025-12-28T08:32:26.684188Z"
}
``` 

### GitHub Actions Bot Pushing Changes 

  * **No JSON files changes?** 
  
    - If there are no job JSON files to process 
    - And there is no changes for a new manifest to be created 
    - Complete the admin user's original push to build and deploy 

  * **JSON files processed** 

    - If job JSON files were process via the four options above 
    - Then a new manifest must have also been created 
    - Complete a new `git add .` to push all the new files and changes 
    - Use the rebase setup to make later admin user push easier 

---

## CYCLE B: Triggered Updates from Frontend User Behavior and/or Payments 