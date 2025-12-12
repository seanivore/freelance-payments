# README — New Project Setup + AI Context Primer
Agnostic starter README for any repo. Use this to prime AI before touching code or docs.

---

## Quick Start
1. Create project directory named with slug.
2. Copy starter:
   ```bash
   cp -R /Users/seanivore/Development/_ai.resources/repo-starter/. .
   ```
3. Ensure secrets ignored before git:
   - `.env` and `.env.example` present
   - `.gitignore` includes `.env` and any secret files

---

## Secrets & Environment
- `.env` contains prepared tokens. Review/prune before production.
- `.env.example` provides safe defaults for onboarding.
- `.gitignore` must ignore `.env` from the start to prevent exposure for the repo’s lifetime.
- If secrets ever commit, rotate immediately.

---

## Project Declaration
Fill now. AI uses this first.
- Name:
- One-line value prop:
- Audience/users:
- Primary deliverables:
- Success criteria:
- Timeline/milestones:
- Current status:
- Risks/constraints (tech, budget, compliance, UX):
- Issue tracker:

---

## AI Context Primer (Read Before Doing Anything)
This repo may include intentional patterns that look “wrong.” They aren’t. Do not auto-correct unless asked.

- Intentional Deviations (examples; replace with project-specific)
  - Atypical naming/capitalization/slashes or file layouts used for display/routing.
  - “No build” stacks, 404-based routing, hash filters.
  - Non-standard JSON/YAML/Markdown conventions for human readability.
  - Domain-specific schemas/protocols unique to this project.

- Guardrails
  - Don’t fix capitalization, slashes, naming if they’re documented or used in display/routing.
  - Don’t introduce frameworks/build tools unless explicitly requested.
  - Don’t invent classes/functions/modules not present in files.
  - Don’t refactor architecture or normalize URLs unless told to.
  - Don’t remove mobile-first or accessibility constraints.

- What to Document (AI must add for the actual project)
  - “Atypical but intentional” choices: list and explain.
  - Normalization or routing logic: where it lives; single source of truth.
  - Content schemas: fields, types, display rules, nonstandard conventions.
  - Test strategy: local/prod, parameters, breakpoints, data seeds.
  - Known “Do Not Fix” patterns with rationale.

---

## AI Update Protocol (Single Pass)
When an AI session starts:
1. Read this README fully.
2. Scan the repo (no guessing; no grepping hallucinations).
3. Update only:
   - Project Declaration
   - Tech Stack & Tooling
   - File Map (actual files only; no speculative names)
   - Operating Procedures
   - Known Pitfalls / Do-Not-Fix
   - Open Questions
4. Stop. Do not rewrite other sections. Do not change architecture.

---

## Included Starter Resources (Evergreen)
Copied by repo-starter; reference as needed.
- `_ai/` workspace docs:
  - Project memory protocol, keywords
  - JSON tool lists
  - Master map for planning/task management
- `.gitignore` optimized for AI/dev
- `.cursor/rules/` for Cursor
- `.vscode/` settings + template workspace
- CORE DOCS templates
- `resources/`:
  - MCP Core Concepts, Spec Schemas, Test & Debug
  - Aider How To
  - Single File Agents (SFA)
  - LLM Context How-To
- Markdown CSS directory
- Sample Aider config
- MASTER MAP (`AI.MASTER_MAP.md`): Projects, priorities, emoji statuses

Note: Mention only resources actually used when updating.

---

## Tech Stack & Tooling (To Be Filled Per Project)
- Languages:
- Frameworks/build tools:
- Hosting/deployment:
- Data/schemas:
- MCP servers/tools (if any):
- AI pairing tools (Cursor, Claude, Aider, etc):
- Automation/analytics:

---

## File Map (Add Only Real Files)
List actual files and roles. No placeholders. No invented names.

Example format:
```
├── src/
│   ├── module_a/
│   └── module_b/
├── docs/
└── scripts/
```

---

## Operating Procedures
- Setup:
- Local run/test:
- Data generation/manifest steps (if applicable):
- Lint/format/test:
- Deployment:
- Rollback:

---

## Known Pitfalls / Do-Not-Fix
Add project-specific items. Examples:
- Intentional capitalization in display fields.
- Nonstandard URL normalization centralized in one function.
- 404-based SPA routing for clean URLs.
- Hash routing filters that don’t reload the page.
- Accessibility: alt text required; specific heading/breadcrumb semantics.

---

## Optional: AI Dev Index (If Codebase Is Large)
If modular and many files, add `AI_DEV_INDEX.md` with:
- File/class/function index
- Orchestrator responsibilities and entry points
- Public APIs
- Cache keys/patterns
- Error-handling decorators
- CLI commands/flags
- MCP server configs
- Tool directory maps and UI display conventions

Rule: Index only what exists. No hallucinations.

---

## Open Questions
- Architecture deltas requested?
- Frameworks allowed? Why?
- Build process allowed? Tooling?
- Performance targets?
- Accessibility targets?
- External integrations?
- Security/compliance?
- Data retention?

---

## Changelog
- YYYY-MM-DD: Initial template copied from new-project-setup
- YYYY-MM-DD: AI session updated declaration + file map