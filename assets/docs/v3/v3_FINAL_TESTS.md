# Final Test Notes 

## Summary 

## Bugs 

## 1. Using `project_object.active= false` Change To Archive 

  * **Steps required in automation versus what happened** 

  1. Recognizes the JSON filename and manifest entry matches ✅ 
  2. Discovered one of the matched JSON files has been marked no longer active ✅
    - This means it needs to be archived 
    - Happens after a final (1 of 1 payments, or 2 of 2 payments, etc.) payment is made 🧪
  3. The inactive JSON product is archived from the Stripe catalog ✅ 
  4. That inactive JSON file must now be deleted 🚫 
    - This did not happen 
    - Though Stripe worked
    - This action is important for avoiding overly complex logic for keeping archived JSON files; we don't want that 
  5. The manifest then updates and wouldn't show the deleted file ⏰ 
    - As long as the file deletion happens first 
    - I think this should end up accurate 
    - Without deletion last time it did not end up accurate 

  * **Updates required to fix bug** 

  The script that updates a JSON with all the ID numbers after catalog object creation, must also delete JSON job files after catalog object archival. 

    1. Prepare for fix 
      - I'm going to delete the file that should have been deleted ✅ 
      - Then when I push it should fix the manifest to be accurate showing just one product instead of two 
      - Be conscious that there is no error from the system thinking it needs to archive a product that was already archived 
      - If there is, add that to the steps for the fix in steps below 
    2. Identify which file should be handling this action 
      - The same file that updates JSONs after new object creation 
      - Be aware of avoiding logic conflict where system looks for object to archive that already was 
      - However, this won't occur once the deletion works, but good to protect for edge cases 
    2. Confirm there isn't already coded logic for this action elsewhere 
      - What if it does exist but is just broken and didn't flag an error 
      - Check file we're using 
      - Check other files just in case 
      - Again, confirm no logic conflict will occur when fixing this, without removing the normal orphan archival action 
    3. Fix file that is needed to delete JSON files after a Stripe Object is archived 
      - Write new code 
      - Create an `asset/docs/v3/BUG_8_INACTIVE_DELETION.md` documenting the issue and fix 
      - Update `asset/docs/v3/v3_UPDATE.md` to include an extra bug +0_0_1 count to v3.1.8 
    4. Push the fix 
      - Perhaps create first tag for versioning in GitHub 
      - Nothing should actually change with push, will need to set up actual test to check for success 

  * **Test creation after bug fix is pushed and documented** 

    1. First create a standard job with two payments and a coupon 
    2. Push that file as `active: true` first to have objects created 
    3. Git Pull to get updated JSON and manifest
    4. Confirm creation of Stripe Catalog object, accurate manifest, and JSON file updates 
    5. Now, if all is a success, you can change the JSON to `product_object.active= false` 
    6. Commit and push, wait for deploy and build 
    7. Confirm Stripe catalog product archival is still functional 
    8. Git Pull for updated (deleted) JSON file and new manifest with one less entry 

  All current feature flow functionality working, plus file deletion, and accurate manifest will indicate successful bug removal

## Updates 

### 1. JSON Template Accuracy Issue 

The artifact I was editing was from the last successful tests. I saw that the `state_management.client_status` section was different than the actual `assets/docs/v3/_job_template_v3.json` file. The tested file I'm repurposing for my own test looks more accurate based on the wording so I'm changing the template to match. Noting the details here for record keeping in case one of either or both are inaccurate. 

  * **Previously tested JSON file**

```json
{
    "client_status": {
      "logged_in": null,
      "contract_loaded": null,
      "contract_scrolled_complete": false,
      "viewed_contract": false,
      "viewed_invoice": false,
      "downloaded_docs": 0,
      "signed_contract": null
    }, }
```

  * **Template file**

```json
{
    "client_status": {
      "logged_in": "2026-01-03",
      "viewed_contract": true,
      "viewed_invoice": true,
      "downloaded_docs": 0,
      "signed_contract": "2026-01-05" 
    }, }
``` 


### 2. Custom Script for New JSON UX 

  * **Let's create a custom script to keep in the directory that produces a new, blank JSON ready for real information**

  1. Versioning logic keeps it modular 
    - Find highest `v#` (v1, v3, etc.) in directory `assets/docs/...` 
    - Locate underscore prefaced template file in that directory 
    - E.g. `assets/docs/v3/_job_template_v3.json` 
  2. Provide it in prepared-for-completion form 
  + Values that another script fills in empty 
    - ALL values in `state_management` should be NULL 
  + Use executable `UID` script to get UID value 
    - I put a copy here `assets/scripts/workflow_id.py` 
    - It will always be unique, never repeated 
  + Take that UID and place as 
    - Value in `product_object.id` 
    - Value in `initial_price_object.product.products[0]`
    - Value in `balance_price_object.product.products[0]`
    - Value in `coupon_object.applies_to
  + Add `-client` to UID and place as 
    - Value in `customer_object.id` 
    - Value in `initial_checkout_session.client_reference_id` 
    - Value in `balance_checkout_session.client_reference_id`
  + Add `-coupon` to UID and place as 
    - Value in `coupon_object.id` 
    - Value in `initial_checkout_session.discounts[0].coupon`
  + Prefilled values that remain or to check 
    - Some of these where the value is static (not UID dependent) may already be filled in 
    - We should have recorded somewhere the `..._checkout_session.branding_settings.{font_family, background_color, border_style, button_color, display_name}` values to confirm 
  + Creative 'on the fly' value 
    - `...checkout_session.custom_text.after_submit.message` 
  + Static values should already be set as follows 
    - Value "Sean August Horvath" for `contract.signatures.contractor.legal_name`
    - All objects can be set to `active: true`
    - "service" for `product_object.type` 
    - "Payment" for `product_object.unit_label`
    - "per_unit" for `initial_price_object.billing_scheme`and `balance_price_object.billing_scheme`
    - "once" for `coupon_object.duration` 
    - All `currency` values are "usd" 
    - "true" for `..._checkout_session.automatic_tax.enabled`
    - "self" for `..._checkout_session.automatic_tax.liability.type`
    - "required" for `..._checkout_session.billing_address_collection`
    - "always" for `..._checkout_session.customer_creation` and `_checkout_session.redirect_on_completion`
    - "payment" for `..._checkout_session.mode`
    - "https://payments.august.style/payment-success" for `..._checkout_session.return_url` 
    - "pay" for `..._checkout_session.submit_type`
    - "embedded" for `..._checkout_session.embedded` 
    - true set for `..._checkout_session.name_collection.individual.enabled`, `..._checkout_session.name_collection.business.enabled`, and `..._checkout_session.name_collection.business.optional` 
  3. Name the file according to the same UID created
  4. Place the file in `assets/jobs/...` 
  5. Then make the script executable with the custom bash/zsh using our typical flow; ~bin is okay but better if we put it in `assets/scripts/...`; and please understand these are notes for myself so you might need to adjust if you're setting it up and not me; let's use `new-job` as the command (I just checked and it is open)
    - Create script file named how you run it: `touch ~/bin/project-tree.sh`
    - Open that file in your editor: `nano ~/bin/project-tree.sh` 
    - Paste the Script in the editor file: with `#!/bin/bash` at the top 
    - Make the Script Executable: chmod +x ~/bin/project-tree.sh 
    - Now run the script [example] "project-tree.sh"

  * **This way now, when I open the workspace in the IDE editor, and just run `new-job` in the terminal and then just hop in to the file or tell the AI to help me fill out the essential details** 