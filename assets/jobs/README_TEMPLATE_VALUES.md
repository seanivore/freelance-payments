# JSON Job Template - Field Reference Guide

This document explains each field in `_job_template.json` to help you create new job entries.

## Quick Reference: Important Conversions

- **Amounts**: Store in dollars (e.g., `1250.00`). Stripe API converts to cents automatically (multiply by 100).
- **Dates**: Store ISO format (`"2025-01-20"`) for readability. Unix timestamps (`1737417600`) are auto-generated for Stripe metadata.
- **Product Names**: Format `"{invoice_number}-{payment_number}"` (e.g., `"uid-abc-123-1"`)

---

## Top-Level Fields

### `job_id` (string, required)
- **Format**: Generated via `uid` command (e.g., `"uid-jcm-519"`)
- **Usage**: Unique identifier for the job. Same value used for `invoice_number`.
- **Example**: `"uid-abc-123"`

### `invoice_number` (string, required)
- **Format**: Same as `job_id` (no separate invoice counter needed)
- **Usage**: Invoice identifier displayed to client
- **Example**: `"uid-abc-123"`

### `status` (string, required)
- **Options**: `"active"`, `"completed"`, `"archived"`
- **Usage**: Job lifecycle status. `"active"` for current jobs, `"completed"` when contract signed + all payments paid.
- **Default**: `"active"`

---

## Client Information (`client`)

### `client.name` (string, required)
- **Description**: Full business name or client name
- **Example**: `"Everlastings by Emaline"`

### `client.last_name` (string, required)
- **Description**: Client's last name for lookup form
- **Usage**: Used with `project_keyword` to find job in manifest
- **Example**: `"Hoff"`

### `client.project_keyword` (string, required)
- **Description**: Short keyword identifying the project (for lookup form)
- **Format**: Lowercase, hyphenated (e.g., `"art-website"`, `"logo-design"`)
- **Usage**: Combined with `last_name` creates lookup key: `"{last_name}-{project_keyword}"`
- **Example**: `"everlastings-website"`

### `client.contact` (object, required)
- **`name`**: Contact person's full name
- **`title`**: Their role/title (e.g., `"Owner"`, `"Manager"`)
- **`email`**: Contact email address
- **`phone`**: Phone number (include country code if international)

### `client.address` (object, required)
- **`street`**: Street address
- **`city`**: City name
- **`state`**: State/province code (e.g., `"MA"`, `"CA"`)
- **`zip`**: ZIP/postal code

---

## Contract Information (`contract`)

### `contract.date` (string, required)
- **Format**: ISO date `"YYYY-MM-DD"`
- **Description**: Contract creation date
- **Example**: `"2025-01-15"`

### `contract.start_date` (string, required)
- **Format**: ISO date `"YYYY-MM-DD"`
- **Description**: Project start date
- **Example**: `"2025-01-20"`

### `contract.end_date` (string, required)
- **Format**: ISO date `"YYYY-MM-DD"`
- **Description**: Expected project completion date
- **Example**: `"2025-03-15"`

### `contract.rate_type` (string, required)
- **Options**: `"Flat Rate"`, `"Hourly Rate"`, `"Daily Rate"`, `"Weekly Rate"`, `"Monthly Rate"`
- **Description**: How the project is billed
- **Example**: `"Flat Rate"`

### `contract.total_fee` (number, required)
- **Format**: Dollar amount as decimal (e.g., `5000.00`)
- **Description**: Total project fee
- **Example**: `5000.00`

### `contract.deposit_percent` (number, optional)
- **Format**: Percentage as integer (e.g., `25` for 25%)
- **Description**: Deposit percentage (if applicable)
- **Example**: `25`

### `contract.invoice_days` (number, required)
- **Format**: Integer (days)
- **Description**: Payment terms - days client has to pay after invoice
- **Example**: `30`

### `contract.late_fee` (number, optional)
- **Format**: Dollar amount as decimal
- **Description**: Late fee charged per month for overdue payments
- **Example**: `100.00`

### `contract.hourly_fee` (number, optional)
- **Format**: Dollar amount as decimal
- **Description**: Hourly rate for revisions outside scope
- **Example**: `150.00`

### `contract.location` (string, required)
- **Description**: Legal jurisdiction for contract (state/country)
- **Example**: `"Massachusetts"`

### `contract.maintenance_period_months` (number, optional)
- **Format**: Integer (months)
- **Description**: Number of months client must use Contractor for updates
- **Example**: `3`

### Contract Signing Fields

### `contract.signed` (boolean, required)
- **Default**: `false`
- **Description**: Whether contract has been signed
- **Updates**: Set to `true` when client signs via contract.html

### `contract.signed_date` (string, nullable)
- **Format**: ISO date `"YYYY-MM-DD"` or `null`
- **Description**: Date contract was signed
- **Example**: `"2025-01-18"` or `null`

### `contract.signed_by` (string, nullable)
- **Description**: Client name who signed (from signature field)
- **Example**: `"Emy Hoff"` or `null`

### `contract.contractor_signature` (string, nullable)
- **Description**: Contractor signature (typed name)
- **Example**: `"Sean August Horvath"` or `null`

### `contract.contractor_date` (string, nullable)
- **Format**: ISO date `"YYYY-MM-DD"` or `null`
- **Description**: Date contractor signed
- **Example**: `"2025-01-15"` or `null`

### `contract.client_date` (string, nullable)
- **Format**: ISO date `"YYYY-MM-DD"` or `null`
- **Description**: Date client signed
- **Example**: `"2025-01-18"` or `null`

---

## Payments Array (`payments`)

Each payment object represents one payment in the payment schedule.

### `payment_number` (number, required)
- **Format**: Integer (1, 2, 3, etc.)
- **Description**: Payment sequence number
- **Example**: `1`

### `amount` (number, required)
- **Format**: Dollar amount as decimal
- **Description**: Payment amount in dollars
- **Note**: Stripe API converts to cents (multiply by 100) automatically
- **Example**: `1250.00` (becomes 125000 cents in Stripe)

### `currency` (string, required)
- **Format**: Three-letter ISO currency code (lowercase)
- **Default**: `"usd"`
- **Description**: Currency for this payment
- **Example**: `"usd"`

### `description` (string, required)
- **Description**: Payment description shown on invoice
- **Example**: `"Deposit (25%)"` or `"Final payment before launch"`

### `due_type` (string, required)
- **Options**: `"date"` or `"term"`
- **Description**: How due date is determined
- **Example**: `"date"` for fixed dates, `"term"` for milestone-based

### `due_date` (string, nullable)
- **Format**: ISO date `"YYYY-MM-DD"` or `null`
- **Description**: Fixed due date (if `due_type` is `"date"`)
- **Example**: `"2025-01-20"` or `null`

### `due_date_unix` (number, nullable)
- **Format**: Unix timestamp (seconds since epoch) or `null`
- **Description**: Unix timestamp version of `due_date` for Stripe metadata
- **Note**: Auto-generated from `due_date` when creating Stripe objects
- **Example**: `1737417600` (for January 20, 2025) or `null`
- **Conversion**: `Math.floor(new Date("2025-01-20").getTime() / 1000)`

### `due_term` (string, nullable)
- **Description**: Milestone-based due term (if `due_type` is `"term"`)
- **Example**: `"before launch"`, `"upon completion"`, `null`

### `status` (string, required)
- **Options**: `"pending"`, `"paid"`, `"overdue"`
- **Default**: `"pending"`
- **Description**: Payment status
- **Updates**: Set to `"paid"` when payment completes via Stripe

### `paid_date` (string, nullable)
- **Format**: ISO date `"YYYY-MM-DD"` or `null`
- **Description**: Date payment was completed
- **Example**: `"2025-01-19"` or `null`

### `paid_date_unix` (number, nullable)
- **Format**: Unix timestamp (seconds since epoch) or `null`
- **Description**: Unix timestamp version of `paid_date` for Stripe metadata
- **Note**: Auto-generated from `paid_date` when updating Stripe objects
- **Example**: `1737504000` or `null`

### Stripe Integration Fields

### `stripe_product_id` (string, nullable)
- **Format**: Stripe product ID (e.g., `"prod_xxx"`) or `null`
- **Description**: Stripe Product ID created via API
- **Updates**: Set by GitHub Actions workflow when creating Stripe products
- **Example**: `"prod_ABC123xyz"` or `null`

### `stripe_price_id` (string, nullable)
- **Format**: Stripe price ID (e.g., `"price_xxx"`) or `null`
- **Description**: Stripe Price ID created via API
- **Updates**: Set by GitHub Actions workflow when creating Stripe prices
- **Example**: `"price_XYZ789abc"` or `null`

### `stripe_product_name` (string, nullable)
- **Format**: Product name string or `null`
- **Description**: Generated product name for Stripe (format: `"{invoice_number}-{payment_number}"`)
- **Updates**: Set by GitHub Actions workflow
- **Example**: `"uid-abc-123-1"` or `null`

### `stripe_metadata` (object, nullable)
- **Description**: Metadata object for Stripe Product/Price creation
- **Structure**:
  ```json
  {
    "job_id": "uid-abc-123",
    "invoice_number": "uid-abc-123",
    "payment_number": "1",
    "client_last_name": "Smith",
    "project_keyword": "art-website"
  }
  ```
- **Note**: All values stored as strings (even numbers)
- **Updates**: Auto-populated from job data when creating Stripe objects

---

## Project Scope Fields

### `project_scope_summary` (string, required)
- **Format**: 2-3 paragraph text summary
- **Description**: Condensed project scope for contract insertion
- **Length**: ~200-400 words
- **Usage**: Inserted into contract template
- **Note**: Remove sales language, keep essential details only

### `project_scope_full` (string, required)
- **Format**: Full detailed text or reference
- **Description**: Complete project scope document
- **Usage**: Referenced separately in contract (not inserted)
- **Note**: Can be stored as text or file path reference

---

## Creating a New Job Entry

1. **Generate Job ID**: Run `uid` command in terminal
2. **Fill Client Info**: Use `last_name` + `project_keyword` for lookup
3. **Set Contract Dates**: Use ISO format (`YYYY-MM-DD`)
4. **Define Payments**: 
   - Set `amount` in dollars (e.g., `1250.00`)
   - Set `currency` (default: `"usd"`)
   - Choose `due_type`: `"date"` or `"term"`
   - If `due_type: "date"`, set `due_date` (ISO format)
   - If `due_type: "term"`, set `due_term` (e.g., `"before launch"`)
5. **Add Project Scope**: Create `project_scope_summary` (2-3 paragraphs) and `project_scope_full` (detailed)
6. **Leave Stripe Fields Null**: `stripe_product_id`, `stripe_price_id`, etc. will be populated by automation

---

## Common Patterns

### Two-Payment Structure (Deposit + Final)
```json
{
  "payment_number": 1,
  "amount": 400.00,
  "description": "Deposit (50%)",
  "due_type": "date",
  "due_date": "2025-01-20",
  "status": "pending"
},
{
  "payment_number": 2,
  "amount": 400.00,
  "description": "Final payment before launch",
  "due_type": "term",
  "due_term": "before launch",
  "status": "pending"
}
```

### Three-Payment Structure (Deposit + Milestone + Final)
```json
{
  "payment_number": 1,
  "amount": 500.00,
  "description": "Deposit (33%)",
  "due_type": "date",
  "due_date": "2025-01-20",
  "status": "pending"
},
{
  "payment_number": 2,
  "amount": 500.00,
  "description": "Mid-project milestone",
  "due_type": "term",
  "due_term": "upon design approval",
  "status": "pending"
},
{
  "payment_number": 3,
  "amount": 500.00,
  "description": "Final payment before launch",
  "due_type": "term",
  "due_term": "before launch",
  "status": "pending"
}
```

---

## Questions?

Refer to:
- `STRIPE_API_REQUIREMENTS.md` for Stripe API details
- `_job_template.json` for complete structure
- Plan document for overall architecture
