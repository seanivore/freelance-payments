# Schema Transformation Reference

**Purpose:** Complete before/after schema comparison for Phase 2 migration
**Last Updated:** 2025-12-20
**Status:** DRAFT - Ready for review

---

## Table of Contents

1. [Overview](#overview)
2. [Side-by-Side Comparison](#side-by-side-comparison)
3. [Field Mapping](#field-mapping)
4. [Key Changes](#key-changes)
5. [Migration Rules](#migration-rules)
6. [Validation Checklist](#validation-checklist)

---

## Overview

### What's Changing

**OLD SCHEMA (Current):**
- `payments[]` array with Stripe IDs at top level
- `invoice_number` AND `job_id` (duplicates)
- `stripe_metadata` object with redundant fields
- Each payment has its own `stripe_product_id` (BUG!)
- Status vocabulary: `pending`, `paid`

**NEW SCHEMA (Target):**
- `product{}` object (one per job)
- `prices[]` array (replaces payments)
- Only `job_id` (single identifier)
- Stripe IDs in metadata objects
- ALL prices reference SAME product
- Stripe vocabulary: `active: true/false`
- State flags: `section_updated: true/false`

### Migration Strategy

1. **Preserve all data** - No information loss
2. **One-way transformation** - Old → New (no reverse needed)
3. **Stripe re-sync** - Set all `section_updated: true` for initial sync
4. **Frontend updates** - Update field references

---

## Side-by-Side Comparison

### OLD SCHEMA (Current)

```json
{
  "job_id": "uid-abc-123",
  "invoice_number": "uid-abc-123",
  "status": "active",

  "client": {
    "name": "Client Business Name",
    "last_name": "Smith",
    "project_keyword": "art-website",
    "contact": { "name": "...", "email": "..." },
    "address": { "street": "...", "city": "..." }
  },

  "contract": {
    "date": "2025-01-15",
    "start_date": "2025-01-20",
    "end_date": "2025-03-15",
    "rate_type": "Flat Rate",
    "total_fee": 5000.00,
    "deposit_percent": 25,
    "signed": false,
    "contractor_signature": null,
    "client_date": null
  },

  "payments": [
    {
      "payment_number": 1,
      "amount": 1250.00,
      "currency": "usd",
      "description": "Deposit (25%)",
      "due_type": "date",
      "due_date": "2025-01-20",
      "due_date_unix": 1737417600,
      "status": "pending",
      "paid_date": null,
      "paid_date_unix": null,

      "stripe_product_id": "prod_ABC123",
      "stripe_price_id": "price_XYZ789",
      "stripe_product_name": "Website for Client Business",
      "stripe_metadata": {
        "job_id": "uid-abc-123",
        "invoice_number": "uid-abc-123",
        "payment_number": "1",
        "client_last_name": "Smith",
        "project_keyword": "art-website"
      }
    },
    {
      "payment_number": 2,
      "amount": 3750.00,
      "currency": "usd",
      "description": "Final payment",
      "due_type": "term",
      "due_term": "before launch",
      "status": "pending",

      "stripe_product_id": "prod_DEF456",
      "stripe_price_id": "price_QRS012",
      "stripe_metadata": { "..." }
    }
  ],

  "project_scope_summary": "This project delivers...",
  "project_scope_full": "Full detailed project scope..."
}
```

### NEW SCHEMA (Target)

```json
{
  "job_id": "uid-abc-123",
  "project_keyword": "art-website",

  "client": {
    "name": "Client Business Name",
    "last_name": "Smith",
    "contact": { "name": "...", "email": "..." },
    "address": { "street": "...", "city": "..." }
  },

  "contract": {
    "date": "2025-01-15",
    "start_date": "2025-01-20",
    "end_date": "2025-03-15",
    "rate_type": "Flat Rate",
    "total_fee": 5000.00,
    "deposit_percent": 25,
    "signed": false,
    "signatures": {
      "contractor": {"name": null, "date": null},
      "client": {"name": null, "date": null}
    },
    "contractor_signature": null,
    "contractor_date": null,
    "client_date": null
  },

  "product": {
    "section_updated": true,

    "active": true,
    "name": "Website for Client Business",
    "description": "This project delivers...",
    "metadata": {
      "stripe_product_id": "prod_ABC123",
      "job_id": "uid-abc-123"
    },
    "created": 1737417600,
    "updated": 1737417600
  },

  "prices": [
    {
      "payment_number": 1,
      "due_date": "2025-01-20",
      "due_date_unix": 1737417600,
      "due_type": "date",
      "payment_status": "pending",
      "paid_date": null,
      "paid_date_unix": null,

      "section_updated": true,

      "active": true,
      "product": "prod_ABC123",
      "unit_amount": 125000,
      "currency": "usd",
      "nickname": "Deposit (25%)",
      "metadata": {
        "stripe_price_id": "price_XYZ789",
        "payment_number": "1",
        "job_id": "uid-abc-123"
      },
      "created": 1737417600
    },
    {
      "payment_number": 2,
      "due_type": "term",
      "due_term": "before launch",
      "payment_status": "pending",

      "section_updated": true,

      "active": true,
      "product": "prod_ABC123",
      "unit_amount": 375000,
      "currency": "usd",
      "nickname": "Final payment",
      "metadata": {
        "stripe_price_id": "price_QRS012",
        "payment_number": "2",
        "job_id": "uid-abc-123"
      },
      "created": 1737417600
    }
  ],

  "project_scope_summary": "This project delivers...",
  "project_scope_full": "Full detailed project scope..."
}
```

---

## Field Mapping

### Top Level

| OLD Field | NEW Field | Transformation |
|-----------|-----------|----------------|
| `job_id` | `job_id` | Keep (primary identifier) |
| `invoice_number` | ❌ REMOVED | Duplicate of job_id |
| `status` | ❌ REMOVED | Not needed (active/paid tracked per price) |
| `client.project_keyword` | `project_keyword` | Move to top level |
| `client` | `client` | Keep as-is (minus project_keyword) |
| `contract` | `contract` | Keep as-is + add signatures structure |
| `payments[]` | `prices[]` | Transform (see below) |
| ❌ N/A | `product{}` | NEW - Create from first payment's product info |
| `project_scope_*` | `project_scope_*` | Keep as-is |

### Contract Section

| OLD Field | NEW Field | Transformation |
|-----------|-----------|----------------|
| All existing fields | All existing fields | Keep as-is |
| `contractor_signature` | `contractor_signature` | Keep (legacy compatibility) |
| `contractor_date` | `contractor_date` | Keep (legacy compatibility) |
| `client_date` | `client_date` | Keep (legacy compatibility) |
| ❌ N/A | `signatures.contractor.name` | NEW - Map from contractor_signature |
| ❌ N/A | `signatures.contractor.date` | NEW - Map from contractor_date |
| ❌ N/A | `signatures.client.name` | NEW - Extract from signed_by or null |
| ❌ N/A | `signatures.client.date` | NEW - Map from client_date |

### Product Section (NEW)

| Source | Target Field | Transformation |
|--------|--------------|----------------|
| ❌ N/A | `section_updated` | Set to `true` (initial sync needed) |
| ❌ N/A | `active` | Set to `true` |
| `payments[0].stripe_product_name` | `name` | Use first payment's product name |
| `project_scope_summary` | `description` | Use summary as description |
| `payments[0].stripe_product_id` | `metadata.stripe_product_id` | Use first payment's product ID |
| `job_id` | `metadata.job_id` | Copy top-level job_id |
| Current timestamp | `created` | Unix timestamp |
| Current timestamp | `updated` | Unix timestamp |

### Payments → Prices Transformation

| OLD Field (payments[]) | NEW Field (prices[]) | Transformation |
|------------------------|----------------------|----------------|
| `payment_number` | `payment_number` | Keep as-is |
| `due_date` | `due_date` | Keep as-is |
| `due_date_unix` | `due_date_unix` | Keep as-is |
| `due_type` | `due_type` | Keep as-is |
| `due_term` | `due_term` | Keep as-is |
| `status` | `payment_status` | Rename field |
| `paid_date` | `paid_date` | Keep as-is |
| `paid_date_unix` | `paid_date_unix` | Keep as-is |
| ❌ N/A | `section_updated` | Set to `true` (initial sync needed) |
| `status != "paid"` | `active` | `true` if pending, `false` if paid |
| `stripe_product_id` | `product` | Use product ID (will be same for all) |
| `amount * 100` | `unit_amount` | Convert dollars to cents |
| `currency` | `currency` | Keep as-is |
| `description` | `nickname` | Rename field |
| `stripe_price_id` | `metadata.stripe_price_id` | Move into metadata |
| `payment_number` | `metadata.payment_number` | Move into metadata (as string) |
| `job_id` | `metadata.job_id` | Copy from top level |
| Current timestamp | `created` | Unix timestamp |
| ❌ REMOVED | `stripe_product_name` | Not needed (in product section now) |
| ❌ REMOVED | `stripe_metadata.*` | Replaced by metadata object |

---

## Key Changes

### 1. Eliminated Duplication

**BEFORE:**
```json
{
  "job_id": "uid-abc-123",
  "invoice_number": "uid-abc-123",  // DUPLICATE!
  "payments": [
    {
      "stripe_metadata": {
        "job_id": "uid-abc-123",  // DUPLICATE!
        "invoice_number": "uid-abc-123",  // DUPLICATE!
        "client_last_name": "Smith",  // Available in client.last_name
        "project_keyword": "art-website"  // Available in client.project_keyword
      }
    }
  ]
}
```

**AFTER:**
```json
{
  "job_id": "uid-abc-123",  // SINGLE SOURCE OF TRUTH
  "project_keyword": "art-website",  // SINGLE SOURCE OF TRUTH
  "prices": [
    {
      "metadata": {
        "stripe_price_id": "price_XYZ789",
        "payment_number": "1",
        "job_id": "uid-abc-123"  // Only copied where needed
      }
    }
  ]
}
```

### 2. Fixed Product/Price Bug

**BEFORE (BUG):**
```json
{
  "payments": [
    {
      "payment_number": 1,
      "stripe_product_id": "prod_ABC123",  // Each payment has different product!
      "stripe_price_id": "price_XYZ789"
    },
    {
      "payment_number": 2,
      "stripe_product_id": "prod_DEF456",  // Different product ID!
      "stripe_price_id": "price_QRS012"
    }
  ]
}
```

**AFTER (FIXED):**
```json
{
  "product": {
    "metadata": {
      "stripe_product_id": "prod_ABC123"  // ONE product for the job
    }
  },
  "prices": [
    {
      "payment_number": 1,
      "product": "prod_ABC123",  // References SAME product
      "metadata": {"stripe_price_id": "price_XYZ789"}
    },
    {
      "payment_number": 2,
      "product": "prod_ABC123",  // References SAME product
      "metadata": {"stripe_price_id": "price_QRS012"}
    }
  ]
}
```

### 3. State Management with Flags

**BEFORE:**
- No explicit sync flags
- Git diff logic to detect changes
- Complex conditional checks

**AFTER:**
```json
{
  "product": {
    "section_updated": true,  // Needs Stripe sync
    "active": true,  // Stripe state
    "name": "..."
  },
  "prices": [
    {
      "section_updated": true,  // Needs Stripe sync
      "active": true,  // Stripe state
      "payment_status": "pending",  // Our payment workflow state
      "unit_amount": 125000
    }
  ]
}
```

**Flags explained:**
- `section_updated`: Set by `detect_sync_needs.py`, used by `sync_catalog.py`
- `active`: Mirrors Stripe's active field (true = available, false = archived)
- `payment_status`: Our workflow state (pending, paid)

### 4. Currency Conversion

**BEFORE:**
```json
{
  "payments": [
    {"amount": 1250.00}  // Dollars (float, precision issues!)
  ]
}
```

**AFTER:**
```json
{
  "prices": [
    {"unit_amount": 125000}  // Cents (integer, no precision issues!)
  ]
}
```

### 5. Renamed Fields for Clarity

| Old Name | New Name | Reason |
|----------|----------|--------|
| `payments[]` | `prices[]` | Matches Stripe's vocabulary |
| `status` | `payment_status` | More specific (avoids confusion with `active`) |
| `description` | `nickname` | Matches Stripe's Price.nickname field |
| `amount` | `unit_amount` | Matches Stripe's Price.unit_amount field |

---

## Migration Rules

### Rule 1: Preserve All Data

**Never delete fields that might be referenced:**
- Keep all contract fields (even if unused)
- Keep legacy signature fields (contractor_signature, etc.)
- Keep all date fields (even if null)

### Rule 2: Set Initial Sync Flags

**After migration, all jobs need re-sync:**
```json
{
  "product": {
    "section_updated": true  // ← Force initial sync
  },
  "prices": [
    {
      "section_updated": true  // ← Force initial sync
    }
  ]
}
```

### Rule 3: Handle Missing Data

**If old payment doesn't have Stripe IDs:**
```json
{
  "product": {
    "metadata": {
      "stripe_product_id": null  // Will be created on sync
    }
  },
  "prices": [
    {
      "metadata": {
        "stripe_price_id": null  // Will be created on sync
      }
    }
  ]
}
```

### Rule 4: Product ID Normalization

**All prices must reference the SAME product:**

```python
# Get product ID from first payment
product_id = old_job['payments'][0].get('stripe_product_id')

# Use this ID for ALL prices
for payment in old_job['payments']:
    new_price['product'] = product_id  # Same ID for all!
```

### Rule 5: Active State Logic

**Determine active flag from payment status:**

```python
# Paid payments are archived
price['active'] = (payment['status'] != 'paid')

# Product is active if ANY price is active
product['active'] = any(p['active'] for p in prices)
```

---

## Validation Checklist

### Pre-Migration

- [ ] Backup all job files to `assets/jobs.backup/`
- [ ] Create git commit before migration
- [ ] Test migration script on template file first
- [ ] Verify Stripe API key is available

### Migration Script

- [ ] Reads all `*.json` files from `assets/jobs/`
- [ ] Skips template file (`_job_template.json`)
- [ ] Transforms each field according to mapping table
- [ ] Validates output against new schema
- [ ] Writes migrated files to `assets/jobs/`
- [ ] Creates migration report (what changed)

### Post-Migration

- [ ] All job files parse as valid JSON
- [ ] No data loss (all old fields preserved or transformed)
- [ ] All `section_updated` flags set to `true`
- [ ] All amounts converted to cents correctly (multiply by 100)
- [ ] All prices reference same product ID
- [ ] Git diff shows expected changes
- [ ] Commit migrated files

### Stripe Re-Sync

- [ ] Run `detect_sync_needs.py` (should find all jobs need sync)
- [ ] Run `sync_catalog.py` (creates/updates products and prices)
- [ ] Verify Stripe dashboard shows correct products
- [ ] Verify each job has ONE product with MULTIPLE prices
- [ ] Verify all prices have correct amounts (in cents)
- [ ] Verify all Stripe IDs written back to JSON

### Frontend Testing

- [ ] Update frontend code to use new field names
- [ ] Test payment page loads correctly
- [ ] Test price display (converts cents to dollars)
- [ ] Test contract signing updates correct fields
- [ ] Test payment completion updates `payment_status`
- [ ] Test routing between payments works

---

## Migration Script Outline

```python
#!/usr/bin/env python3
"""
Migrate job files from old schema to new schema.

Usage:
    python3 migrate_schema.py --jobs-dir assets/jobs --backup-dir assets/jobs.backup --dry-run

Exit codes:
    0 = Success
    1 = Validation error
    2 = File I/O error
"""

import sys
import json
import shutil
from pathlib import Path
from datetime import datetime

def migrate_job(old_job: dict) -> dict:
    """Transform old schema to new schema."""
    new_job = {}

    # Top level
    new_job['job_id'] = old_job['job_id']
    new_job['project_keyword'] = old_job['client'].get('project_keyword', '')

    # Client (remove project_keyword)
    new_job['client'] = {k: v for k, v in old_job['client'].items() if k != 'project_keyword'}

    # Contract (add signatures structure)
    new_job['contract'] = old_job['contract'].copy()
    new_job['contract']['signatures'] = {
        'contractor': {
            'name': old_job['contract'].get('contractor_signature'),
            'date': old_job['contract'].get('contractor_date')
        },
        'client': {
            'name': None,  # Extract from signed_by if exists
            'date': old_job['contract'].get('client_date')
        }
    }

    # Product (NEW section)
    first_payment = old_job['payments'][0] if old_job['payments'] else {}
    new_job['product'] = {
        'section_updated': True,  # Force initial sync
        'active': True,
        'name': first_payment.get('stripe_product_name', f"{old_job['client']['name']} - {old_job['client'].get('project_keyword', '')}"),
        'description': old_job.get('project_scope_summary', ''),
        'metadata': {
            'stripe_product_id': first_payment.get('stripe_product_id'),
            'job_id': old_job['job_id']
        },
        'created': int(datetime.now().timestamp()),
        'updated': int(datetime.now().timestamp())
    }

    # Prices (transform payments)
    new_job['prices'] = []
    for payment in old_job['payments']:
        price = {
            # Payment workflow fields
            'payment_number': payment['payment_number'],
            'due_date': payment.get('due_date'),
            'due_date_unix': payment.get('due_date_unix'),
            'due_type': payment['due_type'],
            'due_term': payment.get('due_term'),
            'payment_status': payment['status'],
            'paid_date': payment.get('paid_date'),
            'paid_date_unix': payment.get('paid_date_unix'),

            # Sync flag
            'section_updated': True,  # Force initial sync

            # Stripe fields
            'active': payment['status'] != 'paid',
            'product': first_payment.get('stripe_product_id'),  # SAME for all!
            'unit_amount': int(payment['amount'] * 100),  # Convert to cents
            'currency': payment.get('currency', 'usd'),
            'nickname': payment.get('description', f"Payment {payment['payment_number']}"),
            'metadata': {
                'stripe_price_id': payment.get('stripe_price_id'),
                'payment_number': str(payment['payment_number']),
                'job_id': old_job['job_id']
            },
            'created': int(datetime.now().timestamp())
        }
        new_job['prices'].append(price)

    # Project scope
    new_job['project_scope_summary'] = old_job.get('project_scope_summary', '')
    new_job['project_scope_full'] = old_job.get('project_scope_full', '')

    return new_job


def validate_migrated_job(job: dict) -> bool:
    """Validate new schema structure."""
    required_fields = ['job_id', 'client', 'contract', 'product', 'prices']

    for field in required_fields:
        if field not in job:
            print(f"Missing required field: {field}", file=sys.stderr)
            return False

    # Validate product structure
    if 'section_updated' not in job['product']:
        print("Product missing section_updated flag", file=sys.stderr)
        return False

    if 'metadata' not in job['product']:
        print("Product missing metadata", file=sys.stderr)
        return False

    # Validate prices
    for i, price in enumerate(job['prices']):
        if 'section_updated' not in price:
            print(f"Price {i} missing section_updated flag", file=sys.stderr)
            return False

        if 'metadata' not in price:
            print(f"Price {i} missing metadata", file=sys.stderr)
            return False

        if 'unit_amount' not in price:
            print(f"Price {i} missing unit_amount", file=sys.stderr)
            return False

    return True


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Migrate job schema")
    parser.add_argument('--jobs-dir', default='assets/jobs', help="Jobs directory")
    parser.add_argument('--backup-dir', help="Backup directory (optional)")
    parser.add_argument('--dry-run', action='store_true', help="Don't write files")

    args = parser.parse_args()

    jobs_path = Path(args.jobs_dir)

    # Create backup if requested
    if args.backup_dir and not args.dry_run:
        backup_path = Path(args.backup_dir)
        backup_path.mkdir(parents=True, exist_ok=True)
        for job_file in jobs_path.glob('*.json'):
            shutil.copy(job_file, backup_path / job_file.name)
        print(f"Backed up {len(list(jobs_path.glob('*.json')))} files to {backup_path}")

    # Migrate each file
    migrated_count = 0
    error_count = 0

    for job_file in jobs_path.glob('*.json'):
        # Skip template
        if job_file.name.startswith('_'):
            continue

        try:
            # Read old schema
            with open(job_file, 'r') as f:
                old_job = json.load(f)

            # Transform
            new_job = migrate_job(old_job)

            # Validate
            if not validate_migrated_job(new_job):
                print(f"Validation failed for {job_file.name}", file=sys.stderr)
                error_count += 1
                continue

            # Write (unless dry-run)
            if not args.dry_run:
                with open(job_file, 'w') as f:
                    json.dump(new_job, f, indent=2)

            migrated_count += 1
            print(f"Migrated: {job_file.name}")

        except Exception as e:
            print(f"Error migrating {job_file.name}: {e}", file=sys.stderr)
            error_count += 1

    # Summary
    print(json.dumps({
        'migrated': migrated_count,
        'errors': error_count,
        'dry_run': args.dry_run
    }))

    sys.exit(0 if error_count == 0 else 2)


if __name__ == '__main__':
    main()
```

---

**End of Schema Transformation Reference**

Ready for review and Phase 2 implementation.
