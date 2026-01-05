# AI Context Primer: Freelance Payments System

**Last Updated**: 2026-01-04  
**System Version**: v4  
**Status**: Production-ready

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

## v4 Schema Updates Summary

**For complete changelog, see:** `assets/docs/v4/v4_UPDATES.md` and `assets/docs/v4/_SCHEMA_CHANGELOG.md`

### Key Changes from v3 → v4

1. **Flattened Structure**: Removed `metadata` nesting, shortened field names (`product_object` → `product`, `state_management` → `state`)
2. **Price Objects**: `initial_price_object` → `price1`, `balance_price_object` → `price2`
3. **State Management**: `state_management` → `state`, `state.objects.price_1` and `state.objects.price_2` (not `initial_price`/`balance_price`)
4. **PDF Generation**: PDFs generated immediately after Stripe objects created, stored in repo (`assets/pdf/contract/kon-{job_id}.pdf`, `assets/pdf/invoice/inv-{job_id}.pdf`)
5. **OAuth-Only**: Service Account removed, using OAuth refresh token for Google API authentication
6. **ID Prefixes**: Contract IDs use `kon-` prefix, Invoice IDs use `inv-` prefix, Customer IDs use `cus-` prefix, Coupon IDs use `cou-` prefix

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
- Cannot run server code or store secrets

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
- `orchestrate.yml` - Main orchestrator (sync_catalog → generate_pdfs → generate_manifest → git commit/push)
- `pages-build.yml` - GitHub Pages build (skips if orchestrator commits)
- Triggers: Push to `freelance-payments` branch, `workflow_dispatch` from Vercel
- Updates: JSON files, PDFs, manifest.json

**4. Stripe**
- Products, Prices, Customers, Coupons created via API
- Checkout Sessions created on-demand (not stored in JSON)
- Webhooks trigger state updates

**5. Google Drive/Docs API**
- Templates stored in Google Drive (`TEMPLATES=1cJUCiwrLoWvftdpYaywvZqI7QFTLcIZY`)
- Temporary docs created in `UPDATES` folder (`GOOGLE_TEMP_FOLDER_ID=1JGRnguvUX-hZtv9UDtSZC7dIPrHE-CLE`)
- PDFs exported and saved to repository
- OAuth authentication (internal organization)

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

**Initial Job Creation:**
1. JSON file added to `assets/jobs/`
2. Push triggers `orchestrate.yml`
3. `sync_catalog.py` creates Stripe objects, saves IDs to JSON
4. `generate_pdfs.py` creates PDFs from templates, saves to repo
5. `generate_manifest.py` updates manifest.json
6. Single git commit/push

**Payment Completion:**
1. Stripe webhook → `/api/webhook`
2. Vercel triggers GitHub Actions `workflow_dispatch`
3. `update_payment.py` updates JSON payment state
4. Git commit/push

**Why this matters**: PDFs are generated **immediately after Stripe objects are created**, not after payment. This ensures PDFs are available before checkout.

### 4. Manifest-Based Lookup

`assets/js/manifest.json` is generated from job JSON files. Structure:
```json
{
  "jobs": {
    "login_keyword": {
      "file_path": "assets/jobs/uid-xxx-xxx.json",
      "job_id": "uid-xxx-xxx",
      "login_keyword": "project-keyword",
      "login_name": "ClientLastName"
    }
  }
}
```

Login lookup matches `login_name` and `login_keyword` separately (not combined).

**Why this matters**: The manifest is the lookup index. It's regenerated on every push.

---

## Data Structure: Job JSON Schema (v4)

**Reference files:**
- `assets/docs/v4/_blank_job_schema_v4.json` - Blank template
- `assets/docs/v4/_json_value_examples_v4.json` - Example with values
- `assets/docs/v4/_SCHEMA_CHANGELOG.md` - Complete changelog

### Core Fields

- `product.id` - Job ID (matches filename, e.g., `uid-test-001`)
- `product.login_name` - Client's last name for lookup
- `product.login_keyword` - Project keyword for lookup
- `state.objects` - Stripe object IDs (`product`, `price_1`, `price_2`, `customer`, `coupon`)
- `state.payment_1` / `state.payment_2` - Payment status (`succeeded`, `processing`, etc.)
- `docs.contract` / `docs.invoice` - PDF metadata (`id`, `pdf`, `url`, `sha256`, `created`)
- `price1` / `price2` - Payment details (`unit_amount`, `nickname`, `pay_by`, etc.)

### Important Notes

- **Price.product.products**: This field exists in JSON schema but is **not used by Stripe API**. When creating Stripe Price objects, we pass `product: product_id` directly (see `sync_catalog.py` line 142). The nested structure is for JSON consistency but Stripe only needs the product_id string. You can leave it empty or remove it - it won't affect functionality.

- **Checkout Sessions**: Stored as parameters in JSON (`checkout_session_1`, `checkout_session_2`) but **sessions are created on-demand** via `/api/create-checkout-session`. The JSON parameters are defaults/templates, not actual session IDs.

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

**Note**: Most placeholders match JSON field names directly. Only a few require formatting (dates via `format_date()`, currency via `format_currency()`).

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
│   ├── workflows/
│   │   ├── orchestrate.yml        # Main workflow orchestrator
│   │   └── pages-build.yml        # GitHub Pages build
│   └── scripts/
│       ├── generate_manifest.py
│       ├── orchestration/
│       │   ├── orchestrate_workflow.py  # Umbrella orchestrator
│       │   └── sync_catalog.py          # Stripe object sync
│       ├── pdf/
│       │   └── generate_pdfs.py         # PDF generation from Google Docs
│       └── utils/
│           └── json_io.py                # JSON file operations
└── assets/docs/
    └── v4/
        ├── AI_CONTEXT_PRIMER.md   # This file
        ├── v4_UPDATES.md          # Version changelog
        ├── TESTING_GUIDE.md       # Testing instructions
        ├── _blank_job_schema_v4.json
        └── _json_value_examples_v4.json
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

See `assets/docs/v4/TESTING_GUIDE.md` for:
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

**Note**: This document is for AI context. For version changelog, see `v4_UPDATES.md`. For testing, see `TESTING_GUIDE.md`.
