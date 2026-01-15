# Stripe Checkout Sessions Create

- Developer Workbench API Request
- API version: 2025-12-15.clover
- All field populated directly from job JSON `assets/jobs/uid-ilt-036.json`

## POST /v1/checkout/sessions

```js
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require("stripe")("{{TEST_SECRET_KEY}}");

const session = await stripe.checkout.sessions.create({
  client_reference_id: "cus-ilt-036",
  currency: "usd",
  mode: "payment",
  return_url: "https://payments.august.style/uid-ilt-036#completion-1",
  ui_mode: "custom",
  discounts: [
    {
      coupon: "cou-ilt-036",
    },
  ],
  line_items: [
    {
      price: "price_1SoSfB9fljwH26CPrD9XxOzu",
      quantity: 1,
    },
  ],
});
```

## Request Post Body

```json
{
  "client_reference_id": "cus-ilt-036",
  "currency": "usd",
  "discounts": {
    "0": {
      "coupon": "cou-ilt-036"
    }
  },
  "line_items": {
    "0": {
      "price": "price_1SoSfB9fljwH26CPrD9XxOzu",
      "quantity": "1"
    }
  },
  "mode": "payment",
  "return_url": "https://payments.august.style/uid-ilt-036#completion-1",
  "ui_mode": "custom"
}
```

## Response Body

```json
{
  "id": "cs_test_a1vXU7wyUal7HWJpatG0ItHMvI679Z5EZPJGQAdpSLTjvbKEFZSDmMsWph",
  "object": "checkout.session",
  "adaptive_pricing": {
    "enabled": true
  },
  "after_expiration": null,
  "allow_promotion_codes": null,
  "amount_subtotal": 500,
  "amount_total": 300,
  "automatic_tax": {
    "enabled": false,
    "liability": null,
    "provider": null,
    "status": null
  },
  "billing_address_collection": null,
  "branding_settings": {
    "background_color": "#ffffff",
    "border_style": "rounded",
    "button_color": "#0074d4",
    "display_name": "Sean August Horvath sandbox",
    "font_family": "default",
    "icon": null,
    "logo": null
  },
  "cancel_url": null,
  "client_reference_id": "cus-ilt-036",
  "client_secret": "cs_test_a1vXU7wyUal7HWJpatG0ItHMvI679Z5EZPJGQAdpSLTjvbKEFZSDmMsWph_secret_fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdwbEhqYWAnPydmcHZxamgneCUl",
  "collected_information": null,
  "consent": null,
  "consent_collection": null,
  "created": 1768445436,
  "currency": "usd",
  "currency_conversion": null,
  "custom_fields": [],
  "custom_text": {
    "after_submit": null,
    "shipping_address": null,
    "submit": null,
    "terms_of_service_acceptance": null
  },
  "customer": null,
  "customer_account": null,
  "customer_creation": "if_required",
  "customer_details": null,
  "customer_email": null,
  "discounts": [
    {
      "coupon": "cou-ilt-036",
      "promotion_code": null
    }
  ],
  "expires_at": 1768531836,
  "invoice": null,
  "invoice_creation": {
    "enabled": false,
    "invoice_data": {
      "account_tax_ids": null,
      "custom_fields": null,
      "description": null,
      "footer": null,
      "issuer": null,
      "metadata": {},
      "rendering_options": null
    }
  },
  "livemode": false,
  "locale": null,
  "metadata": {},
  "mode": "payment",
  "origin_context": null,
  "payment_intent": null,
  "payment_link": null,
  "payment_method_collection": "if_required",
  "payment_method_configuration_details": {
    "id": "pmc_1SbjiE9fljwH26CPmMKxs5qZ",
    "parent": null
  },
  "payment_method_options": {
    "card": {
      "request_three_d_secure": "automatic"
    }
  },
  "payment_method_types": ["card", "klarna", "link", "cashapp", "amazon_pay"],
  "payment_status": "unpaid",
  "permissions": null,
  "phone_number_collection": {
    "enabled": false
  },
  "recovered_from": null,
  "return_url": "https://payments.august.style/uid-ilt-036#completion-1",
  "saved_payment_method_options": null,
  "setup_intent": null,
  "shipping_address_collection": null,
  "shipping_cost": null,
  "shipping_options": [],
  "status": "open",
  "submit_type": null,
  "subscription": null,
  "success_url": null,
  "total_details": {
    "amount_discount": 200,
    "amount_shipping": 0,
    "amount_tax": 0
  },
  "ui_mode": "custom",
  "url": null,
  "wallet_options": null
}
```
