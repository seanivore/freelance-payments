#!/usr/bin/env python3
"""
Main coordinator for syncing JSON files to Stripe catalog.

CRITICAL: Creates Product FIRST, then Prices!

Process (simplified 5-step logic):
For product.sync = true:
  1. Check if stripe_product_id exists
  2. No match? → CREATE NEW PRODUCT
  3. Match found? → MODIFY PRODUCT (overwrite all fields)
  4. Store stripe_product_id in JSON
  5. Set product.sync = false

For price[].sync = true:
  1. Check if stripe_price_id exists
  2. No match? → CREATE NEW PRICE
  3. Match found? → ARCHIVE OLD PRICE, CREATE NEW PRICE
  4. Store stripe_price_id in JSON
  5. Set price[].sync = false

Updated for new schema: Uses sync flags, price[] array, _metadata.job_id

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
        # Include both stdout and stderr in error message for debugging
        error_msg = f"Command failed with exit code {result.returncode}\n"
        if result.stdout:
            error_msg += f"STDOUT: {result.stdout}\n"
        if result.stderr:
            error_msg += f"STDERR: {result.stderr}\n"
        print(f"DEBUG: call_script error: {error_msg}", file=sys.stderr)
        raise subprocess.CalledProcessError(
            result.returncode, cmd, result.stdout, result.stderr
        )

    return json.loads(result.stdout) if result.stdout else {}


def sync_job(job_data: dict) -> dict:
    """
    Sync a single job to Stripe catalog.

    Args:
        job_data: Job JSON dictionary (new schema)

    Returns:
        Dictionary with sync stats

    Raises:
        subprocess.CalledProcessError: If Stripe API calls fail
    """
    # Get job_id from _metadata (new schema)
    job_id = job_data.get('_metadata', {}).get('job_id')
    if not job_id:
        raise ValueError("Job missing _metadata.job_id")

    stats = {
        'products_created': 0,
        'products_modified': 0,
        'prices_created': 0,
        'prices_archived': 0
    }

    # === STEP 1: PRODUCT (if sync=true) ===
    product = job_data.get('product', {})
    product_id = product.get('stripe_product_id')  # New schema: direct field, not nested

    if product.get('sync'):  # New schema: sync not section_updated
        if product_id:
            # Product exists → Modify it (overwrite all fields)
            metadata = {
                'job_id': job_id,
                'client_last_name': job_data.get('_metadata', {}).get('client_last_name', ''),
                'project_keyword': job_data.get('_metadata', {}).get('project_keyword', '')
            }

            result = call_script(
                'stripe/product/modify_product.py',
                product_id=product_id,
                name=product.get('name'),
                description=product.get('description'),
                metadata=json.dumps(metadata)
            )
            stats['products_modified'] += 1
        else:
            # Product doesn't exist → Create it
            metadata = {
                'job_id': job_id,
                'client_last_name': job_data.get('_metadata', {}).get('client_last_name', ''),
                'project_keyword': job_data.get('_metadata', {}).get('project_keyword', '')
            }

            print(f"DEBUG: Calling create_product.py for job {job_id}", file=sys.stderr)
            result = call_script(
                'stripe/product/create_product.py',
                name=product.get('name', f"Job {job_id}"),
                description=product.get('description'),
                metadata=json.dumps(metadata)
            )
            print(f"DEBUG: create_product.py returned: {result}", file=sys.stderr)

            # CRITICAL: Store the returned stripe_product_id (new schema: direct field)
            product_id = result.get('product_id')
            if not product_id:
                raise ValueError(f"create_product.py did not return product_id. Result: {result}")
            product['stripe_product_id'] = product_id
            print(f"DEBUG: Stored product_id: {product_id}", file=sys.stderr)

            stats['products_created'] += 1

        # Reset flag (new schema: sync not section_updated)
        product['sync'] = False
        job_data['product'] = product

    # === STEP 2: PRICES (after product has ID!) ===
    prices = job_data.get('price', [])  # New schema: price[] not prices[]

    for i, price in enumerate(prices):
        if price.get('sync'):  # New schema: sync not section_updated
            price_id = price.get('stripe_price_id')  # New schema: direct field, not nested

            if price_id:
                # Price exists → Archive old, create new
                try:
                    call_script('stripe/price/archive_price.py', price_id=price_id)
                    price['active'] = False  # Update JSON
                    stats['prices_archived'] += 1
                except subprocess.CalledProcessError as e:
                    print(f"Warning: Failed to archive price {price_id}: {e.stderr}", file=sys.stderr)

            # Create new price (whether or not old one existed)
            metadata = {
                'job_id': job_id,
                'payment_number': str(price.get('payment_number'))
            }

            print(f"DEBUG: Calling create_price.py for payment {price.get('payment_number')}", file=sys.stderr)
            result = call_script(
                'stripe/price/create_price.py',
                product=product_id,  # Use product_id from above!
                unit_amount=price.get('unit_amount'),
                currency=price.get('currency', 'usd'),
                nickname=price.get('nickname'),
                metadata=json.dumps(metadata)
            )
            print(f"DEBUG: create_price.py returned: {result}", file=sys.stderr)

            # Store the returned stripe_price_id (new schema: direct field)
            new_price_id = result.get('price_id')
            if not new_price_id:
                raise ValueError(f"create_price.py did not return price_id. Result: {result}")
            price['stripe_price_id'] = new_price_id
            print(f"DEBUG: Stored price_id: {new_price_id}", file=sys.stderr)
            price['active'] = True  # New price is active

            stats['prices_created'] += 1

            # Reset flag (new schema: sync not section_updated)
            price['sync'] = False
            prices[i] = price

    job_data['price'] = prices  # New schema: price[] not prices[]

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
    
    # Debug: Log how many jobs were found
    print(f"DEBUG: Found {len(all_jobs)} job(s) in {jobs_dir}", file=sys.stderr)

    overall_stats = {
        'jobs_processed': 0,
        'products_created': 0,
        'products_modified': 0,
        'prices_created': 0,
        'prices_archived': 0
    }

    for job_data in all_jobs:
        # Get job_id from _metadata (new schema)
        job_id = job_data.get('_metadata', {}).get('job_id')
        if not job_id:
            print(f"Warning: Skipping job missing _metadata.job_id", file=sys.stderr)
            continue

        # Check if this job needs sync (new schema: sync not section_updated)
        product_needs_sync = job_data.get('product', {}).get('sync', False)
        prices_need_sync = any(p.get('sync', False) for p in job_data.get('price', []))  # New schema: price[] not prices[]
        
        # Debug: Log sync status for each job
        print(f"DEBUG: Job {job_id} - product.sync={product_needs_sync}, prices_need_sync={prices_need_sync}", file=sys.stderr)

        if not product_needs_sync and not prices_need_sync:
            print(f"DEBUG: Skipping job {job_id} - no sync flags set", file=sys.stderr)
            continue  # Skip this job, nothing to sync

        # Sync this job
        try:
            print(f"DEBUG: Starting sync for job {job_id}", file=sys.stderr)
            stats = sync_job(job_data)
            print(f"DEBUG: Sync completed for job {job_id}. Stats: products_created={stats.get('products_created')}, prices_created={stats.get('prices_created')}, products_modified={stats.get('products_modified')}, prices_archived={stats.get('prices_archived')}", file=sys.stderr)

            # Accumulate stats
            for key in stats:
                overall_stats[key] += stats[key]

            overall_stats['jobs_processed'] += 1

            # Save updated job (uses _metadata.job_id)
            # CRITICAL: Pass jobs_dir to save_job so it saves to the correct location
            if not save_job(job_id, job_data, jobs_dir=jobs_dir):
                print(f"Warning: Failed to save job {job_id}", file=sys.stderr)
            else:
                print(f"DEBUG: Successfully saved job {job_id}", file=sys.stderr)

        except (subprocess.CalledProcessError, ValueError) as e:
            print(f"Error syncing job {job_id}: {e}", file=sys.stderr)
            import traceback
            print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
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
