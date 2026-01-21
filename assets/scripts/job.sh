#!/bin/bash
set -euo pipefail

SOURCE_PATH="${BASH_SOURCE[0]}"
if [ -L "$SOURCE_PATH" ]; then
  SOURCE_PATH="$(readlink "$SOURCE_PATH")"
fi
SCRIPT_DIR="$(cd "$(dirname "$SOURCE_PATH")" && pwd)"
python3 "$SCRIPT_DIR/new_job.py" "$@"
