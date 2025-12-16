# README

## Stripe Payments Micro-site 

  * **Sean August Horvath freelance and consulting**
  
  Architect of your digital business needs. Consulting and freelance custom web development, AI and end-to-end automation solutions, social production, viral strategy, user design, digital marketing optimization. 

    - https://www.payments.august.style 

===

# README TEMPLATE  

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