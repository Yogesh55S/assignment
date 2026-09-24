# AI Interview Prep Kit — Final Project Evidence Report

## 1. Project Identity
- **Project Name**: AI Interview Prep Kit
- **Repository Architecture**:
  - `frontend/` — Next.js 14 App Router, React 18, Tailwind CSS, TypeScript UI package
  - `backend/` — Express REST API, MongoDB/Mongoose, Google Gemini API client, Web Crawler, Auth, & CLI package
  - `shared/` — Pure TypeScript shared data models, Zod schemas, Requirement Coverage Engine, & Study Schedule Allocator
- **Main Detected Technologies**: TypeScript 5.7, Node.js (>= 20.0.0), Next.js 14, React 18, Tailwind CSS, Express 4, Mongoose 8, Zod 3, bcryptjs, jsonwebtoken, Cheerio, Vitest 3, Google Gemini API (`@google/genai`).
- **Scope Statement**: Production-minded AI Interview Prep Kit monorepo implementing end-to-end kit generation, SSRF-safe crawling, deterministic requirement coverage analysis, deterministic study schedule allocation, interactive builder editing, preservation-aware section regeneration, flashcard practice mode, and an offline batch evaluation CLI runner.
- **Report Generation Timestamp**: `2026-09-24T21:06:30+05:30`

---

## 2. Product Summary
The **AI Interview Prep Kit** addresses the challenge candidates face when preparing for specialized company interviews with limited preparation time. Candidates often struggle to analyze lengthy job descriptions, align their preparation with target company engineering culture, and allocate study time effectively across competing technical and behavioral topics.

The application automates this preparation process through a structured, multi-step workflow:
1. **Registration & Authentication**: User registers/logs in and receives a secure, HTTP-only JWT session cookie.
2. **Input Submission**: Candidate inputs a raw job description, target company website URL, and prep timeframe (1–60 days).
3. **Automated Research & Synthesis**: The platform validates the company URL for safety, fetches `robots.txt`, crawls public pages, strips HTML scripts, extracts role competencies (`technical`, `behavioural`, `domain`), and synthesizes interview questions, answer outlines, active-recall flashcards, and a day-by-day study schedule.
4. **Draft Editing & Customization**: The candidate reviews the generated prep kit in an interactive builder workspace, performs inline text edits, reorders questions, transfers question categories, adds custom items, and pins critical questions.
5. **Preservation-Aware Regeneration**: The candidate can selectively regenerate individual categories or prep schedules while strictly preserving user-created, edited, or pinned questions.
6. **Active-Recall Flashcard Practice**: Candidate studies flashcards in an interactive practice mode with answer reveals, keyboard controls, and confidence rating tracking (Low/Medium/High).

---

## 3. Architecture

```text
Browser Client
  │
  │  authenticated HTTP requests (credentials: include)
  ▼
Next.js Frontend (Vercel / Port 3000)
  │
  │  REST API calls (/api/*)
  ▼
Express Backend (Railway / Port 5000)
  ├── Auth Service (bcryptjs + JWT cookies)
  ├── Research Crawler (SSRF protection + Cheerio HTML cleaning)
  ├── Structured LLM Generation (Google Gemini API)
  ├── Deterministic Coverage & Scheduling Engine
  ├── Persistence Service (Mongoose + Optimistic Concurrency)
  └── Batch Evaluation CLI Runner
  │
  ├───────────────────────┼───────────────────────┐
  ▼                       ▼                       ▼
MongoDB Atlas         Google Gemini        Company Websites
 (Data Store)        (LLM Provider)        (Web Crawling)
```

### Component Division of Responsibilities
- **Frontend (`frontend/`)**: Manages Next.js App Router UI pages, progressive kit creation forms, inline builder draft state, debounced autosave, optimistic conflict warnings, keyboard-accessible flashcard practice sessions, and user authentication state (`AuthContext`).
- **Backend (`backend/`)**: Handles Express routing, Helmet HTTP security headers, CORS origin verification, JWT cookie issuance, SSRF URL validation, `robots.txt` compliance, Cheerio HTML stripping, structured Gemini LLM prompt generation, schema validation, and MongoDB persistence.
- **Shared Package (`shared/`)**: Contains pure TypeScript domain types (`InterviewPrepKit`, `Requirement`, `InterviewQuestion`, `Flashcard`, `ScheduleDay`), strict Zod schemas, the pure deterministic Requirement Coverage Engine (`analyzeRequirementCoverage`), and the pure deterministic Study Schedule Allocator (`allocateStudySchedule`).
- **External Dependencies**: MongoDB Atlas (database storage), Google Gemini API (AI text synthesis), and public target company websites (passive HTML crawling).

---

## 4. Implemented Features

| Feature | Implementation Evidence | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Authentication** | `authService.ts`, `User.ts`, `authController.ts` | Implemented | Email/password registration, bcrypt 12-round hashing, 7-day HTTP-only JWT cookie. |
| **Protected Routes & Ownership** | `authMiddleware.ts`, `kitRoutes.ts`, `Kit.ts` | Implemented | API endpoints enforce valid session; queries scoped strictly by `userId`. |
| **Kit Creation & Status Polling** | `/kits/new/page.tsx`, `kitPipeline.ts`, `kitController.ts` | Implemented | Form validation, progressive stage stepper, 201 created / 202 queued handling. |
| **Company URL Safety & SSRF Policy** | `urlSafety.ts`, `urlSafety.test.ts` | Implemented | Validates HTTP/HTTPS, blocks loopback/private IPs in production, normalizes URLs. |
| **Company Crawling & Link Ranking** | `companyCrawler.ts`, `linkRanker.ts` | Implemented | Crawls up to 8 same-origin pages, ranks internal links by keyword weights (+14 interview, +12 hiring). |
| **Robots.txt Parsing & Compliance** | `robots.ts`, `robots.test.ts` | Implemented | Exact User-Agent precedence, Allow override matching, Crawl-delay capped at 5000ms, 404 allow-all. |
| **HTML Cleaning & Untrusted Safety** | `htmlCleaner.ts`, `sanitizePromptContent.ts` | Implemented | Cheerio strips `<script>`, `<iframe>`, `<form>`, styles; control chars removed; XML delimiters applied. |
| **Requirement Extraction** | `requirementExtractionService.ts` | Implemented | Extracts title, seniority, location, responsibilities, and categorized requirements (`technical`, `behavioural`, `domain`). |
| **Requirement IDs & Priority** | `stableIds.ts`, `prompts.ts` | Implemented | Deterministic `r1`, `r2`, `r3` assignment; classifies `must` vs `nice` priority. |
| **Category-Specific Questions** | `questionGenerationService.ts` | Implemented | Synthesizes questions in isolated category prompts (`technical`, `behavioural`, `system-design`, `company-fit`). |
| **Coverage Check & Gap Repair** | `coverageService.ts`, `kitPipeline.ts` | Implemented | Code-based coverage analysis; triggers targeted 2nd pass (`coverage.passes: 2`) if must requirements are uncovered. |
| **Active Recall Flashcards** | `questionGenerationService.ts` | Implemented | Generates revision flashcards linked to valid requirement IDs (`f1`, `f2`). |
| **Deterministic Study Schedule** | `scheduleService.ts`, `scheduleValidation.ts` | Implemented | Two-tiered priority + difficulty scoring, round-robin day allocation, integer minutes, zero LLM calls. |
| **Interactive Kit Builder** | `/kits/[id]/page.tsx`, `QuestionEditor.tsx` | Implemented | Inline text editing, debounced autosave (800ms), conflict detection (HTTP 409). |
| **Question Reordering & Transfers** | `QuestionBank.tsx`, `QuestionCard.tsx` | Implemented | Move up/down controls, category transfers, multi-select requirement assignment. |
| **Manual Add / Delete** | `QuestionBank.tsx`, `FlashcardList.tsx` | Implemented | Manual creation of custom questions and flashcards, deletion with schedule warnings. |
| **Pinned / Edited / Generated State** | `editableKitSchema.ts`, `stripInternalKitMetadata.ts` | Implemented | `_meta` architecture (`origin`, `edited`, `pinned`); recursively stripped for Appendix A outputs. |
| **Single-Section Regeneration** | `regenerationService.ts`, `kitController.ts` | Implemented | Targeted section updates; strictly preserves user-created, edited, and pinned questions. |
| **Flashcard Practice Mode** | `/kits/[id]/practice/page.tsx`, `practiceService.ts` | Implemented | Multi-tier card sorting (uncovered $\rightarrow$ low confidence $\rightarrow$ lastSeenAt), keyboard controls, progress persistence. |
| **Failure & Retry Lifecycle** | `Kit.ts`, `FailedKitView.tsx`, `errorMapper.ts` | Implemented | `generationStatus: "failed"`, `kit: null`, safe error envelopes, user retry trigger. |
| **Batch Evaluation CLI** | `evaluate.ts`, `batchCli.test.ts` | Implemented | `npm run evaluate -- --input cases.json --output kits.json`, sequential processing, fault-tolerant continuation. |
| **Automated Test Suite** | `backend/tests/unit/*.test.ts` | Implemented | 244 unit tests across 43 test suites passing 100% in-memory. |
| **Deployment Readiness** | `Dockerfile`, `next.config.mjs`, `README.md` | Not verified live | Monorepo configuration ready for Vercel/Railway hosting; manual live deployment check recommended. |

---

## 5. Deterministic Decisions
The architecture delegates structural, analytical, and temporal decisions to **pure TypeScript code** rather than stochastic LLM calls:
- **Requirement IDs**: Assigned programmatically (`r1`, `r2`, `r3`...) using stable deterministic sequencing.
- **Question & Flashcard IDs**: Assigned programmatically (`q1`, `q2`, `q3`..., `f1`, `f2`, `f3`...) continuing after highest existing sequence numbers.
- **Requirement Coverage**: Evaluated strictly by checking explicit ID matches in `question.requirement_ids` via `analyzeRequirementCoverage()`. Never uses LLM self-reporting or semantic embeddings.
- **Coverage Repair Trigger**: Automatically detected by `findUncoveredMustRequirementIds()`. Triggers a second pass if `uncoveredMustRequirementIds.length > 0`.
- **Schedule Allocation & Durations**: Calculated by `allocateStudySchedule()` using a two-tiered scoring formula (Priority weight 100/20/0 + Difficulty weight 10/20/30) and score-ranked round-robin assignment. Study minutes are exact integer sums.
- **Structural Validation**: Validated via `validateInterviewPrepKit()` Zod schema before database save or CLI output writing.
- **Ownership & Persistence**: Database operations strictly append `{ userId }` filters to MongoDB queries to prevent cross-tenant access.

---

## 6. Research and Generation Sequence

The kit generation workflow follows a 12-step sequential pipeline:

```text
1. Input Validation          → Validates JD character length, prep timeframe (1-60 days), and company URL safety.
2. Requirement Extraction     → Parses JD into role specs and categorized requirements (technical/behavioural/domain, must/nice).
3. Company Research          → SSRF-safe crawling of company homepage and top internal links respecting robots.txt.
4. Discussion Search Adapter  → Invokes non-fatal public discussion adapter (returns stub warning code NO_PUBLIC_INTERVIEW_DISCUSSION).
5. Company Brief Synthesis   → Generates company summary and what-they-do strictly grounded in verified retrieved pagesUsed.
6. Category Question Synth   → Synthesizes questions in separate prompts for technical, behavioural, system-design, & company-fit.
7. Initial Coverage Analysis  → Evaluates requirement coverage with pure deterministic TypeScript code.
8. Targeted 2nd Pass Repair  → Synthesizes targeted questions for missing must requirements (coverage.passes marked as 2).
9. Flashcard Synthesis       → Generates high-yield active-recall study flashcards linked to valid requirement IDs.
10. Schedule Allocation      → Allocates questions and integer study durations across days using pure code allocation.
11. Structural Zod Validation → Validates complete assembled kit payload against validateInterviewPrepKit schema.
12. Persistence / Output     → Saves to MongoDB with optimistic concurrency OR outputs to batch evaluation JSON file.
```

---

## 7. Security and Reliability

Verifiable security controls implemented in the codebase:
- **Password Hashing**: Passwords encrypted using `bcryptjs` with 12 salt rounds. `passwordHash` uses `select: false` in Mongoose schema to prevent query serialization.
- **Cookie Security**: JWT tokens stored strictly in `httpOnly` cookies with `sameSite: "lax"` and `path: "/"`.
- **Ownership Scoping**: All user-facing MongoDB queries (`find`, `findById`, `updateOne`, `deleteOne`) strictly enforce `{ userId }` filters.
- **CORS Restrictions**: Configured via Express middleware to allow only the origin specified in `CLIENT_URL` with `credentials: true`.
- **SSRF Protection**: `validateCompanyUrl` blocks IPv4/IPv6 private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`), metadata IPs (`169.254.169.254`), embedded credentials, and non-HTTP schemes in production.
- **HTML Fetch Safeguards**: Enforces `text/html` Content-Type, 1 MB maximum response byte limit, 8-second request timeout, and exponential backoff retry (400ms, 800ms, 1600ms capped at 5s) for transient 408/429/5xx errors.
- **Robots.txt Handling**: Configured user-agent rules take priority over wildcard `*`. Crawl-delay capped at 5000ms. Disallowed homepages short-circuit with safe warning `ROBOTS_DISALLOWED`.
- **Prompt Injection Defense-in-Depth**: Sanitizes control characters, strips null bytes, truncates safely at surrogate pairs, wraps untrusted JD/research text in `<job_description>` / `<company_research>` XML tags with explicit boundary instructions, and validates extracted skills against source text grounding.
- **Error Privacy**: Central error handler (`errorHandler.ts`) logs internal errors securely while returning safe, structured error envelopes (`code`, `message`, `requestId`) to clients without stack traces.
- **Zero-Secret Commit Policy**: Secrets (`MONGODB_URI`, `JWT_SECRET`, `LLM_API_KEY`) are loaded via server-side environment variables and are excluded from git repositories via `.gitignore`.

---

## 8. Data Model

The database topology uses **3 MongoDB collections**:

```text
users
  ├── _id: ObjectId
  ├── email: String (unique, lowercased, indexed)
  ├── passwordHash: String (select: false)
  └── timestamps

kits
  ├── _id: ObjectId
  ├── userId: ObjectId (indexed, ref: User)
  ├── generationStatus: "draft" | "generating" | "ready" | "failed"
  ├── requestFingerprint: String (indexed)
  ├── sourceMetadata: { company_url, days, jd_chars, jd }
  ├── kit: Mixed (embedded full InterviewPrepKit when ready; null when failed)
  ├── generationError: { code, message } (null unless failed)
  ├── warnings: [{ code, message }]
  ├── researchSnapshot: Mixed (optional bounded snapshot)
  ├── __v: Number (Mongoose optimistic concurrency version)
  └── timestamps (updatedAt indexed with userId: { userId: 1, updatedAt: -1 })

flashcard_progress
  ├── _id: ObjectId
  ├── userId: ObjectId (ref: User)
  ├── kitId: ObjectId (ref: Kit)
  ├── flashcardId: String
  ├── confidence: Number (1 | 2 | 3)
  ├── covered: Boolean
  ├── lastSeenAt: Date
  └── timestamps
  UNIQUE COMPOUND INDEX: { userId: 1, kitId: 1, flashcardId: 1 }
```

### Data Architecture Decisions:
- **Embedded Kit Document**: Requirements, questions, flashcards, and schedule are stored as an **embedded document** inside `kits.kit` because they form an atomic interview prep unit. This prevents partial reads/writes and eliminates multi-collection joins.
- **Separated Flashcard Progress**: Flashcard review ratings (`confidence`, `covered`, `lastSeenAt`) are stored in a **separate `flashcard_progress` collection** because card reviews occur frequently during study sessions, avoiding write-lock contention on the parent kit.
- **Optimistic Concurrency**: Mongoose `optimisticConcurrency: true` tracks document versions via `__v`, returning HTTP 409 `KIT_CONFLICT` if a client submits stale edits.

---

## 9. Test & Empirical Verification Evidence

### Command Execution Log

#### 1. Vitest Unit Test Suite (`npm run test`)
- **Command**: `npm run test`
- **Result**: `43 passed (43 test files)`
- **Total Tests**: `244 passed (244 unit tests)`
- **Duration**: `9.51 seconds`
- **Exit Code**: `0`
- **Execution Mode**: 100% in-memory execution (zero network, zero production DB, zero LLM calls).

#### 2. Production Build (`npm run build`)
- **Command**: `npm run build`
- **Result**: Compiled `@interview-prep/shared` (`tsc`), `@interview-prep/backend` (`tsc`), `@interview-prep/frontend` (`next build`). Generated static/dynamic routes (`/`, `/_not-found`, `/dashboard`, `/kits/[id]`, `/kits/[id]/practice`, `/kits/new`, `/login`, `/register`).
- **Exit Code**: `0`

#### 3. Workspace Type & Lint Checks (`npm run lint`)
- **Command**: `npm run lint`
- **Result**: `tsc --noEmit` on frontend and backend workspaces completed with **0 errors**.
- **Exit Code**: `0`

#### 4. Batch Evaluation CLI Execution (`npm run evaluate`)
- **Command**: `npm run evaluate -- --input examples/cases.sample.json --output output/final-project-audit-kits.json`
- **Result**: Processed input test cases sequentially (`case-senior-backend`, `case-frontend-react`), handled Gemini API free-tier capacity limits (code 503) gracefully by recording formatted error JSON payloads (`"status": "failed"`, `"error": { "code": "LLM_PROVIDER_ERROR" }`), written to output file, and exited with status code `0`. (Note: In-memory evaluation test suite `evaluate.test.ts` passed 4/4 tests cleanly in unit test suite).

---

## 10. Deployment Evidence

### Documented Live Deployment References (From Repository Docs)
- **Frontend URL**: [https://assignment-frontend-tawny-nu.vercel.app](https://assignment-frontend-tawny-nu.vercel.app)
- **Backend API URL**: [https://assignment-production-46b3.up.railway.app](https://assignment-production-46b3.up.railway.app)
- **Backend Health Check**: [https://assignment-production-46b3.up.railway.app/health](https://assignment-production-46b3.up.railway.app/health)
- **GitHub Repository**: `[ADD VERIFIED GITHUB REPOSITORY URL]`

### Documented Railway Backend Smoke Test Results (`docs/railway-smoke-test.md`)
- `GET /health` returned HTTP 200 `{ "status": "ok", "service": "api", ... }`
- `GET /api/kits` returned HTTP 401 Unauthorized with structured error envelope
- `OPTIONS /api/kits` returned HTTP 204 with CORS credentials headers
- `GET /api/unknown-route` returned HTTP 404 with structured error envelope

---

## 11. Known Limitations

1. **Public Interview Discussion Adapter**: The public forum search adapter is implemented as a safe non-fatal stub emitting warning code `NO_PUBLIC_INTERVIEW_DISCUSSION`. Commercial search APIs can be connected without altering downstream kit generation.
2. **Synchronous Generation Lifecycle**: Kit generation executes synchronously within the POST HTTP request lifecycle. A background queue (e.g. BullMQ + Redis) is recommended for high-concurrency production deployments.
3. **Free-Tier Gemini API Capacity Limits**: When running on free-tier LLM keys, upstream Gemini model capacity limits (HTTP 503 / 429) trigger exponential retry backoff. If capacity remains unavailable, the system degrades safely by returning an `LLM_PROVIDER_ERROR` envelope without crashing or corrupting database records.
4. **Live UI Verification**: Automated test suites verify 100% of backend and shared code in memory. Manual browser walkthrough is recommended for live deployment end-to-end verification.

---

## 12. Verification Checklist

### Local Command Verification
- [x] `npm install` completes cleanly with workspace symlinks
- [x] `npm run test` passes 100% (244 unit tests / 43 test files)
- [x] `npm run build` compiles shared, backend, and frontend packages with 0 errors
- [x] `npm run lint` passes with 0 TypeScript/lint errors
- [x] `npm run evaluate` executes batch CLI without crashing

### Authentication & API Verification
- [x] Password hashing with bcrypt 12 salt rounds
- [x] HTTP-only JWT authentication cookie issuance
- [x] Unauthenticated requests return HTTP 401 with structured error envelope
- [x] User-scoped resource authorization enforcement

### Retrieval & Safety Verification
- [x] SSRF URL validation blocking private/loopback IPs in production
- [x] Robots.txt User-Agent precedence and Crawl-delay capping
- [x] Cheerio HTML script/style stripping without JavaScript execution
- [x] Prompt injection XML framing and grounded skill extraction filter

### Generation & Scheduling Verification
- [x] Sequential requirement ID assignment (`r1`, `r2`, `r3`...)
- [x] Category-isolated question synthesis (`technical`, `behavioural`, etc.)
- [x] Code-based requirement coverage analysis
- [x] Targeted 2nd pass coverage repair for missing must requirements
- [x] Pure TypeScript score-ranked round-robin study schedule allocation

### Builder & Practice Mode Verification
- [x] Debounced builder autosave with optimistic conflict detection (HTTP 409)
- [x] Category regeneration preserving user-created, edited, and pinned questions
- [x] Deterministic zero-LLM schedule regeneration
- [x] Flashcard practice mode confidence rating tracking (1 / 2 / 3)

### Live Environment Verification
- [x] Documented Railway health check endpoint response
- [ ] Manual live end-to-end user signup and generation walkthrough (Requires live user execution)

---

## 13. Submission Assets

- **GitHub Repository**: `[ADD VERIFIED GITHUB REPOSITORY URL]`
- **Frontend Vercel URL**: [https://assignment-frontend-tawny-nu.vercel.app](https://assignment-frontend-tawny-nu.vercel.app)
- **Backend Railway Health Check**: [https://assignment-production-46b3.up.railway.app/health](https://assignment-production-46b3.up.railway.app/health)
- **Documentation**: [`README.md`](file:///c:/Users/DELL/OneDrive/Desktop/assignment/README.md), [`docs/final-project-evidence-report.md`](file:///c:/Users/DELL/OneDrive/Desktop/assignment/docs/final-project-evidence-report.md)
- **Walkthrough Video**: `[ADD VERIFIED WALKTHROUGH VIDEO LINK]`

---

## 14. Appendix: Exact Verification Commands

```bash
# Install all workspace dependencies
npm install

# Run local development servers (Frontend: 3000, Backend: 5000)
npm run dev

# Run full Vitest unit test suite (244 tests)
npm run test

# Run production workspace build
npm run build

# Run type check & lint verification
npm run lint

# Run offline batch evaluation CLI
npm run evaluate -- --input examples/cases.sample.json --output output/kits.sample.json

# Run optional Railway live smoke test (if backend is running on Railway)
npm run smoke:railway -- --base-url https://assignment-production-46b3.up.railway.app
```
