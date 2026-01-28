# Freelance Payments Platform — Development Environment

This is the **development repository** for the freelance payments platform. All development and testing happens here before promoting to production.

> **Important**: This repo uses `freelance-payments` as the main branch name (same as production). This is intentional — it minimizes configuration differences during updates and reduces the chance of bugs. This deviates from the typical pattern of matching branch name to repo name.

---

## Environment URLs

| Type | URL |
|------|-----|
| Frontend | https://dev.payments.august.style |
| Backend API | https://freelance-payments-dev.vercel.app |
| Stripe Dashboard | https://dashboard.stripe.com/test |

**Production** (do not use for development):
- Frontend: https://payments.august.style
- Repo: https://github.com/seanivore/freelance-payments

---

## Test Card

```
Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

---

## Development Workflow

### Daily Development

```bash
cd ~/Development/freelance-payments-dev

# Make changes
# ... edit files ...

# Test locally
npm run dev

# Push to dev
git add .
git commit -m "Add feature X"
git push

# Test on dev.payments.august.style
# Verify workflows run correctly
# Test full user flow
```

### Creating Test Jobs

Use the `test-job` command (symlinked to this dev repo):

```bash
test-job -p "Test Project" -nme "Test Client" -c 500.00 -d 50.00
```

Then move the created JSON from `assets/docs/` to `assets/jobs/` and push.

> **Note**: The `job` command creates jobs in the **live repo**. Use `test-job` for development. Both commands use the same script but are symlinked to different repos.

---

## Promoting to Production

When a feature is ready for production, follow the promotion process in `assets/docs/v6/GO_LIVE_SETUP_DEV.md`.

### Quick Reference: Files to Copy

**Directories (complete overwrite)**:
```
src/
api/
.github/
assets/templates/
assets/scripts/
```

**Config files**:
```
package.json
package-lock.json
vite.config.ts
tsconfig.json
tsconfig.node.json
tailwind.config.js
postcss.config.js
index.html
job.html
404.html
assets/docs/uid-xxx-xxx.json
assets/docs/GUIDE_uid-xxx-xxx.json.md
```

### Files That NEVER Get Copied

```
CNAME                   # Different per environment
vercel.json             # Different CORS per environment
src/lib/api.ts          # Must restore production URL after copy
README.md               # Different per environment
assets/jobs/*.json      # Real client data in prod
assets/pdf/**           # Client PDFs in prod
assets/js/manifest.json # Auto-generated
assets/docs/v1-v6/      # Version history (dev only)
assets/docs/RESOURCES/  # Reference materials (dev only)
```

### After Copying, Restore These in Production

**`src/lib/api.ts`**:
```typescript
return 'https://freelance-payments-neon.vercel.app';
```

**`vercel.json`**:
```json
"Access-Control-Allow-Origin": "https://payments.august.style"
```

---

## Changelog Protocol

Maintain `CHANGELOG.md` with all changes. Use these tags:

| Tag | Description |
|-----|-------------|
| `[CODE]` | Changes to `src/`, `api/`, `.github/` |
| `[CONFIG]` | Changes to `package.json`, `vite.config.ts`, etc. |
| `[SCHEMA]` | Changes to JSON schema structure |
| `[TEMPLATE]` | Changes to `assets/templates/` |
| `[DOCS]` | Documentation updates |

Example entry:
```markdown
## [Unreleased]

### [CODE] Event Tracking
- Added popstate listener for back-button handling
- Unified flush on payment completion

### [SCHEMA] Signed PDF Support
- Added `docs.contract.signed_pdf` field
- Added `docs.contract.signed_url` field
```

---

## Architecture

See `assets/docs/PAYMENTS_PLATFORM.md` for complete technical documentation.

**Key Points**:
- JSON files are the single source of truth (no database)
- GitHub Actions handle all state changes
- GitHub Pages serves static frontend
- Vercel serves serverless API functions
- Events buffer in-memory, flush on page exit or payment completion

---

## Documentation

| Document | Purpose |
|----------|---------|
| `assets/docs/PAYMENTS_PLATFORM.md` | Complete technical documentation |
| `assets/docs/v6/GO_LIVE_SETUP_DEV.md` | Setup and promotion guide |
| `assets/docs/GUIDE_uid-xxx-xxx.json.md` | How to create new jobs |
| `assets/docs/v6/IMPL_*.md` | Implementation plans for features |
| `assets/docs/v1-v5/` | Version history and bug logs |

---

_This is the development environment. Do not use for real client data._
