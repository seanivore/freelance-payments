#!/bin/bash
# git smart-push: Simple, linear pull → apply → push

echo "🔄 git smart-push: Simple workflow"
echo "   - Stash local changes (if any)"
echo "   - Pull with rebase"
echo "   - Restore stash"
echo "   - Push"
echo ""

echo "📋 Step 1: Checking local changes..."
HAS_CHANGES=$(git status --porcelain | wc -l | tr -d ' ')
JOB_JSON_CHANGES=$(git status --porcelain | awk '{print $2}' | grep -E '^assets/jobs/[^/]+\.json$' || true)
JOB_JSON_MODIFIED=$(git status --porcelain | grep -E '^[ MARC][ MARC] assets/jobs/[^/]+\.json$' || true)
JOB_JSON_NEW=$(git status --porcelain | grep -E '^\?\? assets/jobs/[^/]+\.json$' || true)
if [ "$HAS_CHANGES" -gt 0 ]; then
  echo "   ✓ Local changes detected"
else
  echo "   ✓ No local changes detected"
fi

if [ -n "$JOB_JSON_MODIFIED" ] && [ -z "$JOB_JSON_NEW" ]; then
  echo "❌ Existing job JSON changes detected:"
  echo "$JOB_JSON_CHANGES" | sed "s/^/   - /"
  echo "   Local edits to existing job JSONs must not be pushed."
  echo "   Move edits to assets/docs or discard local changes and retry."
  exit 1
fi

echo ""
echo "💾 Step 2: Stashing local changes (if any)..."
if [ "$HAS_CHANGES" -gt 0 ]; then
  git stash push -u -m "smart-push-stash-$(date +%s)"
  STASHED=true
  echo "   ✓ Changes stashed"
else
  STASHED=false
  echo "   ✓ Nothing to stash"
fi

echo ""
echo "⬇️  Step 3: Pulling remote changes with rebase..."
git pull --rebase

if [ "$STASHED" = true ]; then
  echo ""
  echo "📦 Step 4: Restoring stashed changes..."
  git stash pop || {
    echo "❌ Stash pop failed; resolve conflicts and rerun smart-push."
    exit 1
  }
fi

echo ""
echo "⬆️  Step 5: Pushing your changes..."
git push

echo ""
echo "✅ git smart-push completed successfully!"
