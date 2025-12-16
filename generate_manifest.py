#!/usr/bin/env python3
"""
MANIFEST GENERATOR for Freelance Payments
Scans job JSON files and builds lookup key → file path mapping
Lookup key format: "{last_name}-{project_keyword}" (lowercase, hyphenated)

Usage:
    python generate_manifest.py
    
Output:
    /assets/js/manifest.json
"""

import json
import os
from pathlib import Path
from typing import Dict, Optional
import sys


def normalize_lookup_key(text: str) -> str:
    """
    Normalize text for lookup key (lowercase, hyphenated)
    Example: "Smith" + "Art Website" -> "smith-art-website"
    """
    return text.lower().replace(' ', '-').replace('_', '-').strip()


def read_job_json(file_path: Path) -> Optional[Dict]:
    """
    Read a job JSON file and extract lookup data
    Returns: job data dict or None if invalid
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Validate required fields
        if 'client' not in data:
            print(f"⚠️  Missing 'client' field in {file_path.name}", file=sys.stderr)
            return None
        
        client = data['client']
        if 'last_name' not in client or 'project_keyword' not in client:
            print(f"⚠️  Missing 'last_name' or 'project_keyword' in {file_path.name}", file=sys.stderr)
            return None
        
        return data
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in {file_path.name}: {e}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"❌ Error reading {file_path.name}: {e}", file=sys.stderr)
        return None


def generate_manifest() -> Dict[str, str]:
    """
    Generate manifest mapping lookup keys to JSON file paths
    Returns: dict mapping "{last_name}-{project_keyword}" to relative file path
    """
    jobs_dir = Path('assets/jobs')
    manifest = {}
    
    if not jobs_dir.exists():
        print(f"⚠️  Jobs directory not found: {jobs_dir}", file=sys.stderr)
        return manifest
    
    # Scan for JSON files (excluding template)
    json_files = [f for f in jobs_dir.glob('*.json') if f.name != '_job_template.json']
    
    if not json_files:
        print("ℹ️  No job JSON files found (excluding template)", file=sys.stderr)
        return manifest
    
    for json_file in sorted(json_files):
        job_data = read_job_json(json_file)
        
        if not job_data:
            continue
        
        client = job_data['client']
        last_name = normalize_lookup_key(client['last_name'])
        project_keyword = normalize_lookup_key(client['project_keyword'])
        
        # Create lookup key: "{last_name}-{project_keyword}"
        lookup_key = f"{last_name}-{project_keyword}"
        
        # Relative path from site root
        relative_path = f"assets/jobs/{json_file.name}"
        
        # Check for duplicates
        if lookup_key in manifest:
            print(f"⚠️  Duplicate lookup key '{lookup_key}': {json_file.name} conflicts with {manifest[lookup_key]}", file=sys.stderr)
            continue
        
        manifest[lookup_key] = relative_path
        print(f"✅ Added: {lookup_key} → {json_file.name}")
    
    return manifest


def main():
    """Main execution"""
    print("🔍 Generating manifest.json...")
    
    manifest_data = {
        "jobs": generate_manifest(),
        "generated_at": None  # Will be set by GitHub Actions or manually
    }
    
    # Output directory
    output_dir = Path('assets/js')
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / 'manifest.json'
    
    # Write manifest
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(manifest_data, f, indent=2, ensure_ascii=False)
        
        job_count = len(manifest_data['jobs'])
        print(f"\n✅ Manifest generated: {job_count} job(s) mapped")
        print(f"📄 Output: {output_file}")
        
    except Exception as e:
        print(f"❌ Error writing manifest: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
