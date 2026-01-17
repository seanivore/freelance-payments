import os
import json
import sys
import datetime

def process_exit_events():
    """
    Processes a batch of user events passed via environment variables (from GitHub Action payload).
    Updates the corresponding Job JSON file with proper timestamps, contract signatures, and price deactivation.
    """
    
    # 1. Get Inputs from Environment
    job_id = os.environ.get('JOB_ID')
    payload_str = os.environ.get('PAYLOAD_JSON')

    if not job_id:
        print("Error: JOB_ID not provided.")
        sys.exit(1)
    
    if not payload_str:
        print("Error: PAYLOAD_JSON not provided. Nothing to update.")
        sys.exit(0)

    try:
        events_batch = json.loads(payload_str)
    except json.JSONDecodeError as e:
        print(f"Error decoding payload JSON: {e}")
        sys.exit(1)

    # 2. Locate Job File
    job_file_path = f"assets/jobs/{job_id}.json"
    if not os.path.exists(job_file_path):
        print(f"Error: Job file {job_file_path} not found.")
        sys.exit(1)

    print(f"Processing {len(events_batch)} events for {job_id}...")

    # 3. Read & Parse Job JSON (with retry logic for race conditions)
    max_retries = 3
    retry_delay = 1  # seconds
    job_data = None
    
    for attempt in range(max_retries):
        try:
            with open(job_file_path, 'r') as f:
                content = f.read()
                # Validate JSON before parsing
                if not content.strip():
                    raise ValueError("File is empty")
                job_data = json.loads(content)
                break  # Success, exit retry loop
        except (json.JSONDecodeError, ValueError, IOError) as e:
            if attempt < max_retries - 1:
                print(f"Warning: Error reading job file (attempt {attempt + 1}/{max_retries}): {e}")
                print(f"Retrying in {retry_delay} second(s)...")
                import time
                time.sleep(retry_delay)
            else:
                print(f"Error reading job file after {max_retries} attempts: {e}")
                sys.exit(1)
    
    if job_data is None:
        print("Error: Failed to read job file after all retries")
        sys.exit(1)

    # 4. Ensure state structure exists
    if 'state' not in job_data:
        job_data['state'] = {}
    if 'client_status' not in job_data['state']:
        job_data['state']['client_status'] = {}
    
    state = job_data['state']
    client_status = state['client_status']
    updates_made = False

    # 5. Process each event in order
    for event in events_batch:
        e_type = event.get('type')
        e_data = event.get('data', {})
        e_time = event.get('timestamp') or datetime.datetime.utcnow().isoformat() + 'Z'

        if not e_type:
            continue

        # Map event types to JSON updates
        if e_type == 'logged_in':
            if not client_status.get('logged_in'):
                client_status['logged_in'] = e_time
                updates_made = True
                print(f"  ✓ Updated logged_in: {e_time}")
                
        elif e_type == 'contract_signed':
            if not client_status.get('contract_signed'):
                client_status['contract_signed'] = e_time
                updates_made = True
                print(f"  ✓ Updated contract_signed: {e_time}")
            
            # Update contract signatures with legal_name and signed_date
            if 'contract' in job_data:
                if 'signatures' not in job_data['contract']:
                    job_data['contract']['signatures'] = {}
                if 'client' not in job_data['contract']['signatures']:
                    job_data['contract']['signatures']['client'] = {}
                
                if 'legal_name' in e_data:
                    job_data['contract']['signatures']['client']['legal_name'] = e_data['legal_name']
                    updates_made = True
                    print(f"  ✓ Updated contract signature legal_name: {e_data['legal_name']}")
                
                if 'signed_date' in e_data:
                    job_data['contract']['signatures']['client']['signed_date'] = e_data['signed_date']
                    updates_made = True
                    print(f"  ✓ Updated contract signature signed_date: {e_data['signed_date']}")

        elif e_type == 'invoice':
            if not client_status.get('invoice'):
                client_status['invoice'] = e_time
                updates_made = True
                print(f"  ✓ Updated invoice: {e_time}")

        elif e_type == 'payment_1':
            # Deduplication: Skip if already processed
            if client_status.get('payment_1'):
                print(f"  ⏭️  Skipping payment_1 - already processed at {client_status.get('payment_1')}")
                continue
                
            client_status['payment_1'] = e_time
            updates_made = True
            print(f"  ✓ Updated payment_1: {e_time}")
            
            # Deactivate price1 (flag exists at base level)
            if 'price1' in job_data:
                if job_data['price1'].get('active', True):
                    job_data['price1']['active'] = False
                    updates_made = True
                    print(f"  ✓ Deactivated price1")
                
        elif e_type == 'balance':
            if not client_status.get('balance'):
                client_status['balance'] = e_time
                updates_made = True
                print(f"  ✓ Updated balance: {e_time}")

        elif e_type == 'payment_2':
            # Deduplication: Skip if already processed
            if client_status.get('payment_2'):
                print(f"  ⏭️  Skipping payment_2 - already processed at {client_status.get('payment_2')}")
                continue
                
            client_status['payment_2'] = e_time
            updates_made = True
            print(f"  ✓ Updated payment_2: {e_time}")
            
            # Deactivate price2 and product (flags exist at base level)
            if 'price2' in job_data:
                if job_data['price2'].get('active', True):
                    job_data['price2']['active'] = False
                    updates_made = True
                    print(f"  ✓ Deactivated price2")
            
            if 'product' in job_data:
                if job_data['product'].get('active', True):
                    job_data['product']['active'] = False
                    updates_made = True
                    print(f"  ✓ Deactivated product")

    # 6. Write changes if any (atomic write to prevent corruption)
    if updates_made:
        job_data['state']['client_status'] = client_status
        
        # Atomic write: write to temp file first, then rename
        import tempfile
        import shutil
        temp_file = job_file_path + '.tmp'
        try:
            with open(temp_file, 'w') as f:
                json.dump(job_data, f, indent=4)
            # Atomic rename (works on Unix/Linux/GitHub Actions)
            shutil.move(temp_file, job_file_path)
            print(f"✅ Successfully updated {job_file_path}")
        except Exception as e:
            # Clean up temp file on error
            if os.path.exists(temp_file):
                os.remove(temp_file)
            print(f"Error writing job file: {e}")
            sys.exit(1)
    else:
        print("ℹ️  No state changes required.")


if __name__ == "__main__":
    process_exit_events()
