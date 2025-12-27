#!/usr/bin/env python3
"""
MANIFEST GENERATOR for Freelance Payments
Scans job JSON files and builds lookup key → file path mapping
Lookup key format: "{last_name}-{project_keyword}" (lowercase, hyphenated)

Usage:
    python3 generate_manifest.py
    
Note: GitHub Actions workflow should use: python3 generate_manifest.py
    
Output:
    /assets/js/manifest.json
"""

import json
import os
from pathlib import Path
from typing import Dict, Optional, Any
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
        
        # Validate required fields - v3 schema uses product_object.metadata
        if 'product_object' not in data:
            print(f"⚠️  Missing 'product_object' field in {file_path.name}", file=sys.stderr)
            return None
        
        product_obj = data['product_object']
        if 'metadata' not in product_obj:
            print(f"⚠️  Missing 'metadata' in product_object for {file_path.name}", file=sys.stderr)
            return None
        
        metadata = product_obj['metadata']
        if 'login_name' not in metadata or 'login_keyword' not in metadata:
            print(f"⚠️  Missing 'login_name' or 'login_keyword' in product_object.metadata for {file_path.name}", file=sys.stderr)
            return None
        
        if 'id' not in product_obj:
            print(f"⚠️  Missing 'id' in product_object for {file_path.name}", file=sys.stderr)
            return None
        
        return data
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in {file_path.name}: {e}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"❌ Error reading {file_path.name}: {e}", file=sys.stderr)
        return None


def generate_manifest() -> Dict[str, Dict]:
    """
    Generate manifest mapping lookup keys to job entries
    Returns: dict mapping "{login_name}-{login_keyword}" to entry dict with:
        - file_path: relative path to JSON file
        - job_id: product_object.id (matches filename)
        - login_keyword: from product_object.metadata
        - login_name: from product_object.metadata
    """
    # Get project root (3 levels up from .github/scripts/generate_manifest.py)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    jobs_dir = project_root / 'assets' / 'jobs'
    manifest = {}
    
    if not jobs_dir.exists():
        print(f"⚠️  Jobs directory not found: {jobs_dir}", file=sys.stderr)
        return manifest
    
    # Scan for JSON files (excluding templates)
    json_files = [f for f in jobs_dir.glob('*.json') if not f.name.startswith('_job_template')]
    
    if not json_files:
        print("ℹ️  No job JSON files found (excluding template)", file=sys.stderr)
        return manifest
    
    for json_file in sorted(json_files):
        job_data = read_job_json(json_file)
        
        if not job_data:
            continue
        
        # Extract from product_object (v3 schema)
        product_obj = job_data['product_object']
        metadata = product_obj['metadata']
        login_name = normalize_lookup_key(metadata['login_name'])
        login_keyword = normalize_lookup_key(metadata['login_keyword'])
        job_id = product_obj['id']
        
        # Create lookup key: "{login_name}-{login_keyword}"
        lookup_key = f"{login_name}-{login_keyword}"
        
        # Relative path from site root
        relative_path = f"assets/jobs/{json_file.name}"
        
        # Verify job_id matches filename (without .json)
        expected_job_id = json_file.stem
        if job_id != expected_job_id:
            print(f"⚠️  Warning: job_id '{job_id}' doesn't match filename '{expected_job_id}' in {json_file.name}", file=sys.stderr)
        
        # Check for duplicates
        if lookup_key in manifest:
            print(f"⚠️  Duplicate lookup key '{lookup_key}': {json_file.name} conflicts with {manifest[lookup_key]['file_path']}", file=sys.stderr)
            continue
        
        # Create entry with all required fields
        manifest[lookup_key] = {
            "file_path": relative_path,
            "job_id": job_id,
            "login_keyword": metadata['login_keyword'],
            "login_name": metadata['login_name']
        }
        print(f"✅ Added: {lookup_key} → {job_id} ({json_file.name})")
    
    return manifest


def main():
    """Main execution"""
    print("🔍 Generating manifest.json...")
    
    # Get project root (3 levels up from .github/scripts/generate_manifest.py)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    
    from datetime import datetime
    
    manifest_data = {
        "jobs": generate_manifest(),
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }
    
    # Output directory (relative to project root)
    output_dir = project_root / 'assets' / 'js'
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
