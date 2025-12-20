#!/usr/bin/env python3
"""
Find and delete orphaned Stripe products (no matching JSON file).

Orphaned products occur when job JSON files are deleted but Stripe products remain.

CRITICAL: Deletes ALL prices first, then the product!

Usage:
    python3 cleanup_orphans.py --jobs-dir "assets/jobs"

Returns (stdout):
    {"orphaned_products": 2, "prices_deleted": 4, "products_deleted": 2}

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
from utils.json_io import list_all_jobs


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


def cleanup_orphans(jobs_dir: str = "assets/jobs") -> dict:
    """
    Delete orphaned Stripe products.

    Args:
        jobs_dir: Directory containing job JSON files

    Returns:
        Dictionary with cleanup stats

    Raises:
        subprocess.CalledProcessError: If Stripe API calls fail
    """
    # Get all current job_ids from JSON files
    all_jobs = list_all_jobs(jobs_dir)
    current_job_ids = set(job.get('job_id') for job in all_jobs if job.get('job_id'))

    stats = {
        'orphaned_products': 0,
        'prices_deleted': 0,
        'products_deleted': 0
    }

    # List all Stripe products
    try:
        result = call_script('stripe/product/list_products.py', limit=100)
        stripe_products = result.get('products', [])
    except subprocess.CalledProcessError as e:
        print(f"Error listing Stripe products: {e.stderr}", file=sys.stderr)
        return stats

    # Find orphaned products
    for product in stripe_products:
        product_id = product.get('product_id')
        metadata = product.get('metadata', {})
        job_id = metadata.get('job_id')

        # Skip if no job_id in metadata
        if not job_id:
            continue

        # Check if this job_id still exists in our JSON files
        if job_id in current_job_ids:
            continue  # Not orphaned, skip

        # This is an orphaned product - delete it!
        stats['orphaned_products'] += 1

        try:
            # STEP 1: Delete all prices for this product
            prices_result = call_script('stripe/price/list_prices.py', product=product_id, limit=100)
            prices = prices_result.get('prices', [])

            for price in prices:
                price_id = price.get('price_id')
                try:
                    call_script('stripe/price/delete_price.py', price_id=price_id)
                    stats['prices_deleted'] += 1
                except subprocess.CalledProcessError as e:
                    # If delete fails, try archive instead
                    try:
                        call_script('stripe/price/archive_price.py', price_id=price_id)
                        print(f"Archived price {price_id} instead of deleting", file=sys.stderr)
                    except:
                        print(f"Warning: Could not delete or archive price {price_id}", file=sys.stderr)

            # STEP 2: Delete the product (after all prices deleted)
            try:
                call_script('stripe/product/delete_product.py', product_id=product_id)
                stats['products_deleted'] += 1
            except subprocess.CalledProcessError as e:
                # If delete fails, try archive instead
                try:
                    call_script('stripe/product/archive_product.py', product_id=product_id)
                    print(f"Archived product {product_id} instead of deleting", file=sys.stderr)
                except:
                    print(f"Warning: Could not delete or archive product {product_id}", file=sys.stderr)

        except subprocess.CalledProcessError as e:
            print(f"Error cleaning up product {product_id}: {e.stderr}", file=sys.stderr)
            continue

    return stats


def main():
    parser = argparse.ArgumentParser(description="Cleanup orphaned Stripe products")
    parser.add_argument('--jobs-dir', default='assets/jobs', help="Jobs directory")

    args = parser.parse_args()

    try:
        result = cleanup_orphans(jobs_dir=args.jobs_dir)

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
