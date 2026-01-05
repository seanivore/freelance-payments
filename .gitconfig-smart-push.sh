#!/bin/bash
# git smart-push: Intelligent push workflow with modify/delete conflict handling

echo "🔄 git smart-push: Intelligent push workflow"
echo ""

# Step 1: Identify intentionally changed files
echo "📋 Step 1: Identifying your intentionally changed files..."
INTENTIONAL=$(git diff --cached --name-only 2>/dev/null || true)
LOCAL=$(git log origin/$(git rev-parse --abbrev-ref HEAD)..HEAD --name-only --pretty=format: 2>/dev/null | sort -u || true)
ALL_INTENTIONAL=$(echo -e "$INTENTIONAL\n$LOCAL" | grep -v "^$" | sort -u)

# Also track which files were DELETED in our commits
DELETED_FILES=$(git log origin/$(git rev-parse --abbrev-ref HEAD)..HEAD --diff-filter=D --name-only --pretty=format: 2>/dev/null | sort -u || true)

if [ -n "$ALL_INTENTIONAL" ]; then
  echo "   Your files (will be preserved in conflicts):"
  echo "$ALL_INTENTIONAL" | sed "s/^/     - /"
else
  echo "   No intentionally changed files detected"
fi

# Step 2: Stash unstaged changes
echo ""
echo "💾 Step 2: Stashing unstaged changes..."
HAS_CHANGES=$(git diff --quiet && git diff --cached --quiet && echo no || echo yes)
[ "$HAS_CHANGES" = yes ] && git stash push -u -m "smart-push-stash-$(date +%s)" && STASHED=true || STASHED=false
[ "$STASHED" = true ] && echo "   ✓ Stashed unstaged changes" || echo "   ✓ No unstaged changes to stash"

# Step 3: Pull with rebase
echo ""
echo "⬇️  Step 3: Pulling remote changes (including auto-generated files like manifest.json)..."
set +e
git pull --rebase 2>&1
REBASE_STATUS=$?
set -e

# Step 4: Handle conflicts intelligently
if [ $REBASE_STATUS -ne 0 ] && ([ -d .git/rebase-merge ] || [ -d .git/rebase-apply ]); then
  CONFLICTS=$(git diff --name-only --diff-filter=U 2>/dev/null || true)
  if [ -n "$CONFLICTS" ]; then
    echo ""
    echo "⚠️  Step 4: Resolving conflicts intelligently..."
    echo "$CONFLICTS" | while read -r file; do
      [ -z "$file" ] && continue
      
      # Check conflict type using git ls-files -u
      # Stage 0 = common ancestor, Stage 1 = ours, Stage 2 = theirs
      STAGE_INFO=$(git ls-files -u "$file" 2>/dev/null | awk '{print $1}' | sort -u)
      
      # Check if file exists in our commit (was deleted)
      FILE_IN_DELETED=$(echo "$DELETED_FILES" | grep -q "^$file$" && echo "yes" || echo "no")
      
      # Check if file is in our intentional changes
      FILE_IN_INTENTIONAL=$(echo "$ALL_INTENTIONAL" | grep -q "^$file$" && echo "yes" || echo "no")
      
      if [ "$FILE_IN_DELETED" = "yes" ]; then
        # We deleted it - keep the deletion
        echo "   ✓ Keeping YOUR deletion: $file (you intentionally deleted this)"
        git rm "$file" 2>/dev/null || true
      elif echo "$STAGE_INFO" | grep -q "^1$" && ! echo "$STAGE_INFO" | grep -q "^2$"; then
        # Only stage 1 exists (we modified, they deleted)
        if [ "$FILE_IN_INTENTIONAL" = "yes" ]; then
          echo "   ✓ Keeping YOUR version: $file (you intentionally changed this)"
          git checkout --ours "$file"
          git add "$file"
        else
          echo "   ✓ Taking REMOTE deletion: $file (you didn't change this)"
          git rm "$file" 2>/dev/null || true
        fi
      elif echo "$STAGE_INFO" | grep -q "^2$" && ! echo "$STAGE_INFO" | grep -q "^1$"; then
        # Only stage 2 exists (they modified, we deleted - handled above)
        echo "   ✓ Taking REMOTE version: $file (you didn't delete this)"
        git checkout --theirs "$file"
        git add "$file"
      else
        # Regular modify/modify conflict (both stages exist)
        if [ "$FILE_IN_INTENTIONAL" = "yes" ]; then
          echo "   ✓ Keeping YOUR version: $file (you intentionally changed this)"
          git checkout --ours "$file"
          git add "$file"
        else
          echo "   ✓ Taking REMOTE version: $file (auto-generated or you didn't touch it)"
          git checkout --theirs "$file"
          git add "$file"
        fi
      fi
    done
    echo "   ✓ Continuing rebase..."
    git rebase --continue
  fi
else
  echo "   ✓ No conflicts - all remote changes pulled successfully"
fi

# Step 5: Pop stash
[ "$STASHED" = true ] && echo "" && echo "📦 Step 5: Restoring unstaged changes..." && git stash pop || true

# Step 6: Push
echo ""
echo "⬆️  Step 6: Pushing your changes..."
git push

echo ""
echo "✅ git smart-push completed successfully!"
echo "   - Remote changes pulled (including manifest.json updates)"
echo "   - Your intentional changes preserved"
echo "   - Conflicts resolved intelligently"
