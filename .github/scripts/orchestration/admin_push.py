#!/usr/bin/env python3
"""
Admin Push Workflow - TRIGGER=admin-push (Steps 1-12)

When: Admin pushes JSON files to repo
Behavior: Starts immediately when admin pushes

Flow:
1. Compare JSONs to catalog (8-step matching logic)
2. Generate PDFs for new jobs
3-9. (Handled in 8-step sync)
10. Create manifest
11. Build pages (logged, actual build happens in separate workflow)
12. Deploy (commit and push)

Usage:
    python3 admin_push.py

Exit codes:
    0 = Success
    1 = Validation error
    2 = Git/File error
"""

import sys
import json
import subprocess
import os
import hashlib
from pathlib import Path
from datetime import datetime, UTC
from typing import Dict, Optional

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.json_io import list_all_jobs, save_job, delete_job

# Import Stripe
try:
    import stripe
except ImportError:
    print(json.dumps({"error": "Stripe library not installed. Run: pip install stripe"}), file=sys.stderr)
    sys.exit(2)

# Import Google APIs
try:
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseDownload
    import io
except ImportError:
    print(json.dumps({"error": "Google libraries not installed. Run: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client"}), file=sys.stderr)
    sys.exit(2)

# Import pypdf for combining PDFs (optional - will skip combined PDF if unavailable)
PYPDF_AVAILABLE = False
PdfMerger = None
try:
    from pypdf import PdfMerger
    PYPDF_AVAILABLE = True
except ImportError as e:
    print(f"WARNING: pypdf not available ({e}), combined PDFs will be skipped", file=sys.stderr)
except Exception as e:
    print(f"WARNING: pypdf import failed ({e}), combined PDFs will be skipped", file=sys.stderr)


# ============================================================================
# STRIPE HELPER FUNCTIONS
# ============================================================================

def create_stripe_product(product: dict, job_id: str) -> str:
    """Create Stripe Product. Returns product_id."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    if not stripe.api_key:
        raise ValueError("STRIPE_SECRET_KEY environment variable not set")

    product_params = {
        'name': product.get('name', f'Job {job_id}'),
        'active': product.get('active', True),
        'type': product.get('type', 'service'),
        'metadata': {}
    }

    if product.get('description'):
        product_params['description'] = product['description']

    if product.get('unit_label'):
        product_params['unit_label'] = product['unit_label']

    try:
        stripe_product = stripe.Product.create(id=product.get('id'), **product_params)
    except stripe.error.InvalidRequestError:
        stripe_product = stripe.Product.create(**product_params)

    return stripe_product.id


def check_stripe_product_exists(product_id: str) -> bool:
    """Check if a Stripe product exists."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    try:
        product = stripe.Product.retrieve(product_id)
        return product is not None
    except stripe.error.InvalidRequestError:
        return False
    except Exception as e:
        print(f"Warning: Error checking product {product_id}: {e}", file=sys.stderr)
        return False


def get_stripe_product_active(product_id: str) -> bool:
    """Get active status of Stripe product."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    try:
        product = stripe.Product.retrieve(product_id)
        return product.active
    except Exception:
        return False


def archive_stripe_product(product_id: str) -> None:
    """Archive Stripe Product (set active=false)."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    stripe.Product.modify(product_id, active=False)


def create_stripe_price(price_obj: dict, product_id: str) -> str:
    """Create Stripe Price. Returns price_id."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    price_params = {
        'product': product_id,
        'unit_amount': price_obj.get('unit_amount'),
        'currency': price_obj.get('currency', 'usd').lower(),
        'active': price_obj.get('active', True),
        'billing_scheme': price_obj.get('billing_scheme', 'per_unit'),
        'metadata': {}
    }

    if price_obj.get('nickname'):
        price_params['nickname'] = price_obj['nickname']

    if price_obj.get('id'):
        price_params['lookup_key'] = price_obj['id']

    price = stripe.Price.create(**price_params)
    return price.id


def create_stripe_customer(customer: dict) -> str:
    """Create Stripe Customer. Returns customer.id."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    customer_params = {
        'name': customer.get('name') or customer.get('business'),
        'email': customer.get('email'),
        'phone': customer.get('phone'),
        'metadata': {}
    }

    if customer.get('title'):
        customer_params['metadata']['title'] = customer['title']

    if customer.get('address'):
        customer_params['address'] = {
            'line1': customer['address'].get('line1'),
            'city': customer['address'].get('city'),
            'state': customer['address'].get('state'),
            'postal_code': customer['address'].get('postal_code'),
            'country': customer['address'].get('country', 'US')
        }

    customer_id = customer.get('id')
    if customer_id and not customer_id.startswith('cus-'):
        customer_id = f'cus-{customer_id}'
    
    try:
        customer = stripe.Customer.create(id=customer_id, **customer_params)
    except stripe.error.InvalidRequestError:
        customer = stripe.Customer.create(**customer_params)

    return customer.id


def check_stripe_coupon_exists(coupon_id: str) -> bool:
    """Check if a Stripe coupon exists."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    try:
        coupon = stripe.Coupon.retrieve(coupon_id)
        return coupon is not None
    except stripe.error.InvalidRequestError:
        return False
    except Exception as e:
        print(f"Warning: Error checking coupon {coupon_id}: {e}", file=sys.stderr)
        return False


def create_stripe_coupon(coupon: dict) -> str:
    """Create Stripe Coupon. Returns coupon_id. If coupon already exists, returns existing ID."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    coupon_id = coupon.get('id')
    if coupon_id and not coupon_id.startswith('cou-'):
        coupon_id = f'cou-{coupon_id}'

    # Check if coupon already exists
    if coupon_id and check_stripe_coupon_exists(coupon_id):
        print(f"DEBUG: Coupon {coupon_id} already exists, using existing coupon", file=sys.stderr)
        return coupon_id

    coupon_params = {
        'id': coupon_id,
        'amount_off': coupon.get('amount_off'),
        'currency': coupon.get('currency', 'usd').lower(),
        'duration': coupon.get('duration', 'once'),
        'max_redemptions': coupon.get('max_redemptions', 1)
    }

    if coupon.get('name'):
        coupon_params['name'] = coupon['name']

    if coupon.get('applies_to'):
        coupon_params['applies_to'] = coupon['applies_to']

    try:
        coupon_obj = stripe.Coupon.create(**coupon_params)
        return coupon_obj.id
    except stripe.error.InvalidRequestError as e:
        error_msg = str(e)
        if 'already exists' in error_msg.lower():
            # Coupon was created between check and create - return the ID
            print(f"DEBUG: Coupon {coupon_id} was created concurrently, using existing coupon", file=sys.stderr)
            return coupon_id
        else:
            raise


def create_stripe_payment_link(price_id: str, job_id: str, payment_number: int, coupon_id: str = None) -> str:
    """Create a persistent Stripe Payment Link."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    
    # Construct base URL for redirection (GitHub Pages or Vercel)
    # Ideally checking an ENV var, otherwise defaulting to the known URL structure
    base_url = os.getenv('SITE_URL', 'https://seanivore.github.io/freelance-payments')
    return_url = f"{base_url}/{job_id}#completion"

    params = {
        'line_items': [{'price': price_id, 'quantity': 1}],
        'metadata': {
            'job_id': job_id,
            'payment_number': str(payment_number)
        },
        'after_completion': {
            'type': 'redirect',
            'redirect': {'url': return_url}
        },
        'allow_promotion_codes': True
    }
    
    if coupon_id and payment_number == 1:
        # Pre-apply coupon for the first payment if exists
        params['discounts'] = [{'coupon': coupon_id}]
        
    # We create a new link every time? Or idemptotency?
    # Stripe Payment Links don't have lookup_keys easily. 
    # For now, we create one. If we wanted to be cleaner, we'd list existing links for this price.
    # But prices are unique per job usually.
    
    link = stripe.PaymentLink.create(**params)
    return link.url


def load_manifest(manifest_path: str) -> dict:
    """Load manifest.json and return jobs dict."""
    manifest_file = Path(manifest_path)
    if not manifest_file.exists():
        return {}
    
    try:
        with open(manifest_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('jobs', {})
    except Exception as e:
        print(f"Warning: Failed to load manifest: {e}", file=sys.stderr)
        return {}


def get_manifest_job_ids(manifest: dict) -> set:
    """Extract job_ids from manifest (handles both old and new formats)."""
    job_ids = set()
    for lookup_key, entry in manifest.items():
        if isinstance(entry, dict):
            job_id = entry.get('job_id')
            if job_id:
                job_ids.add(job_id)
        elif isinstance(entry, str):
            file_path = Path(entry)
            if file_path.suffix == '.json':
                job_id = file_path.stem
                job_ids.add(job_id)
    return job_ids


def create_stripe_objects_for_job(job_data: dict, job_id: str) -> dict:
    """Create all Stripe objects for a new job. Returns stats."""
    stats = {
        'products_created': 0,
        'prices_created': 0,
        'customers_created': 0,
        'coupons_created': 0
    }
    
    product = job_data.get('product', {})
    if 'state' not in job_data:
        job_data['state'] = {}
    if 'objects' not in job_data['state']:
        job_data['state']['objects'] = {}
    
    state_objects = job_data['state']['objects']
    
    # Create product
    product_id = create_stripe_product(product, job_id)
    stats['products_created'] = 1
    state_objects['product'] = product_id
    state_objects['created'] = datetime.now(UTC).isoformat().replace('+00:00', 'Z')
    
    # Auto-sign contractor date using created timestamp
    if job_data.get('contract') and 'signatures' in job_data['contract']:
        if 'contractor' in job_data['contract']['signatures']:
            job_data['contract']['signatures']['contractor']['signed_date'] = state_objects['created']
    
    # Create customer
    customer = job_data.get('customer')
    if customer:
        customer_id = create_stripe_customer(customer)
        stats['customers_created'] = 1
        state_objects['customer'] = customer_id
    
    # Create prices
    price1 = job_data.get('price1')
    price2 = job_data.get('price2')
    
    if price1 and price1.get('active', True) and price1.get('unit_amount') is not None:
        price_1_id = create_stripe_price(price1, product_id)
        stats['prices_created'] += 1
        state_objects['price_1'] = price_1_id
        price1['id'] = price_1_id
    
    if price2 and price2.get('active', True) and price2.get('unit_amount') is not None:
        price_2_id = create_stripe_price(price2, product_id)
        stats['prices_created'] += 1
        state_objects['price_2'] = price_2_id
        price2['id'] = price_2_id
    
    
    
    # Create coupon (non-blocking - if it fails, continue with rest of workflow)
    coupon = job_data.get('coupon')
    if coupon and coupon.get('amount_off', 0) > 0:
        try:
            coupon_id = create_stripe_coupon(coupon)
            stats['coupons_created'] = 1
            state_objects['coupon'] = coupon_id
        except Exception as e:
            # Coupon creation failed - log warning but don't fail entire workflow
            # Product and prices are already created, so we can continue
            print(f"Warning: Failed to create coupon for {job_id}: {e}", file=sys.stderr)
            # Try to use existing coupon ID if available
            coupon_id_from_data = coupon.get('id')
            if coupon_id_from_data:
                if not coupon_id_from_data.startswith('cou-'):
                    coupon_id_from_data = f'cou-{coupon_id_from_data}'
                if check_stripe_coupon_exists(coupon_id_from_data):
                    print(f"Using existing coupon {coupon_id_from_data} for {job_id}", file=sys.stderr)
                    state_objects['coupon'] = coupon_id_from_data
    
    # Update checkout session parameters
    if job_data.get('checkout_session_1') and state_objects.get('price_1'):
        checkout_session_1 = job_data['checkout_session_1']
        if 'line_items' in checkout_session_1 and len(checkout_session_1['line_items']) > 0:
            checkout_session_1['line_items'][0]['price'] = state_objects['price_1']
        if state_objects.get('coupon') and 'discounts' in checkout_session_1 and checkout_session_1['discounts']:
            if len(checkout_session_1['discounts']) > 0:
                checkout_session_1['discounts'][0]['coupon'] = state_objects['coupon']
    
    if job_data.get('checkout_session_2') and state_objects.get('price_2'):
        checkout_session_2 = job_data['checkout_session_2']
        if 'line_items' in checkout_session_2 and len(checkout_session_2['line_items']) > 0:
            checkout_session_2['line_items'][0]['price'] = state_objects['price_2']
    
    return stats


# ============================================================================
# 8-STEP MATCHING LOGIC
# ============================================================================

def execute_8_step_sync(jobs_dir: str, manifest_path: str, trigger_category: str = 'admin-push') -> dict:
    """Execute the 8-step matching logic inline with explicit step-by-step logging."""
    stats = {
        'products_created': 0,
        'products_archived': 0,
        'jobs_deleted': 0
    }
    
    # Step 1: Compare JSONs to catalog
    print(f"[TRIGGER={trigger_category}] Step 1: Comparing JSONs to catalog", file=sys.stderr)
    
    # Load all JSON files from directory (source of truth)
    all_jobs = list_all_jobs(jobs_dir)
    json_job_ids = set()
    jobs_by_id = {}
    json_active_status = {}  # Track JSON active status for clearer logging
    for job_data in all_jobs:
        product = job_data.get('product', {})
        job_id = product.get('id')
        if job_id:
            json_job_ids.add(job_id)
            jobs_by_id[job_id] = job_data
            json_active_status[job_id] = product.get('active', True)
    
    json_active_count = sum(1 for active in json_active_status.values() if active)
    json_inactive_count = len(json_job_ids) - json_active_count
    print(f"[TRIGGER={trigger_category}] Step 1: Found {len(json_job_ids)} JSON file(s) in directory ({json_active_count} active={True}, {json_inactive_count} active={False})", file=sys.stderr)
    
    # Get Stripe catalog job_ids (ONLY ACTIVE products count as "matched" for creation logic)
    # Archived products are handled separately in orphaned product checks
    stripe_job_ids = set()
    stripe_active_status = {}  # Cache active status to avoid duplicate API calls
    stripe_archived_job_ids = set()  # Track archived products separately
    all_potential_job_ids = json_job_ids.copy()
    
    # Also check manifest for any orphaned Stripe products
    manifest = load_manifest(manifest_path)
    manifest_job_ids = get_manifest_job_ids(manifest)
    all_potential_job_ids.update(manifest_job_ids)
    
    print(f"[TRIGGER={trigger_category}] Step 1: Checking Stripe catalog for {len(all_potential_job_ids)} potential product(s)", file=sys.stderr)
    
    for job_id in all_potential_job_ids:
        if check_stripe_product_exists(job_id):
            is_active = get_stripe_product_active(job_id)
            stripe_active_status[job_id] = is_active
            if is_active:
                stripe_job_ids.add(job_id)  # Only active products count as "matched" for creation logic
            else:
                stripe_archived_job_ids.add(job_id)  # Archived products tracked separately
    
    stripe_active_count = len(stripe_job_ids)
    stripe_archived_count = len(stripe_archived_job_ids)
    print(f"[TRIGGER={trigger_category}] Step 1: Found {stripe_active_count} active product(s) and {stripe_archived_count} archived product(s) in Stripe catalog", file=sys.stderr)
    
    # Initialize action lists
    jobs_to_create = []
    jobs_to_delete_no_stripe = []
    jobs_to_archive_orphaned = []
    jobs_to_delete_mismatch = []
    jobs_to_archive_and_delete = []
    jobs_ignored = []
    
    # Step 2: Unmatched: JSON but no catalog, if json.active=true → create catalog object
    # CRITICAL: Only check against ACTIVE products for matching (archived products don't count as "matched")
    unmatched_json = json_job_ids - stripe_job_ids  # Only active products in stripe_job_ids
    json_count = len(unmatched_json)
    json_active_in_unmatched = sum(1 for jid in unmatched_json if json_active_status.get(jid, True))
    json_inactive_in_unmatched = json_count - json_active_in_unmatched
    
    print(f"[TRIGGER={trigger_category}] Step 2: Found {json_count} JSON file(s), active={json_active_in_unmatched}/{json_inactive_in_unmatched} and Found 0 catalog product(s), active=N/A", file=sys.stderr)
    
    for job_id in unmatched_json:
        json_active = json_active_status.get(job_id, True)
        if json_active:
            jobs_to_create.append(job_id)
            print(f"[TRIGGER={trigger_category}] Step 2: RESULT - Creating Stripe objects for {job_id}", file=sys.stderr)
        else:
            print(f"[TRIGGER={trigger_category}] Step 2: Skipping {job_id} (inactive, will be handled in Step 3)", file=sys.stderr)
    
    if not jobs_to_create:
        print(f"[TRIGGER={trigger_category}] Step 2: RESULT - No actions needed", file=sys.stderr)
    
    # Step 3: Unmatched: JSON but no catalog, if json.active=false → delete JSON
    json_inactive_count = sum(1 for jid in unmatched_json if not json_active_status.get(jid, True))
    print(f"[TRIGGER={trigger_category}] Step 3: Found {json_inactive_count} JSON file(s), active=False and Found 0 catalog product(s), active=N/A", file=sys.stderr)
    
    for job_id in unmatched_json:
        json_active = json_active_status.get(job_id, True)
        if not json_active:
            jobs_to_delete_no_stripe.append(job_id)
            print(f"[TRIGGER={trigger_category}] Step 3: RESULT - Deleting JSON {job_id}", file=sys.stderr)
    
    if not jobs_to_delete_no_stripe:
        print(f"[TRIGGER={trigger_category}] Step 3: RESULT - No actions needed", file=sys.stderr)
    
    # Step 4: Unmatched: Catalog but no JSON, if catalog.active=true → modify catalog active=false
    unmatched_catalog = stripe_job_ids - json_job_ids  # Only active products
    catalog_active_count = len(unmatched_catalog)
    print(f"[TRIGGER={trigger_category}] Step 4: Found 0 JSON file(s), active=N/A and Found {catalog_active_count} catalog product(s), active=True", file=sys.stderr)
    
    for job_id in unmatched_catalog:
        stripe_active = stripe_active_status.get(job_id, False)
        if stripe_active:
            jobs_to_archive_orphaned.append(job_id)
            print(f"[TRIGGER={trigger_category}] Step 4: RESULT - Archiving orphaned product {job_id}", file=sys.stderr)
    
    if not jobs_to_archive_orphaned:
        print(f"[TRIGGER={trigger_category}] Step 4: RESULT - No actions needed", file=sys.stderr)
    
    # Step 5: Unmatched: Catalog but no JSON, if catalog.active=false → ignore
    # Check archived products that aren't in JSON directory
    unmatched_archived = stripe_archived_job_ids - json_job_ids
    archived_count = len(unmatched_archived)
    print(f"[TRIGGER={trigger_category}] Step 5: Found 0 JSON file(s), active=N/A and Found {archived_count} catalog product(s), active=False", file=sys.stderr)
    
    if archived_count > 0:
        print(f"[TRIGGER={trigger_category}] Step 5: RESULT - Ignoring {archived_count} orphaned archived product(s)", file=sys.stderr)
    else:
        print(f"[TRIGGER={trigger_category}] Step 5: RESULT - No actions needed", file=sys.stderr)
    
    # Step 6: Matched: catalog.active=false, json.active=true → delete JSON
    # IMPORTANT: We check stripe_active_status.get(job_id, False) even for matched_jobs
    # because a product might have been archived during workflow execution (e.g., by payment webhook)
    # and artifacts might not have been copied over properly
    matched_jobs = json_job_ids.intersection(stripe_job_ids)  # Only active products (at start of sync)
    matched_json_active_stripe_inactive = []
    for job_id in matched_jobs:
        json_active = json_active_status.get(job_id, True)
        # Check actual current state (may have changed during execution)
        stripe_active = stripe_active_status.get(job_id, False)
        if not stripe_active and json_active:
            matched_json_active_stripe_inactive.append(job_id)
    
    print(f"[TRIGGER={trigger_category}] Step 6: Found {len(matched_json_active_stripe_inactive)} JSON file(s), active=True and Found {len(matched_json_active_stripe_inactive)} catalog product(s), active=False", file=sys.stderr)
    
    for job_id in matched_json_active_stripe_inactive:
        jobs_to_delete_mismatch.append(job_id)
        print(f"[TRIGGER={trigger_category}] Step 6: RESULT - Deleting JSON {job_id} (JSON active but Stripe inactive)", file=sys.stderr)
    
    if not matched_json_active_stripe_inactive:
        print(f"[TRIGGER={trigger_category}] Step 6: RESULT - No actions needed", file=sys.stderr)
    
    # Step 7: Matched: catalog.active=false, json.active=false → delete JSON
    matched_both_inactive = []
    for job_id in matched_jobs:
        if job_id in jobs_to_delete_mismatch:
            continue  # Already handled in Step 6
        json_active = json_active_status.get(job_id, True)
        stripe_active = stripe_active_status.get(job_id, False)  # Check actual current state
        if not stripe_active and not json_active:
            matched_both_inactive.append(job_id)
    
    print(f"[TRIGGER={trigger_category}] Step 7: Found {len(matched_both_inactive)} JSON file(s), active=False and Found {len(matched_both_inactive)} catalog product(s), active=False", file=sys.stderr)
    
    for job_id in matched_both_inactive:
        jobs_to_delete_mismatch.append(job_id)
        print(f"[TRIGGER={trigger_category}] Step 7: RESULT - Deleting JSON {job_id} (both inactive)", file=sys.stderr)
    
    if not matched_both_inactive:
        print(f"[TRIGGER={trigger_category}] Step 7: RESULT - No actions needed", file=sys.stderr)
    
    # Step 8: Matched: catalog.active=true, json.active=false → modify catalog to active=false, delete JSON
    matched_stripe_active_json_inactive = []
    for job_id in matched_jobs:
        if job_id in jobs_to_delete_mismatch:
            continue  # Already handled
        json_active = json_active_status.get(job_id, True)
        stripe_active = stripe_active_status.get(job_id, False)  # Check actual current state
        if stripe_active and not json_active:
            matched_stripe_active_json_inactive.append(job_id)
    
    print(f"[TRIGGER={trigger_category}] Step 8: Found {len(matched_stripe_active_json_inactive)} JSON file(s), active=False and Found {len(matched_stripe_active_json_inactive)} catalog product(s), active=True", file=sys.stderr)
    
    for job_id in matched_stripe_active_json_inactive:
        jobs_to_archive_and_delete.append(job_id)
        print(f"[TRIGGER={trigger_category}] Step 8: RESULT - Archiving catalog and deleting JSON {job_id}", file=sys.stderr)
    
    if not matched_stripe_active_json_inactive:
        print(f"[TRIGGER={trigger_category}] Step 8: RESULT - No actions needed", file=sys.stderr)
    
    # Step 9: Matched: catalog.active=true, json.active=true → ignore
    matched_both_active = []
    for job_id in matched_jobs:
        if job_id in jobs_to_delete_mismatch or job_id in jobs_to_archive_and_delete:
            continue  # Already handled
        json_active = json_active_status.get(job_id, True)
        stripe_active = stripe_active_status.get(job_id, False)  # Check actual current state
        if stripe_active and json_active:
            matched_both_active.append(job_id)
    
    print(f"[TRIGGER={trigger_category}] Step 9: Found {len(matched_both_active)} JSON file(s), active=True and Found {len(matched_both_active)} catalog product(s), active=True", file=sys.stderr)
    
    for job_id in matched_both_active:
        jobs_ignored.append(job_id)
        print(f"[TRIGGER={trigger_category}] Step 9: RESULT - Ignoring {job_id} (both active, already synced)", file=sys.stderr)
    
    if not matched_both_active:
        print(f"[TRIGGER={trigger_category}] Step 9: RESULT - No actions needed", file=sys.stderr)
    
    # Execute actions
    
    # Archive orphaned products (Step 4)
    if jobs_to_archive_orphaned:
        print(f"[TRIGGER={trigger_category}] Step 4: ARTIFACTS - Archiving {len(jobs_to_archive_orphaned)} orphaned product(s)", file=sys.stderr)
        for job_id in jobs_to_archive_orphaned:
            try:
                archive_stripe_product(job_id)
                stats['products_archived'] += 1
                print(f"[TRIGGER={trigger_category}] Step 4: ARTIFACTS - Archived product {job_id}", file=sys.stderr)
            except Exception as e:
                print(f"Warning: Failed to archive orphaned product {job_id}: {e}", file=sys.stderr)
    
    # Archive and delete (Step 8)
    if jobs_to_archive_and_delete:
        print(f"[TRIGGER={trigger_category}] Step 8: ARTIFACTS - Archiving {len(jobs_to_archive_and_delete)} product(s) and deleting JSON(s)", file=sys.stderr)
        for job_id in jobs_to_archive_and_delete:
            try:
                archive_stripe_product(job_id)
                stats['products_archived'] += 1
                print(f"[TRIGGER={trigger_category}] Step 8: ARTIFACTS - Archived product {job_id}", file=sys.stderr)
                if delete_job(job_id, jobs_dir=jobs_dir):
                    stats['jobs_deleted'] += 1
                    print(f"[TRIGGER={trigger_category}] Step 8: ARTIFACTS - Deleted JSON {job_id}", file=sys.stderr)
            except Exception as e:
                print(f"Warning: Failed to archive/delete {job_id}: {e}", file=sys.stderr)
    
    # Delete JSONs (Steps 3, 6, 7)
    all_jobs_to_delete = set(jobs_to_delete_no_stripe + jobs_to_delete_mismatch)
    if all_jobs_to_delete:
        print(f"[TRIGGER={trigger_category}] Steps 3/6/7: ARTIFACTS - Deleting {len(all_jobs_to_delete)} JSON file(s)", file=sys.stderr)
        for job_id in all_jobs_to_delete:
            try:
                if delete_job(job_id, jobs_dir=jobs_dir):
                    stats['jobs_deleted'] += 1
                    print(f"[TRIGGER={trigger_category}] Steps 3/6/7: ARTIFACTS - Deleted JSON {job_id}", file=sys.stderr)
            except Exception as e:
                print(f"Warning: Failed to delete {job_id}: {e}", file=sys.stderr)
    
    # Create Stripe objects (Step 2) - This is where artifacts get added to JSON
    if jobs_to_create:
        print(f"[TRIGGER={trigger_category}] Step 2: ARTIFACTS - Creating Stripe objects for {len(jobs_to_create)} job(s)", file=sys.stderr)
        for job_id in jobs_to_create:
            try:
                job_data = jobs_by_id[job_id]
                create_stats = create_stripe_objects_for_job(job_data, job_id)
                stats['products_created'] += create_stats['products_created']
                # Save JSON with updated state.objects (2a: artifacts added)
                save_job(job_id, job_data, jobs_dir=jobs_dir)
                print(f"[TRIGGER={trigger_category}] Step 2: ARTIFACTS - Added Stripe object IDs to JSON {job_id} (product, prices, customer, coupon)", file=sys.stderr)
            except Exception as e:
                error_msg = str(e)
                print(f"Warning: Failed to create Stripe objects for {job_id}: {error_msg}", file=sys.stderr)
                # Even if creation partially failed, check if product was created
                # (product is created first, so it might exist even if coupon failed)
                if 'state' in jobs_by_id[job_id] and 'objects' in jobs_by_id[job_id]['state']:
                    product_id = jobs_by_id[job_id]['state']['objects'].get('product')
                    if product_id and check_stripe_product_exists(product_id):
                        # Product exists - count it as created so PDFs can be generated
                        stats['products_created'] += 1
                        print(f"Note: Product {product_id} was created before error, counting for PDF generation", file=sys.stderr)
                        # Save partial state if product exists
                        try:
                            save_job(job_id, jobs_by_id[job_id], jobs_dir=jobs_dir)
                        except Exception as save_err:
                            print(f"Warning: Failed to save partial state for {job_id}: {save_err}", file=sys.stderr)
    
    return stats


# ============================================================================
# PDF GENERATION FUNCTIONS
# ============================================================================

SCOPES = [
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive'
]


def validate_google_token():
    """Validate Google OAuth refresh token by attempting to refresh it.
    Returns True if valid, raises ValueError with helpful error message if invalid.
    """
    refresh_token = os.getenv('GOOGLE_REFRESH_TOKEN')
    client_id = os.getenv('GOOGLE_CLIENT_ID')
    client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
    
    if not (refresh_token and client_id and client_secret):
        auth_url = "https://freelance-payments-neon.vercel.app/api/google/auth"
        raise ValueError(
            f"GOOGLE_REFRESH_TOKEN, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET environment variables must be set.\n"
            f"To get a new refresh token:\n"
            f"1. Visit: {auth_url}\n"
            f"2. Complete OAuth consent flow\n"
            f"3. Copy the refresh_token from the callback response\n"
            f"4. Add to GitHub Secrets as GOOGLE_REFRESH_TOKEN"
        )
    
    try:
        from google.oauth2.credentials import Credentials
        
        creds = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=client_id,
            client_secret=client_secret,
            scopes=SCOPES
        )
        
        creds.refresh(Request())
        return True
    except Exception as e:
        auth_url = "https://freelance-payments-neon.vercel.app/api/google/auth"
        error_msg = str(e)
        if 'invalid_grant' in error_msg or 'expired' in error_msg.lower() or 'revoked' in error_msg.lower():
            raise ValueError(
                f"Google OAuth refresh token is expired or invalid: {error_msg}\n\n"
                f"To get a new refresh token:\n"
                f"1. Visit: {auth_url}\n"
                f"2. Complete OAuth consent flow\n"
                f"3. Copy the refresh_token from the callback response\n"
                f"4. Add to GitHub Secrets as GOOGLE_REFRESH_TOKEN\n"
                f"5. Re-run this workflow\n\n"
                f"Workflow stopped early to prevent partial state updates."
            )
        else:
            raise ValueError(f"OAuth authentication failed: {error_msg}. Ensure refresh token is valid and template files are shared with the OAuth user account.")


def authenticate_google():
    """Authenticate with Google using OAuth refresh token."""
    refresh_token = os.getenv('GOOGLE_REFRESH_TOKEN')
    client_id = os.getenv('GOOGLE_CLIENT_ID')
    client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
    
    if not (refresh_token and client_id and client_secret):
        raise ValueError("GOOGLE_REFRESH_TOKEN, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET environment variables must be set")
    
    try:
        from google.oauth2.credentials import Credentials
        
        creds = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=client_id,
            client_secret=client_secret,
            scopes=SCOPES
        )
        
        creds.refresh(Request())
        
        drive_service = build('drive', 'v3', credentials=creds)
        docs_service = build('docs', 'v1', credentials=creds)
        print("DEBUG: Using OAuth refresh token authentication", file=sys.stderr)
        return drive_service, docs_service
    except Exception as e:
        raise ValueError(f"OAuth authentication failed: {e}. Ensure refresh token is valid and template files are shared with the OAuth user account.")


def format_date(iso_string: str) -> str:
    """Format ISO date string to 'Month D, YYYY'"""
    if not iso_string:
        return ''
    try:
        dt = datetime.fromisoformat(iso_string.replace('Z', '+00:00'))
        return dt.strftime('%B %d, %Y')
    except:
        return iso_string


def format_currency(cents: int) -> str:
    """Format cents to currency string: '$X,XXX.XX'"""
    if cents is None:
        return '$0.00'
    # Handle string inputs (convert to int)
    if isinstance(cents, str):
        try:
            cents = int(cents)
        except (ValueError, TypeError):
            return '$0.00'
    # Ensure it's a number
    try:
        dollars = float(cents) / 100.0
        return f"${dollars:,.2f}"
    except (ValueError, TypeError):
        return '$0.00'


def safe_int(value, default=0):
    """Convert value to int, handling strings and None."""
    if value is None:
        return default
    if isinstance(value, str):
        try:
            return int(value)
        except (ValueError, TypeError):
            return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def calculate_amount_due(job_data: dict) -> str:
    """Calculate amount due based on payment state"""
    state = job_data.get('state', {})
    payment_1 = state.get('payment_1', {})
    payment_2 = state.get('payment_2', {})
    product = job_data.get('product', {})
    price1 = job_data.get('price1', {})
    price2 = job_data.get('price2', {})
    
    if not payment_1.get('succeeded'):
        amount = safe_int(price1.get('unit_amount'), 0)
        return format_currency(amount)
    
    if product.get('total_payments') == 1:
        return '$0.00'
    
    if product.get('total_payments') == 2:
        if not payment_2.get('succeeded'):
            amount = safe_int(price2.get('unit_amount'), 0)
            return format_currency(amount)
        return '$0.00'
    
    return '$0.00'


def calculate_subtotal(job_data: dict) -> str:
    """Calculate subtotal (price1 + price2)."""
    price1_amount = safe_int(job_data.get('price1', {}).get('unit_amount', 0), 0)
    price2_amount = safe_int(job_data.get('price2', {}).get('unit_amount', 0), 0)
    return format_currency(price1_amount + price2_amount)

def calculate_payment_due(job_data: dict, payment_number: int) -> str:
    """Calculate amount due for a specific payment."""
    if payment_number == 1:
        unit_amount = safe_int(job_data.get('price1', {}).get('unit_amount', 0), 0)
        # Coupon applies to first payment usually
        coupon_amount = safe_int(job_data.get('coupon', {}).get('amount_off', 0), 0)
        return format_currency(max(0, unit_amount - coupon_amount))
    elif payment_number == 2:
        unit_amount = safe_int(job_data.get('price2', {}).get('unit_amount', 0), 0)
        return format_currency(unit_amount)
    return "$0.00"


def calculate_sha256(pdf_bytes: bytes) -> str:
    """Calculate SHA256 hash of PDF bytes"""
    return hashlib.sha256(pdf_bytes).hexdigest()


def replace_placeholders(docs_service, document_id: str, replacements: dict):
    """Replace placeholders in Google Doc using batchUpdate"""
    requests = []
    
    for placeholder, value in replacements.items():
        requests.append({
            'replaceAllText': {
                'containsText': {
                    'text': placeholder,
                    'matchCase': False
                },
                'replaceText': (str(value).replace('\\n', '\n') if value is not None else '')
            }
        })
    
    if requests:
        docs_service.documents().batchUpdate(
            documentId=document_id,
            body={'requests': requests}
        ).execute()


def generate_contract_pdf(drive_service, docs_service, job_data: dict, template_id: str) -> dict:
    """Generate contract PDF from template"""
    job_id = job_data.get('product', {}).get('id', 'unknown')
    
    template_display = f"{template_id[:10]}...{template_id[-10:]}" if len(template_id) > 20 else template_id
    print(f"DEBUG: Attempting to copy contract template (ID: {template_display})", file=sys.stderr)
    
    temp_folder_id = os.getenv('GOOGLE_TEMP_FOLDER_ID', '').strip()
    copy_body = {'name': f'Contract-{job_id}-{int(datetime.now(UTC).timestamp())}'}
    if temp_folder_id:
        copy_body['parents'] = [temp_folder_id]
    
    try:
        copy_response = drive_service.files().copy(
            fileId=template_id,
            body=copy_body,
            supportsAllDrives=True
        ).execute()
        new_doc_id = copy_response['id']
        print(f"DEBUG: Successfully copied contract template, new doc ID: {new_doc_id}", file=sys.stderr)
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        if "404" in error_msg or "not found" in error_msg.lower():
            detailed_error = f"Template file not found (404). Template ID: {template_display}."
        elif "403" in error_msg or "permission" in error_msg.lower():
            detailed_error = f"Permission denied (403). Template ID: {template_display}."
        else:
            detailed_error = f"{error_type}: {error_msg}"
        print(f"DEBUG: Contract template copy failed: {detailed_error}", file=sys.stderr)
        raise Exception(f"Failed to copy contract template: {detailed_error}")
    
    try:
        product = job_data.get('product', {})
        customer = job_data.get('customer', {})
        contract = job_data.get('contract', {})
        price1 = job_data.get('price1', {})
        price2 = job_data.get('price2', {})
        
        replacements = {
            '{{docs.contract.id}}': f'kon-{job_id}',
            '{{docs.contract.created}}': format_date(datetime.now(UTC).isoformat()),
            '{{contract.work_start}}': format_date(contract.get('work_start')),
            '{{contract.work_end}}': format_date(contract.get('work_end')),
            '{{contract.legal_jurisdiction}}': contract.get('legal_jurisdiction', ''),
            '{{project}}': job_data.get('project', ''),
            '{{amount_due}}': calculate_amount_due(job_data),
            '{{customer.business}}': customer.get('business', ''),
            '{{customer.name}}': customer.get('name', ''),
            '{{customer.title}}': customer.get('title', ''),
            '{{address.line1}}': customer.get('address', {}).get('line1', ''),
            '{{customer.address.line1}}': customer.get('address', {}).get('line1', ''),
            '{{city}}': customer.get('address', {}).get('city', ''),
            '{{state}}': customer.get('address', {}).get('state', ''),
            '{{postal_code}}': customer.get('address', {}).get('postal_code', ''),
            '{{country}}': customer.get('address', {}).get('country', ''),
            '{{customer.email}}': customer.get('email', ''),
            '{{customer.phone}}': customer.get('phone', ''),
            '{{product.login_name}}': product.get('login_name', ''),
            '{{product.login_keyword}}': product.get('login_keyword', ''),
            '{{price1.nickname}}': price1.get('nickname', 'Initial Payment'),
            '{{price2.nickname}}': price2.get('nickname', 'Final Payment'),
            '{{price2.pay_days}}': str(price2.get('pay_days', '')),
            '{{price2.late_fee}}': format_currency(price2.get('late_fee', 0)),
            '{{price1.pay_by}}': price1.get('pay_by', 'start of work'),
            '{{price2.pay_by}}': price2.get('pay_by', 'before project launch'),
            '{{price1.unit_amount}}': format_currency(price1.get('unit_amount', 0)),
            '{{price2.unit_amount}}': format_currency(price2.get('unit_amount', 0)),
            '{{today}}': format_date(datetime.now(UTC).isoformat()),
            '{{project_scope_summary}}': job_data.get('project_scope_summary', ''),
            '{{project_scope_full}}': job_data.get('project_scope_full', ''),
            '{{subtotal}}': format_currency(safe_int(price1.get('unit_amount', 0)) + safe_int(price2.get('unit_amount', 0))),
            '{{amount_off}}': format_currency(safe_int(job_data.get('coupon', {}).get('amount_off', 0))),
            '{{total}}': format_currency(safe_int(price1.get('unit_amount', 0)) + safe_int(price2.get('unit_amount', 0)) - safe_int(job_data.get('coupon', {}).get('amount_off', 0))),
            '{{amount_paid}}': "$0.00"
        }
        
        replace_placeholders(docs_service, new_doc_id, replacements)
        
        pdf_response = drive_service.files().export_media(
            fileId=new_doc_id,
            mimeType='application/pdf'
        )
        
        pdf_bytes = io.BytesIO()
        downloader = MediaIoBaseDownload(pdf_bytes, pdf_response)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        
        pdf_bytes.seek(0)
        pdf_content = pdf_bytes.read()
        
        sha256 = calculate_sha256(pdf_content)
        
        return {
            'pdf_bytes': pdf_content,
            'sha256': sha256,
            'doc_id': new_doc_id
        }
    finally:
        try:
            drive_service.files().delete(fileId=new_doc_id).execute()
        except:
            pass


def generate_invoice_pdf(drive_service, docs_service, job_data: dict, template_id: str, payment_number: int) -> dict:
    """Generate invoice PDF from template for specific payment"""
    job_id = job_data.get('product', {}).get('id', 'unknown')
    
    template_display = f"{template_id[:10]}...{template_id[-10:]}" if len(template_id) > 20 else template_id
    print(f"DEBUG: Attempting to copy invoice template (ID: {template_display}) for Payment {payment_number}", file=sys.stderr)
    
    temp_folder_id = os.getenv('GOOGLE_TEMP_FOLDER_ID', '').strip()
    # Unique name for this specific payment invoice
    copy_body = {'name': f'Invoice-{payment_number}-{job_id}-{int(datetime.now(UTC).timestamp())}'}
    if temp_folder_id:
        copy_body['parents'] = [temp_folder_id]
    
    try:
        copy_response = drive_service.files().copy(
            fileId=template_id,
            body=copy_body,
            supportsAllDrives=True
        ).execute()
        new_doc_id = copy_response['id']
        print(f"DEBUG: Successfully copied invoice template, new doc ID: {new_doc_id}", file=sys.stderr)
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        if "404" in error_msg or "not found" in error_msg.lower():
            detailed_error = f"Template file not found (404). Template ID: {template_display}."
        elif "403" in error_msg or "permission" in error_msg.lower():
            detailed_error = f"Permission denied (403). Template ID: {template_display}."
        else:
            detailed_error = f"{error_type}: {error_msg}"
        print(f"DEBUG: Invoice template copy failed: {detailed_error}", file=sys.stderr)
        raise Exception(f"Failed to copy invoice template: {detailed_error}")
    
    try:
        product = job_data.get('product', {})
        customer = job_data.get('customer', {})
        price1 = job_data.get('price1', {})
        price2 = job_data.get('price2', {})
        coupon = job_data.get('coupon', {})  # Added coupon
        
        # Calculate subtotal and total using helper (or inline, but let's be explicit per doc)
        # Ensure all values are integers (handle string inputs from JSON)
        price1_amount = safe_int(price1.get('unit_amount', 0))
        price2_amount = safe_int(price2.get('unit_amount', 0))
        coupon_amount = safe_int(coupon.get('amount_off', 0))
        
        subtotal_cents = price1_amount + price2_amount
        coupon_cents = coupon_amount
        total_cents = subtotal_cents - coupon_cents
        
        replacements = {
            '{{docs.invoice.id}}': f'inv-{job_id}',
            '{{docs.invoice.created}}': format_date(datetime.now(UTC).isoformat()),
            '{{contract.work_start}}': format_date(job_data.get('contract', {}).get('work_start')),
            '{{contract.work_end}}': format_date(job_data.get('contract', {}).get('work_end')),
            '{{contract.signatures.contractor.signed_date}}': format_date(job_data.get('contract', {}).get('signatures', {}).get('contractor', {}).get('signed_date')),
            '{{contract.legal_jurisdiction}}': job_data.get('contract', {}).get('legal_jurisdiction', ''),
            '{{project}}': job_data.get('project', ''),
            
            # DEFUNCT but map to something safe/empty logic handled by template usually or removed
            '{{amount_due}}': "$0.00", 
            '{{amount_paid}}': "$0.00",

            # New Mapped Values from BALANCE_INVOICE_PDF.md
            '{{subtotal}}': format_currency(subtotal_cents),
            '{{amount_off}}': format_currency(coupon_cents),
            '{{total}}': format_currency(total_cents),
            '{{price1.count}}': str(price1.get('count', 1)),
            '{{price2.count}}': str(price2.get('count', 2)),
            '{{product.total_payments}}': str(product.get('total_payments', 1)),
            '{{payment1_due}}': format_currency(max(0, price1_amount - coupon_cents)),
            '{{payment2_due}}': format_currency(price2_amount),

            # Standard Fields
            '{{customer.business}}': customer.get('business', ''),
            '{{customer.name}}': customer.get('name', ''),
            '{{customer.title}}': customer.get('title', ''),
            '{{address.line1}}': customer.get('address', {}).get('line1', ''),
            '{{customer.address.line1}}': customer.get('address', {}).get('line1', ''),
            '{{city}}': customer.get('address', {}).get('city', ''),
            '{{state}}': customer.get('address', {}).get('state', ''),
            '{{postal_code}}': customer.get('address', {}).get('postal_code', ''),
            '{{country}}': customer.get('address', {}).get('country', ''),
            '{{customer.email}}': customer.get('email', ''),
            '{{customer.phone}}': customer.get('phone', ''),
            '{{product.login_name}}': product.get('login_name', ''),
            '{{product.login_keyword}}': product.get('login_keyword', ''),
            '{{price1.nickname}}': price1.get('nickname', 'Initial Payment'),
            '{{price2.nickname}}': price2.get('nickname', 'Final Payment'),
            '{{price2.pay_days}}': str(price2.get('pay_days', '')),
            '{{price2.late_fee}}': str(price2.get('late_fee', '')),
            '{{price1.pay_by}}': price1.get('pay_by', 'start of work'),
            '{{price2.pay_by}}': price2.get('pay_by', 'before project launch'),
            '{{price1.unit_amount}}': format_currency(price1.get('unit_amount', 0)),
            '{{price2.unit_amount}}': format_currency(price2.get('unit_amount', 0)),
            '{{today}}': format_date(datetime.now(UTC).isoformat()),
            '{{project_scope_summary}}': job_data.get('project_scope_summary', ''),
            '{{project_scope_full}}': job_data.get('project_scope_full', '')
        }
        
        replace_placeholders(docs_service, new_doc_id, replacements)
        
        pdf_response = drive_service.files().export_media(
            fileId=new_doc_id,
            mimeType='application/pdf'
        )
        
        pdf_bytes = io.BytesIO()
        downloader = MediaIoBaseDownload(pdf_bytes, pdf_response)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        
        pdf_bytes.seek(0)
        pdf_content = pdf_bytes.read()
        
        sha256 = calculate_sha256(pdf_content)
        
        return {
            'pdf_bytes': pdf_content,
            'sha256': sha256,
            'doc_id': new_doc_id
        }
    finally:
        try:
            drive_service.files().delete(fileId=new_doc_id).execute()
        except:
            pass


def generate_pdfs_for_new_jobs(jobs_dir: str, new_job_ids: list) -> dict:
    """Generate PDFs for new jobs that were just created."""
    stats = {
        "contracts_generated": 0,
        "invoices_generated": 0,
        "errors": [],
        "warnings": []
    }
    
    if not new_job_ids:
        return stats
    
    # Authenticate with Google
    try:
        drive_service, docs_service = authenticate_google()
        print("DEBUG: Google authentication successful", file=sys.stderr)
    except ValueError as e:
        error_msg = str(e)
        if "GOOGLE_REFRESH_TOKEN" in error_msg or "GOOGLE_CLIENT_ID" in error_msg:
            stats['errors'].append("Authentication failed: Missing required environment variables")
        else:
            stats['errors'].append(f"Authentication failed: {error_msg}")
        return stats
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        if "invalid_scope" in error_msg or "invalid_grant" in error_msg:
            stats['errors'].append(f"Authentication failed: OAuth token error ({error_type})")
        else:
            stats['errors'].append(f"Authentication failed: {error_type}: {error_msg}")
        return stats
    
    # Get template IDs
    contract_template_id = os.getenv('GOOGLE_TEMPLATE_CONTRACT_ID', '').strip()
    invoice_template_id = os.getenv('GOOGLE_TEMPLATE_INVOICE_ID', '').strip()
    # Prioritize the new cleaner name, fallback to legacy if needed
    invoice_balance_template_id = os.getenv('GOOGLE_TEMPLATE_BALANCE_ID', '').strip() or os.getenv('GOOGLE_TEMPLATE_INVOICE_BALANCE_ID', '').strip()
    
    if not contract_template_id or not invoice_template_id:
        stats['errors'].append("GOOGLE_TEMPLATE_CONTRACT_ID or GOOGLE_TEMPLATE_INVOICE_ID not set")
        return stats
    
    # Get project root
    utils_dir = Path(__file__).parent.parent
    github_dir = utils_dir.parent
    project_root = github_dir.parent
    
    # Create PDF directories
    contract_dir = project_root / 'assets' / 'pdf' / 'contract'
    invoice_dir = project_root / 'assets' / 'pdf' / 'invoice'
    contract_dir.mkdir(parents=True, exist_ok=True)
    invoice_dir.mkdir(parents=True, exist_ok=True)
    
    # Load jobs
    all_jobs = list_all_jobs(jobs_dir)
    jobs_by_id = {}
    for job_data in all_jobs:
        product = job_data.get('product', {})
        job_id = product.get('id')
        if job_id and job_id in new_job_ids:
            jobs_by_id[job_id] = job_data
    
    for job_id in new_job_ids:
        if job_id not in jobs_by_id:
            stats['errors'].append(f"Job {job_id} not found")
            continue
        
        job_data = jobs_by_id[job_id]
        
        # Initialize docs if missing
        if 'docs' not in job_data:
            job_data['docs'] = {}
        if 'contract' not in job_data['docs']:
            job_data['docs']['contract'] = {}
        if 'invoice' not in job_data['docs']:
            job_data['docs']['invoice'] = {}
        
        # -------------------------------------------------------------------------
        # GENERATE ITEMS (Contract, Invoice, Balance)
        # -------------------------------------------------------------------------
        
        clean_id = job_id.replace('uid-', '')
        
        # 1. CONTRACT
        if contract_template_id:
            pdf_filename = f'kon-{clean_id}.pdf'
            pdf_path = contract_dir / pdf_filename
            
            if not pdf_path.exists():
                try:
                    print(f"Generating Contract for {job_id}...", file=sys.stderr)
                    result = generate_contract_pdf(drive_service, docs_service, job_data, contract_template_id)
                    with open(pdf_path, 'wb') as f: f.write(result['pdf_bytes'])
                    
                    job_data['docs']['contract'] = {
                        'id': f'kon-{clean_id}',
                        'pdf': f'assets/pdf/contract/{pdf_filename}',
                        'file_id': result['doc_id'],
                        'url': f'https://payments.august.style/assets/pdf/contract/{pdf_filename}',
                        'sha256': result['sha256'],
                        'created': datetime.now(UTC).isoformat().replace('+00:00', 'Z')
                    }
                    stats['contracts_generated'] += 1
                except Exception as e:
                    stats['errors'].append(f"Contract generation failed for {job_id}: {str(e)}")

        # 2. INVOICE (Previously Invoice 1)
        if invoice_template_id:
            pdf_filename = f'inv-{clean_id}.pdf'
            pdf_path = invoice_dir / pdf_filename
            
            # Ensure docs structure
            if 'invoice' not in job_data['docs']: job_data['docs']['invoice'] = {}
            
            if not pdf_path.exists():
                try:
                    print(f"Generating Invoice for {job_id}...", file=sys.stderr)
                    # Pass 1 for payment_num as it is the initial invoice
                    result = generate_invoice_pdf(drive_service, docs_service, job_data, invoice_template_id, 1)
                    with open(pdf_path, 'wb') as f: f.write(result['pdf_bytes'])
                    
                    job_data['docs']['invoice'] = {
                        'id': f'inv-{clean_id}',
                        'pdf': f'assets/pdf/invoice/{pdf_filename}',
                        'file_id': result['doc_id'],
                        'url': f'https://payments.august.style/assets/pdf/invoice/{pdf_filename}',
                        'sha256': result['sha256'],
                        'created': datetime.now(UTC).isoformat().replace('+00:00', 'Z')
                    }
                    stats['invoices_generated'] += 1
                except Exception as e:
                    stats['errors'].append(f"Invoice generation failed for {job_id}: {str(e)}")
        else:
            print(f"WARNING: Skipping Invoice (Missing Template ID)", file=sys.stderr)

        # 3. BALANCE (Previously Invoice 2)
        total_payments = job_data.get('product', {}).get('total_payments', 1)
        
        # Check if we should generate a balance invoice (total_payments >= 2)
        if total_payments >= 2:
            if invoice_balance_template_id:
                pdf_filename = f'bal-{clean_id}.pdf'
                # Use a specific balance directory if desired, but user listed assets/pdf/balance/ in request
                # We need to make sure 'balance_dir' is defined earlier or just stick to invoice_dir if we want flat
                # The user explicitly said: assets/pdf/balance/
                # So we must use balance_dir. I need to define it above this block or use the path directly.
                # Since I am replacing a block inside the loop, I should use project_root to define it here if needed,
                # buuuut 'invoice_dir' was defined at top scope.
                # Let's use invoice_dir.parent / 'balance' / pdf_filename
                balance_dir = invoice_dir.parent / 'balance'
                balance_dir.mkdir(parents=True, exist_ok=True)
                
                pdf_path = balance_dir / pdf_filename
                
                # Ensure docs structure
                if 'balance' not in job_data['docs']: job_data['docs']['balance'] = {}
                
                if not pdf_path.exists():
                    try:
                        print(f"Generating Balance Invoice for {job_id}...", file=sys.stderr)
                        # Pass 2 for payment_num
                        result = generate_invoice_pdf(drive_service, docs_service, job_data, invoice_balance_template_id, 2)
                        with open(pdf_path, 'wb') as f: f.write(result['pdf_bytes'])
                        
                        job_data['docs']['balance'] = {
                            'id': f'bal-{clean_id}',
                            'pdf': f'assets/pdf/balance/{pdf_filename}',
                            'file_id': result['doc_id'],
                            'url': f'https://payments.august.style/assets/pdf/balance/{pdf_filename}',
                            'sha256': result['sha256'],
                            'created': datetime.now(UTC).isoformat().replace('+00:00', 'Z')
                        }
                        stats['invoices_generated'] += 1
                    except Exception as e:
                        stats['errors'].append(f"Balance Invoice generation failed for {job_id}: {str(e)}")
            else:
                msg = f"Skipping Balance Invoice for {job_id}: Missing GOOGLE_TEMPLATE_BALANCE_ID"
                print(f"WARNING: {msg}", file=sys.stderr)
                stats['warnings'].append(msg)

        # 4. COMBINED PDF (merge contract + invoice + balance into single download)
        if PYPDF_AVAILABLE:
            combined_dir = invoice_dir.parent / 'combined'
            combined_dir.mkdir(parents=True, exist_ok=True)
            combined_filename = f'{job_id}.pdf'
            combined_path = combined_dir / combined_filename

            if not combined_path.exists():
                # Collect paths of individual PDFs that exist
                pdfs_to_merge = []
                contract_pdf_path = contract_dir / f'kon-{clean_id}.pdf'
                invoice_pdf_path = invoice_dir / f'inv-{clean_id}.pdf'
                balance_pdf_path = invoice_dir.parent / 'balance' / f'bal-{clean_id}.pdf'

                if contract_pdf_path.exists():
                    pdfs_to_merge.append(contract_pdf_path)
                if invoice_pdf_path.exists():
                    pdfs_to_merge.append(invoice_pdf_path)
                if balance_pdf_path.exists():
                    pdfs_to_merge.append(balance_pdf_path)

                if len(pdfs_to_merge) >= 2:  # Need at least contract + invoice
                    try:
                        print(f"Generating Combined PDF for {job_id}...", file=sys.stderr)
                        merger = PdfMerger()
                        for pdf_path in pdfs_to_merge:
                            merger.append(str(pdf_path))

                        with open(combined_path, 'wb') as output_file:
                            merger.write(output_file)
                        merger.close()

                        # Calculate SHA256 of combined PDF
                        with open(combined_path, 'rb') as f:
                            combined_sha256 = calculate_sha256(f.read())

                        # Ensure docs.combined structure exists
                        if 'combined' not in job_data['docs']:
                            job_data['docs']['combined'] = {}

                        job_data['docs']['combined'] = {
                            'id': job_id,
                            'pdf': f'assets/pdf/combined/{combined_filename}',
                            'url': f'https://payments.august.style/assets/pdf/combined/{combined_filename}',
                            'sha256': combined_sha256,
                            'created': datetime.now(UTC).isoformat().replace('+00:00', 'Z')
                        }
                        print(f"Combined PDF generated: {combined_filename} ({len(pdfs_to_merge)} files merged)", file=sys.stderr)
                    except Exception as e:
                        stats['errors'].append(f"Combined PDF generation failed for {job_id}: {str(e)}")
                else:
                    print(f"Skipping Combined PDF for {job_id}: Not enough PDFs to merge ({len(pdfs_to_merge)} found)", file=sys.stderr)
        else:
            print(f"Skipping Combined PDF for {job_id}: pypdf not available", file=sys.stderr)

        # Save updated job JSON
        try:
            save_job(job_id, job_data, jobs_dir)
        except Exception as e:
            stats['errors'].append(f"Failed to save job JSON for {job_id}: {str(e)}")
    
    return stats


# ============================================================================
# MANIFEST GENERATION FUNCTIONS
# ============================================================================

def normalize_lookup_key(text: str) -> str:
    """Normalize text for lookup key (lowercase, hyphenated)"""
    return text.lower().replace(' ', '-').replace('_', '-').strip()


def read_job_json(file_path: Path) -> Optional[Dict]:
    """Read a job JSON file and extract lookup data"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'product' not in data:
            print(f"⚠️  Missing 'product' field in {file_path.name}", file=sys.stderr)
            return None
        
        product = data['product']
        if 'login_name' not in product or 'login_keyword' not in product:
            print(f"⚠️  Missing 'login_name' or 'login_keyword' in product for {file_path.name}", file=sys.stderr)
            return None
        
        if 'id' not in product:
            print(f"⚠️  Missing 'id' in product for {file_path.name}", file=sys.stderr)
            return None
        
        return data
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in {file_path.name}: {e}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"❌ Error reading {file_path.name}: {e}", file=sys.stderr)
        return None


def generate_manifest(jobs_dir: str, manifest_path: str) -> dict:
    """Generate manifest mapping lookup keys to job entries"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent  # .github/scripts/orchestration -> .github/scripts -> .github -> project root
    jobs_path = project_root / jobs_dir
    manifest = {}
    
    if not jobs_path.exists():
        print(f"⚠️  Jobs directory not found: {jobs_path}", file=sys.stderr)
        return manifest
    
    json_files = [f for f in jobs_path.glob('*.json') if not f.name.startswith('_job_template')]
    
    if not json_files:
        print("ℹ️  No job JSON files found (excluding template)", file=sys.stderr)
        return manifest
    
    for json_file in sorted(json_files):
        job_data = read_job_json(json_file)
        
        if not job_data:
            continue
        
        product = job_data['product']
        login_name = normalize_lookup_key(product['login_name'])
        login_keyword = normalize_lookup_key(product['login_keyword'])
        job_id = product['id']
        
        lookup_key = f"{login_name}-{login_keyword}"
        relative_path = f"assets/jobs/{json_file.name}"
        
        expected_job_id = json_file.stem
        if job_id != expected_job_id:
            print(f"⚠️  Warning: job_id '{job_id}' doesn't match filename '{expected_job_id}' in {json_file.name}", file=sys.stderr)
        
        if lookup_key in manifest:
            print(f"⚠️  Duplicate lookup key '{lookup_key}': {json_file.name} conflicts with {manifest[lookup_key]['file_path']}", file=sys.stderr)
            continue
        
        manifest[lookup_key] = {
            "file_path": relative_path,
            "job_id": job_id,
            "login_keyword": product['login_keyword'],
            "login_name": product['login_name']
        }
        print(f"✅ Added: {lookup_key} → {job_id} ({json_file.name})")
    
    return manifest


def write_manifest(manifest: dict, manifest_path: str):
    """Write manifest to file"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent  # .github/scripts/orchestration -> .github/scripts -> .github -> project root
    output_file = project_root / manifest_path
    
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    manifest_data = {
        "jobs": manifest,
        "generated_at": datetime.now(UTC).isoformat().replace('+00:00', 'Z')
    }
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(manifest_data, f, indent=2, ensure_ascii=False)
        
        job_count = len(manifest)
        print(f"\n✅ Manifest generated: {job_count} job(s) mapped")
        print(f"📄 Output: {output_file}")
    except Exception as e:
        print(f"❌ Error writing manifest: {e}", file=sys.stderr)
        raise


# ============================================================================
# GIT FUNCTIONS
# ============================================================================

def git_commit_and_push(message: str) -> bool:
    """Commit and push changes to git."""
    try:
        subprocess.run(['git', 'config', '--local', 'user.email', 'action@github.com'], check=True)
        subprocess.run(['git', 'config', '--local', 'user.name', 'GitHub Action'], check=True)
        
        status_result = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True, check=True)
        has_unstaged = bool(status_result.stdout.strip())
        
        if has_unstaged:
            stash_result = subprocess.run(['git', 'stash', '--include-untracked'], check=False, capture_output=True, text=True)
            if stash_result.returncode != 0 and 'No local changes' not in stash_result.stdout:
                print(f"Warning: git stash failed: {stash_result.stderr}", file=sys.stderr)
            
            pull_result = subprocess.run(['git', 'pull', '--rebase'], check=False, capture_output=True, text=True)
            if pull_result.returncode != 0:
                print(f"Warning: git pull --rebase had issues: {pull_result.stderr}", file=sys.stderr)
            
            stash_pop_result = subprocess.run(['git', 'stash', 'pop'], check=False, capture_output=True, text=True)
            if stash_pop_result.returncode != 0:
                if 'No stash entries' not in stash_pop_result.stderr:
                    print(f"❌ Critical Error: git stash pop caused conflicts: {stash_pop_result.stderr}", file=sys.stderr)
                    print("⚠️  Aborting commit to prevent corruption.", file=sys.stderr)
                    # Abort: Do NOT commit conflict markers
                    return False
        else:
            subprocess.run(['git', 'pull', '--rebase'], check=False)
        
        subprocess.run(['git', 'add', '-A'], check=True)
        
        result = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True, check=True)
        if not result.stdout.strip():
            return False
        
        subprocess.run(['git', 'commit', '-m', message], check=True)
        subprocess.run(['git', 'push'], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Git error: {e.stderr}", file=sys.stderr)
        return False


# ============================================================================
# MAIN WORKFLOW
# ============================================================================

def main():
    """TRIGGER=admin-push: Steps 1-12"""
    jobs_dir = 'assets/jobs'
    manifest_path = 'assets/js/manifest.json'
    
    results = {
        'trigger': 'admin-push',
        'steps_run': [],
        'errors': [],
        'committed': False,
        'pushed': False
    }
    
    try:
        # Pre-check: Validate Google token if new jobs detected (before Step 1)
        print(f"[TRIGGER=admin-push] Pre-check: Scanning for new jobs that will need PDFs", file=sys.stderr)
        all_jobs = list_all_jobs(jobs_dir)
        new_jobs_detected = []
        for job_data in all_jobs:
            product = job_data.get('product', {})
            job_id = product.get('id')
            state_objects = job_data.get('state', {}).get('objects', {})
            # New jobs don't have 'created' timestamp yet - they'll need PDFs
            if job_id and not state_objects.get('created'):
                new_jobs_detected.append(job_id)
        
        if new_jobs_detected:
            print(f"[TRIGGER=admin-push] Pre-check: Found {len(new_jobs_detected)} new job(s) that will need PDFs - validating Google token", file=sys.stderr)
            # Debug: Check if token env var is set (don't print actual token value)
            token_set = bool(os.getenv('GOOGLE_REFRESH_TOKEN'))
            token_length = len(os.getenv('GOOGLE_REFRESH_TOKEN', ''))
            print(f"[TRIGGER=admin-push] Pre-check: DEBUG - GOOGLE_REFRESH_TOKEN env var is set: {token_set}, length: {token_length}", file=sys.stderr)
            try:
                validate_google_token()
                print(f"[TRIGGER=admin-push] Pre-check: Google token validated successfully", file=sys.stderr)
            except ValueError as e:
                error_msg = str(e)
                results['errors'].append(error_msg)
                print(f"[TRIGGER=admin-push] Pre-check: FAILED - {error_msg}", file=sys.stderr)
                print(json.dumps(results, indent=2))
                sys.exit(1)
        else:
            print(f"[TRIGGER=admin-push] Pre-check: No new jobs detected - skipping token validation", file=sys.stderr)
        
        # Step 1: Compare JSONs to catalog (8-step matching logic)
        sync_stats = execute_8_step_sync(jobs_dir, manifest_path, 'admin-push')
        results['steps_run'].append('sync_catalog')
        print(f"[TRIGGER=admin-push] Step 1: Completed - Stats: {json.dumps(sync_stats, indent=2)}", file=sys.stderr)
        
        # Step 2: Generate PDFs for new jobs (2a, 2b, 2c)
        print(f"[TRIGGER=admin-push] Step 2: Generating PDFs for new jobs (2a: artifacts, 2b: PDFs, 2c: artifacts)", file=sys.stderr)
        new_job_ids = []
        if sync_stats.get('products_created', 0) > 0:
            # Find which jobs were created
            all_jobs = list_all_jobs(jobs_dir)
            for job_data in all_jobs:
                product = job_data.get('product', {})
                job_id = product.get('id')
                state_objects = job_data.get('state', {}).get('objects', {})
                if job_id and state_objects.get('created'):
                    # Check if created timestamp is recent (within last minute)
                    created_str = state_objects.get('created')
                    try:
                        created_dt = datetime.fromisoformat(created_str.replace('Z', '+00:00'))
                        if (datetime.now(UTC) - created_dt.replace(tzinfo=UTC)).total_seconds() < 60:
                            new_job_ids.append(job_id)
                    except:
                        pass
            
            if new_job_ids:
                print(f"[TRIGGER=admin-push] Step 2: Found {len(new_job_ids)} new job(s) to generate PDFs for", file=sys.stderr)
                pdf_stats = generate_pdfs_for_new_jobs(jobs_dir, new_job_ids)
                results['steps_run'].append('generate_pdfs')
                if pdf_stats.get('errors'):
                    results['errors'].extend(pdf_stats['errors'])
                print(f"[TRIGGER=admin-push] Step 2: Completed - Generated {pdf_stats.get('contracts_generated', 0)} contract(s), {pdf_stats.get('invoices_generated', 0)} invoice(s)", file=sys.stderr)
            else:
                print(f"[TRIGGER=admin-push] Step 2: Skipped - No new jobs detected (created timestamp check)", file=sys.stderr)
        else:
            print(f"[TRIGGER=admin-push] Step 2: Skipped - No new products created", file=sys.stderr)
        
        # Steps 3-9 are handled within execute_8_step_sync (already logged)
        print(f"[TRIGGER=admin-push] Steps 3-9: Completed within Step 1 sync logic", file=sys.stderr)
        
        # Step 10: Create new manifest that reflects resulting JSON directory
        print(f"[TRIGGER=admin-push] Step 10: Creating manifest", file=sys.stderr)
        try:
            manifest = generate_manifest(jobs_dir, manifest_path)
            write_manifest(manifest, manifest_path)
            results['steps_run'].append('generate_manifest')
            print(f"[TRIGGER=admin-push] Step 10: Completed - Manifest generated with {len(manifest)} job(s)", file=sys.stderr)
        except Exception as e:
            results['errors'].append(f"generate_manifest failed: {str(e)}")
            print(f"[TRIGGER=admin-push] Step 10: ERROR - {str(e)}", file=sys.stderr)
        
        # Step 11: Build pages (logged, actual build happens in separate workflow)
        print(f"[TRIGGER=admin-push] Step 11: Building pages (will trigger after commit)", file=sys.stderr)
        results['steps_run'].append('build_pages')
        print(f"[TRIGGER=admin-push] Step 11: Completed - Pages build will trigger after commit", file=sys.stderr)
        
        # Step 12: Deploy
        print(f"[TRIGGER=admin-push] Step 12: Deploying (committing and pushing changes)", file=sys.stderr)
        commit_message = "🤖 Auto-update: Stripe catalog sync and manifest update\n\nCo-Authored-By: GitHub Actions <action@github.com>"
        if git_commit_and_push(commit_message):
            results['committed'] = True
            results['pushed'] = True
            print(f"[TRIGGER=admin-push] Step 12: Completed - Changes committed and pushed", file=sys.stderr)
        else:
            print(f"[TRIGGER=admin-push] Step 12: Skipped - No changes detected", file=sys.stderr)
        
    except Exception as e:
        results['errors'].append(f"Orchestration error: {str(e)}")
        import traceback
        print(traceback.format_exc(), file=sys.stderr)
    
    print(json.dumps(results, indent=2))
    sys.exit(0 if not results['errors'] else 1)


if __name__ == "__main__":
    main()
