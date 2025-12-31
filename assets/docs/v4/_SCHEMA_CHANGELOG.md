# JSON Schema v4 Updates 

## Summary 

  * **Artifacts to dynamically serve contract and invoice PDF embedded on front end** 

  + **NOTE** Dia's notes and code have inaccurate mapping; they kept using old values 
    - New section is stand alone at `docs.contract{id, pdf, drive_id, url, sha256, created}`
    - As in each have 6 values, the other at `docs.invoice...` 
  + ID is `product.id` transformed 
    - For invoice `uid-xxx-xxx` --> `inv-xxx-xxx` 
    - For contract `uid-xxx-xxx` --> `kon-xxx-xxx` 
    - I read k is sometimes used for contract because ica independent contractor agreement, and fca freelance contractor agreement, neither seemed to resonate enough -- PS tho this REALLY makes me wish we did customer as `cst-xxx-xxx` and coupon as `cou-xxx-xxx` -- just mentioning in case it would be an easy shift since we have mapped all these other major code key word changes; makes my ocd brain happy 
  
  * **Next I started adding {{placeholders}} with mapped JSON value** 

  + I really was against creating an entire NEW set of keywords for placeholders 
    - I started using the exact, full JSON value's mapping 
    - For example there are unchanged and what's on gDoc template (left) matches JSON (right)
    | {{contract.work_start}}  | `contract.work_start`          |
    | {{contract.work_end}}    | `contract.work_end`            |
  + Then I was having formatting issues from length 
    - Eventually figured that the long, descriptive weren't needed anymore because memory 
    - So I started shortening as many as I could in sensible ways; examples 
    `initial_price_object.metadata.payment_number` --> `price1.count`
    `balance_price_object.metadata.payment_number` --> `price2.count`

  * **Long story long, I kept track but we need to update again** 

  + I ran search and replace myself 
  + I spotted things like this and made me wonder if it was also a place for better code writing work "priceObject" from invoice-controller.js 
  
  + To prevent formatting issues due to length of template placeholders, and to improve some logic, I have changed the following job JSON values as mapped to their new value as mapped. 

    - `initial_price_object` --> `price1`
    - `balance_price_object` --> `price2` 
    - `initial_price_object.metadata.payment_number` --> `price1.count`
    - `balance_price_object.metadata.payment_number` --> `price2.count`

  + I was dumb and changed "initial_price" and "balance_price" before "payment_number" 
    - I can find lots of "payment_number" but not specifics 
    - We COMPLETELY eliminated it so I saw all the code with "if payment number missing" logic 
    - Same note on 'metadata' it wasn't a helpful additional level 

    - `initial_price_object.metadata.payment_usd` --> `price1.payment_usd`
    - `initial_price_object.metadata.balance_usd` --> `price1.balance_usd`
    - `initial_price_object.metadata.pay_by` --> `price1.pay_by`
    - `balance_price_object.metadata.payment_usd` --> `price2.payment_usd`
    - `balance_price_object.metadata.balance_usd` --> `price2.balance_usd`
    - `balance_price_object.metadata.pay_by` --> `price2.pay_by`
    - `balance_price_object.metadata.pay_days` --> `price2.pay_days`
    - `balance_price_object.metadata.late_fee` --> `price2.late_fee`

  + In the following cases, it grouped the batch of the object together 
    - This would mean `price_object_1.currency` and `price_object_1.active` need updating 
    - They change to `price1.currency` and `price1.active` etc. down the line 
    - it might end up easier just using the actual JSON v3/v4 docs idk 

    - `price_object_1.currency` --> `price1.currency``active``billing_scheme``nickname``product.products``id``unit_amount`
    - `price_object_2.currency` --> `price2.currency``active``billing_scheme``nickname``product.products``id``unit_amount`

  + I know this is tedious; please take your time and double check all files 
    - Make it a more rewarding task by also finding ways to improve code while looking 
  + After changing from v2 to v3 we were debugging for days because of this 
    - But then when I was over it and wanted to refactor, you went full autonomous 
    - Used the gh, stripe, vercel CLI to check things and took two hours! 
    - Let's try to get to that quality the first time 
  + Seeing lot of "balance_price_obj" in code which doesn't exist 
    - Also 'balance_price_id' which never existed because it used to be also 'balance_price.id'
  + Woah okay and I'm stopping my find and replace because now this file is broken: 
    `.github/workflows/orchestrate.yml` 

    - `customer_object` --> `customer` 
    - `customer_object.id` --> `customer.id` 
    - `customer...` --> `customer.name`/`email`/`phone` 
    - `customer.address.city` --> `customer.address.city` `line1` `state` `postal_code` `country`
    - `customer_object.description` --> `customer.title`
    - `customer_object.individual_name` --> `customer.name`
    - `customer_object.business_name` --> `customer.business`
    - `state_management.initial_payment_intent` --> `state.payment_1`
    - `state_management.initial_payment_intent.created` --> `state.payment_1.intent`
    - `state_management.balance_payment_intent` --> `state.payment_2`
    - `state_management.balance_payment_intent.created` --> `state.payment_2.intent`
    - `state_management.object_id.initial_price` --> `state.object.price_1`
    - `state_management.object_id.balance_price` --> `state.object.price_2`
    - `initial_checkout_session` --> `checkout_session_1`
    - `balance_checkout_session` --> `checkout_session_2`
    - `product_object` --> `product`
    - `product_object.active` --> `product.active`/`description`/`id`/`type`/`unit_label`
    - `product_object.metadata.login_name` --> `product.login_name`
    - `product_object.metadata.login_keyword` --> `product.login_keyword`
    - `product_object.metadata.service_usd` --> `product.service_usd`
    - `product_object.metadata.total_payments` --> `product.total_payments`
    - `product_object.metadata.discount_usd` --> `product.discount_usd`
    - `state_management.object_id.checkout_session.initial` --> `state.object.checkout_session.payment_1`
    - `state_management.object_id.checkout_session.balance` --> `state.object.checkout_session.payment_2`
    - `state_management` --> `state` 
    - `state.object_id` --> `state.object``created``product``customer``coupon`
    - `coupon_object` --> `coupon``amount_off``applies_to.products``currency``duration``max_redemptions`
    - `coupon_object.id` --> `coupon.id``name`

