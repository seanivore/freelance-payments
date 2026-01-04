#!/usr/bin/env python3
"""
Umbrella Orchestrator for Workflow Coordination (v4 schema)

Single coordinator that runs all needed workflows, commits everything, then pushes ONCE.
Uses immediate updates (each JSON file saved after Stripe objects created) with batched git commit.

v4 Schema Changes:
- No sync flags - compares filenames to manifest to determine what needs syncing
- Uses consolidated scripts: sync_catalog.py, update_state.py, generate_pdfs.py
- Immediate updates: sync_catalog.py saves each JSON file immediately after creating Stripe objects
- PDF generation: After Stripe objects created, generate PDFs from Google Docs templates
- Batched git commit: All changes committed together at the end (prevents multiple pushes)

Process:
1. Determine trigger type (push, workflow_dispatch, webhook)
2. Run scripts in correct order:
   - sync_catalog.py (compares files to manifest, creates/archives Stripe objects, saves JSON immediately)
   - generate_pdfs.py (if new products created, generates contract/invoice PDFs from Google Docs templates)
   - update_state.py (contract signing, payment status, tracking events, saves JSON immediately)
   - generate_manifest.py (always at end, saves manifest.json)
3. Check if any changes were made (sync_catalog stats or action triggered)
4. Commit all changes together (if any)
5. Push ONCE at the end (if committed)

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

        # Pull before push (handle unstaged changes gracefully)
        # Check if there are unstaged changes from scripts that ran
        status_result = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True, check=True)
        has_unstaged = bool(status_result.stdout.strip())
        
        if has_unstaged:
            # Scripts have modified files - stash, pull with rebase, then pop
            stash_result = subprocess.run(['git', 'stash', '--include-untracked'], check=False, capture_output=True, text=True)
            if stash_result.returncode != 0 and 'No local changes' not in stash_result.stdout:
                print(f"Warning: git stash failed: {stash_result.stderr}", file=sys.stderr)
            
            pull_result = subprocess.run(['git', 'pull', '--rebase'], check=False, capture_output=True, text=True)
            if pull_result.returncode != 0:
                print(f"Warning: git pull --rebase had issues: {pull_result.stderr}", file=sys.stderr)
            
            # Try to pop stash, but handle conflicts gracefully
            stash_pop_result = subprocess.run(['git', 'stash', 'pop'], check=False, capture_output=True, text=True)
            if stash_pop_result.returncode != 0:
                # Stash pop failed (likely conflicts) - check if we have a stash entry
                if 'No stash entries' not in stash_pop_result.stderr:
                    print(f"Warning: git stash pop had conflicts or errors: {stash_pop_result.stderr}", file=sys.stderr)
                    # Try to resolve by dropping the stash and re-adding files
                    subprocess.run(['git', 'stash', 'drop'], check=False)
                    # Files should still be in working directory (stash pop leaves them on conflict)
                    # We'll add them explicitly below
        else:
            # No local changes, safe to pull with rebase
            subprocess.run(['git', 'pull', '--rebase'], check=False)

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
    Orchestrate workflow execution (v4 schema with batching).

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

        # Step 1: Always sync catalog (simplified flow - script checks if changes needed)
        # sync_catalog.py compares files to manifest and only makes changes when needed
        # Returns stats - if all zeros, no changes were made
        sync_result = None
        has_catalog_changes = False
        
        if trigger == 'push':
            print("DEBUG: Step 1 - Running sync_catalog...", file=sys.stderr)
            try:
                sync_result = run_script(
                    'orchestration/sync_catalog.py',
                    jobs_dir='assets/jobs',
                    manifest_path='assets/js/manifest.json'
                )
                results['steps_run'].append('sync_catalog')
                print("DEBUG: Step 1 - sync_catalog completed", file=sys.stderr)
                
                # Check if any changes were made
                stats = sync_result
                has_catalog_changes = (
                    stats.get('products_created', 0) > 0 or
                    stats.get('products_modified', 0) > 0 or
                    stats.get('prices_created', 0) > 0 or
                    stats.get('customers_created', 0) > 0 or
                    stats.get('coupons_created', 0) > 0 or
                    stats.get('products_archived', 0) > 0 or
                    stats.get('jobs_deleted', 0) > 0  # Include deletions as changes
                )
                
                # Print stats and stderr output so we can see what sync_catalog found
                print(f"DEBUG: sync_catalog stats: {json.dumps(stats, indent=2)}", file=sys.stderr)
                
                if sync_result.get('_stderr'):
                    stderr_msg = sync_result.get('_stderr', '')
                    # Print stderr output so we can see file counts, comparison results, etc.
                    print(f"DEBUG: sync_catalog stderr output:", file=sys.stderr)
                    print(stderr_msg, file=sys.stderr)
                    
                    # Filter out DEBUG and Warning messages - they're informational, not errors
                    # Split stderr into lines and check each line for actual errors
                    stderr_lines = stderr_msg.split('\n')
                    error_lines = [
                        line for line in stderr_lines
                        if not line.strip().startswith('DEBUG:') 
                        and not line.strip().startswith('Warning:')
                        and any(indicator in line for indicator in ['Error:', 'error:', 'Failed', 'failed', 'Exception', 'Traceback'])
                    ]
                    if error_lines:
                        results['errors'].append(f"sync_catalog errors: {' '.join(error_lines[:3])}")  # First 3 error lines
                
                if not has_catalog_changes:
                    print("DEBUG: sync_catalog made no changes - all files match manifest and are active", file=sys.stderr)
                    
            except subprocess.CalledProcessError as e:
                error_msg = e.stderr[:500] if e.stderr else str(e)
                results['errors'].append(f"sync_catalog failed: {error_msg}")

        # Step 2: Generate PDFs for new jobs only (v4 schema)
        # Only run PDF generation when new Stripe products were created (new JSON files added)
        pdf_generation_succeeded = False
        pdf_generation_attempted = False
        if trigger == 'push' and sync_result and has_catalog_changes and sync_result.get('products_created', 0) > 0:
            pdf_generation_attempted = True
            products_created = sync_result.get('products_created', 0)
            print(f"DEBUG: Step 2 - Attempting PDF generation for {products_created} new job(s)...", file=sys.stderr)
            try:
                pdf_result = run_script(
                    'pdf/generate_pdfs.py',
                    jobs_dir='assets/jobs'
                )
                results['steps_run'].append('generate_pdfs')
                
                # Log PDF generation stats
                if pdf_result:
                    contracts = pdf_result.get('contracts_generated', 0)
                    invoices = pdf_result.get('invoices_generated', 0)
                    print(f"DEBUG: PDF generation: {contracts} contracts, {invoices} invoices", file=sys.stderr)
                    
                    # PDF generation succeeded if no errors and at least one PDF was generated
                    if not pdf_result.get('errors') and (contracts > 0 or invoices > 0):
                        pdf_generation_succeeded = True
                        print(f"DEBUG: PDF generation succeeded: {contracts} contracts, {invoices} invoices", file=sys.stderr)
                    elif pdf_result.get('errors'):
                        print(f"DEBUG: PDF generation completed with errors: {pdf_result.get('errors')}", file=sys.stderr)
                        results['errors'].extend([f"PDF generation: {e}" for e in pdf_result['errors'][:3]])
            except subprocess.CalledProcessError as e:
                print("DEBUG: PDF generation failed with exception", file=sys.stderr)
                # Include both stdout (JSON) and stderr (DEBUG) in error message
                error_parts = []
                if e.stdout:
                    error_parts.append(f"stdout: {e.stdout[:500]}")
                if e.stderr:
                    error_parts.append(f"stderr: {e.stderr[:500]}")
                if not error_parts:
                    error_parts.append(str(e))
                error_msg = " | ".join(error_parts)
                results['errors'].append(f"generate_pdfs failed: {error_msg}")
                # Don't block workflow if PDF generation fails - manifest still needs to be generated
        elif trigger == 'push' and sync_result and has_catalog_changes:
            print("DEBUG: Skipping PDF generation - no new products created", file=sys.stderr)

        # Step 3: Handle state updates (contract signing, payment status, tracking events)
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

        # Step 4: Generate manifest (always at end)
        print("DEBUG: Step 4 - Generating manifest...", file=sys.stderr)
        try:
            manifest_result = run_script('generate_manifest.py')
            results['steps_run'].append('generate_manifest')
            print("DEBUG: Step 4 - Manifest generation completed", file=sys.stderr)
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr[:500] if e.stderr else str(e)
            results['errors'].append(f"generate_manifest failed: {error_msg}")

        # Step 5: Always attempt commit (git_commit_and_push checks for actual changes)
        # This handles cases where manifest might have changed even if sync_catalog stats were zero
        # git_commit_and_push will return False if there are no changes, which is fine
        print("DEBUG: Step 5 - Building commit message and committing changes...", file=sys.stderr)
        commit_message = "🤖 Auto-update: "
        if action == 'sign-contract':
            commit_message += f"Contract signed for {job_id}"
        elif action == 'update-payment':
            commit_message += f"Payment #{payload_data.get('payment_number', '?')} for {job_id}"
        elif action == 'track-event':
            commit_message += f"Tracking event ({payload_data.get('event_type', '?')}) for {job_id}"
        elif has_catalog_changes:
            if pdf_generation_attempted and pdf_generation_succeeded:
                commit_message += "Stripe catalog sync, PDF generation, and manifest update"
            elif pdf_generation_attempted:
                commit_message += "Stripe catalog sync and manifest update (PDF generation failed)"
            else:
                commit_message += "Stripe catalog sync and manifest update"
        else:
            # sync_catalog ran but made no changes - manifest might still need update
            commit_message += "Manifest update"

        commit_message += "\n\nCo-Authored-By: GitHub Actions <action@github.com>"

        if git_commit_and_push(commit_message):
            results['committed'] = True
            results['pushed'] = True
        else:
            # No actual changes detected by git - this is fine!
            print("DEBUG: git_commit_and_push found no changes - skipping commit", file=sys.stderr)
            results['committed'] = False
            results['pushed'] = False

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
