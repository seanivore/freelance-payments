#!/usr/bin/env python3
"""
Update contract signing status in job JSON file.

Called by Vercel when user signs contract via frontend.

Usage:
    python3 update_contract.py --job-id "uid-001" --signature-data '{"client_signature":"John Doe","client_date":"2025-12-20"}'

Returns (stdout):
    {"job_id": "uid-001", "updated": true, "signed": true}

Exit codes:
    0 = Success
    1 = Validation error (job not found, invalid data)
    2 = File I/O error
"""

import sys
import json
import argparse
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.json_io import load_job, save_job


def update_contract(job_id: str, signature_data: dict) -> dict:
    """
    Update contract signing information in job JSON.

    Args:
        job_id: Job identifier
        signature_data: Dictionary containing signature fields:
            - client_signature: str
            - client_date: str (ISO date)
            - contractor_signature: str (optional)
            - contractor_date: str (ISO date, optional)
            - signed_by: str (optional)

    Returns:
        Dictionary with update confirmation

    Raises:
        ValueError: If job not found or data invalid
    """
    # Load job
    job_data = load_job(job_id)
    if not job_data:
        raise ValueError(f"Job not found: {job_id}")

    # Update contract signing fields
    contract = job_data.get('contract', {})

    contract['signed'] = True
    contract['signed_date'] = signature_data.get('client_date') or signature_data.get('contractor_date') or datetime.now().isoformat()[:10]
    contract['signed_by'] = signature_data.get('signed_by', '')

    # Update signatures
    if 'signatures' not in contract:
        contract['signatures'] = {
            'contractor': {'name': None, 'date': None},
            'client': {'name': None, 'date': None}
        }

    # Client signature
    if 'client_signature' in signature_data:
        contract['signatures']['client']['name'] = signature_data['client_signature']
        contract['signatures']['client']['date'] = signature_data.get('client_date')

    # Contractor signature
    if 'contractor_signature' in signature_data:
        contract['signatures']['contractor']['name'] = signature_data['contractor_signature']
        contract['signatures']['contractor']['date'] = signature_data.get('contractor_date')

    # Legacy fields (for compatibility)
    contract['contractor_signature'] = signature_data.get('contractor_signature')
    contract['contractor_date'] = signature_data.get('contractor_date')
    contract['client_date'] = signature_data.get('client_date')

    job_data['contract'] = contract

    # Save updated job
    if not save_job(job_id, job_data):
        raise IOError(f"Failed to save job: {job_id}")

    return {
        'job_id': job_id,
        'updated': True,
        'signed': contract['signed'],
        'signed_date': contract['signed_date']
    }


def main():
    parser = argparse.ArgumentParser(description="Update contract signing status")
    parser.add_argument('--job-id', required=True, help="Job ID")
    parser.add_argument('--signature-data', required=True, help="JSON string of signature data")

    args = parser.parse_args()

    # Parse signature data
    try:
        signature_data = json.loads(args.signature_data)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON in signature-data: {e}"}), file=sys.stderr)
        sys.exit(1)

    # Validate inputs
    if not args.job_id or len(args.job_id.strip()) == 0:
        print(json.dumps({"error": "Job ID cannot be empty"}), file=sys.stderr)
        sys.exit(1)

    # Validate signature data has required fields
    if 'client_signature' not in signature_data and 'contractor_signature' not in signature_data:
        print(json.dumps({"error": "Signature data must include client_signature or contractor_signature"}), file=sys.stderr)
        sys.exit(1)

    try:
        result = update_contract(job_id=args.job_id, signature_data=signature_data)

        print(json.dumps(result, indent=2))
        sys.exit(0)

    except ValueError as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

    except (IOError, OSError) as e:
        print(json.dumps({"error": f"File I/O error: {e}"}), file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
