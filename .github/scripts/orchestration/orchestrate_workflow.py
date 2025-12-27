#!/usr/bin/env python3
"""
Umbrella Orchestrator for Workflow Coordination (v3 schema)

Single coordinator that runs all needed workflows, commits everything, then pushes ONCE.
Implements batching to prevent simultaneous file updates.

v3 Schema Changes:
- No sync flags - compares filenames to manifest to determine what needs syncing
- Uses consolidated scripts: sync_catalog.py, update_state.py
- Batches all JSON updates together before committing

Process:
1. Determine trigger type (push, workflow_dispatch, webhook)
2. Collect all updates needed (batch them)
3. Run scripts in correct order:
   - sync_catalog.py (compares files to manifest, creates/archives Stripe objects)
   - update_state.py (contract signing, payment status, tracking events)
   - generate_manifest.py (always at end)
4. Apply all JSON updates in batch
5. Commit all changes together
6. Push ONCE at the end

Usage:
    python3 orchestrate_workflow.py --trigger push
    python3 orchestrate_workflow.py --trigger workflow_dispatch --action sign-contract --job-id "uid-001" --payload '{"signatures":{...}}'
    python3 orchestrate_workflow.py --trigger workflow_dispatch --action track-event --job-id "uid-001" --payload '{"event_type":"contract_loaded"}'

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
                     Examples: 'state/update_state.py', 'generate_manifest.py'
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
            parsed = json.loads(result.stdout)
            # Include stderr in output if present (for debugging)
            if result.stderr:
                parsed['_stderr'] = result.stderr
            return parsed
        except json.JSONDecodeError:
            # Script doesn't output JSON (e.g., generate_manifest.py just prints messages)
            # Return success indicator with stderr if present
            output = {"success": True, "output": result.stdout}
            if result.stderr:
                output['_stderr'] = result.stderr
            return output
    
    # No stdout, but check for stderr
    if result.stderr:
        return {"success": False, "_stderr": result.stderr}
    
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
    Orchestrate workflow execution (v3 schema with batching).

    Args:
        trigger: Trigger type ('push', 'workflow_dispatch', 'webhook')
        action: Action type ('sign-contract', 'update-payment', 'track-event', None for auto-detect)
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

    # Collect all JSON updates in batch (prevents simultaneous file conflicts)
    batched_updates = []

    try:
        # Parse payload if provided
        payload_data = {}
        if payload:
            try:
                payload_data = json.loads(payload)
            except json.JSONDecodeError as e:
                results['errors'].append(f"Invalid payload JSON: {e}")
                return results

        # Step 1: Sync catalog (v3 schema: compares filenames to manifest, no sync flags)
        if trigger == 'push':
            try:
                sync_result = run_script(
                    'orchestration/sync_catalog.py',
                    jobs_dir='assets/jobs',
                    manifest_path='assets/js/manifest.json'
                )
                results['steps_run'].append('sync_catalog')
                
                # Log sync stats for debugging
                if sync_result.get('_stderr'):
                    stderr_msg = sync_result.get('_stderr', '')[:500]
                    results['errors'].append(f"sync_catalog stderr: {stderr_msg}")
                
                if sync_result.get('jobs_processed', 0) == 0:
                    results['errors'].append(f"sync_catalog processed 0 jobs. Stats: {sync_result}")
                elif sync_result.get('products_created', 0) == 0 and sync_result.get('prices_created', 0) == 0:
                    # This is OK if no new files were added
                    pass
                    
            except subprocess.CalledProcessError as e:
                error_msg = e.stderr[:500] if e.stderr else str(e)
                results['errors'].append(f"sync_catalog failed: {error_msg}")

        # Step 2: Handle state updates (contract signing, payment status, tracking events)
        if action and job_id:
            try:
                # Use consolidated update_state.py
                # Extract action-specific data from payload
                if action == 'sign-contract':
                    update_data = payload_data.get('signature_data') or {'signatures': payload_data.get('signatures', payload_data)}
                elif action == 'update-payment':
                    update_data = {
                        'payment_number': payload_data.get('payment_number'),
                        'succeeded': payload_data.get('succeeded')
                    }
                elif action == 'track-event':
                    update_data = {
                        'event_type': payload_data.get('event_type'),
                        'event_data': payload_data.get('event_data', {}),
                        'timestamp': payload_data.get('event_data', {}).get('timestamp')
                    }
                else:
                    update_data = payload_data
                
                update_result = run_script(
                    'state/update_state.py',
                    job_id=job_id,
                    action=action,
                    data=json.dumps(update_data),
                    jobs_dir='assets/jobs'
                )
                results['steps_run'].append(f'update_state_{action}')
                
            except subprocess.CalledProcessError as e:
                error_msg = e.stderr[:500] if e.stderr else str(e)
                results['errors'].append(f"update_state ({action}) failed: {error_msg}")

        # Step 3: Generate manifest (always at end)
        try:
            manifest_result = run_script('generate_manifest.py')
            results['steps_run'].append('generate_manifest')
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr[:500] if e.stderr else str(e)
            results['errors'].append(f"generate_manifest failed: {error_msg}")

        # Step 4: Commit and push ONCE (batched)
        commit_message = "🤖 Auto-update: "
        if action == 'sign-contract':
            commit_message += f"Contract signed for {job_id}"
        elif action == 'update-payment':
            commit_message += f"Payment #{payload_data.get('payment_number', '?')} for {job_id}"
        elif action == 'track-event':
            commit_message += f"Tracking event ({payload_data.get('event_type', '?')}) for {job_id}"
        else:
            commit_message += "Stripe catalog sync and manifest update"

        commit_message += "\n\nCo-Authored-By: GitHub Actions <action@github.com>"

        if git_commit_and_push(commit_message):
            results['committed'] = True
            results['pushed'] = True

    except Exception as e:
        results['errors'].append(f"Orchestration error: {str(e)}")
        import traceback
        print(traceback.format_exc(), file=sys.stderr)

    return results


def main():
    parser = argparse.ArgumentParser(description="Orchestrate workflow execution")
    parser.add_argument('--trigger', required=True, choices=['push', 'workflow_dispatch', 'webhook'],
                       help="Trigger type")
    parser.add_argument('--action', choices=['sign-contract', 'update-payment', 'track-event'],
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
