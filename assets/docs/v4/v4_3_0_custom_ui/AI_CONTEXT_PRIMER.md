# AI Context Primer: Freelance Payments System

**Last Updated**: 2026-01-04  
**System Version**: v4.3.0
**Status**: Testing new workflows and custom-ui Stripe integration 

---

## Executive Summary

A **freelance payment collection micro-site** (`payments.august.style`) that automates contract generation, invoice creation, payment processing, and document management using:

- **GitHub Pages** for static frontend hosting (SPA with hash routing)
- **Vercel** for serverless API functions
- **GitHub Actions** for automation workflows
- **Stripe** for payment processing
- **Google Docs API** for PDF generation from templates
- **JSON job files** as the single source of truth

**Key Innovation**: This is a **static website that behaves dynamically** through JSON-driven content, SPA routing, and event-driven automation. All state is managed through JSON files in the repository, not a database.

---

## v4 Schema Basics `assets/docs/v4/_job_schema_v4.jsonc` 
*Always check the pathway linked file for completely accurate and up-to-date schema* 

**Project and contract basics** 
```json 
  "project": null,
  "contract": {
    "work_start": null,
    "work_end": null,
    "legal_jurisdiction": null,
    "maintenance_period_months": 3,
    "maintenance_monthly_fee": 15000,
    "signatures": {
      "contractor": {
        "legal_name": "Sean August Horvath",
        "signed_date": null
      },
      "client": {
        "legal_name": null,
        "signed_date": null
      }
    }
  }
``` 

**PDF creation artifacts for dynamic serving**
```json
  "docs": {
    "contract": {
      "id": null,
      "pdf": null, 
      "file_id": null,
      "url": null, 
      "sha256": null,
      "created": null
    },
    "invoice": {
      "id": null,
      "pdf": null, 
      "file_id": null,
      "url": null, 
      "sha256": null,
      "created": null
    }
  }
```

**State Management tracking through events** 
```json 
  "state": {
    "objects": {
      "created": null,
      "product": null,
      "price_1": null,
      "price_2": null,
      "customer": null,
      "coupon": null,
    },
    "client_status": {
      "logged_in": null,
      "contract_loaded": null,
      "contract_scrolled_complete": null,
      "viewed_contract": true,
      "viewed_invoice": true,
      "downloaded_docs": 0,
      "signed_contract": null
    },
    "payment_1": {
      "intent": null,
      "processing": null,
      "succeeded": null
    },
    "payment_2": {
      "intent": null,
      "processing": null,
      "succeeded": null
    }
  }
``` 
**Stripe catalog Product Object** 
```json 
  "product": {
    "name": null,
    "active": true,
    "description": null,
    "id": null,
    "login_name": null,
    "login_keyword": null,
    "service_usd": null,
    "total_payments": null,
    "discount_usd": null,
    "type": "service", 
    "unit_label": "Payment"
  }
```
**Customer and coupon Stripe catalog product objects**
```json 
  "customer": {
    "name": null,
    "business": null,
    "title": null,
    "email": null,
    "phone": null,
    "id": null,
    "address": {
      "city": null,
      "line1": null,
      "state": null,
      "postal_code": null,
      "country": null
    }
  },

  "coupon": {
    "amount_off": 0,
    "applies_to": {"products": [null]},
    "currency": "usd",
    "duration": "once",
    "id": null,
    "max_redemptions": 1,
    "name": null
  }
```
**Two price payment objects per Job** 
```json 
  "price1": {
    "count": 1, 
    "currency": "usd",
    "unit_amount": 0,
    "active": true,
    "billing_scheme": "per_unit",
    "pay_by": "start of work",
    "nickname": "Initial Payment",
    "product": {"products": [null]},
    "id": null
  },

  "price2": {
    "count": 2, 
    "currency": "usd",
    "unit_amount": null,
    "active": true,
    "billing_scheme": "per_unit",
    "pay_by": "before project launch",
    "pay_days": 14,
    "late_fee": 10000,
    "nickname": "Final Payment",
    "product": {"products": [null]},
    "id": null
  }
```
**Checkout session objects and scope values** 
```json 
  "checkout_session_1": {
    "billing_address_collection": "required",
    "customer_creation": "always",
    "discounts": [{"coupon": null}],
    "line_items": [{"price": null, "quantity": 1}],
    "mode": "payment", 
    "return_url": "https://payments.august.style/{job_id}#completion",
    "ui_mode": "custom"
  },

  "checkout_session_2": {
    "billing_address_collection": "required",
    "customer_creation": "always",
    "discounts": [{"coupon": null}],
    "line_items": [{"price": null, "quantity": 1}],
    "mode": "payment",
    "return_url": "https://payments.august.style/{job_id}#completion",
    "ui_mode": "custom"
  },

"project_scope_summary": null,
"project_scope_full": null
```

---

## Architecture Overview

### System Flow

```
User visits payments.august.style
  ↓
Login form (index.html) → Lookup in manifest.json
  ↓
Redirect to job.html#{section} (SPA routing via 404.html)
  ↓
JavaScript loads job JSON → Displays PDFs or checkout
  ↓
User actions → Vercel API → GitHub Actions → JSON updates
```

### Component Responsibilities

**1. GitHub Pages** (`payments.august.style`)
- Static hosting (HTML, CSS, JavaScript, PDFs)
- SPA routing via `404.html` (serves `job.html` for job URLs)
- Hash-based navigation (`#contract`, `#invoice`, `#payment-1`, `#completion`)

**2. Vercel** (`freelance-payments-neon.vercel.app`)
- Serverless functions for secure operations:
  - `/api/create-checkout-session` - Creates Stripe Checkout Sessions on-demand
  - `/api/sign-contract` - Handles contract signing
  - `/api/update-payment` - Updates payment status
  - `/api/track-event` - Tracks user events
  - `/api/webhook` - Stripe webhook handler
  - `/api/google/auth` - OAuth consent URL (one-time setup)
  - `/api/google/callback` - OAuth callback (extracts refresh token)

**3. GitHub Actions**
- `admin-push.yml` triggered for auto-deploys on EVERY push to `freelance-payments` branch
- `user-behavior.yml` triggered for timed batch processing of frontend user events 
- `payments.yml` triggered for every major payment event

**4. Stripe's Custom UI Elements**
- Products, Prices, Customers, Coupons created via API
- Checkout Sessions created on-demand (not stored in JSON)
- Webhooks trigger state updates

**5. Google Drive/Docs API**
- Templates stored in Google Drive (`TEMPLATES=1cJUCiwrLoWvftdpYaywvZqI7QFTLcIZY`)
- Temporary docs created in `UPDATES` folder (`GOOGLE_TEMP_FOLDER_ID=1JGRnguvUX-hZtv9UDtSZC7dIPrHE-CLE`)
- PDFs exported and saved to repository
- OAuth authentication 

---

## Key Concepts

### 1. Static Site with Dynamic Behavior

This is **not a traditional dynamic website**. It's a static GitHub Pages site that achieves dynamic behavior through:
- **JSON-driven content**: All job data stored in JSON files
- **SPA routing**: `404.html` serves `job.html` for any job URL, JavaScript handles hash navigation
- **Client-side state**: `sessionStorage` stores job data after lookup
- **Event-driven updates**: User actions trigger API calls → GitHub Actions → JSON updates → Site rebuilds

**Why this matters**: Don't try to add a database or server-side rendering. The architecture is intentionally static.

### 2. JSON as Single Source of Truth

Every job is a JSON file in `assets/jobs/{job_id}.json`. This file contains:
- All Stripe object IDs (`state.objects.product`, `state.objects.price_1`, etc.)
- PDF metadata (`docs.contract`, `docs.invoice`)
- Payment state (`state.payment_1.succeeded`, `state.payment_2.succeeded`)
- Client tracking (`state.client_status`)

**Why this matters**: All state changes must update the JSON file. There's no separate database.

### 3. Event-Driven Workflow

**Initial Job Creation**
1. JSON file added to `assets/jobs/`
2. Push triggers `admin-push.yml`
3. Identifies patterns based on JSON and Stripe product matches 
4. Creates Stripe objects, saves IDs to JSON
5. Creates PDFs from templates, saves to repo
6. Updates manifest.json
7. Single git commit/push

**Why this matters**: PDFs are generated **immediately after Stripe objects are created**, not after payment. This ensures PDFs are available before checkout.

**Payment Completion**
1. Stripe webhook → `/api/webhook`
2. Vercel triggers GitHub Actions `workflow_dispatch`
3. Triggers workflow `payment.yml`
4. Batches necessary JSON updates for state management 
5. Then continues sequence followed in admin-push.yml to address any JSON/catalog match/mismatch actions 
6. Updates manifest.json
7. Single git commit/push

**User-Behavior Event Tracking** 
1. Github pages events tracked on front-end 
2. Triggers workflow `user-behavior.yml`
3. Events tracked require JSON state management updates which are batched for 2 min after inactivity 
4. Then continues sequence followed in admin-push.yml to address any JSON/catalog match/mismatch actions 
5. Updates manifest.json
6. Single git commit/push

### 4. Stripe Catalog Lookup

Login lookup matches `login_name` and `login_keyword` separately (not combined).

**Why this matters**: The manifest is the lookup index. It's regenerated on every push.

---

## Data Structure: Job JSON Schema (v4)

**Reference files:**
- `assets/docs/v4/_job_schema_v4.jsonc` 
- Note that this is a .json COMMENTS file 
- It should be used to make standard .JSON files 

### Core Fields

- `product.id` - Job ID (matches filename, e.g., `uid-test-001`)
- `product.login_name` - Client's last name for lookup
- `product.login_keyword` - Project keyword for lookup
- `state.objects` - Stripe object IDs (`product`, `price_1`, `price_2`, `customer`, `coupon`)
- `state.payment_1` / `state.payment_2` - Payment status (`succeeded`, `processing`, etc.)
- `docs.contract` / `docs.invoice` - PDF metadata (`id`, `pdf`, `url`, `sha256`, `created`)
- `price1` / `price2` - Payment details (`unit_amount`, `nickname`, `pay_by`, etc.)

---

## Placeholder Mapping Chart

**Placeholder → JSON Value mappings for Google Docs templates:**

| Template Placeholder            | Mapped JSON Value                                         |
| ------------------------------- | --------------------------------------------------------- |
| {{docs.invoice.id}}             | `docs.invoice.id`                                         |
| {{docs.invoice.created}}        | `docs.invoice.created`                                    |
| {{contract.work_start}}         | formatDate(`contract.work_start`)                         |
| {{contract.work_end}}           | formatDate(`contract.work_end`)                           |
| {{contract.legal_jurisdiction}} | `contract.legal_jurisdiction`                             |
| {{project}}                     | `project`                                                 |
| {{amount_due}}                  |  Variable                                                 |
| {{customer.business}}           | `customer.business`                                       |
| {{customer.name}}               | `customer.name`                                           |
| {{customer.title}}              | `customer.title`                                          |
| {{customer.address.line1}}      | `customer.address.line1`                                  |
| {{city}}                        | `customer.address.city`                                   |
| {{state}}                       | `customer.address.state`                                  |
| {{postal_code}}                 | `customer.address.postal_code`                            |
| {{country}}                     | `customer.address.country`                                |
| {{customer.email}}              | `customer.email`                                          |
| {{customer.phone}}              | `customer.phone`                                          |
| {{product.login_name}}          | `product.login_name`                                      |
| {{product.login_keyword}}       | `product.login_keyword`                                   |
| {{price1.nickname}}             | `price1.nickname`                                         |
| {{price2.nickname}}             | `price2.nickname`                                         |
| {{price2.pay_days}}             | `price2.pay_days`                                         |
| {{price2.late_fee}}             | `price2.late_fee`                                         |
| {{price1.pay_by}}               | `price1.pay_by`                                           |
| {{price2.pay_by}}               | `price2.pay_by`                                           |
| {{price1.unit_amount}}          | `price1.unit_amount`                                      |
| {{price2.unit_amount}}          | `price2.unit_amount`                                      |
| {{project_scope_summary}}       | `project_scope_summary`                                   |
| {{project_scope_full}}          | `project_scope_full`                                      |
| {{subtotal}}                    | formatCurrency(`price1.unit_amount`+`price2.unit_amount`) |
| {{amount_off}}                  | formatCurrency(`coupon.amount_off`)                       |
| {{total}}                       | formatCurrency(`{{subtotal}}`–`{{discount}}`)             |
| {{amount_paid}}                 | Variable                                                  |
| {{today}}                       | formatDate(day-invoice-is-created)                        |

**Variable Placeholders:**
- `{{amount_due}}` - Calculated from `state.payment_1` and `state.payment_2` (see `calculate_amount_due()` in `generate_pdfs.py`)
- `{{amount_paid}}` - Calculated from payment state (see `calculate_amount_paid()` in `generate_pdfs.py`)

**Note**: Most placeholders match mapped JSON field names directly. 
Only a few require formatting (dates via `format_date()`, currency via `format_currency()`).

**Key points:**
- Most placeholders match JSON field names directly (e.g., `{{customer.name}}` → `customer.name`)
- Some require formatting (dates, currency)
- Variables like `{{amount_due}}` and `{{amount_paid}}` are calculated from payment state
- `{{today}}` uses current date for invoice generation

---

## Common Pitfalls & What NOT to Change

### 1. Don't Add a Database
The system is intentionally JSON-based. Adding a database would require a complete architecture rewrite.

### 2. Don't Change Manifest Structure
The manifest uses `login_keyword` as the lookup key. Changing this breaks the login flow.

### 3. Don't Modify PDFs After Generation
PDFs are immutable. If changes are needed, create a new job with a new UID.

### 4. Don't Store Checkout Session IDs
Sessions expire after 24 hours. They're created on-demand, not stored.

### 5. Don't Remove OAuth Scopes
PDF generation requires `https://www.googleapis.com/auth/drive` (full Drive access) to access shared templates. `drive.file` scope is too narrow.

### 6. Don't Change PDF Storage Location
PDFs must be in `assets/pdf/contract/` and `assets/pdf/invoice/` for GitHub Pages to serve them.

### 7. Don't Skip the Orchestrator
All workflow steps must go through `orchestrate_workflow.py` to prevent GitHub Actions cancellation issues. Never commit/push directly from individual scripts.

### 8. Don't Use HTML Fallback
v4 requires PDF-only display. If PDF generation fails, show an error, not HTML rendering.

---

## Extension Points: Where to Add Features

### 1. Email Delivery
**Where**: After PDF generation in `generate_pdfs.py` or via webhook handler
**How**: Add email service (SendGrid, etc.) to send PDF links to client and contractor
**Files**: `.github/scripts/pdf/generate_pdfs.py`, `api/webhook.js`

**OR** I saw one of the scopes we added from Google was "send email as me" which could work great. 

### 2. Event Tracking
**Where**: Frontend JavaScript files
**How**: Already partially implemented (`api/track-event.js`). Expand to track more user actions:
- Contract scrolled completely
- Invoice viewed
- Document downloaded
- Time spent on each section
**Files**: `assets/js/contract-controller.js`, `assets/js/invoice-controller.js`, `api/track-event.js`

### 3. Digital Signatures
**Where**: Contract signing flow
**How**: Enhance `/api/sign-contract` to:
- Generate signature image from user input
- Embed signature in PDF (requires PDF manipulation library)
- Store signature metadata with PDF SHA256 hash
**Files**: `api/sign-contract.js`, `assets/js/contract-controller.js`

### 4. Email Signed Documents
**Where**: After contract signing
**How**: After signature saved, trigger email with signed contract PDF
**Files**: `api/sign-contract.js`, add email service integration

### 5. Design Updates
**Where**: Frontend CSS and HTML
**How**: Update `assets/css/styles.css` and HTML templates. Breakpoints already exist (640px, 768px, 1024px, 1280px, 1536px)
**Files**: `index.html`, `job.html`, `assets/css/styles.css`

### 6. Additional Payment Methods
**Where**: Stripe Checkout Session creation
**How**: Modify `api/create-checkout-session.js` to enable additional payment methods
**Files**: `api/create-checkout-session.js`

### 7. Discount Codes
**Where**: Coupon handling
**How**: Already supported via `coupon` object. Could add frontend UI for clients to enter discount codes
**Files**: `assets/js/checkout-controller.js`, `api/create-checkout-session.js`

---

## File Structure

```
freelance-payments/
├── index.html                    # Login lookup form
├── 404.html                     # SPA routing handler (serves job.html for job URLs)
├── job.html                      # Single-page template (contract, invoice, payment sections)
├── api/                          # Vercel serverless functions
│   ├── create-checkout-session.js
│   ├── sign-contract.js
│   ├── update-payment.js
│   ├── track-event.js
│   ├── webhook.js
│   ├── update-payment.js
│   ├── google/auth.js
│   └── google/callback.js
├── assets/
│   ├── jobs/                     # Job JSON files (one per client project)
│   │   └── uid-xxx-xxx.json
│   ├── js/
│   │   ├── manifest.json         # Lookup manifest (generated)
│   │   ├── payment-lookup.js     # Login form handler
│   │   ├── payment-router.js     # State machine for routing
│   │   ├── contract-controller.js # Contract PDF display
│   │   ├── invoice-controller.js  # Invoice PDF display
│   │   └── checkout-controller.js # Stripe Checkout integration
│   ├── pdf/
│   │   ├── contract/             # Contract PDFs (kon-{job_id}.pdf)
│   │   └── invoice/               # Invoice PDFs (inv-{job_id}.pdf)
│   └── css/
│       └── styles.css             # Tailwind CSS (includes breakpoints)
├── .github/
│   └── workflows/
│       ├── admin-push.yml        # Creates objects and PDFs
│       ├── user-behavior.yml        # Triggers from user behavior on front end 
│       └── payment.yml        # Triggered by payment events 
└── assets/docs/
    ├── _job_schema_v4.jsonc
    └── v4
        ├── v4_3_0
        │   └── AI_CONTEXT_PRIMER.md   # This file
        └── v4_3_3
            └── LIVING_DEV_PLAN.md     # Version changes, current state
```

---

## Environment Variables

### GitHub Secrets (for GitHub Actions)
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REFRESH_TOKEN` - OAuth refresh token (obtained from `/api/google/auth` flow)
- `GOOGLE_TEMPLATE_CONTRACT_ID` - Google Docs contract template ID
- `GOOGLE_TEMPLATE_INVOICE_ID` - Google Docs invoice template ID
- `GOOGLE_TEMP_FOLDER_ID` - Google Drive folder for temporary docs

### Vercel Environment Variables
- Same as above, plus:
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signature secret
- `GOOGLE_REDIRECT_URI` - OAuth callback URL (`https://freelance-payments-neon.vercel.app/api/google/callback`)

---

## Testing

See `assets/docs/v4/v4_1_0_pdfs/TESTING_GUIDE.md` for:
- Stripe test card numbers
- Testing workflow
- Common test scenarios
- Debugging tips

---

## References

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [Google Docs API Documentation](https://developers.google.com/docs/api)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

---
