#!/usr/bin/env python3
"""
Detect which job files need Stripe sync by comparing to git HEAD.

Sets section_updated flags on product and prices that have changed.

Usage:
    python3 detect_sync_needs.py --jobs-dir "assets/jobs"

Returns (stdout):
    {"files_scanned": 5, "sync_needed": 2, "details": [...]}

Exit codes:
    0 = Success
    1 = Validation error
    2 = Git/File error
"""

import sys
import json
import argparse
import subprocess
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.json_io import list_all_jobs, save_job


def get_git_head_version(filepath: Path) -> dict:
    """
    Get the git HEAD version of a file.

    Args:
        filepath: Path to file

    Returns:
        Dictionary with file contents from HEAD, or empty dict if not in git

    Raises:
        subprocess.CalledProcessError: If git command fails
    """
    try:
        result = subprocess.run(
            ['git', 'show', f'HEAD:{filepath}'],
            capture_output=True,
            text=True,
            check=False
        )

        if result.returncode != 0:
            # File not in git or git not available
            return {}

        return json.loads(result.stdout)
    except (json.JSONDecodeError, subprocess.CalledProcessError):
        return {}


def detect_product_changes(current: dict, previous: dict) -> bool:
    """
    Check if product fields changed.

    Args:
        current: Current product object
        previous: Previous product object from git HEAD

    Returns:
        True if changes detected, False otherwise
    """
    if not previous:
        return True  # New product

    # Check fields that trigger sync
    sync_fields = ['name', 'description']

    for field in sync_fields:
        if current.get(field) != previous.get(field):
            return True

    return False


def detect_price_changes(current: dict, previous: dict) -> bool:
    """
    Check if price fields changed.

    Args:
        current: Current price object
        previous: Previous price object from git HEAD

    Returns:
        True if changes detected, False otherwise
    """
    if not previous:
        return True  # New price

    # Check fields that trigger sync
    sync_fields = ['unit_amount', 'currency', 'nickname']

    for field in sync_fields:
        if current.get(field) != previous.get(field):
            return True

    return False


def detect_sync_needs(jobs_dir: str = "assets/jobs") -> dict:
    """
    Scan all job files and set section_updated flags where needed.

    Args:
        jobs_dir: Directory containing job JSON files

    Returns:
        Dictionary with scan results

    Raises:
        IOError: If file operations fail
    """
    jobs_path = Path(jobs_dir)
    all_jobs = list_all_jobs(jobs_dir)

    files_scanned = 0
    files_updated = 0
    details = []

    for job_data in all_jobs:
        job_id = job_data.get('job_id')
        if not job_id:
            continue

        files_scanned += 1

        # Find the file path
        job_file = jobs_path / f"{job_id}.json"
        if not job_file.exists():
            # Try to find by searching
            for f in jobs_path.glob("*.json"):
                if not f.stem.startswith('_'):
                    try:
                        with open(f, 'r') as file:
                            data = json.load(file)
                            if data.get('job_id') == job_id:
                                job_file = f
                                break
                    except:
                        continue

        # Get git HEAD version
        try:
            previous = get_git_head_version(job_file)
        except:
            previous = {}

        changes_made = False

        # Check product changes
        current_product = job_data.get('product', {})
        previous_product = previous.get('product', {})

        if detect_product_changes(current_product, previous_product):
            current_product['section_updated'] = True
            job_data['product'] = current_product
            changes_made = True
            details.append({
                'job_id': job_id,
                'type': 'product',
                'reason': 'Product fields changed'
            })

        # Check price changes
        current_prices = job_data.get('prices', [])
        previous_prices = previous.get('prices', [])

        for i, current_price in enumerate(current_prices):
            payment_num = current_price.get('payment_number')

            # Find matching previous price
            prev_price = None
            for p in previous_prices:
                if p.get('payment_number') == payment_num:
                    prev_price = p
                    break

            if detect_price_changes(current_price, prev_price):
                current_price['section_updated'] = True
                current_prices[i] = current_price
                changes_made = True
                details.append({
                    'job_id': job_id,
                    'type': 'price',
                    'payment_number': payment_num,
                    'reason': 'Price fields changed'
                })

        job_data['prices'] = current_prices

        # Save if changes were made
        if changes_made:
            from utils.json_io import save_job
            if save_job(job_id, job_data):
                files_updated += 1

    return {
        'files_scanned': files_scanned,
        'files_updated': files_updated,
        'sync_needed': len(details),
        'details': details
    }


def main():
    parser = argparse.ArgumentParser(description="Detect which jobs need Stripe sync")
    parser.add_argument('--jobs-dir', default='assets/jobs', help="Jobs directory")

    args = parser.parse_args()

    try:
        result = detect_sync_needs(jobs_dir=args.jobs_dir)

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
