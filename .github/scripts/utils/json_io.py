"""
Shared JSON file I/O operations for job files.

Provides consistent file loading, saving, and lookup across all scripts.
Prevents code duplication and ensures consistent error handling.
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, Optional, List


def load_job(job_id: str, jobs_dir: str = "assets/jobs") -> Optional[Dict]:
    """
    Load a job JSON file by job_id.

    Args:
        job_id: The job identifier (e.g., "uid-test-001")
        jobs_dir: Directory containing job JSON files

    Returns:
        Dictionary containing job data, or None if file not found

    Example:
        job_data = load_job("uid-test-001")
        if job_data:
            print(job_data['client']['name'])
    """
    job_path = find_job_file(job_id, jobs_dir)

    if not job_path:
        print(f"Error: Job file not found for job_id: {job_id}", file=sys.stderr)
        return None

    try:
        with open(job_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {job_path}: {e}", file=sys.stderr)
        return None
    except IOError as e:
        print(f"Error: Cannot read {job_path}: {e}", file=sys.stderr)
        return None


def save_job(job_id: str, job_data: Dict, jobs_dir: str = "assets/jobs") -> bool:
    """
    Save a job JSON file.

    Args:
        job_id: The job identifier
        job_data: Dictionary containing job data
        jobs_dir: Directory containing job JSON files

    Returns:
        True if saved successfully, False otherwise

    Example:
        job_data['contract']['signed'] = True
        if save_job("uid-test-001", job_data):
            print("Saved successfully")
    """
    job_path = find_job_file(job_id, jobs_dir)

    if not job_path:
        # File doesn't exist, create it
        job_path = Path(jobs_dir) / f"{job_id}.json"

    try:
        with open(job_path, 'w', encoding='utf-8') as f:
            json.dump(job_data, f, indent=2, ensure_ascii=False)
            f.write('\n')  # Add trailing newline
        return True
    except IOError as e:
        print(f"Error: Cannot write to {job_path}: {e}", file=sys.stderr)
        return False


def find_job_file(job_id: str, jobs_dir: str = "assets/jobs") -> Optional[Path]:
    """
    Find the file path for a given job_id.

    Args:
        job_id: The job identifier
        jobs_dir: Directory containing job JSON files

    Returns:
        Path to the job file, or None if not found

    Example:
        path = find_job_file("uid-test-001")
        if path:
            print(f"Found at: {path}")
    """
    jobs_path = Path(jobs_dir)

    if not jobs_path.exists():
        return None

    # Try direct filename match first
    direct_path = jobs_path / f"{job_id}.json"
    if direct_path.exists():
        return direct_path

    # Search all JSON files in directory
    for json_file in jobs_path.glob("*.json"):
        # Skip template and edit files
        if json_file.stem.startswith('_'):
            continue

        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if data.get('job_id') == job_id:
                    return json_file
        except (json.JSONDecodeError, IOError):
            continue

    return None


def list_all_jobs(jobs_dir: str = "assets/jobs") -> List[Dict]:
    """
    Load all job files from the jobs directory.

    Args:
        jobs_dir: Directory containing job JSON files

    Returns:
        List of dictionaries, each containing job data

    Example:
        all_jobs = list_all_jobs()
        for job in all_jobs:
            print(job['job_id'])
    """
    jobs_path = Path(jobs_dir)

    if not jobs_path.exists():
        return []

    jobs = []
    for json_file in jobs_path.glob("*.json"):
        # Skip template and edit files
        if json_file.stem.startswith('_'):
            continue

        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                job_data = json.load(f)
                jobs.append(job_data)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Warning: Skipping {json_file}: {e}", file=sys.stderr)
            continue

    return jobs


def validate_job_schema(job_data: Dict) -> tuple[bool, List[str]]:
    """
    Validate that a job has required fields.

    Args:
        job_data: Dictionary containing job data

    Returns:
        Tuple of (is_valid, list_of_errors)

    Example:
        valid, errors = validate_job_schema(job_data)
        if not valid:
            for error in errors:
                print(f"Error: {error}")
    """
    errors = []

    # Check required top-level fields
    required_fields = ['job_id', 'client', 'contract', 'product', 'prices']
    for field in required_fields:
        if field not in job_data:
            errors.append(f"Missing required field: {field}")

    # Check product structure
    if 'product' in job_data:
        if 'metadata' not in job_data['product']:
            errors.append("Product missing metadata field")
        elif 'job_id' not in job_data['product']['metadata']:
            errors.append("Product metadata missing job_id")

    # Check prices structure
    if 'prices' in job_data:
        if not isinstance(job_data['prices'], list):
            errors.append("Prices must be a list")
        else:
            for i, price in enumerate(job_data['prices']):
                if 'payment_number' not in price:
                    errors.append(f"Price {i} missing payment_number")
                if 'metadata' not in price:
                    errors.append(f"Price {i} missing metadata")

    return (len(errors) == 0, errors)


if __name__ == "__main__":
    # Simple CLI for testing
    import argparse

    parser = argparse.ArgumentParser(description="Job JSON I/O utilities")
    parser.add_argument('action', choices=['load', 'list', 'validate'])
    parser.add_argument('--job-id', help="Job ID to load")
    parser.add_argument('--jobs-dir', default="assets/jobs", help="Jobs directory")

    args = parser.parse_args()

    if args.action == 'load':
        if not args.job_id:
            print("Error: --job-id required for load action", file=sys.stderr)
            sys.exit(1)

        job = load_job(args.job_id, args.jobs_dir)
        if job:
            print(json.dumps(job, indent=2))
            sys.exit(0)
        else:
            sys.exit(1)

    elif args.action == 'list':
        jobs = list_all_jobs(args.jobs_dir)
        print(json.dumps({
            "count": len(jobs),
            "jobs": [{"job_id": j.get('job_id'), "client": j.get('client', {}).get('name')} for j in jobs]
        }, indent=2))
        sys.exit(0)

    elif args.action == 'validate':
        if not args.job_id:
            print("Error: --job-id required for validate action", file=sys.stderr)
            sys.exit(1)

        job = load_job(args.job_id, args.jobs_dir)
        if not job:
            sys.exit(1)

        valid, errors = validate_job_schema(job)
        if valid:
            print(json.dumps({"valid": True}))
            sys.exit(0)
        else:
            print(json.dumps({"valid": False, "errors": errors}), file=sys.stderr)
            sys.exit(1)
