# Create a source

Creates a new source object.

## Returns

Returns a newly created source.

## Parameters

- `type` (string, required)
  The `type` of the source to create. Required unless `customer` and `original_source` are specified (see the [Cloning card Sources](https://docs.stripe.com/docs/sources/connect.md#cloning-card-sources) guide)

- `amount` (integer, optional)
  Amount associated with the source. This is the amount for which the source will be chargeable once ready. Required for `single_use` sources. Not supported for `receiver` type sources, where charge amount may not be specified until funds land.

- `currency` (enum, optional)
  Three-letter [ISO code for the currency](https://stripe.com/docs/currencies) associated with the source. This is the currency for which the source will be chargeable once ready.

- `flow` (string, optional)
  The authentication `flow` of the source to create. `flow` is one of `redirect`, `receiver`, `code_verification`, `none`. It is generally inferred unless a type supports multiple flows.

- `mandate` (object, optional)
  Information about a mandate possibility attached to a source object (generally for bank debits) as well as its acceptance status.

  - `mandate.acceptance` (object, optional)
    The parameters required to notify Stripe of a mandate acceptance or refusal by the customer.

    - `mandate.acceptance.status` (string, required)
      The status of the mandate acceptance. Either `accepted` (the mandate was accepted) or `refused` (the mandate was refused).

    - `mandate.acceptance.date` (timestamp, required)
      The Unix timestamp (in seconds) when the mandate was accepted or refused by the customer.

    - `mandate.acceptance.ip` (string, optional)
      The IP address from which the mandate was accepted or refused by the customer.

    - `mandate.acceptance.offline` (object, optional)
      The parameters required to store a mandate accepted offline. Should only be set if `mandate[type]` is `offline`

      - `mandate.acceptance.offline.contact_email` (string, required)
        An email to contact you with if a copy of the mandate is requested, required if `type` is `offline`.

        The maximum length is 800 characters.

    - `mandate.acceptance.online` (object, optional)
      The parameters required to store a mandate accepted online. Should only be set if `mandate[type]` is `online`

      - `mandate.acceptance.online.date` (timestamp, required)
        The Unix timestamp (in seconds) when the mandate was accepted or refused by the customer.

      - `mandate.acceptance.online.ip` (string, required)
        The IP address from which the mandate was accepted or refused by the customer.

      - `mandate.acceptance.online.user_agent` (string, required)
        The user agent of the browser from which the mandate was accepted or refused by the customer.

    - `mandate.acceptance.type` (string, optional)
      The type of acceptance information included with the mandate. Either `online`  or `offline`

    - `mandate.acceptance.user_agent` (string, optional)
      The user agent of the browser from which the mandate was accepted or refused by the customer.

  - `mandate.amount` (integer, optional)
    The amount specified by the mandate. (Leave null for a mandate covering all amounts)

  - `mandate.currency` (enum, optional)
    The currency specified by the mandate. (Must match `currency` of the source)

  - `mandate.interval` (string, optional)
    The interval of debits permitted by the mandate. Either `one_time` (just permitting a single debit), `scheduled` (with debits on an agreed schedule or for clearly-defined events), or `variable`(for debits with any frequency)

  - `mandate.notification_method` (string, optional)
    The method Stripe should use to notify the customer of upcoming debit instructions and/or mandate confirmation as required by the underlying debit network. Either `email` (an email is sent directly to the customer), `manual` (a `source.mandate_notification` event is sent to your webhooks endpoint and you should handle the notification) or `none` (the underlying debit network does not require any notification).

- `metadata` (object, optional)
  Set of [key-value pairs](https://docs.stripe.com/docs/api/metadata.md) that you can attach to an object. This can be useful for storing additional information about the object in a structured format. Individual keys can be unset by posting an empty value to them. All keys can be unset by posting an empty value to `metadata`.

- `owner` (object, optional)
  Information about the owner of the payment instrument that may be used or required by particular source types.

  - `owner.address` (object, optional)
    Owner’s address.

    - `owner.address.city` (string, optional)
      City, district, suburb, town, or village.

    - `owner.address.country` (string, optional)
      Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).

    - `owner.address.line1` (string, optional)
      Address line 1, such as the street, PO Box, or company name.

    - `owner.address.line2` (string, optional)
      Address line 2, such as the apartment, suite, unit, or building.

    - `owner.address.postal_code` (string, optional)
      ZIP or postal code.

    - `owner.address.state` (string, optional)
      State, county, province, or region ([ISO 3166-2](https://en.wikipedia.org/wiki/ISO_3166-2)).

  - `owner.email` (string, optional)
    Owner’s email address.

    The maximum length is 800 characters.

  - `owner.name` (string, optional)
    Owner’s full name.

  - `owner.phone` (string, optional)
    Owner’s phone number.

- `receiver` (object, optional)
  Optional parameters for the receiver flow. Can be set only if the source is a receiver (`flow` is `receiver`).

  - `receiver.refund_attributes_method` (string, optional)
    The method Stripe should use to request information needed to process a refund or mispayment. Either `email` (an email is sent directly to the customer) or `manual` (a `source.refund_attributes_required` event is sent to your webhooks endpoint). Refer to each payment method’s documentation to learn which refund attributes may be required.

- `redirect` (object, optional)
  Parameters required for the redirect flow. Required if the source is authenticated by a redirect (`flow` is `redirect`).

  - `redirect.return_url` (string, required)
    The URL you provide to redirect the customer back to you after they authenticated their payment. It can use your application URI scheme in the context of a mobile application.

- `source_order` (object, optional)
  Information about the items and shipping associated with the source. Required for transactional credit (for example Klarna) sources before you can charge it.

  - `source_order.items` (array of objects, optional)
    List of items constituting the order.

    - `source_order.items.parent` (string, optional)
      The ID of the SKU being ordered.

    - `source_order.items.quantity` (integer, optional)
      The quantity of this order item. When type is `sku`, this is the number of instances of the SKU to be ordered.

  - `source_order.shipping` (object, optional)
    Shipping address for the order. Required if any of the SKUs are for products that have `shippable` set to true.

    - `source_order.shipping.address` (object, required)
      Shipping address.

      - `source_order.shipping.address.line1` (string, required)
        Address line 1, such as the street, PO Box, or company name.

      - `source_order.shipping.address.city` (string, optional)
        City, district, suburb, town, or village.

      - `source_order.shipping.address.country` (string, optional)
        Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).

      - `source_order.shipping.address.line2` (string, optional)
        Address line 2, such as the apartment, suite, unit, or building.

      - `source_order.shipping.address.postal_code` (string, optional)
        ZIP or postal code.

      - `source_order.shipping.address.state` (string, optional)
        State, county, province, or region ([ISO 3166-2](https://en.wikipedia.org/wiki/ISO_3166-2)).

    - `source_order.shipping.carrier` (string, optional)
      The delivery service that shipped a physical product, such as Fedex, UPS, USPS, etc.

    - `source_order.shipping.name` (string, optional)
      Recipient name.

    - `source_order.shipping.phone` (string, optional)
      Recipient phone (including extension).

    - `source_order.shipping.tracking_number` (string, optional)
      The tracking number for a physical product, obtained from the delivery service. If multiple tracking numbers were generated for this purchase, please separate them with commas.

- `statement_descriptor` (string, optional)
  An arbitrary string to be displayed on your customer’s statement. As an example, if your website is `RunClub` and the item you’re charging for is a race ticket, you may want to specify a `statement_descriptor` of `RunClub 5K race ticket.` While many payment types will display this information, some may not display it at all.

- `token` (string, optional)
  An optional token used to create the source. When passed, token properties will override source parameters.

- `usage` (string, optional)
  Either `reusable` or `single_use`. Whether this source should be reusable or not. Some source types may or may not be reusable by construction, while others may leave the option at creation. If an incompatible value is passed, an error will be returned.

```curl
curl https://api.stripe.com/v1/sources \
  -u "<<YOUR_SECRET_KEY>>" \
  -d type=ach_credit_transfer \
  -d currency=usd \
  --data-urlencode "owner[email]"="jenny.rosen@example.com"
```

```cli
stripe sources create  \
  --type=ach_credit_transfer \
  --currency=usd \
  -d "owner[email]"="jenny.rosen@example.com"
```

```ruby
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

source = client.v1.sources.create({
  type: 'ach_credit_transfer',
  currency: 'usd',
  owner: {email: 'jenny.rosen@example.com'},
})
```

```python
client = StripeClient("<<YOUR_SECRET_KEY>>")

source = client.v1.sources.create({
  "type": "ach_credit_transfer",
  "currency": "usd",
  "owner": {"email": "jenny.rosen@example.com"},
})
```

```php
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$source = $stripe->sources->create([
  'type' => 'ach_credit_transfer',
  'currency' => 'usd',
  'owner' => ['email' => 'jenny.rosen@example.com'],
]);
```

```java
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SourceCreateParams params =
  SourceCreateParams.builder()
    .setType("ach_credit_transfer")
    .setCurrency("usd")
    .setOwner(
      SourceCreateParams.Owner.builder().setEmail("jenny.rosen@example.com").build()
    )
    .build();

Source source = client.v1().sources().create(params);
```

```node
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const source = await stripe.sources.create({
  type: 'ach_credit_transfer',
  currency: 'usd',
  owner: {
    email: 'jenny.rosen@example.com',
  },
});
```

```go
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.SourceCreateParams{
  Type: stripe.String("ach_credit_transfer"),
  Currency: stripe.String(stripe.CurrencyUSD),
  Owner: &stripe.SourceCreateOwnerParams{
    Email: stripe.String("jenny.rosen@example.com"),
  },
}
result, err := sc.V1Sources.Create(context.TODO(), params)
```

```dotnet
var options = new SourceCreateOptions
{
    Type = "ach_credit_transfer",
    Currency = "usd",
    Owner = new SourceOwnerOptions { Email = "jenny.rosen@example.com" },
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.Sources;
Source source = service.Create(options);
```

### Response

```json
{
  "id": "src_1N3lxdLkdIwHu7ixPHXy8UcI",
  "object": "source",
  "ach_credit_transfer": {
    "account_number": "test_eb829353ed79",
    "bank_name": "TEST BANK",
    "fingerprint": "kBQsBk9KtfCgjEYK",
    "refund_account_holder_name": null,
    "refund_account_holder_type": null,
    "refund_routing_number": null,
    "routing_number": "110000000",
    "swift_code": "TSTEZ122"
  },
  "amount": null,
  "client_secret": "src_client_secret_ZaOIRUD8a9uGmQobLxGvqKSr",
  "created": 1683144457,
  "currency": "usd",
  "flow": "receiver",
  "livemode": false,
  "metadata": {},
  "owner": {
    "address": null,
    "email": "jenny.rosen@example.com",
    "name": null,
    "phone": null,
    "verified_address": null,
    "verified_email": null,
    "verified_name": null,
    "verified_phone": null
  },
  "receiver": {
    "address": "110000000-test_eb829353ed79",
    "amount_charged": 0,
    "amount_received": 0,
    "amount_returned": 0,
    "refund_attributes_method": "email",
    "refund_attributes_status": "missing"
  },
  "statement_descriptor": null,
  "status": "pending",
  "type": "ach_credit_transfer",
  "usage": "reusable"
}
```