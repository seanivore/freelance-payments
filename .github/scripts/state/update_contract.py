#!/usr/bin/env python3
"""
Update contract signing status in job JSON file.

Called by Vercel when user signs contract via frontend.

Updated for new schema: Uses contract.signatures structure, _metadata.job_id

Usage:
    python3 update_contract.py --job-id "uid-001" --signature-data '{"signatures":{"contractor":{"legal_name":"Sean","signed_date":"2025-12-20"},"client":{"legal_name":"John Doe","signed_date":"2025-12-20"}}}'

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
        job_id: Job identifier (from _metadata.job_id)
        signature_data: Dictionary containing signature fields (new schema):
            - signed: bool
            - signatures: {
                contractor: { legal_name: str, signed_date: str },
                client: { legal_name: str, signed_date: str }
              }

    Returns:
        Dictionary with update confirmation

    Raises:
        ValueError: If job not found or data invalid
    """
    # Load job
    job_data = load_job(job_id)
    if not job_data:
        raise ValueError(f"Job not found: {job_id}")

    # Update contract signing fields (new schema)
    contract = job_data.get('contract', {})

    # Set signed flag
    contract['signed'] = signature_data.get('signed', True)

    # Update signatures structure (new schema)
    if 'signatures' not in contract:
        contract['signatures'] = {
            'contractor': {'legal_name': None, 'signed_date': None},
            'client': {'legal_name': None, 'signed_date': None}
        }

    # Update contractor signature
    if 'signatures' in signature_data and 'contractor' in signature_data['signatures']:
        contractor_sig = signature_data['signatures']['contractor']
        contract['signatures']['contractor']['legal_name'] = contractor_sig.get('legal_name')
        contract['signatures']['contractor']['signed_date'] = contractor_sig.get('signed_date')

    # Update client signature
    if 'signatures' in signature_data and 'client' in signature_data['signatures']:
        client_sig = signature_data['signatures']['client']
        contract['signatures']['client']['legal_name'] = client_sig.get('legal_name')
        contract['signatures']['client']['signed_date'] = client_sig.get('signed_date')

    job_data['contract'] = contract

    # Save updated job
    if not save_job(job_id, job_data):
        raise IOError(f"Failed to save job: {job_id}")

    # Get signed date for return value
    signed_date = (
        contract['signatures']['client'].get('signed_date') or
        contract['signatures']['contractor'].get('signed_date') or
        datetime.now().isoformat()[:10]
    )

    return {
        'job_id': job_id,
        'updated': True,
        'signed': contract['signed'],
        'signed_date': signed_date
    }


def main():
    parser = argparse.ArgumentParser(description="Update contract signing status")
    parser.add_argument('--job-id', required=True, help="Job ID (from _metadata.job_id)")
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

    # Validate signature data has required fields (new schema)
    if 'signatures' not in signature_data:
        print(json.dumps({"error": "Signature data must include 'signatures' object"}), file=sys.stderr)
        sys.exit(1)

    if 'client' not in signature_data['signatures'] and 'contractor' not in signature_data['signatures']:
        print(json.dumps({"error": "Signatures must include at least 'client' or 'contractor'"}), file=sys.stderr)
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
