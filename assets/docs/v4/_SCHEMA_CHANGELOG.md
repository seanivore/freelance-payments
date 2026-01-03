# JSON Schema v4 Updates 

## Summary 

  1. Majority of the changes from schema v3 -> v4 are the result of shortening the words used in grouping different levels of the values. 
  2. This term shortening allowed for using the actual JSON mapped string AS THE PLACEHOLDER for the JSON value it in directing be placed there in the contract or invoice. 
  3. A much smaller number of schema changes are new values that were added simply to facilitate the ability to dynamically serve embedded PDF documents to frontend payment site Users. 
  4. This means that, while there are a lot of word changes for many strings, the overall architecture did not change much at all; the only architecture change was the removal of the 'metadata' levels for simplicity. 

### Requirement 

As indicated on the implementation plan, all files will be audited. Updating to accurate JSON value mapping will be part of the review. I did some Find/Replace but we need thorough accuracy confirmation. 

I know this is tedious. Pleases take your time and then double check all work after complete. Look for ways to clean up code while making these updates, i.e. many places with qualifies referencing values no longer used like "balance_price_id". 

### JSON Files 

  * **BLANK to copy for adding new jobs, EXAMPLE to understand format of values, unchanging values are still already filled in** 

    - **BLANK** `assets/docs/v4/_blank_job_schema_v4.json`
    - **EXAMPLE** `assets/docs/v4/_json_value_examples_v4.json`
    - **OLD v3** `assets/docs/v3/_job_template_v3.json` 

### Changes Logged 

* **Price object section changes for both payments** 

- `initial_price_object` --> `price1`
- `balance_price_object` --> `price2`

- `initial_price_object.metadata.payment_number` --> `price1.count`
- `balance_price_object.metadata.payment_number` --> `price2.count`

- `initial_price_object.metadata.payment_usd` --> DELETED
- `balance_price_object.metadata.payment_usd` --> DELETED 

  + USE `unit_amount` instead of `payment_usd` everywhere 
  + The "payment_usd" value used to just be the price but shown formatted with a $ and two decimal places 
  + In an effort to keep currency values consistent across the entire JSON, it is no longer needed because "unit_amount" is the full amount of that value 

- `initial_price_object.metadata.balance_usd` --> DELETED 
- `balance_price_object.metadata.balance_usd` --> DELETED 

  + USE MATH FUNCTION IN SCRIPT 
  + It was no longer clear if this "balance_usd" was before or after the coupon which is an entirely separate object 
  + Fully eliminating it is the best way to assure no errors 

- `initial_price_object.metadata.pay_by` --> `price1.pay_by`
- `balance_price_object.metadata.pay_by` --> `price2.pay_by`

* **Price object section changes for final payment specific values** 

- `balance_price_object.metadata.pay_days` --> `price2.pay_days`
- `balance_price_object.metadata.late_fee` --> `price2.late_fee`

* **Price object values at same level that were effected** 

- `price_object_1.currency` --> `price1.currency` 
  and `active``billing_scheme``nickname``product.products``id``unit_amount`

- `price_object_2.currency` --> `price2.currency` 
  and `active``billing_scheme``nickname``product.products``id``unit_amount`

- 

* **Customer object section changes from top level, down** 

- `customer_object` --> `customer` 
- `customer_object.description` --> `customer.title`
- `customer_object.individual_name` --> `customer.name`
- `customer_object.business_name` --> `customer.business`

- `customer_object.id` --> `customer.id` 
  and `name``email``phone` 

- `customer_object.address.city` --> `customer.address.city` 
  and `line1``state``postal_code``country`

* **Product object section changes from top level and metadata removal** 

- `product_object` --> `product`
- `product_object.active` --> `product.active` 
  and `description``id``type``unit_label`

- `product_object.metadata.login_name` --> `product.login_name`
- `product_object.metadata.login_keyword` --> `product.login_keyword`
- `product_object.metadata.service_usd` --> `product.service_usd`
- `product_object.metadata.total_payments` --> `product.total_payments`
- `product_object.metadata.discount_usd` --> `product.discount_usd`

* **Coupon object section changes** 

- `coupon_object` --> `coupon`

- `coupon_object.amount_off` --> `coupon.amount_off` 
  and `currency``duration``id``max_redemptions``name`

- `coupon_object.applies_to.products` --> `coupon.applies_to.products`

* **State management section changes to top level and down** 

- `state_management` --> `state` 

- `state_management.object_id.created` --> `state.object.created`
  and `product``customer``coupon`

- `state_management.object_id.initial_price` --> `state.object.price_1`
- `state_management.object_id.balance_price` --> `state.object.price_2`

- `state_management.initial_payment_intent` --> `state.payment_1`
- `state_management.balance_payment_intent` --> `state.payment_2`

- `state_management.initial_payment_intent.created` --> `state.payment_1.intent`
- `state_management.balance_payment_intent.created` --> `state.payment_2.intent`

- `state_management.object_id.checkout_session.initial` --> `state.object.checkout_session.payment_1`
- `state_management.object_id.checkout_session.balance` --> `state.object.checkout_session.payment_2`

* **Checkout session section top level changes effect all mapped values under** 

- `initial_checkout_session` --> `checkout_session_1`
- `balance_checkout_session` --> `checkout_session_2`

