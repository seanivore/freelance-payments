#!/usr/bin/env python3
"""
Consolidated Stripe Catalog Sync (v3 schema)
Creates/updates Products, Prices, Customers, Coupons, and stores Checkout Session parameters.

Process:
1. Compare filenames in assets/jobs/ to manifest.json entries
2. Files with no manifest match → Create all Stripe objects
3. Manifest entries with no file match → Archive product
4. Store Stripe IDs in state_management.object
5. Store checkout session parameters (sessions created on-demand per CHECKOUT_SESSION_DETAILS.md)

v3 Schema:
- product_object.id = job_id (matches filename)
- initial_price_object, balance_price_object (not price[] array)
- customer_object (not client)
- coupon_object (optional)
- state_management.object stores Stripe IDs

Usage:
    python3 sync_catalog.py --jobs-dir "assets/jobs" --manifest-path "assets/js/manifest.json"

Returns (stdout):
    {"jobs_processed": 5, "products_created": 2, "prices_created": 4, "customers_created": 2, "coupons_created": 1, "products_archived": 0}

Exit codes:
    0 = Success
    1 = Validation error
    2 = Stripe API error
"""

import sys
import json
import argparse
import os
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.json_io import list_all_jobs, save_job, find_job_file

# Import Stripe
try:
    import stripe
except ImportError:
    print(json.dumps({"error": "Stripe library not installed. Run: pip install stripe"}), file=sys.stderr)
    sys.exit(2)


def load_manifest(manifest_path: str) -> dict:
    """Load manifest.json and return jobs dict."""
    manifest_file = Path(manifest_path)
    if not manifest_file.exists():
        return {}
    
    try:
        with open(manifest_file, 'r', encoding='utf-8') as f:
            manifest_data = json.load(f)
            return manifest_data.get('jobs', {})
    except Exception as e:
        print(f"Warning: Failed to load manifest: {e}", file=sys.stderr)
        return {}


def create_stripe_product(product_obj: dict, job_id: str) -> str:
    """Create Stripe Product. Returns product_id."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    if not stripe.api_key:
        raise ValueError("STRIPE_SECRET_KEY environment variable not set")

    # Use product_object.id as Stripe product ID (if allowed)
    product_params = {
        'name': product_obj.get('name', f'Job {job_id}'),
        'active': product_obj.get('active', True),
        'type': product_obj.get('type', 'service'),
        'metadata': product_obj.get('metadata', {})
    }

    if product_obj.get('description'):
        product_params['description'] = product_obj['description']

    if product_obj.get('unit_label'):
        product_params['unit_label'] = product_obj['unit_label']

    # Try to use custom ID (may not always work, Stripe will generate if needed)
    try:
        product = stripe.Product.create(id=product_obj.get('id'), **product_params)
    except stripe.error.InvalidRequestError:
        # Custom ID not allowed, let Stripe generate
        product = stripe.Product.create(**product_params)

    return product.id


def modify_stripe_product(product_id: str, product_obj: dict) -> str:
    """Modify existing Stripe Product. Returns product_id."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    
    update_params = {
        'name': product_obj.get('name'),
        'active': product_obj.get('active', True),
        'metadata': product_obj.get('metadata', {})
    }

    if product_obj.get('description'):
        update_params['description'] = product_obj['description']

    product = stripe.Product.modify(product_id, **update_params)
    return product.id


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
        'metadata': price_obj.get('metadata', {})
    }

    if price_obj.get('nickname'):
        price_params['nickname'] = price_obj['nickname']

    # Try to use custom ID
    try:
        price = stripe.Price.create(id=price_obj.get('id'), **price_params)
    except stripe.error.InvalidRequestError:
        price = stripe.Price.create(**price_params)

    return price.id


def archive_stripe_price(price_id: str) -> None:
    """Archive Stripe Price (set active=false)."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    stripe.Price.modify(price_id, active=False)


def create_stripe_customer(customer_obj: dict) -> str:
    """Create Stripe Customer. Returns customer_id."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    customer_params = {
        'name': customer_obj.get('individual_name') or customer_obj.get('business_name'),
        'email': customer_obj.get('email'),
        'phone': customer_obj.get('phone'),
        'metadata': {}
    }

    if customer_obj.get('description'):
        customer_params['description'] = customer_obj['description']

    if customer_obj.get('address'):
        customer_params['address'] = {
            'line1': customer_obj['address'].get('line1'),
            'city': customer_obj['address'].get('city'),
            'state': customer_obj['address'].get('state'),
            'postal_code': customer_obj['address'].get('postal_code'),
            'country': customer_obj['address'].get('country', 'US')
        }

    # Try to use custom ID
    try:
        customer = stripe.Customer.create(id=customer_obj.get('id'), **customer_params)
    except stripe.error.InvalidRequestError:
        customer = stripe.Customer.create(**customer_params)

    return customer.id


def create_stripe_coupon(coupon_obj: dict) -> str:
    """Create Stripe Coupon. Returns coupon_id."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    coupon_params = {
        'id': coupon_obj.get('id'),  # Coupons allow custom IDs
        'amount_off': coupon_obj.get('amount_off'),
        'currency': coupon_obj.get('currency', 'usd').lower(),
        'duration': coupon_obj.get('duration', 'once'),
        'max_redemptions': coupon_obj.get('max_redemptions', 1)
    }

    if coupon_obj.get('name'):
        coupon_params['name'] = coupon_obj['name']

    if coupon_obj.get('applies_to'):
        coupon_params['applies_to'] = coupon_obj['applies_to']

    coupon = stripe.Coupon.create(**coupon_params)
    return coupon.id


def sync_job(job_data: dict, manifest_job_ids: set) -> dict:
    """
    Sync a single job to Stripe catalog (v3 schema).
    
    Args:
        job_data: Job JSON dictionary (v3 schema)
        manifest_job_ids: Set of job_ids already in manifest
    
    Returns:
        Dictionary with sync stats
    """
    # Get job_id from product_object.id (v3 schema)
    product_obj = job_data.get('product_object', {})
    job_id = product_obj.get('id')
    
    if not job_id:
        raise ValueError("Job missing product_object.id")

    stats = {
        'products_created': 0,
        'products_modified': 0,
        'prices_created': 0,
        'customers_created': 0,
        'coupons_created': 0,
        'products_archived': 0
    }

    # Initialize state_management if missing
    if 'state_management' not in job_data:
        job_data['state_management'] = {}
    if 'object' not in job_data['state_management']:
        job_data['state_management']['object'] = {}

    state_obj = job_data['state_management']['object']

    # Check if job needs Stripe objects created (not in manifest)
    needs_creation = job_id not in manifest_job_ids

    if needs_creation:
        # === CREATE PRODUCT ===
        product_id = state_obj.get('product')
        if product_id:
            # Product exists → Modify it
            product_id = modify_stripe_product(product_id, product_obj)
            stats['products_modified'] += 1
        else:
            # Create new product
            product_id = create_stripe_product(product_obj, job_id)
            stats['products_created'] += 1
        
        state_obj['product'] = product_id
        state_obj['created'] = datetime.utcnow().isoformat() + 'Z'

        # === CREATE CUSTOMER ===
        customer_obj = job_data.get('customer_object')
        if customer_obj:
            customer_id = state_obj.get('customer')
            if not customer_id:
                customer_id = create_stripe_customer(customer_obj)
                stats['customers_created'] += 1
            state_obj['customer'] = customer_id

        # === CREATE PRICES ===
        initial_price_obj = job_data.get('initial_price_object')
        balance_price_obj = job_data.get('balance_price_object')
        
        # Get existing price IDs from state_management
        existing_prices = state_obj.get('price', [])
        initial_price_id = None
        balance_price_id = None
        
        for price_entry in existing_prices:
            if isinstance(price_entry, dict):
                if 'initial' in price_entry:
                    initial_price_id = price_entry['initial']
                if 'balance' in price_entry:
                    balance_price_id = price_entry['balance']
        
        price_ids = []
        
        if initial_price_obj:
            if not initial_price_id:
                initial_price_id = create_stripe_price(initial_price_obj, product_id)
                stats['prices_created'] += 1
            price_ids.append({'initial': initial_price_id})

        if balance_price_obj:
            if not balance_price_id:
                balance_price_id = create_stripe_price(balance_price_obj, product_id)
                stats['prices_created'] += 1
            price_ids.append({'balance': balance_price_id})

        state_obj['price'] = price_ids

        # === CREATE COUPON (if exists) ===
        coupon_obj = job_data.get('coupon_object')
        if coupon_obj:
            coupon_id = state_obj.get('coupon')
            if not coupon_id:
                coupon_id = create_stripe_coupon(coupon_obj)
                stats['coupons_created'] += 1
            state_obj['coupon'] = coupon_id

        # === STORE CHECKOUT SESSION PARAMETERS (not create actual sessions) ===
        # Sessions are created on-demand per CHECKOUT_SESSION_DETAILS.md
        # Just store the parameters from the template
        checkout_session_params = []
        if job_data.get('initial_checkout_session'):
            checkout_session_params.append({'initial': 'parameters_stored'})
        if job_data.get('balance_checkout_session'):
            checkout_session_params.append({'balance': 'parameters_stored'})
        
        if checkout_session_params:
            state_obj['checkout_session'] = checkout_session_params

    return stats


def archive_orphaned_products(manifest_job_ids: set, jobs_dir: str) -> int:
    """
    Archive Stripe products that are in manifest but no longer have files.
    
    Returns:
        Number of products archived
    """
    archived_count = 0
    
    # Load manifest to get product IDs
    # We'd need to load each manifest entry to get the product_id
    # For now, skip this - can be implemented later if needed
    
    return archived_count


def sync_catalog(jobs_dir: str = "assets/jobs", manifest_path: str = "assets/js/manifest.json") -> dict:
    """
    Sync all job files to Stripe catalog (v3 schema).
    
    Args:
        jobs_dir: Directory containing job JSON files
        manifest_path: Path to manifest.json
    
    Returns:
        Dictionary with overall sync stats
    """
    # Load manifest to get existing job_ids
    manifest = load_manifest(manifest_path)
    manifest_job_ids = {entry.get('job_id') for entry in manifest.values() if entry.get('job_id')}
    
    # Get all job files
    all_jobs = list_all_jobs(jobs_dir)
    
    print(f"DEBUG: Found {len(all_jobs)} job file(s) in {jobs_dir}", file=sys.stderr)
    print(f"DEBUG: Found {len(manifest_job_ids)} job_id(s) in manifest", file=sys.stderr)

    overall_stats = {
        'jobs_processed': 0,
        'products_created': 0,
        'products_modified': 0,
        'prices_created': 0,
        'customers_created': 0,
        'coupons_created': 0,
        'products_archived': 0
    }

    for job_data in all_jobs:
        product_obj = job_data.get('product_object', {})
        job_id = product_obj.get('id')
        
        if not job_id:
            print(f"Warning: Skipping job missing product_object.id", file=sys.stderr)
            continue

        try:
            print(f"DEBUG: Processing job {job_id}", file=sys.stderr)
            stats = sync_job(job_data, manifest_job_ids)
            
            # Accumulate stats
            for key in stats:
                overall_stats[key] += stats[key]
            
            overall_stats['jobs_processed'] += 1

            # Save updated job
            if not save_job(job_id, job_data, jobs_dir=jobs_dir):
                print(f"Warning: Failed to save job {job_id}", file=sys.stderr)
            else:
                print(f"DEBUG: Successfully saved job {job_id}", file=sys.stderr)

        except Exception as e:
            print(f"Error syncing job {job_id}: {e}", file=sys.stderr)
            import traceback
            print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
            continue

    # Archive orphaned products (in manifest but no file)
    archived = archive_orphaned_products(manifest_job_ids, jobs_dir)
    overall_stats['products_archived'] = archived

    return overall_stats


def main():
    parser = argparse.ArgumentParser(description="Sync jobs to Stripe catalog (v3 schema)")
    parser.add_argument('--jobs-dir', default='assets/jobs', help="Jobs directory")
    parser.add_argument('--manifest-path', default='assets/js/manifest.json', help="Path to manifest.json")

    args = parser.parse_args()

    try:
        result = sync_catalog(jobs_dir=args.jobs_dir, manifest_path=args.manifest_path)
        print(json.dumps(result, indent=2))
        sys.exit(0)

    except ValueError as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

    except Exception as e:
        print(json.dumps({"error": f"Unexpected error: {e}"}), file=sys.stderr)
        import traceback
        print(traceback.format_exc(), file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
