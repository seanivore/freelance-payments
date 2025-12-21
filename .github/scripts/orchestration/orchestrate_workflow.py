#!/usr/bin/env python3
"""
Umbrella Orchestrator for Workflow Coordination

Single coordinator that runs all needed workflows, commits everything, then pushes ONCE.

This eliminates multiple pushes that cause cancellation issues and provides cleaner history.

Process:
1. Determine trigger type (push, workflow_dispatch, webhook)
2. Check what needs to be done:
   - Any sync=true flags? → Run sync workflow
   - Contract signing? → Run contract update
   - Payment update? → Run payment update
   - JSON files changed? → Generate manifest
3. Run all needed scripts in correct order:
   - detect_sync_needs.py (if JSON changed)
   - sync_catalog.py (if sync flags true)
   - update_contract.py (if contract signing)
   - update_payment.py (if payment update)
   - generate_manifest.py (always at end)
4. Commit all changes together
5. Push ONCE at the end

Usage:
    python3 orchestrate_workflow.py --trigger push --action sign-contract --job-id "uid-001" --payload '{"signatures":{...}}'

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
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.json_io import list_all_jobs


def run_script(script_path: str, **kwargs) -> dict:
    """
    Run a Python script and return its JSON output.

    Args:
        script_path: Relative path to script from .github/scripts/ directory
                     Examples: 'state/detect_sync_needs.py', 'generate_manifest.py'
        **kwargs: Arguments to pass to script

    Returns:
        Dictionary with script output

    Raises:
        subprocess.CalledProcessError: If script fails
    """
    # Get scripts directory (.github/scripts/)
    scripts_dir = Path(__file__).parent.parent
    # Get project root (for cwd)
    project_root = scripts_dir.parent
    
    # Build full path: scripts_dir + script_path
    full_path = scripts_dir / script_path

    cmd = ['python3', str(full_path)]

    for key, value in kwargs.items():
        cmd.append(f"--{key.replace('_', '-')}")
        if value is not None:
            cmd.append(str(value))

    result = subprocess.run(cmd, capture_output=True, text=True, cwd=project_root)

    if result.returncode != 0:
        raise subprocess.CalledProcessError(
            result.returncode, cmd, result.stdout, result.stderr
        )

    # Try to parse as JSON, but some scripts (like generate_manifest.py) don't output JSON
    if result.stdout:
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            # Script doesn't output JSON (e.g., generate_manifest.py just prints messages)
            # Return success indicator
            return {"success": True, "output": result.stdout}
    
    return {}


def git_commit_and_push(message: str, files: list = None) -> bool:
    """
    Commit and push changes to git.

    Args:
        message: Commit message
        files: List of files to commit (None = all changes)

    Returns:
        True if successful, False otherwise
    """
    try:
        # Configure git user
        subprocess.run(['git', 'config', '--local', 'user.email', 'action@github.com'], check=True)
        subprocess.run(['git', 'config', '--local', 'user.name', 'GitHub Action'], check=True)

        # Pull with rebase (auto-pull before push)
        subprocess.run(['git', 'pull', '--rebase'], check=False)  # Don't fail if no remote changes

        # Add files
        if files:
            for file in files:
                subprocess.run(['git', 'add', file], check=True)
        else:
            subprocess.run(['git', 'add', '-A'], check=True)

        # Check if there are changes
        result = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True, check=True)
        if not result.stdout.strip():
            return False  # No changes to commit

        # Commit
        subprocess.run(['git', 'commit', '-m', message], check=True)

        # Push
        subprocess.run(['git', 'push'], check=True)

        return True
    except subprocess.CalledProcessError as e:
        print(f"Git error: {e.stderr}", file=sys.stderr)
        return False


def orchestrate(trigger: str, action: str = None, job_id: str = None, payload: str = None) -> dict:
    """
    Orchestrate workflow execution.

    Args:
        trigger: Trigger type ('push', 'workflow_dispatch', 'webhook')
        action: Action type ('sign-contract', 'update-payment', None for auto-detect)
        job_id: Job ID (required for actions)
        payload: JSON payload string (for actions)

    Returns:
        Dictionary with execution results
    """
    results = {
        'trigger': trigger,
        'action': action,
        'steps_run': [],
        'errors': [],
        'committed': False,
        'pushed': False
    }

    try:
        # Parse payload if provided
        payload_data = {}
        if payload:
            try:
                payload_data = json.loads(payload)
            except json.JSONDecodeError as e:
                results['errors'].append(f"Invalid payload JSON: {e}")
                return results

        # Step 1: Detect sync needs (if push trigger)
        if trigger == 'push':
            try:
                sync_result = run_script('state/detect_sync_needs.py', jobs_dir='assets/jobs')
                results['steps_run'].append('detect_sync_needs')
                if sync_result.get('sync_needed', 0) > 0:
                    # Commit sync flags
                    git_commit_and_push(
                        "🤖 Auto-update: Set sync flags for Stripe catalog",
                        ['assets/jobs']
                    )
            except subprocess.CalledProcessError as e:
                results['errors'].append(f"detect_sync_needs failed: {e.stderr}")

        # Step 2: Sync catalog (if sync flags exist)
        if trigger == 'push':
            try:
                # Check if any jobs need sync
                all_jobs = list_all_jobs('assets/jobs')
                needs_sync = any(
                    job.get('product', {}).get('sync', False) or
                    any(p.get('sync', False) for p in job.get('price', []))
                    for job in all_jobs
                )

                if needs_sync:
                    sync_result = run_script('orchestration/sync_catalog.py', jobs_dir='assets/jobs')
                    results['steps_run'].append('sync_catalog')
            except subprocess.CalledProcessError as e:
                results['errors'].append(f"sync_catalog failed: {e.stderr}")

        # Step 3: Handle contract signing
        if action == 'sign-contract' and job_id:
            try:
                signature_data = payload_data.get('signature_data', payload_data)
                run_script(
                    'state/update_contract.py',
                    job_id=job_id,
                    signature_data=json.dumps(signature_data)
                )
                results['steps_run'].append('update_contract')
            except subprocess.CalledProcessError as e:
                results['errors'].append(f"update_contract failed: {e.stderr}")

        # Step 4: Handle payment update
        if action == 'update-payment' and job_id:
            try:
                payment_number = payload_data.get('payment_number')
                paid_date = payload_data.get('paid_date')
                run_script(
                    'state/update_payment.py',
                    job_id=job_id,
                    payment_number=payment_number,
                    paid_date=paid_date
                )
                results['steps_run'].append('update_payment')
            except subprocess.CalledProcessError as e:
                results['errors'].append(f"update_payment failed: {e.stderr}")

        # Step 5: Generate manifest (always at end)
        try:
            run_script('generate_manifest.py')
            results['steps_run'].append('generate_manifest')
        except subprocess.CalledProcessError as e:
            results['errors'].append(f"generate_manifest failed: {e.stderr}")

        # Step 6: Commit and push ONCE
        commit_message = "🤖 Auto-update: "
        if action == 'sign-contract':
            commit_message += f"Contract signed for {job_id}"
        elif action == 'update-payment':
            commit_message += f"Payment #{payload_data.get('payment_number')} for {job_id}"
        else:
            commit_message += "Manifest and Stripe catalog sync"

        commit_message += "\n\nCo-Authored-By: GitHub Actions <action@github.com>"

        if git_commit_and_push(commit_message):
            results['committed'] = True
            results['pushed'] = True

    except Exception as e:
        results['errors'].append(f"Orchestration error: {str(e)}")

    return results


def main():
    parser = argparse.ArgumentParser(description="Orchestrate workflow execution")
    parser.add_argument('--trigger', required=True, choices=['push', 'workflow_dispatch', 'webhook'],
                       help="Trigger type")
    parser.add_argument('--action', choices=['sign-contract', 'update-payment'],
                       help="Action type (for workflow_dispatch)")
    parser.add_argument('--job-id', help="Job ID (required for actions)")
    parser.add_argument('--payload', help="JSON payload string")

    args = parser.parse_args()

    # Validate
    if args.action and not args.job_id:
        print(json.dumps({"error": "job_id required when action is specified"}), file=sys.stderr)
        sys.exit(1)

    try:
        result = orchestrate(
            trigger=args.trigger,
            action=args.action,
            job_id=args.job_id,
            payload=args.payload
        )

        print(json.dumps(result, indent=2))
        sys.exit(0 if not result['errors'] else 1)

    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
