#!/usr/bin/env python3
"""
MANIFEST GENERATOR
Scans portfolio entry JSON files and builds URL → file path mapping
Run this script after adding/updating/removing any JSON entries
Won't break if URL structure changes

Usage:
    python generate_manifest.py
    
Output:
    /assets/js/manifest.json
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Tuple
import sys


def normalize_for_url(text: str) -> str:
    """
    Normalize text for URL usage (matches JavaScript normalizeForURL function)
    Example: "HTML/CSS/JS" -> "html-css-js"
    """
    return text.lower().replace(' ', '-').replace('/', '-').strip()


def read_json_entry(file_path: Path) -> Tuple[Dict, str]:
    """
    Read a JSON entry file and extract placement data
    Returns: (placement_dict, error_message)
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        # Validate structure
        if 'categorization' not in data:
            return None, f"Missing 'categorization' field in {file_path.name}"
            
        if 'placement' not in data['categorization']:
            return None, f"Missing 'placement' field in {file_path.name}"
            
        placement = data['categorization']['placement']
        
        # Validate required fields
        required_fields = ['section', 'sub_section', 'slug']
        for field in required_fields:
            if field not in placement:
                return None, f"Missing '{field}' in placement for {file_path.name}"
                
        return placement, None
        
    except json.JSONDecodeError as e:
        return None, f"Invalid JSON in {file_path.name}: {e}"
    except Exception as e:
        return None, f"Error reading {file_path.name}: {e}"


def build_manifest(entries_dir: Path) -> Dict:
    """
    Scan entries directory and build manifest structure
    """
    manifest = {
        "entries": {},
        "sections": {},
        "_metadata": {
            "generated": "auto",
            "description": "Maps URLs to JSON file paths for dynamic loading",
            "entry_count": 0
        }
    }
    
    errors = []
    
    # Find all JSON files in entries directory
    json_files = list(entries_dir.glob('*.json'))
    
    if not json_files:
        print(f"⚠️  No JSON files found in {entries_dir}")
        return manifest
        
    print(f"📂 Found {len(json_files)} JSON files in {entries_dir}")
    print()
    
    # Process each file
    for json_file in sorted(json_files):
        placement, error = read_json_entry(json_file)
        
        if error:
            errors.append(error)
            continue
            
        # Build URL path from placement data
        section_normalized = normalize_for_url(placement['section'])
        subsection_normalized = normalize_for_url(placement['sub_section'])
        slug = placement['slug']
        
        # Full URL path
        url_path = f"{section_normalized}/{subsection_normalized}/{slug}"
        
        # Relative file path from project root
        file_path = f"assets/entries/{json_file.name}"
        
        # Add to entries mapping
        manifest['entries'][url_path] = file_path
        
        # Add to sections grouping
        if section_normalized not in manifest['sections']:
            manifest['sections'][section_normalized] = []
            
        # Store just the UID for section grouping
        uid = json_file.stem  # Filename without extension
        if uid not in manifest['sections'][section_normalized]:
            manifest['sections'][section_normalized].append(uid)
            
        print(f"✅ {json_file.name}")
        print(f"   → {url_path}")
        
    # Update entry count
    manifest['_metadata']['entry_count'] = len(manifest['entries'])
    
    # Print errors if any
    if errors:
        print()
        print("❌ ERRORS:")
        for error in errors:
            print(f"   {error}")
            
    return manifest


def write_manifest(manifest: Dict, output_path: Path):
    """
    Write manifest to JSON file with pretty formatting
    """
    try:
        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write with indentation for readability
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
            
        print()
        print(f"✨ Manifest written to: {output_path}")
        print(f"📊 Total entries: {manifest['_metadata']['entry_count']}")
        print(f"📁 Sections: {', '.join(manifest['sections'].keys())}")
        
    except Exception as e:
        print(f"❌ Error writing manifest: {e}")
        sys.exit(1)


def main():
    """
    Main execution
    """
    print("=" * 60)
    print("MANIFEST GENERATOR")
    print("Single-JSON Portfolio Architecture")
    print("=" * 60)
    print()
    
    # Define paths relative to script location
    script_dir = Path(__file__).parent
    project_root = script_dir  # Assuming script is in project root
    
    entries_dir = project_root / 'assets' / 'entries'
    output_path = project_root / 'assets' / 'js' / 'manifest.json'
    
    # Validate entries directory exists
    if not entries_dir.exists():
        print(f"❌ Entries directory not found: {entries_dir}")
        print("   Please ensure you're running this script from the project root")
        sys.exit(1)
        
    # Build manifest
    manifest = build_manifest(entries_dir)
    
    # Write manifest
    write_manifest(manifest, output_path)
    
    print()
    print("=" * 60)
    print("✅ DONE!")
    print("=" * 60)


if __name__ == '__main__':
    main()
