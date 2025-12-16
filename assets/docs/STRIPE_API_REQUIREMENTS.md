# Stripe API Requirements for Product & Price Creation

## Overview

When creating Stripe Products and Prices via the API (for GitHub Actions automation), these are the required and recommended fields.

## Product Creation

### Required Fields
- **`name`** (string, required): Product name displayed to customers
  - Format: `"{invoice_number}-{payment_number}"` (e.g., "uid-abc-123-1")
  - Stored in JSON as: `stripe_product_name`

### Optional but Recommended Fields
- **`description`** (string, optional): Payment description from JSON
- **`metadata`** (object, optional): Key-value pairs for lookup and tracking
  - Max 20 keys per object
  - Max 40 characters per key
  - Max 500 characters per value
  - Recommended keys:
    - `job_id`: Unique job identifier
    - `invoice_number`: Invoice number (same as job_id)
    - `payment_number`: Payment sequence number (1, 2, 3, etc.)
    - `client_last_name`: For lookup form
    - `project_keyword`: For lookup form
  - Stored in JSON as: `stripe_metadata` object

## Price Creation

### Required Fields
- **`product`** (string, required): Product ID from Product creation response
  - Stored in JSON as: `stripe_product_id`
- **`currency`** (string, required): Three-letter ISO currency code (lowercase)
  - Default: `"usd"`
  - Stored in JSON as: `currency` field in payment object
- **`unit_amount`** (integer, required): Amount in smallest currency unit
  - For USD: amount in cents (multiply dollar amount by 100)
  - Example: $1250.00 → `125000`
  - Convert from JSON `amount` field: `Math.round(amount * 100)`

### Optional but Recommended Fields
- **`metadata`** (object, optional): Same structure as Product metadata
  - Useful for tracking on Price object as well

## Timestamp Handling

**Important**: Stripe metadata values are strings. If storing dates/timestamps:

- **Unix Timestamp Format**: Store as integer (seconds since Unix epoch)
  - Example: `1737417600` (for January 20, 2025)
  - Convert ISO date string to Unix timestamp: `Math.floor(new Date("2025-01-20").getTime() / 1000)`
  - Stored in JSON as: `due_date_unix` and `paid_date_unix` fields

- **ISO Date Format**: Keep ISO dates (`"2025-01-20"`) in JSON for human readability
  - Convert to Unix timestamp when creating Stripe objects
  - Stored in JSON as: `due_date` and `paid_date` fields

## Example API Calls

### Create Product
```python
product = stripe.Product.create(
    name=f"{invoice_number}-{payment_number}",
    description=payment_description,
    metadata={
        "job_id": job_id,
        "invoice_number": invoice_number,
        "payment_number": str(payment_number),
        "client_last_name": client_last_name,
        "project_keyword": project_keyword
    }
)
```

### Create Price
```python
# Convert amount to cents
unit_amount_cents = int(round(amount * 100))

price = stripe.Price.create(
    product=product.id,
    currency=currency.lower(),  # "usd"
    unit_amount=unit_amount_cents,
    metadata={
        "job_id": job_id,
        "invoice_number": invoice_number,
        "payment_number": str(payment_number),
        "client_last_name": client_last_name,
        "project_keyword": project_keyword
    }
)
```

## JSON Schema Updates

The `_job_template.json` has been updated to include:
- `currency` field in each payment object (default: "usd")
- `due_date_unix` field for Unix timestamp version of due_date
- `paid_date_unix` field for Unix timestamp version of paid_date
- `stripe_product_name` field to store the generated product name
- `stripe_metadata` object with all metadata keys pre-defined

## Notes

- Product names should be unique and human-readable
- Metadata is searchable via Stripe API but not via direct product search
- Use metadata for lookup logic (we'll use manifest.json for actual lookup)
- Store both ISO dates (human-readable) and Unix timestamps (API-ready) in JSON
- Amounts must be converted to smallest currency unit (cents for USD)
