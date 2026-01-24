# Freelance Payments Platform

A zero-database payment collection system that turns static hosting into a full-featured business application.

## The Architecture That Shouldn't Work (But Does)

This platform processes real payments, generates legal documents, and manages complex multi-step user flows — all without a traditional database, server, or backend infrastructure costs.

**How?** By treating JSON files as the single source of truth and orchestrating state changes through GitHub Actions workflows.

### Key Innovations

**1. JSON-as-Database Pattern**
- Each client job is a single JSON file containing all state, documents, and payment data
- GitHub becomes the database with built-in version control, audit trails, and conflict resolution
- No database hosting costs, no connection pooling, no schema migrations

**2. FluxGate State Machine**
- Client progress tracked via timestamp-based state gates
- Each gate represents a completed action (contract signed, invoice acknowledged, payment made)
- Frontend reads state and routes to the correct view — no server-side session management

**3. Exit-Event Architecture**
- User actions buffered in-memory, flushed only on page exit or inactivity
- Single API call triggers single workflow run — no duplicate processing
- `navigator.sendBeacon` ensures events survive page close

**4. Hybrid Static/Serverless Deployment**
- Frontend: Static files on GitHub Pages (free)
- Backend: Vercel serverless functions (free tier)
- Automation: GitHub Actions (free for public repos)
- **Total infrastructure cost: $0/month**

## What It Does

A freelancer sends their client a login link. The client:

1. **Signs a contract** — PDF rendered client-side, signature captured on canvas
2. **Reviews an invoice** — Generated from Google Docs templates via API
3. **Makes payment** — Stripe Checkout with custom UI
4. **Returns later for final payment** — State persists across sessions
5. **Downloads all documents** — Contract, invoice, balance PDF

Each step updates the JSON file via GitHub Actions. The next login routes to the correct step automatically.

## Technical Highlights

### Zero-Trust Frontend
- No sensitive data in client code
- Stripe keys are publishable-only
- All payment processing happens server-side
- Webhook verification for payment confirmation

### Bulletproof Event Delivery
- CORS-safe `sendBeacon` with `text/plain` content type
- Fallback to `fetch` with `keepalive` flag
- Session-level deduplication prevents duplicate events
- Git rebase in workflows prevents merge conflicts

### Mobile-First Modals
- Custom drawer component tuned for iOS keyboard behavior
- Disabled `vaul` library's aggressive repositioning
- Native keyboard handling preserved

### PDF Generation Pipeline
- Google Docs as template engine
- OAuth refresh token stored in GitHub Secrets
- PDFs generated on admin push, stored in repo
- Client-side rendering via `pdfjs-dist`

## Stack

| Layer      | Technology                                       |
|------------|--------------------------------------------------|
| Frontend   | React 18 + TypeScript + Vite                     |
| Styling    | Tailwind CSS + shadcn/ui                         |
| Payments   | Stripe Checkout (Custom UI)                      |
| PDF        | pdfjs-dist (render) + Google Docs API (generate) |
| Backend    | Vercel Serverless Functions                      |
| Automation | GitHub Actions                                   |
| Hosting    | GitHub Pages + Vercel                            |
| "Database" | JSON files in Git                                |

## Why This Architecture?

### The Problem
Traditional payment platforms require:
- Database hosting ($20-100/month)
- Server infrastructure ($10-50/month)
- Session management complexity
- DevOps overhead

### The Solution
This architecture eliminates all of that by:
- Using Git as a database (free, versioned, auditable)
- Treating workflows as the "backend" (event-driven, scalable)
- Keeping the frontend truly static (cacheable, fast)
- Leveraging free tiers strategically (Vercel, GitHub, Stripe)

### The Trade-offs
- Not suitable for high-volume (GitHub Actions has rate limits)
- Requires Git knowledge to debug
- JSON conflicts possible with concurrent edits (mitigated by rebase)

**Perfect for**: Freelancers, small agencies, anyone processing <100 payments/month who wants zero infrastructure costs.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Documentation

For complete technical documentation, see [`assets/docs/PAYMENTS_PLATFORM.md`](assets/docs/PAYMENTS_PLATFORM.md).

---

*Built with the philosophy that the best infrastructure is the infrastructure you don't have to manage.*
