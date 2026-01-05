# Git Workflow Guide

## The Problem

When pushing changes, Git conflicts can occur with auto-generated files (like `manifest.json`). The default behavior overwrites our intentional changes with remote versions, which is frustrating.

## The Solution: `git smart-push`

A workflow that:
1. **Preserves intentionally changed files** - If you staged/committed a file locally, your version wins in conflicts
2. **Accepts auto-generated updates** - If you didn't touch a file (like `manifest.json`), the remote version wins
3. **Handles rebase conflicts intelligently** - Automatically resolves conflicts based on what you changed

## Usage

**Standard Workflow (Recommended):**

```bash
git add .                              # Stage all your changes
git commit -m "Your commit message"    # Commit staged changes
git smart-push                          # Pull, resolve conflicts intelligently, push
```

**Or if you only want to commit specific files:**

```bash
git add <file1> <file2>                # Stage specific files
git commit -m "Your commit message"    # Commit staged changes
git smart-push                          # Pull, resolve conflicts intelligently, push
```

**What `git smart-push` does:**
1. **Identify files you've staged/committed locally** (these will be preserved in conflicts)
2. **Stash any unstaged changes** (temporary, will be restored)
3. **Pull with rebase** - This pulls ALL remote changes, including:
   - Auto-generated files like `manifest.json` (if no conflicts)
   - Any other remote updates
4. **If conflicts occur**, resolve intelligently:
   - **Your files** (staged/committed) → Keep your version ✅
   - **Other files** (like manifest.json if you didn't touch it) → Take remote version ✅
5. **Continue rebase automatically**
6. **Pop stash** (restore your unstaged changes)
7. **Push** your changes

**Key Point:** `git pull --rebase` pulls ALL remote changes first. If there are no conflicts, you get everything (including manifest.json updates). Conflicts only occur when both you and remote changed the same file, and that's when the intelligent resolution kicks in.

## Manual Alternative

If you prefer manual control:

```bash
# 1. See what you've changed
git status

# 2. Stage your intentional changes
git add <files-you-want-to-keep>

# 3. Pull with rebase
git pull --rebase

# 4. If conflicts occur:
#    - For files you intentionally changed: git checkout --ours <file>
#    - For auto-generated files you didn't touch: git checkout --theirs <file>
#    - Then: git add <file> && git rebase --continue

# 5. Push
git push
```

## Quick Commands

- `git sync` - Old alias (may cause issues, use `git smart-push` instead)
- `git smart-push` - New intelligent push workflow (recommended)

## How It Works

The `git smart-push` script:
1. Checks `git diff --cached` to see what you've staged
2. Checks `git log` to see what you've committed locally but not pushed
3. Before pulling, saves a list of "your files"
4. During rebase conflicts:
   - If file is in "your files" list → `git checkout --ours`
   - Otherwise → `git checkout --theirs`
5. Automatically continues the rebase

## Example Scenarios

### Scenario 1: No Conflicts (Most Common)

**Before:**
- You: Created `uid-test-fresh-001.json` and committed it
- Remote: GitHub Actions updated `manifest.json` (you didn't touch it)

**What happens:**
1. `git smart-push` detects you committed `uid-test-fresh-001.json`
2. Pulls with rebase → **Pulls in the new manifest.json automatically** ✅
3. No conflicts → Everything merges cleanly
4. Pushes successfully with both your JSON and the updated manifest

### Scenario 2: Conflicts Occur

**Before:**
- You: Manually edited `manifest.json` and committed it
- Remote: GitHub Actions also updated `manifest.json`

**What happens:**
1. `git smart-push` detects you committed `manifest.json`
2. Pulls with rebase → Conflict detected!
3. Conflict resolution: Keeps YOUR version (because you intentionally changed it) ✅
4. Continues rebase
5. Pushes successfully

### Scenario 3: Mixed Changes

**Before:**
- You: Created `uid-test-fresh-001.json` and manually edited `manifest.json`
- Remote: GitHub Actions updated `manifest.json` AND deleted an old file

**What happens:**
1. `git smart-push` detects you committed both files
2. Pulls with rebase → Conflict in `manifest.json` only
3. Conflict resolution:
   - `manifest.json` → Keeps YOUR version (you edited it) ✅
   - Old file deletion → Takes remote version (you didn't touch it) ✅
4. Continues rebase
5. Pushes successfully

## Troubleshooting

**"Jobs directory disappeared"**
- This happens when `git sync` or `git pull --rebase` conflicts with deleted directories
- Solution: Use `git smart-push` which preserves your intentional changes
- To restore: `git checkout HEAD -- assets/jobs/`

**"Manifest keeps reverting"**
- If you didn't intentionally change manifest.json, this is correct behavior
- GitHub Actions generates it, so remote version should win
- If you DID intentionally change it, make sure you staged it before pushing
