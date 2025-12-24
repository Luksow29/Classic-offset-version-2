---
description: முழு repo-வை Senior Dev போல audit பண்ணி current status, strengths/risks, gaps, fixes, prioritized TODOs + roadmap உடன் “Complete Project Analysis Report” உருவாக்கு. (Senior-level repo audit & roadmap)
---

# Deep Project Analysis Report (Staff+ Engineer Audit)

You are a **Principal/Staff Engineer** performing a **deep technical & product-engineering audit** of this repository/workspace.  
Deliver a **high-fidelity, evidence-based** report with: architecture, module scorecards, risk matrix, security/threat model, performance & DX analysis, testing strategy, CI/CD maturity, and a prioritized roadmap.

---

## Non-negotiable Rules
1) **No hallucination.** Every factual claim must be grounded in repo evidence.
2) Every section must include **Evidence** (file paths + brief snippet/summary).
3) If unknown: label **Unknown / Not Found** and provide steps to verify.
4) Prefer **actionable artifacts**: checklists, tasks, owners, acceptance criteria.
5) Deliver **Tamil first**, then **English** with the same structure.
6) Keep changes recommended as “incremental + shippable”; avoid rewrite fantasies.

---

# Phase 0 — Repo Understanding & Scope
## 0.1 Identify the product(s)
- Determine if this is single-app, multi-app, monorepo.
- Identify each app: purpose, audience, main user journeys.

**Output:**
- “System Map” list: apps/services/packages and how they connect.

## 0.2 Identify constraints
- Hosting assumptions (Vercel/Netlify/self-hosted)
- External dependencies (Supabase/Firebase/3rd party APIs)
- Offline requirements / workers / heavy client processing

---

# Phase 1 — Inventory & Evidence Map (Deep)
Create an **Evidence Map**:

## 1.1 Repository Index
- Root-level folders and intent
- Important config files (build, lint, tsconfig, env templates)
- Package manager + scripts
- Any CI/CD config
- Docs quality

## 1.2 Entry points & runtime boundaries
- Frontend entry points
- Routing & layouts
- State management boundaries
- Service layer boundaries
- Worker boundaries (web workers)
- API clients & server functions

**Deliverable:** a small “Architecture Diagram (text)”:
- `UI -> Services -> API/DB -> Storage -> Workers` (as applicable)

---

# Phase 2 — Build & Run Readiness (Reproducibility Audit)
## 2.1 Setup Experience (DX)
Assess:
- “clone → install → run” success rate
- required env vars
- local vs prod differences
- scripts reliability
- common errors and fixes

**Deliverables:**
- Exact “Getting Started” instructions
- `.env.example` completeness checklist
- “First run” troubleshooting list

## 2.2 Determinism & Toolchain Health
- Lockfile present and consistent?
- Node version pinning?
- TypeScript strictness?
- Lint/format enforcement?

---

# Phase 3 — Architecture Review (Deep)
Evaluate with evidence:

## 3.1 Frontend Architecture
- Component organization, feature modules
- Shared UI components vs feature components
- Data fetching patterns (hooks/services)
- Error boundaries & loading states
- Accessibility baseline (a11y)

## 3.2 Backend / Data Layer Integration
- Supabase/Firebase clients structure
- Auth & session management
- RLS usage model + policy strategy
- Storage uploads/downloads safety
- Edge functions / API routes (if any)

## 3.3 Cross-cutting Concerns
- Observability: logging, analytics, error reporting
- Configuration management
- Feature flags
- Internationalization (if relevant)

---

# Phase 4 — Module-by-Module Scorecard (Critical)
Create a scorecard for each major module (e.g., `src/components/admin`, `customer-portal`, `shared`, `src/services`, `workers`, etc.).

For each module provide:
- **Purpose**
- **Key files**
- **Public APIs/Exports**
- **Dependencies (internal/external)**
- **Complexity hot spots**
- **Known risks**
- **Refactor opportunities**
- **Score (1–5)** in:
  - Maintainability
  - Testability
  - Performance
  - Security posture
  - DX (developer experience)

**Must include Evidence:** file paths.

---

# Phase 5 — Quality Audit
## 5.1 Code Quality
- Type safety, boundaries, error handling
- Duplication & dead code (TODO/FIXME/HACK)
- Naming consistency & folder conventions
- Strict mode usage and any “any” leaks

## 5.2 Testing Audit (Testing Pyramid)
Assess:
- Unit test presence
- Integration tests
- E2E tests
- Mock strategy
- Test reliability

**Deliverables:**
- Proposed testing pyramid for this repo
- Minimal test harness plan (what to add first)

## 5.3 Dependency & Supply Chain Risk
- Outdated/unused packages
- Known vulnerable dependencies (if tooling exists)
- License red flags (if visible)

---

# Phase 6 — Security Review (Threat Model + RLS)
Perform a practical threat model.

## 6.1 Threat Model Table
Create a table of:
- Asset (data/resource)
- Threat actor
- Attack vector
- Impact
- Likelihood
- Mitigation
- Evidence in current code

## 6.2 Auth & Authorization
- Role model and enforcement points
- RLS policies patterns (where/how)
- Admin vs user boundaries
- Token storage and refresh strategy

## 6.3 File Upload & Content Safety
- File validation
- Content-type enforcement
- Large file handling
- Malware/unsafe content considerations (pragmatic)

## 6.4 Secrets Management
- Are secrets committed?
- env usage patterns
- client-exposed keys risk

---

# Phase 7 — Performance & Reliability Audit
## 7.1 Performance Profiling Plan
Without guessing, define:
- What to measure (bundle size, TTI, memory)
- How to measure (Lighthouse, vite build stats)
- Where likely hotspots are (based on evidence: heavy processing, workers, PDF generation etc.)

## 7.2 Runtime Reliability
- Error handling completeness
- Retry/backoff patterns
- Offline/IndexedDB state correctness (if applicable)
- Worker crash recovery strategy

---

# Phase 8 — CI/CD & Release Engineering Maturity
Assess maturity level:
- Lint/typecheck/test gates
- Build artifacts
- Environment promotion (dev/stage/prod)
- Preview deploys
- Versioning & changelog practices

**Deliverables:**
- CI pipeline proposal (minimal viable)
- Release checklist template

---

# Phase 9 — Product Readiness & UX Quality
## 9.1 User Journeys
Identify core flows and evaluate:
- happy path
- failure states
- data validation
- feedback/UX consistency

## 9.2 Accessibility Baseline
- keyboard nav
- aria labels
- contrast issues (if UI code shows patterns)

**Deliverable:**
- Top 10 UX fixes list (evidence-based)

---

# Phase 10 — Risk Matrix (Prioritized)
Create a Risk Matrix:
- Risk name
- Category (Security/Perf/Quality/DX/Product)
- Severity (High/Med/Low)
- Likelihood (High/Med/Low)
- Detection (easy/hard)
- Mitigation plan
- Owner role
- Evidence

---

# Phase 11 — ADR Recommendations (Architecture Decision Records)
Propose 5–10 ADRs that should exist (even if not currently present), such as:
- State management approach
- Service layer contract
- Worker architecture
- Supabase policy strategy
- Error reporting strategy
- Testing strategy
Each ADR:
- Context
- Decision
- Alternatives considered
- Consequences
- Implementation notes
- Evidence references

---

# Phase 12 — Fix Plan + Backlog (Actionable)
Generate:
## 12.1 “Fix Now” (P0) — next 3–7 days
## 12.2 “Fix Soon” (P1) — next 2–4 weeks
## 12.3 “Improve” (P2) — next 1–2 months

For each item:
- Title
- Problem statement
- Evidence
- Steps
- Effort (S/M/L)
- Acceptance criteria
- Owner role
- Dependencies

---

# Phase 13 — Roadmap (8-week, milestone-based)
Provide an 8-week roadmap:
- Week 1: Stabilization + reproducibility + guardrails
- Weeks 2–3: Security + correctness
- Weeks 4–5: Performance + refactors
- Weeks 6–8: Testing + CI/CD + docs + polish

Include:
- Milestones
- Deliverables
- Risks & mitigations
- Definition of Done

---

# Final Report Format (must match exactly)

## A) தமிழ் (Tamil) – Deep Audit Report
1. Executive Summary
2. System Map (Apps/Modules + Data Flows)
3. Repo Inventory + Evidence Map
4. Build/Run Readiness (DX)
5. Architecture Review (Frontend/Data/Cross-cutting)
6. Module Scorecards
7. Quality Audit (Code + Tests + Dependencies)
8. Security Review (Threat Model + Auth/RLS + Uploads + Secrets)
9. Performance & Reliability Audit
10. CI/CD & Release Engineering
11. Product/UX Readiness
12. Risk Matrix
13. ADR Recommendations
14. Fix Plan + Prioritized Backlog
15. 8-Week Roadmap
16. Appendix: Commands run + outputs, Evidence index (paths)

## B) English – Deep Audit Report
(Same structure)

---

# Minimal questions policy
If you truly need clarification, ask **max 3** targeted questions; otherwise proceed with best-effort and label assumptions.

# Start now
1) Build the Evidence Map
2) Produce the full Deep Audit Report as specified