# v3 Update 

*UPDATED 2025-12-29: v3.1.6*

## Note 

This is being written after the fact. I just created the versioning folders. Moving forward we can better stay organized with documentation and resources. 

## Summary 

### v3 Job JSON 

  * **Added section for `state_management`** 

  +  Details inform logic for user placement post login 
    - Unique IDs that represent confirmation of successful Stripe catalog object creation 
    - Timestamps tracking key user behavior triggers 
    - Timestamps highlighting key payment steps made on Stripe 
    - Space for Stripe created Price Object ID 
  + Provides all necessary details to create Checkout Sessions 
    - Made on the fly and expire 
    - Need to be made when user is done signing to show line-items 
  + Completed Checkout Sessions indicate complete job payment 
    - Can then be archived for record keeping 
    - Needs to be made `product_object.active= false` 

  * **Added sections for Stripe catalog object creation** 
  
  + All details needed have a value 
    - Product Object with provided uid-abc-123 
    - Customer Object with altered uid-abc-123-client 
    - Coupon Object with altered uid-abc-123-coupon 
    - Price Objects for initial payment and balance payment  (optional) with Stripe created ID 

  * **Remaining contract specifics** 

  + Details for populating templates 
    - Contract 
    - Invoice 

### Simplified Workflow Logic 

  * **Simple check of job JSON files compared to manifest** 

  + JSON directory versus Manifest 
    - JSON directory reflects active jobs 
    - Manifest reflect Stripe catalog contents 
  + Only four possible outcomes 
    - Archiving because of orphaned Stripe catalog Product Object 
    - Matching so ignore 
    - Matching but JSON marked "active= false" so archive 
    - Creation of Stripe objects because new JSON file added 

  * **Removed dynamic website build and deploy** 

  + No need for any other job sync check 
  + No updates needed, then standard build and push runs 