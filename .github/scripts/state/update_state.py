#!/usr/bin/env python3
"""
Consolidated State Update Script (v4 schema)
Handles contract signing, payment status, and tracking event updates.

Actions:
1. Contract signing → Update contract.signatures
2. Payment status → Update state.payment_1/payment_2
3. Tracking events → Update state.client_status

v4 Schema:
- contract.signatures.client.signed_date
- state.payment_1.succeeded
- state.payment_2.succeeded (not balance_payment_intent)
- state.client_status (contract_loaded, contract_scrolled_complete, invoice_viewed, downloaded_docs, signed_contract)

Usage:
    # Contract signing
    python3 update_state.py --action sign-contract --job-id "uid-001" --data '{"signatures":{"client":{"legal_name":"John","signed_date":"2026-01-05"}}}'
    
    # Payment status
    python3 update_state.py --action update-payment --job-id "uid-001" --data '{"payment_number":1,"succeeded":"2026-01-06T10:00:00Z"}'
    
    # Tracking event
    python3 update_state.py --action track-event --job-id "uid-001" --data '{"event_type":"contract_loaded","timestamp":"2026-01-03T14:30:00Z"}'

Returns (stdout):
    {"job_id": "uid-001", "action": "sign-contract", "updated": true}

Exit codes:
    0 = Success
    1 = Validation error
    2 = File I/O error
"""

import sys
import json
import argparse
from pathlib import Path
from datetime import datetime, UTC

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.json_io import load_job, save_job


def update_contract_signing(job_data: dict, signature_data: dict) -> dict:
    """
    Update contract signing status (v4 schema).
    
    Args:
        job_data: Job JSON dictionary
        signature_data: Dictionary with signatures object
    
    Returns:
        Update confirmation
    """
    contract = job_data.get('contract', {})
    
    # Initialize signatures structure if missing
    if 'signatures' not in contract:
        contract['signatures'] = {
            'contractor': {'legal_name': None, 'signed_date': None},
            'client': {'legal_name': None, 'signed_date': None}
        }
    
    # Update signatures
    if 'signatures' in signature_data:
        sigs = signature_data['signatures']
        
        if 'contractor' in sigs:
            contractor_sig = sigs['contractor']
            contract['signatures']['contractor']['legal_name'] = contractor_sig.get('legal_name')
            contract['signatures']['contractor']['signed_date'] = contractor_sig.get('signed_date')
        
        if 'client' in sigs:
            client_sig = sigs['client']
            contract['signatures']['client']['legal_name'] = client_sig.get('legal_name')
            contract['signatures']['client']['signed_date'] = client_sig.get('signed_date')
    
    job_data['contract'] = contract
    
    # Update client_status.signed_contract timestamp
    if 'state' not in job_data:
        job_data['state'] = {}
    if 'client_status' not in job_data['state']:
        job_data['state']['client_status'] = {}
    
    client_status = job_data['state']['client_status']
    signed_date = contract['signatures']['client'].get('signed_date') or datetime.now(UTC).isoformat().replace('+00:00', 'Z')
    client_status['signed_contract'] = signed_date
    
    return {
        'updated': True,
        'signed': contract['signatures']['client'].get('signed_date') is not None,
        'signed_date': signed_date
    }


def update_payment_status(job_data: dict, payment_data: dict) -> dict:
    """
    Update payment status (v4 schema).
    
    Args:
        job_data: Job JSON dictionary
        payment_data: Dictionary with payment_number and succeeded timestamp
    
    Returns:
        Update confirmation
    """
    payment_number = payment_data.get('payment_number')
    succeeded_timestamp = payment_data.get('succeeded')
    
    if not payment_number or payment_number not in [1, 2]:
        raise ValueError("payment_number must be 1 or 2")
    
    # Initialize state if missing
    if 'state' not in job_data:
        job_data['state'] = {}
    
    # Update payment intent status
    if payment_number == 1:
        if 'payment_1' not in job_data['state']:
            job_data['state']['payment_1'] = {}
        
        payment_intent = job_data['state']['payment_1']
        if not payment_intent.get('intent'):
            payment_intent['intent'] = succeeded_timestamp or datetime.now(UTC).isoformat().replace('+00:00', 'Z')
        payment_intent['succeeded'] = succeeded_timestamp or datetime.now(UTC).isoformat().replace('+00:00', 'Z')
        
    elif payment_number == 2:
        if 'payment_2' not in job_data['state']:
            job_data['state']['payment_2'] = {}
        
        payment_intent = job_data['state']['payment_2']
        if not payment_intent.get('intent'):
            payment_intent['intent'] = succeeded_timestamp or datetime.now(UTC).isoformat().replace('+00:00', 'Z')
        payment_intent['succeeded'] = succeeded_timestamp or datetime.now(UTC).isoformat().replace('+00:00', 'Z')
    
    # Check if all payments are complete
    initial_paid = job_data['state'].get('payment_1', {}).get('succeeded') is not None
    balance_paid = job_data['state'].get('payment_2', {}).get('succeeded') is not None
    all_paid = initial_paid and balance_paid
    
    return {
        'updated': True,
        'payment_number': payment_number,
        'succeeded': succeeded_timestamp,
        'all_paid': all_paid
    }


def update_tracking_event(job_data: dict, event_data: dict) -> dict:
    """
    Update tracking event in client_status (v4 schema).
    
    Args:
        job_data: Job JSON dictionary
        event_data: Dictionary with event_type and timestamp/data
    
    Returns:
        Update confirmation
    """
    event_type = event_data.get('event_type')
    timestamp = event_data.get('timestamp') or event_data.get('event_data', {}).get('timestamp') or datetime.now(UTC).isoformat().replace('+00:00', 'Z')
    
    # Initialize state.client_status if missing
    if 'state' not in job_data:
        job_data['state'] = {}
    if 'client_status' not in job_data['state']:
        job_data['state']['client_status'] = {}
    
    client_status = job_data['state']['client_status']
    
    # Update based on event type
    if event_type == 'contract_loaded':
        client_status['contract_loaded'] = timestamp
    elif event_type == 'contract_scrolled_complete':
        client_status['contract_scrolled_complete'] = True
    elif event_type == 'invoice_viewed':
        client_status['viewed_invoice'] = True
        if not client_status.get('viewed_contract'):
            client_status['viewed_contract'] = True  # Implies contract was viewed
    elif event_type == 'document_downloaded':
        current_count = client_status.get('downloaded_docs', 0)
        client_status['downloaded_docs'] = current_count + 1
    elif event_type == 'contract_signed':
        # This is handled by update_contract_signing, but included for completeness
        client_status['signed_contract'] = timestamp
    
    return {
        'updated': True,
        'event_type': event_type,
        'timestamp': timestamp
    }


def update_state(job_id: str, action: str, data: dict, jobs_dir: str = "assets/jobs") -> dict:
    """
    Update job state based on action type.
    
    Args:
        job_id: Job identifier (product.id in v4 schema)
        action: Action type (sign-contract, update-payment, track-event)
        data: Action-specific data dictionary
        jobs_dir: Directory containing job JSON files
    
    Returns:
        Dictionary with update confirmation
    
    Raises:
        ValueError: If job not found or data invalid
        IOError: If file save fails
    """
    # Load job
    job_data = load_job(job_id, jobs_dir=jobs_dir)
    if not job_data:
        raise ValueError(f"Job not found: {job_id}")
    
    # Route to appropriate update function
    if action == 'sign-contract':
        result = update_contract_signing(job_data, data)
    elif action == 'update-payment':
        result = update_payment_status(job_data, data)
    elif action == 'track-event':
        result = update_tracking_event(job_data, data)
    else:
        raise ValueError(f"Unknown action: {action}")
    
    # Save updated job
    if not save_job(job_id, job_data, jobs_dir=jobs_dir):
        raise IOError(f"Failed to save job: {job_id}")
    
    return {
        'job_id': job_id,
        'action': action,
        **result
    }


def main():
    parser = argparse.ArgumentParser(title="Update job state (v4 schema)")
    parser.add_argument('--job-id', required=True, help="Job ID (product.id)")
    parser.add_argument('--action', required=True, choices=['sign-contract', 'update-payment', 'track-event'],
                       help="Action type")
    parser.add_argument('--data', required=True, help="JSON string of action-specific data")
    parser.add_argument('--jobs-dir', default='assets/jobs', help="Jobs directory")

    args = parser.parse_args()

    # Parse data
    try:
        data = json.loads(args.data)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON in data: {e}"}), file=sys.stderr)
        sys.exit(1)

    # Validate inputs
    if not args.job_id or len(args.job_id.strip()) == 0:
        print(json.dumps({"error": "Job ID cannot be empty"}), file=sys.stderr)
        sys.exit(1)

    try:
        result = update_state(
            job_id=args.job_id,
            action=args.action,
            data=data,
            jobs_dir=args.jobs_dir
        )

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
