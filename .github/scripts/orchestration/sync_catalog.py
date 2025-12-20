#!/usr/bin/env python3
"""
Main coordinator for syncing JSON files to Stripe catalog.

CRITICAL: Creates Product FIRST, then Prices!

Process:
1. Scan all job files
2. For each product with section_updated=true:
   - Create or modify product
   - Store stripe_product_id
3. For each price with section_updated=true:
   - Archive old price (if exists)
   - Create new price (using product_id from above!)
   - Store stripe_price_id
4. Set all section_updated flags to false

Usage:
    python3 sync_catalog.py --jobs-dir "assets/jobs"

Returns (stdout):
    {"jobs_processed": 5, "products_created": 2, "prices_created": 3, "products_modified": 1}

Exit codes:
    0 = Success
    1 = Validation error
    2 = File/Stripe error
"""

import sys
import json
import argparse
import subprocess
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.json_io import list_all_jobs, save_job


def call_script(script_path: str, **kwargs) -> dict:
    """Call another script and return its JSON output."""
    script_dir = Path(__file__).parent.parent
    full_path = script_dir / script_path

    cmd = ['python3', str(full_path)]

    for key, value in kwargs.items():
        cmd.append(f"--{key.replace('_', '-')}")
        if value is not None:
            cmd.append(str(value))

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise subprocess.CalledProcessError(
            result.returncode, cmd, result.stdout, result.stderr
        )

    return json.loads(result.stdout) if result.stdout else {}


def sync_job(job_data: dict) -> dict:
    """
    Sync a single job to Stripe catalog.

    Args:
        job_data: Job JSON dictionary

    Returns:
        Dictionary with sync stats

    Raises:
        subprocess.CalledProcessError: If Stripe API calls fail
    """
    job_id = job_data.get('job_id')
    stats = {
        'products_created': 0,
        'products_modified': 0,
        'prices_created': 0,
        'prices_archived': 0
    }

    # === STEP 1: PRODUCT (if section_updated=true) ===
    product = job_data.get('product', {})
    product_id = product.get('metadata', {}).get('stripe_product_id')

    if product.get('section_updated'):
        if product_id:
            # Product exists → Modify it
            result = call_script(
                'stripe/product/modify_product.py',
                product_id=product_id,
                description=product.get('description'),
                metadata=json.dumps(product.get('metadata', {}))
            )
            stats['products_modified'] += 1
        else:
            # Product doesn't exist → Create it
            metadata = product.get('metadata', {})
            metadata['job_id'] = job_id  # Ensure job_id is in metadata

            result = call_script(
                'stripe/product/create_product.py',
                name=product.get('name', f"Job {job_id}"),
                description=product.get('description'),
                metadata=json.dumps(metadata)
            )

            # CRITICAL: Store the returned stripe_product_id
            product_id = result.get('product_id')
            if 'metadata' not in product:
                product['metadata'] = {}
            product['metadata']['stripe_product_id'] = product_id

            stats['products_created'] += 1

        # Reset flag
        product['section_updated'] = False
        job_data['product'] = product

    # === STEP 2: PRICES (after product has ID!) ===
    prices = job_data.get('prices', [])

    for i, price in enumerate(prices):
        if price.get('section_updated'):
            price_id = price.get('metadata', {}).get('stripe_price_id')

            if price_id:
                # Price exists → Archive old, create new
                try:
                    call_script('stripe/price/archive_price.py', price_id=price_id)
                    price['active'] = False  # Update JSON
                    stats['prices_archived'] += 1
                except subprocess.CalledProcessError as e:
                    print(f"Warning: Failed to archive price {price_id}: {e.stderr}", file=sys.stderr)

            # Create new price (whether or not old one existed)
            metadata = price.get('metadata', {})
            metadata['job_id'] = job_id
            metadata['payment_number'] = str(price.get('payment_number'))

            result = call_script(
                'stripe/price/create_price.py',
                product=product_id,  # Use product_id from above!
                unit_amount=price.get('unit_amount'),
                currency=price.get('currency', 'usd'),
                nickname=price.get('nickname'),
                metadata=json.dumps(metadata)
            )

            # Store the returned stripe_price_id
            new_price_id = result.get('price_id')
            if 'metadata' not in price:
                price['metadata'] = {}
            price['metadata']['stripe_price_id'] = new_price_id
            price['active'] = True  # New price is active

            stats['prices_created'] += 1

            # Reset flag
            price['section_updated'] = False
            prices[i] = price

    job_data['prices'] = prices

    return stats


def sync_catalog(jobs_dir: str = "assets/jobs") -> dict:
    """
    Sync all job files to Stripe catalog.

    Args:
        jobs_dir: Directory containing job JSON files

    Returns:
        Dictionary with overall sync stats

    Raises:
        IOError: If file operations fail
    """
    all_jobs = list_all_jobs(jobs_dir)

    overall_stats = {
        'jobs_processed': 0,
        'products_created': 0,
        'products_modified': 0,
        'prices_created': 0,
        'prices_archived': 0
    }

    for job_data in all_jobs:
        job_id = job_data.get('job_id')
        if not job_id:
            continue

        # Check if this job needs sync
        product_needs_sync = job_data.get('product', {}).get('section_updated', False)
        prices_need_sync = any(p.get('section_updated', False) for p in job_data.get('prices', []))

        if not product_needs_sync and not prices_need_sync:
            continue  # Skip this job, nothing to sync

        # Sync this job
        try:
            stats = sync_job(job_data)

            # Accumulate stats
            for key in stats:
                overall_stats[key] += stats[key]

            overall_stats['jobs_processed'] += 1

            # Save updated job
            if not save_job(job_id, job_data):
                print(f"Warning: Failed to save job {job_id}", file=sys.stderr)

        except subprocess.CalledProcessError as e:
            print(f"Error syncing job {job_id}: {e.stderr}", file=sys.stderr)
            continue

    return overall_stats


def main():
    parser = argparse.ArgumentParser(description="Sync jobs to Stripe catalog")
    parser.add_argument('--jobs-dir', default='assets/jobs', help="Jobs directory")

    args = parser.parse_args()

    try:
        result = sync_catalog(jobs_dir=args.jobs_dir)

        print(json.dumps(result, indent=2))
        sys.exit(0)

    except ValueError as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

    except (IOError, OSError) as e:
        print(json.dumps({"error": f"File operation failed: {e}"}), file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
