# AI Context Primer: Freelance Payments System

**Last Updated**: 2026-01-03  
**System Version**: v4 (OAuth-only PDF Generation)  
**Status**: Production-ready, OAuth authentication implemented

---

## Executive Summary

This is a **freelance payment collection micro-site** (`payments.august.style`) that automates contract generation, invoice creation, payment processing, and document management. The system uses:

- **GitHub Pages** for static frontend hosting
- **Vercel** for serverless API functions
- **GitHub Actions** for automation workflows
- **Stripe** for payment processing (Checkout Sessions, Products, Prices, Customers, Coupons)
- **Google Docs API** for PDF generation from templates (NEW)
- **JSON job files** as the single source of truth

**Key Innovation**: Event-driven architecture where Stripe webhooks trigger document generation, and all state is managed through JSON files in the repository.

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  GitHub Pages   │────▶│  Vercel API      │────▶│  GitHub Actions     │
│  (Frontend)     │     │  (Serverless)    │     │  (Automation)       │
│  Static Site    │     │                  │     │  JSON Updates       │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
         │                       │                         │
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Client Browser │     │   Stripe API     │     │  Google Drive API  │
│  (User View)    │     │  (Payments)      │     │  (PDF Generation)  │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
```

### Component Responsibilities

**1. GitHub Pages** (`payments.august.style`)
- Hosts: HTML, CSS, JavaScript, static assets
- What users see: Lookup form, contract viewer, invoice viewer, checkout
- Cannot: Run server code, store secrets, process payments
- Routing: SPA using `404.html` and hash anchors (`#contract`, `#invoice`, `#payment-1`)

**2. Vercel** (`freelance-payments-neon.vercel.app`)
- Serverless functions:
  - `/api/create-checkout-session` - Creates Stripe Checkout Sessions on-demand
  - `/api/sign-contract` - Handles contract signing, triggers GitHub Actions
  - `/api/update-payment` - Updates payment status, triggers GitHub Actions
  - `/api/track-event` - Tracks user events (contract loaded, scrolled, etc.)
  - `/api/webhook` - Stripe webhook handler (listens for `checkout.session.completed`)
  - `/api/google/auth` - OAuth consent URL generator (one-time setup)
  - `/api/google/callback` - OAuth callback handler (extracts refresh token)
- Has: `STRIPE_SECRET_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_TEMPLATE_CONTRACT_ID`, `GOOGLE_TEMPLATE_INVOICE_ID` configured
- Does: Creates payment sessions, validates webhooks, triggers GitHub Actions, handles OAuth flow

**3. GitHub Actions**
- Workflows:
  - `orchestrate.yml` - Main orchestrator (runs sync_catalog, update_state, generate_manifest)
  - `pages-build.yml` - Custom GitHub Pages build (runs Jekyll manually)
- Triggers: Push to `freelance-payments` branch, `workflow_dispatch` (from Vercel)
- Updates: JSON files in `assets/jobs/`, `assets/js/manifest.json`

**4. Google Drive/Docs API** (v4)
- Template storage: Google Docs templates with `{{placeholder}}` syntax
- PDF generation: Clone template → Replace placeholders → Export as PDF → Save to repo
- Authentication: OAuth refresh token (internal organization setup)
- Storage: PDFs stored in repo `assets/pdf/contract/` and `assets/pdf/invoice/`
- Template IDs: Contract (`1BJI1-d1NJu9pgLKI7Z_EHP9Y2rd6bqR57yZVJxwXJB8`), Invoice (`1BYf71d5Bryy8SrfnQdxSeIfzQilsvHQ8bqUKTh5QB1c`)

---

## v4 Schema Changes Summary

### Key Changes from v3 → v4

**1. Flattened Structure**
- Removed `metadata` nesting level throughout
- Shortened field names (e.g., `product_object` → `product`, `state_management` → `state`)
- Direct field access (e.g., `product.login_name` instead of `product.metadata.login_name`)

**2. Price Object Renaming**
- `initial_price_object` → `price1`
- `balance_price_object` → `price2`
- `state.objects.initial_price` → `state.objects.price_1`
- `state.objects.balance_price` → `state.objects.price_2`

**3. Customer Object Simplification**
- `customer_object` → `customer`
- `customer_object.description` → `customer.title` (stored in Stripe metadata)
- `customer_object.individual_name` → `customer.name`
- `customer_object.business_name` → `customer.business`

**4. State Management Updates**
- `state_management` → `state`
- `state_management.object_id` → `state.objects`
- `state_management.initial_payment_intent` → `state.payment_1`
- `state_management.balance_payment_intent` → `state.payment_2`

**5. Checkout Session Updates**
- `initial_checkout_session` → `checkout_session_1`
- `balance_checkout_session` → `checkout_session_2`

**6. PDF Generation (NEW in v4)**
- PDFs generated immediately after Stripe objects created (during initial push workflow)
- Stored in repo: `assets/pdf/contract/kon-{job_id}.pdf` and `assets/pdf/invoice/inv-{job_id}.pdf`
- Metadata stored in `docs.contract` and `docs.invoice` fields
- No HTML fallback - frontend only displays PDFs or shows error

**7. Authentication (v4 Update)**
- OAuth-only authentication (Service Account removed)
- Internal Google Cloud organization setup
- Refresh token stored in GitHub Secrets as `GOOGLE_REFRESH_TOKEN`
- Template files shared with OAuth user account (`development@august.style`)

For complete changelog, see `assets/docs/v4/_SCHEMA_CHANGELOG.md`.

---

## Data Structure: Job JSON Schema (v4)

Each client project is represented by a single JSON file in `assets/jobs/` named `{job_id}.json` (e.g., `uid-abc-123.json`).

**Note**: The example below shows v3 schema structure. For v4 schema examples, see:
- `assets/docs/v4/_blank_job_schema_v4.json` - Blank template for new jobs
- `assets/docs/v4/_json_value_examples_v4.json` - Example with sample values
- `assets/docs/v4/_SCHEMA_CHANGELOG.md` - Complete changelog of v3→v4 changes

### Core Structure (v3 example - see files above for v4)

```json
{
  "project": "Project Name",
  "contract": {
    "work_start": "2026-12-30",
    "work_end": "2026-12-31",
    "legal_jurisdiction": "California",
    "maintenance_period_months": 3,
    "maintenance_monthly_fee": "$150",
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
  },
  "state_management": {
    "object_id": {
      "created": "2025-12-30T18:51:40.071111Z",
      "product": "uid-sst-846",
      "initial_price": "price_1Sk81A9fljwH26CPWq2sOLqU",
      "balance_price": "price_1Sk81A9fljwH26CPdQFDdLBK",
      "customer": "uid-sst-846-client",
      "coupon": "uid-sst-846-coupon",
      "checkout_session": {
        "initial": "parameters_stored",
        "balance": "parameters_stored"
      }
    },
    "client_status": {
      "logged_in": null,
      "contract_loaded": null,
      "contract_scrolled_complete": false,
      "viewed_contract": false,
      "viewed_invoice": false,
      "downloaded_docs": 0,
      "signed_contract": null
    },
    "initial_payment_intent": {
      "created": null,
      "processing": null,
      "succeeded": null
    },
    "balance_payment_intent": {
      "created": null,
      "processing": null,
      "succeeded": null
    }
  },
  "product_object": {
    "name": "Full Flow Standard Job",
    "active": true,
    "description": "Project description",
    "id": "uid-sst-846",
    "metadata": {
      "login_keyword": "full-flow",
      "login_name": "Flow",
      "service_usd": "$1,250",
      "total_payments": 2,
      "discount_usd": "$250"
    },
    "type": "service",
    "unit_label": "Payment"
  },
  "customer_object": {
    "individual_name": "Sandra Flow",
    "business_name": "Flowing With Sandy LLC",
    "description": "Managing Owner",
    "email": "sandy@flow.com",
    "phone": "210-510-0100",
    "id": "uid-sst-846-client",
    "address": {
      "city": "Bangor",
      "line1": "9301 Gerbil Rd",
      "state": "ME",
      "postal_code": "10111",
      "country": "US"
    }
  },
  "initial_price_object": {
    "currency": "usd",
    "active": true,
    "billing_scheme": "per_unit",
    "metadata": {
      "payment_number": 1,
      "payment_usd": "$750",
      "balance_usd": "$750",
      "pay_by": "Meow."
    },
    "nickname": "Payment with discount",
    "product": {
      "products": ["uid-sst-846"]
    },
    "id": "price_1Sk81A9fljwH26CPWq2sOLqU",
    "unit_amount": 75000
  },
  "balance_price_object": {
    "currency": "usd",
    "active": true,
    "billing_scheme": "per_unit",
    "metadata": {
      "payment_number": 2,
      "payment_usd": "$250",
      "balance_usd": "$0",
      "pay_by": "Meow, but a little later than right meow.",
      "pay_days": 14,
      "late_fee": "$100"
    },
    "nickname": "Balance Payment",
    "product": {
      "products": ["uid-sst-846"]
    },
    "id": "price_1Sk81A9fljwH26CPdQFDdLBK",
    "unit_amount": 25000
  },
  "coupon_object": {
    "amount_off": 25000,
    "applies_to": {
      "products": ["uid-sst-846"]
    },
    "currency": "usd",
    "duration": "once",
    "id": "uid-sst-846-coupon",
    "max_redemptions": 1,
    "name": "FOR-SANDY"
  },
  "initial_checkout_session": {
    "automatic_tax": {
      "enabled": true,
      "liability": {
        "type": "self"
      }
    },
    "billing_address_collection": "required",
    "branding_settings": {
      "font_family": "noto_sans",
      "background_color": "#1f1f1f",
      "border_style": "pill",
      "button_color": "#9C528B",
      "display_name": "august.style designer"
    },
    "client_reference_id": "uid-sst-846-client",
    "currency": "usd",
    "customer_creation": "always",
    "custom_text": {
      "after_submit": {
        "message": "Glorious!"
      }
    },
    "discounts": null,
    "line_items": [
      {
        "price": "price_1Sk81A9fljwH26CPWq2sOLqU",
        "quantity": 1
      }
    ],
    "mode": "payment",
    "redirect_on_completion": "always",
    "return_url": "https://payments.august.style/uid-sst-846#completion",
    "submit_type": "pay",
    "ui_mode": "embedded",
    "name_collection": {
      "individual": {
        "enabled": true
      },
      "business": {
        "enabled": true,
        "optional": true
      }
    }
  },
  "balance_checkout_session": {
    // Similar structure to initial_checkout_session
  },
  "project_scope_summary": "Brief project description",
  "project_scope_full": "Full detailed project scope document stored separately."
}
```

### Key Fields for PDF Generation

**Contract Fields** (from JSON → Google Docs template):
- `contract.work_start` → `{{start_date}}`
- `contract.work_end` → `{{end_date}}`
- `contract.legal_jurisdiction` → `{{jurisdiction}}`
- `customer_object.individual_name` or `customer_object.business_name` → `{{client_name}}`
- `customer_object.address` → `{{client_address}}`
- `product_object.name` → `{{project_title}}`
- `project_scope_summary` or `project_scope_full` → `{{deliverables}}`
- `initial_price_object.unit_amount` + `balance_price_object.unit_amount` → `{{total_amount}}`
- `initial_price_object.metadata.pay_by` → `{{payment_terms}}`

**Invoice Fields** (from JSON → Google Docs template):
- `product_object.id` → `{{invoice_number}}`
- `customer_object.individual_name` or `customer_object.business_name` → `{{bill_to_name}}`
- `customer_object.address` → `{{bill_to_address}}`
- `initial_price_object` and `balance_price_object` → `{{item_rows}}` (table rows)
- `coupon_object.amount_off` → `{{discount}}`
- `initial_price_object.unit_amount` + `balance_price_object.unit_amount` → `{{subtotal}}`
- `balance_price_object.metadata.pay_by` → `{{due_date}}`

**PDF Artifacts** (stored in JSON after generation):
```json
{
  "pdf_artifacts": {
    "contract_pdf": {
      "drive_file_id": "1a2b3c4d5e6f7g8h9i0j",
      "url": "https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view",
      "sha256": "abc123...",
      "generated_at": "2025-12-30T18:51:40Z"
    },
    "invoice_pdf": {
      "drive_file_id": "9z8y7x6w5v4u3t2s1r0q",
      "url": "https://drive.google.com/file/d/9z8y7x6w5v4u3t2s1r0q/view",
      "sha256": "def456...",
      "generated_at": "2025-12-30T18:51:40Z"
    }
  }
}
```

---

## Workflow: Event-Driven PDF Generation

### Current Flow (Before PDF Generation)

1. **User logs in** → `index.html` → Lookup in `manifest.json` → Redirect to `job.html#contract`
2. **User views contract** → `contract-controller.js` loads JSON → Displays HTML (markdown-to-HTML)
3. **User signs contract** → Frontend calls `/api/sign-contract` → GitHub Actions updates JSON
4. **User views invoice** → `invoice-controller.js` loads JSON → Displays HTML
5. **User pays** → Stripe Checkout Session → Webhook → GitHub Actions updates JSON

### New Flow (With PDF Generation)

**Trigger**: `checkout.session.completed` OR `payment_intent.succeeded` webhook

**Steps**:
1. **Webhook received** → `/api/webhook` validates signature
2. **Extract job_id** → From `client_reference_id` or webhook metadata
3. **Load job JSON** → Read from `assets/jobs/{job_id}.json`
4. **Generate Contract PDF**:
   - Clone Google Doc template (`GOOGLE_TEMPLATE_CONTRACT_ID`)
   - Replace placeholders with values from JSON
   - Export as PDF
   - Store in Google Drive (or authenticated proxy)
   - Calculate SHA256 hash
   - Update JSON: `pdf_artifacts.contract_pdf = {drive_file_id, url, sha256, generated_at}`
5. **Generate Invoice PDF**:
   - Clone Google Doc template (`GOOGLE_TEMPLATE_INVOICE_ID`)
   - Replace placeholders (including dynamic `{{item_rows}}` table)
   - Export as PDF
   - Store in Google Drive
   - Calculate SHA256 hash
   - Update JSON: `pdf_artifacts.invoice_pdf = {drive_file_id, url, sha256, generated_at}`
6. **Archive PDFs** → Commit PDFs to `assets/completed_docs/{job_id}-{timestamp}-contract.pdf` and `{job_id}-{timestamp}-invoice.pdf`
7. **Email** → Send PDF links to client and contractor (via email service or webhook)
8. **Update JSON** → Commit changes to repository

**Key Point**: PDFs are generated **on-demand** when payment succeeds, not when contract is signed. This ensures the invoice reflects actual payment amounts.

---

## Google Docs Template Setup

### Template Creation

1. **Create Contract Template** (`Freelance Contract v1`):
   - Use Google Docs formatting (typography, spacing, headers)
   - Insert placeholders: `{{client_name}}`, `{{client_address}}`, `{{project_title}}`, `{{deliverables}}`, `{{start_date}}`, `{{end_date}}`, `{{total_amount}}`, `{{payment_terms}}`, `{{jurisdiction}}`
   - Save template
   - Get template ID from URL: `https://docs.google.com/document/d/{TEMPLATE_ID}/edit`
   - Store in Vercel env: `GOOGLE_TEMPLATE_CONTRACT_ID`

2. **Create Invoice Template** (`Invoice v1`):
   - Use Google Docs formatting
   - Insert placeholders: `{{invoice_number}}`, `{{bill_to_name}}`, `{{bill_to_address}}`, `{{item_rows}}`, `{{subtotal}}`, `{{discount}}`, `{{tax}}`, `{{total}}`, `{{due_date}}`
   - For `{{item_rows}}`: Create a table with one row, mark it for script replacement
   - Save template
   - Get template ID
   - Store in Vercel env: `GOOGLE_TEMPLATE_INVOICE_ID`

### Placeholder Syntax

- **Simple placeholders**: `{{field_name}}` → Replaced with string value from JSON
- **Dynamic tables**: `{{item_rows}}` → Replaced by script that generates table rows from `initial_price_object` and `balance_price_object`

### Template Storage

- Templates stored in Google Drive
- OAuth user account (`development@august.style`) has Editor access to templates
- Templates are **immutable** (don't modify after creation, create new version if needed)

---

## API Endpoints

### `/api/webhook` (Stripe Webhook Handler)

**Trigger**: Stripe webhook events (`checkout.session.completed`, `payment_intent.succeeded`)

**Process**:
1. Validate webhook signature
2. Extract `job_id` from `client_reference_id`
3. Call `/api/generate-pdf` (internal) or trigger GitHub Actions
4. Return 200 OK

### `/api/generate-pdf` (NEW - To Be Implemented)

**Endpoint**: `POST /api/generate-pdf`

**Request Body**:
```json
{
  "job_id": "uid-sst-846",
  "document_type": "contract" | "invoice" | "both"
}
```

**Process**:
1. Load job JSON from repository (or pass in request)
2. Determine which templates to use (`contract`, `invoice`, or both)
3. For each template:
   - Clone Google Doc template
   - Replace placeholders with JSON values
   - Export as PDF
   - Store in Google Drive
   - Calculate SHA256 hash
   - Return file info
4. Update job JSON with PDF artifacts
5. Commit PDFs to `assets/completed_docs/`
6. Trigger email (optional)

**Response**:
```json
{
  "success": true,
  "job_id": "uid-sst-846",
  "contract_pdf": {
    "drive_file_id": "1a2b3c4d5e6f7g8h9i0j",
    "url": "https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view",
    "sha256": "abc123..."
  },
  "invoice_pdf": {
    "drive_file_id": "9z8y7x6w5v4u3t2s1r0q",
    "url": "https://drive.google.com/file/d/9z8y7x6w5v4u3t2s1r0q/view",
    "sha256": "def456..."
  }
}
```

---

## Frontend Integration

### Contract Page (`job.html#contract`)

**Current**: Displays HTML generated from markdown in JSON

**New**: Embed Google Drive PDF viewer or serve PDF from authenticated proxy

```html
<iframe src="https://drive.google.com/file/d/{drive_file_id}/preview" width="100%" height="600px"></iframe>
```

**Fallback**: If PDF not generated yet, show HTML version (backward compatibility)

### Invoice Page (`job.html#invoice`)

**Current**: Displays HTML generated from JSON

**New**: Embed Google Drive PDF viewer

**Download Button**: Links to PDF URL (same as embedded viewer)

### Signature Flow

**Current**: Typed name + "I agree" checkbox → POST to `/api/sign-contract`

**New**: Same flow, but signature metadata includes PDF SHA256 hash for verification:
```json
{
  "signatures": {
    "client": {
      "legal_name": "Sandra Flow",
      "signed_date": "2025-12-30T18:51:40Z",
      "ip": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "pdf_sha256": "abc123..."
    }
  }
}
```

---

## Security & Storage

### Google Drive Access

- **OAuth Authentication**: Uses refresh token for headless authentication in GitHub Actions
- **Template Access**: OAuth user account has Editor access to templates
- **PDF Storage**: PDFs saved directly to repository (`assets/pdf/contract/` and `assets/pdf/invoice/`)
- **Public Access**: PDFs served via GitHub Pages (public repository)

### Repository Storage

- PDFs committed to `assets/pdf/contract/` and `assets/pdf/invoice/` with names: `kon-{job_id}.pdf` and `inv-{job_id}.pdf`
- Provides audit trail and backup
- Job JSON stores PDF paths and URLs for frontend access
- Temporary Google Doc copies are deleted immediately after PDF export

---

## Environment Variables

### Vercel Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...

# Google OAuth (for PDF generation)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token  # Obtained from /api/google/auth flow
GOOGLE_TEMPLATE_CONTRACT_ID=1BJI1-d1NJu9pgLKI7Z_EHP9Y2rd6bqR57yZVJxwXJB8
GOOGLE_TEMPLATE_INVOICE_ID=1BYf71d5Bryy8SrfnQdxSeIfzQilsvHQ8bqUKTh5QB1c

# Email (optional)
SENDGRID_API_KEY=SG...
EMAIL_FROM=sean@august.style
EMAIL_TO=sean@august.style
```

---

## File Structure

```
freelance-payments/
├── index.html                    # Payment lookup form
├── 404.html                     # SPA routing handler
├── job.html                      # Single-page template (contract, invoice, payment sections)
├── api/
│   ├── create-checkout-session.js
│   ├── sign-contract.js
│   ├── update-payment.js
│   ├── track-event.js
│   ├── webhook.js
│   └── generate-pdf.js           # NEW: Google Docs → PDF generation
├── assets/
│   ├── jobs/
│   │   ├── uid-sst-846.json      # Job JSON files (one per client project)
│   │   └── _job_template_v3.json # Schema template
│   ├── js/
│   │   ├── manifest.json         # Lookup manifest (generated)
│   │   ├── payment-lookup.js
│   │   ├── payment-router.js
│   │   ├── contract-controller.js
│   │   ├── invoice-controller.js
│   │   └── checkout-controller.js
│   └── completed_docs/           # NEW: Archived PDFs
│       └── uid-sst-846-20251230-contract.pdf
├── .github/
│   ├── workflows/
│   │   ├── orchestrate.yml        # Main workflow orchestrator
│   │   └── pages-build.yml       # GitHub Pages build
│   └── scripts/
│       ├── generate_manifest.py
│       ├── orchestration/
│       │   ├── orchestrate_workflow.py
│       │   └── sync_catalog.py
│       ├── state/
│       │   └── update_state.py
│       └── utils/
│           └── json_io.py
└── assets/docs/
    └── v3/
        └── AI_CONTEXT_PRIMER.md  # This file
```

---

## Key Design Decisions

1. **JSON as Single Source of Truth**: All state, Stripe IDs, PDF artifacts stored in JSON files
2. **Event-Driven**: PDFs generated immediately after Stripe objects created (during initial push workflow)
3. **Immutable PDFs**: Once generated, PDFs are never modified (new jobs get new UIDs)
4. **Repository Storage**: PDFs stored only in repository (`assets/pdf/contract/` and `assets/pdf/invoice/`)
5. **Template-Based**: Google Docs templates handle all formatting, no CSS/HTML gymnastics
6. **No HTML Fallback**: Frontend only displays PDFs or shows error (v4 requirement)

---

## Testing Checklist

- [ ] Google Docs templates created with correct placeholders
- [ ] OAuth refresh token obtained and stored in GitHub Secrets
- [ ] Template files shared with OAuth user account (`development@august.style`)
- [ ] PDF generation script tested in GitHub Actions
- [ ] PDF generation tested with sample JSON
- [ ] PDFs stored in Drive and accessible
- [ ] PDFs committed to repository archive
- [ ] Frontend displays embedded PDF viewer
- [ ] Download button works
- [ ] Email delivery works (if implemented)
- [ ] Webhook triggers PDF generation correctly
- [ ] Signature flow includes PDF SHA256 hash

---

## Next Steps

1. **Create Google Docs templates** with placeholders ✅
2. **Set up Google OAuth** (internal organization) and obtain refresh token ✅
3. **Share templates** with OAuth user account ✅
4. **Test PDF generation** end-to-end in GitHub Actions
4. **Test PDF generation** with sample job JSON
5. **Update frontend** to display PDFs instead of HTML
6. **Add email delivery** (optional)
7. **Deploy and test** end-to-end flow

---

## References

- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [Google Docs API Documentation](https://developers.google.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

---

**Note**: This document is a living specification. Update as the system evolves.
