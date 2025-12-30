# Final Test Notes 

## Summary 

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