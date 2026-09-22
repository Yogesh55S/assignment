# AI Interview Prep Kit

A production-minded, full-stack TypeScript platform designed to transform job descriptions and target company URLs into structured, high-yield interview preparation kits complete with tailored questions, active-recall flashcards, and a day-by-day study schedule.

> **Engineering Assessment Note**: This repository represents **Phase 1 Foundation, Phase 2 Deterministic Coverage & Scheduling Engine, Phase 3 Secure Company Research & Partial-Failure Crawler, Phase 4 Structured LLM Kit Generation, Coverage Repair & Batch Evaluation CLI, and Phase 5 Next.js Kit Creation, Builder UI, Section Regeneration & Flashcard Practice Mode**. It provides a robust, type-safe architecture, complete shared data models, schema validation, HTTP-only cookie authentication, database models, pure deterministic requirement coverage analysis, deterministic study schedule allocation, schedule consistency validation, SSRF-safe web retrieval, robots.txt compliance, Cheerio-based HTML cleaning, internal link discovery & ranking, Gemini-powered structured output generation, category-specific interview question synthesis, targeted second-pass must-have coverage repair, active recall flashcards, company briefs, deduplicated request persistence, the complete batch evaluation CLI runner, interactive kit creation form with stepper, full-featured kit builder with inline editing, debounced autosave with optimistic concurrency conflict detection, question reordering & category transfer, targeted section regeneration with user edit preservation, and active-recall flashcard practice mode with confidence tracking.

---

## Repository structure

```text
frontend/  - Next.js + Tailwind user interface
backend/   - Express API, MongoDB, Gemini, crawler, auth and batch CLI
shared/    - shared schemas, domain types, coverage and schedule code
```

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

## Deployment

```text
Frontend deployment:
- Platform: Vercel
- Repository: this monorepo
- Root Directory: frontend

Backend deployment:
- Platform: Any normal Node.js host
- Repository: this monorepo
- Build from repository root because backend uses shared/
- Start command: npm run start --workspace backend
- Health endpoint: /health
```

## Mandatory batch command

```bash
npm run evaluate -- --input <cases.json> --output <kits.json>
```

> **Key Deployment & Architecture Notes**:
> - **Single Repository**: Exactly one GitHub repository contains separately deployable `frontend` and `backend` workspaces.
> - **Separate Live Deployment URLs**: Both frontend and backend have separate live deployment URLs (e.g. Vercel for frontend, any Node host for backend).
> - **Environment Hygiene**: Secrets (`MONGODB_URI`, `JWT_SECRET`, `LLM_API_KEY`) are configured strictly in local or hosting environment variables and are never committed or exposed to the client.
> - **Root Evaluation**: The backend CLI and automated test suite run directly from a clean clone of the repository root.

---

## 1. Project Overview

The **AI Interview Prep Kit** enables candidates to prepare systematically for technical and behavioral interviews. A user provides:
1. A raw job description (JD)
2. A company homepage or careers URL
3. The number of days remaining until the interview (1–60 days)

The system is architected to perform automated company and role research, extract prioritized competencies, generate interview questions with answer outlines, generate active recall flashcards, conduct deterministic coverage checks, and generate a day-by-day schedule optimized for the time available.

---

## 2. Scope of Current Implementation

### What IS Implemented:
- **Phase 1 Foundation**:
  - **Monorepo Architecture**: Single repository with npm workspaces (`frontend`, `backend`, `shared`), root orchestration, and shared ESM packages.
  - **Next.js Frontend Scaffold**: Responsive Next.js App Router frontend built with React, Tailwind CSS, TypeScript, and accessible components (`AuthForm`, `Header`, `EmptyState`, `ErrorAlert`, `LoadingState`).
  - **Express Backend Scaffold**: Production-grade Express REST API with TypeScript, Helmet, scoped CORS, cookie parsing, request ID tracing, and secure request logging.
  - **MongoDB & Mongoose Foundation**: Explicit connection management, retry/timeout controls, graceful shutdown hooks, and schema models (`User`, `Kit`, `FlashcardProgress`) with compound indexes.
  - **Authentication**: Email/password registration and login with bcrypt password hashing, 7-day signed JWT stored exclusively in HTTP-only cookies, and session verification (`/api/auth/me`).
  - **Shared Domain Models**: Exact TypeScript data definitions conforming to the assessment specification (`InterviewPrepKit`, `Requirement`, `InterviewQuestion`, `Flashcard`, `ScheduleDay`, `EvaluationCase`, `EvaluationOutput`).
  - **Strict Zod Validation**: Complete schema enforcement verifying integer bounds, non-empty IDs, uniqueness, referential integrity between questions/flashcards/schedule and requirements, and input bounds.
  - **Protected API Scaffolding**: Structured endpoints for `/health`, `/api/auth/*`, and `/api/kits` returning typed JSON and standard error envelopes.
  - **Secure Configuration**: Zero-secret code guarantee, `.env.example` templates, strict `.gitignore` rules, and deferred server-side environment validation.
- **Phase 2 Deterministic Engine**:
  - **Deterministic Coverage Analysis**: `analyzeRequirementCoverage`, `findUncoveredMustRequirementIds`, `findUncoveredRequirementIds`, `hasCompleteMustCoverage`. Strictly code-based via `question.requirement_ids` without LLMs or embeddings.
  - **Deterministic Schedule Allocation**: `allocateStudySchedule`, `calculateQuestionSchedulingScores`. Round-robin allocation prioritizing must-haves and higher difficulty, integer durations, and focus labeling.
  - **Schedule Validation Engine**: `validateStudySchedule` verifying day counts, sequential ordering, non-negative integer minutes, question presence, and must-requirement coverage without throwing exceptions.
- **Phase 3 Secure Company Research & Retrieval**:
  - **SSRF / URL Safety Service**: `validateCompanyUrl`, `isPrivateOrLoopbackHostname`, `isPrivateOrLoopbackIp`. Rejects private/loopback/metadata addresses in production, validates HTTP/HTTPS, normalizes URLs, strips fragments, rejects embedded credentials, and allows local addresses only when `ALLOW_LOCAL_FETCH=true`.
  - **Robots.txt Parser & Compliance**: `getRobotsUrl`, `parseRobotsTxt`, `isPathAllowedByRobots`, `getRobotsRules`. Supports exact User-Agent and wildcard `*`, parses Disallow/Allow/Crawl-delay, handles 404 as allow-all, non-fatal fetch failure warning, and caps delay at 5000ms.
  - **Safe Fetching & Retry Policy**: `fetchHtmlPage`, `shouldRetryHttpStatus`, `getRetryDelayMs`. HTML content-type enforcement (`text/html`, `application/xhtml+xml`), 1MB size limit pre- and post-read, 8s timeout, exponential backoff (400ms, 800ms, 1600ms, capped at 5s) on 408/429/5xx, no retry on 404, rate limiter integration.
  - **HTML Cleaning**: `cleanHtmlToPage`. Cheerio-based extraction of title and main visible text, removal of scripts, styles, noscript, svg, iframe, canvas, nav, footer, header, form, button, input, dialog, aside, cookie/consent banners, whitespace normalization, and safe surrogate-pair 20,000 char truncation. Content is treated strictly as passive data.
  - **Internal Link Discovery**: `extractInternalLinks`. Discovers `a[href]` links from actual HTML pages, resolves relative links with base URL (including path prefixes), strips fragments, skips assets/non-http schemes, computes `sameOrigin`, and normalizes duplicates.
  - **Deterministic Link Ranking**: `rankCompanyLinks`. Ranks same-origin non-nofollow links using URL path and anchor text with keyword weights (+14 interview, +12 hiring, +7 company, +5 engineering, -15 privacy/terms/login), classifies purpose, excludes non-positive links, and sorts deterministically.
  - **Partial-Failure-Safe Crawler**: `crawlCompanySite`. Coordinates validation, robots checking, homepage retrieval, link extraction & ranking, and candidate page crawling (max 8 pages). Continues gracefully on individual page failures, flags warnings, and identifies hiring pages.
  - **Research Service Facade**: `researchCompany` facade ready for future kit-generation and batch evaluation pipelines.
- **Phase 4 Structured Generation, Coverage Repair & Batch Evaluation CLI**:
  - **Gemini Structured Output Client**: Server-side Google Gemini REST API client with retry backoff (750ms, 1500ms, 3000ms), error taxonomy, and 1-pass JSON repair mechanism. Zero key logging.
  - **Untrusted Prompt Framing**: `sanitizeUntrustedContent` strips control characters, normalizes whitespace, truncates at safe surrogate pair boundaries, and wraps all external JD/research text in strict untrusted data sections.
  - **Stable Code-Assigned IDs**: `assignRequirementIds` (r1, r2...), `assignQuestionIds` (q1, q2...), `assignFlashcardIds` (f1, f2...). Deduplicates references and preserves order.
  - **Request Fingerprinting**: `createRequestFingerprint` generates SHA-256 hashes of user ID, normalized JD, company URL, and days.
  - **Role & Requirement Extraction**: `extractRoleFromJobDescription` extracts title, seniority, location, responsibilities, and classified requirements (`technical`/`behavioural`/`domain`, `must`/`nice`). Honest thin output for brief JDs.
  - **Company Brief Synthesis**: `generateCompanyBrief` synthesizes summary and what they do strictly from verified `pagesUsed`.
  - **Public Interview Discussion Adapter**: `findPublicInterviewDiscussion` safe non-fatal adapter emitting `NO_PUBLIC_INTERVIEW_DISCUSSION` warning.
  - **Category-Specific Question Generation**: `generateQuestionsForCategory` generates questions separately by category (`technical`, `behavioural`, `system-design`, `company-fit`), enforcing requirement ID links and removing duplicates.
  - **Targeted Second-Pass Coverage Repair**: `generateQuestionsForRequirementGaps` detects uncovered must-have requirements and generates targeted questions in a 2nd pass (`coverage.passes: 2`).
  - **Active Recall Flashcards**: `generateFlashcards` generates high-yield revision cards linked to valid requirement IDs.
  - **Deterministic Schedule & Kit Validation**: Assembles schedule via `allocateStudySchedule` and validates complete kit with `validateInterviewPrepKit` before persistence.
  - **Deduplicated Persistence**: `POST /api/kits` returns existing ready kits (HTTP 200), in-progress kits (HTTP 202), or creates and executes generation (HTTP 201). Added `GET /api/kits/:id/status`.
  - **Mandatory Batch Evaluation CLI**: `npm run evaluate -- --input <cases.json> --output <kits.json>` processes test cases sequentially with stderr progress logging, continues on individual case errors, and outputs exact `version: "1.0"` format.
- **Phase 5 Next.js Kit Creation, Builder UI, Section Regeneration & Flashcard Practice Mode**:
  - **Internal Metadata Architecture (`_meta`)**: Non-breaking metadata tags (`origin: "generated" | "user"`, `edited: boolean`, `pinned: boolean`) on questions, flashcards, and company brief. Stripped recursively via `stripInternalKitMetadata()` for pure Appendix A outputs.
  - **Interactive Creation Flow (`/kits/new`)**: Accessible form with live character counters, client validation, stage-by-stage progressive visual stepper, and handling of 201 created / 202 queued status polling.
  - **Complete Kit Builder (`/kits/[id]`)**: Full interactive workspace with debounced manual/autosave (800ms idle), explicit save button, conflict detection (HTTP 409 `KIT_CONFLICT`), unsaved changes warnings (`beforeunload`), and collapsible research warnings.
  - **Inline Editing**: Live editing of company brief summary/what they do, question prompts/outlines, and flashcard fronts/backs.
  - **Question Management**: Reordering questions (move up / move down), transferring questions across categories, adding custom user questions with requirement multi-select, pin/unpin toggling, and question deletion with schedule recalculation warnings.
  - **Flashcard Management**: Adding custom flashcards, editing front/back text, and deleting flashcards.
  - **Preservation-Aware Section Regeneration (`POST /api/kits/:id/regenerate`)**:
    - *Company Brief*: Preserves user edits by default unless explicitly confirmed (`replaceEdited: true`).
    - *Question Category*: Replaces only unedited, unpinned generated questions in the chosen category. Strictly protects user-created, edited, and pinned questions. Runs deterministic coverage check and targeted gap repair if must requirements became uncovered. Deterministically recalculates schedule.
    - *Schedule*: Pure code recalculation of schedule days and question allocations via `allocateStudySchedule` without calling Gemini.
  - **Active-Recall Practice Mode (`/kits/[id]/practice`)**:
    - Focus study session sorting cards by uncovered $\rightarrow$ low confidence (1 $\rightarrow$ 2 $\rightarrow$ 3) $\rightarrow$ older lastSeenAt.
    - Single-card active recall interface with answer reveal and confidence rating buttons.
    - Full keyboard accessibility (Space to reveal, 1/2/3 to rate, Left/Right arrow keys to navigate).
    - Real-time progress bar, covered counters, and session restart.
  - **Persistence & Ownership**: `PATCH /api/kits/:id`, `DELETE /api/kits/:id`, `POST /api/kits/:id/practice`, and `GET /api/kits/:id/practice` with authenticated user-scoped ownership enforcement.
  - **Comprehensive Unit Tests**: 161 unit tests across 24 test files (100% in-memory pass rate).

### What is Intentionally NOT Implemented at This Phase:
- Public interview-discussion live web scraper (safe compliant adapter in place)
- Background worker queue (Redis / BullMQ) for offline queue processing
- Production cloud deployment infrastructure


---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| **Language** | TypeScript 5.7+ (NodeNext ESM throughout) |
| **Runtime** | Node.js (>= 20.0.0) |
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS |
| **Backend** | Express 4, Node.js, Helmet, CORS, Cookie-Parser, UUID |
| **Database** | MongoDB Atlas via Mongoose 8 |
| **Validation** | Zod 3 |
| **Auth** | bcryptjs (12 rounds) + JSON Web Tokens (HTTP-only cookies) |
| **Testing** | Vitest 3 |
| **Monorepo** | npm workspaces + concurrently |

---

## 4. Architecture Overview

```
                          ┌────────────────────────┐
                          │    Next.js Frontend    │
                          │   (localhost:3000)     │
                          └───────────┬────────────┘
                                      │ Native fetch (credentials: include)
                                      ▼
                          ┌────────────────────────┐
                          │    Express Backend     │
                          │   (localhost:5000)     │
                          └─────┬────────────┬─────┘
                                │            │
            Mongoose ODM        │            │ Imports
                                ▼            ▼
                   ┌─────────────────┐  ┌────────────────────────┐
                   │  MongoDB Atlas  │  │ @interview-prep/shared │
                   │  (User / Kit /  │  │ (Types, Zod Schemas,   │
                   │    Progress)    │  │       Constants)       │
                   └─────────────────┘  └────────────────────────┘
```

---

## 5. Project Structure

```text
/
├── frontend/                         # Next.js 14 App Router user interface
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/               # Login & register pages
│   │   │   ├── kits/                 # Kit builder & flashcard practice
│   │   │   ├── globals.css           # Tailwind & custom styles
│   │   │   ├── layout.tsx            # Root HTML layout with ThemeProvider
│   │   │   └── page.tsx              # Dashboard listing kits & creation form
│   │   ├── components/               # Accessible modular UI components
│   │   ├── hooks/                    # React hooks (auth, autosave, polling)
│   │   ├── lib/
│   │   │   └── api.ts                # Fetch client with credentials: include
│   │   ├── styles/
│   │   └── types/
│   ├── public/                       # Static public assets
│   ├── .env.local.example            # Safe public client env template
│   ├── next.config.mjs               # Config with transpilePackages for shared
│   ├── package.json                  # @interview-prep/frontend
│   ├── postcss.config.js
│   ├── README.md                     # Frontend guide & Vercel deployment instructions
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/                          # Express backend API, crawler, Gemini, batch CLI
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts           # Safe Mongoose connection & lifecycle
│   │   │   └── env.ts                # Zod-validated environment config loader
│   │   ├── controllers/              # Route handlers (auth, kits, practice)
│   │   ├── middleware/               # Auth, error handling, request logger
│   │   ├── models/                   # Mongoose schemas (User, Kit, FlashcardProgress)
│   │   ├── routes/                   # Express route definitions
│   │   ├── scripts/
│   │   │   └── evaluate.ts           # Mandatory batch evaluation CLI
│   │   ├── services/
│   │   │   ├── auth/                 # Bcrypt hashing & JWT issuance
│   │   │   ├── generation/           # Deliberate multi-step kit generation pipeline
│   │   │   ├── llm/                  # Gemini structured output client
│   │   │   ├── persistence/          # Kit & practice persistence services
│   │   │   └── research/             # SSRF-safe crawler & HTML cleaner
│   │   ├── utils/                    # AppError, stable ID generators, URL helpers
│   │   ├── validators/               # Input schemas
│   │   ├── app.ts                    # Express application factory
│   │   └── server.ts                 # Server entrypoint (0.0.0.0 binding)
│   ├── tests/
│   │   ├── fixtures/                 # Test fixtures
│   │   └── unit/                     # 24 Vitest unit test suites (161 tests)
│   ├── Dockerfile                    # Containerization for Node.js hosts
│   ├── package.json                  # @interview-prep/backend
│   ├── README.md                     # Backend API & host deployment docs
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── shared/                           # Pure domain types, Zod schemas, deterministic logic
│   ├── constants/                    # Token, cookie, and limit constants
│   ├── services/
│   │   ├── coverage/                 # Deterministic requirement coverage service
│   │   └── schedule/                 # Deterministic study schedule allocator
│   ├── types/                        # Pure TypeScript types (kit, editableKit)
│   ├── validators/                   # Strict Zod schemas & validators
│   ├── index.ts
│   ├── package.json                  # @interview-prep/shared
│   └── tsconfig.json
│
├── examples/                         # Sample batch evaluation input files
│   └── cases.sample.json
│
├── output/                           # Generated evaluation outputs (gitignored)
│   └── .gitkeep
│
├── docs/                             # Architectural & deployment documentation
│   ├── folder-refactor-plan.md
│   ├── deployment-guide.md
│   └── demo-checklist.md
│
├── .env.example                      # Root environment template (no real secrets)
├── .gitignore                        # Standardized ignore rules
├── package.json                      # Monorepo root with npm workspaces & scripts
├── package-lock.json
└── README.md
```

---

## 6. Prerequisites

- **Node.js**: Version 20.0.0 or higher (`node -v`)
- **npm**: Version 10.0.0 or higher (`npm -v`)
- **MongoDB Atlas** or local MongoDB instance (required only when running the live backend server)

---

## 7. Environment Setup

Copy the environment templates to their respective files:

```bash
# 1. Backend & Monorepo Root environment
cp .env.example .env

# 2. Frontend environment (optional for default localhost:5000)
cp frontend/.env.local.example frontend/.env.local
```

---

## 8. Safe Environment Variable Documentation

| Variable | Scope | Description | Safe Example |
|---|---|---|---|
| `NODE_ENV` | Server | Environment mode (`development` \| `production` \| `test`) | `development` |
| `PORT` | Server | HTTP port for the Express backend | `5000` |
| `MONGODB_URI` | **Server-Only** | MongoDB Atlas or replica set connection string. Never commit. | `mongodb+srv://user:pass@cluster.mongodb.net/prep` |
| `JWT_SECRET` | **Server-Only** | High-entropy random secret (32+ chars) used for signing JWTs. | *(generate via `openssl rand -base64 32`)* |
| `CLIENT_URL` | Server | Origin of the frontend application allowed by CORS | `http://localhost:3000` |
| `LLM_API_KEY` | **Server-Only** | API Key for LLM service (used in future generation phase). | `sk-proj-...` |
| `LLM_MODEL` | Server | Target LLM model name | `gemini-1.5-pro` |
| `ALLOW_LOCAL_FETCH` | Server | Set `true` for local assessment test URLs; `false` in production | `true` |
| `NEXT_PUBLIC_API_URL` | Client | Base URL for backend API calls from browser | `http://localhost:5000` |

> [!CAUTION]
> **CRITICAL SECURITY RULE**: `MONGODB_URI`, `JWT_SECRET`, and `LLM_API_KEY` must **NEVER** be committed to git, embedded in source code, added to client environment files, or exposed to the browser. Real secrets are kept only in local untracked `.env` files.

---

## 9. Local Installation

Install all workspace dependencies from the root directory:

```bash
npm install
```

This installs dependencies across `frontend`, `backend`, and `shared`, linking the `@interview-prep/shared` package automatically.

---

## 10. Running Frontend and Backend

### Concurrent Development (Both Frontend & Backend)
```bash
npm run dev
```
- Frontend will be available at: `http://localhost:3000`
- Backend API will be available at: `http://localhost:5000`

### Running Backend Independently
```bash
npm run dev --workspace backend
```

### Running Frontend Independently
```bash
npm run dev --workspace frontend
```

### Production Build
```bash
npm run build
```
This compiles `@interview-prep/frontend` (Next.js production bundle) and `@interview-prep/backend` (`tsc` TypeScript compilation to `dist/`).

---

## 11. Health Endpoint Verification

The health check endpoint is public, requires no authentication, and never exposes database connection details or secrets.

```bash
curl http://localhost:5000/health
```

**Expected JSON Response (HTTP 200)**:
```json
{
  "status": "ok",
  "service": "api",
  "timestamp": "2026-09-22T08:35:41.488Z"
}
```

---

## 12. Authentication Endpoints

All authentication cookies are set with:
`httpOnly: true`, `sameSite: "lax"`, `path: "/"`, and `secure: true` (only when `NODE_ENV === "production"`).

### 1. Register a new user
- **Endpoint**: `POST /api/auth/register`
- **Body**:
  ```json
  {
    "email": "candidate@example.com",
    "password": "secure-password-123"
  }
  ```
- **Response (HTTP 201)**:
  ```json
  {
    "user": {
      "id": "673f1a2b...",
      "email": "candidate@example.com"
    }
  }
  ```
- *Sets HTTP-only cookie `token`.* Duplicate emails return `409 Conflict`.

### 2. Log in
- **Endpoint**: `POST /api/auth/login`
- **Body**:
  ```json
  {
    "email": "candidate@example.com",
    "password": "secure-password-123"
  }
  ```
- **Response (HTTP 200)**:
  ```json
  {
    "user": {
      "id": "673f1a2b...",
      "email": "candidate@example.com"
    }
  }
  ```
- *Sets HTTP-only cookie `token`.* Invalid credentials return generic `401 Unauthorized` ("Invalid email or password.").

### 3. Current Session
- **Endpoint**: `GET /api/auth/me`
- **Response (HTTP 200)**:
  ```json
  {
    "user": {
      "id": "673f1a2b...",
      "email": "candidate@example.com"
    }
  }
  ```
- *Returns `401 Unauthorized` if unauthenticated or token expired.*

### 4. Log out
- **Endpoint**: `POST /api/auth/logout`
- **Response (HTTP 200)**:
  ```json
  {
    "status": "ok",
    "message": "Successfully logged out."
  }
  ```
- *Clears the `token` cookie.*

---

## 13. Current API Endpoints

All application errors return a structured JSON response format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable safe explanation",
    "requestId": "uuid"
  }
}
```

| Method | Endpoint | Auth Required | Description | Status in Phase 4 |
|---|---|---|---|---|
| `GET` | `/health` | No | Service health check | Implemented (200) |
| `POST` | `/api/auth/register` | No | Register new user account | Implemented (201) |
| `POST` | `/api/auth/login` | No | Authenticate & issue cookie | Implemented (200) |
| `POST` | `/api/auth/logout` | No | Clear auth session cookie | Implemented (200) |
| `GET` | `/api/auth/me` | Yes | Get current user profile | Implemented (200/401) |
| `GET` | `/api/kits` | Yes | Get authenticated user's kits | Implemented (200) |
| `POST` | `/api/kits` | Yes | Generate new prep kit or reuse | Implemented (201/200/202) |
| `GET` | `/api/kits/:id` | Yes | Get specific kit details | Implemented (200/404) |
| `GET` | `/api/kits/:id/status` | Yes | Get generation status & error | Implemented (200/404) |
| `PATCH` | `/api/kits/:id` | Yes | Update kit contents | Scaffolded (501) |
| `DELETE` | `/api/kits/:id` | Yes | Delete a prep kit | Scaffolded (501) |

---

## 14. Testing

Run the automated test suite from the root directory:

```bash
npm run test
```

> **Assessment Guarantee**: All **142 unit tests across 19 suites** run purely in memory without requiring a live MongoDB connection, live Gemini API key, or public network access. Mocks and dependency-injected clients verify all deterministic and safety policies.

### Tested Scenarios:
1. **Valid Minimal Kit (`kitValidation.test.ts` - 6 tests)**: Complete schema verification, difficulty limits, integer minutes, and cross-field referential integrity.
2. **Health Endpoint (`health.test.ts` - 1 test)**: Confirms public availability, timestamp, and zero secret leakage.
3. **Coverage Analysis (`coverageService.test.ts` - 9 tests)**: Coverage computation, dangling ID rejection, integer rounding, and must-coverage certification.
4. **Schedule Allocation (`scheduleService.test.ts` - 16 tests)**: Round-robin distribution, priority & difficulty scoring, 1-day to 60-day support, empty day review blocks, and deep determinism.
5. **Schedule Validation (`scheduleValidation.test.ts` - 9 tests)**: Non-throwing verification of day counts, sequence, minutes, and must-requirement scheduling.
6. **URL Safety & SSRF (`urlSafety.test.ts` - 18 tests)**: Scheme checks, loopback/private/metadata rejection, and development localhost handling.
7. **HTML Cleaning (`htmlCleaner.test.ts` - 7 tests)**: Script/style/banner removal, entity decoding, whitespace normalization, and inert prompt-injection handling.
8. **Link Extraction (`linkExtractor.test.ts` - 8 tests)**: Discovered relative links, path prefix preservation, and asset filtering.
9. **Link Ranking (`linkRanker.test.ts` - 8 tests)**: Keyword scoring (+14 interview, +12 hiring, +7 company, +5 engineering, -15 privacy), purpose classification, and tiebreaks.
10. **robots.txt Compliance (`robots.test.ts` - 8 tests)**: Specific user agent precedence, Allow overrides, Crawl-delay capping, and non-fatal fetch failure handling.
11. **Page Fetching & Retries (`fetchPage.test.ts` - 11 tests)**: Exponential backoff, HTML content-type enforcement, 1MB size limit pre/post-read, 404 non-retry, and 429 recovery.
12. **Company Crawler (`companyCrawler.test.ts` - 8 tests)**: Multi-page crawling, partial failure tolerance, and candidate page link following.
13. **Stable IDs (`stableIds.test.ts` - 5 tests)**: Sequential r1/q1/f1 assignment, custom offsets, deduplication, and zero input mutation.
14. **Request Fingerprinting (`requestFingerprint.test.ts` - 5 tests)**: Deterministic SHA-256 generation, whitespace/newline normalization, and parameter differentiation.
15. **Requirement Extraction (`requirementExtractionService.test.ts` - 4 tests)**: Fact extraction, priority classification, thin JD empty requirements, and untrusted framing.
16. **Question Generation (`questionGenerationService.test.ts` - 6 tests)**: Category mapping, invalid ID pruning, category enforcement, question deduplication, and targeted gap generation.
17. **Kit Pipeline (`kitPipeline.test.ts` - 4 tests)**: End-to-end kit generation, targeted must-have repair pass (`coverage.passes: 2`), unreachable research handling, and thin JD handling.
18. **Evaluation CLI (`evaluate.test.ts` - 4 tests)**: CLI argument parsing, input case validation, sequential processing, and batch continuation on case failure.
19. **Gemini Client & Structured Generation (`geminiClient.test.ts` - 5 tests)**: Config check, JSON parsing, 429 retry, 1-pass JSON repair, and invalid schema failure.

---

## 15. Batch Evaluation Command

The batch evaluation CLI executes the exact shared generation pipeline against an input array of evaluation cases:

```bash
npm run evaluate -- --input <cases.json> --output <kits.json>
```

### Input Format (`cases.json`):
```json
[
  {
    "id": "case-01",
    "jd": "Senior Backend Engineer with TypeScript, Node.js, and PostgreSQL...",
    "company_url": "http://localhost:8099/acme/",
    "days": 5
  }
]
```

### Output Format (`kits.json`):
```json
{
  "version": "1.0",
  "generated_at": "2026-09-22T10:00:00.000Z",
  "kits": [
    {
      "id": "case-01",
      "status": "ok",
      "kit": { /* Full valid InterviewPrepKit conforming to Zod schema */ },
      "error": null
    },
    {
      "id": "case-02",
      "status": "failed",
      "kit": null,
      "error": {
        "code": "COMPANY_UNREACHABLE",
        "message": "Company homepage could not be reached after all retries"
      }
    }
  ]
}
```

### Batch Execution Features:
- **Sequential Execution**: Cases are processed sequentially to respect API rate limits and avoid concurrency bursts.
- **Fault-Tolerant Continuation**: If an individual case fails (e.g. invalid input, timeout), the CLI logs the error to stderr, records `"status": "failed"`, and proceeds to the next case without crashing.
- **Local Fixture Support**: When `ALLOW_LOCAL_FETCH=true`, local HTTP fixture targets (e.g. `http://localhost:8099/...`) are supported for evaluation benchmarks.
- **Zero Database Dependency**: Operates in standalone mode (`skipPersistence: true`), eliminating database requirements for batch evaluations.
Evaluation pipeline is not implemented yet.
```
and exits cleanly with status code 0 without touching the database or network.

---

## 16. Deterministic Coverage and Schedule Design

The platform adopts a strict separation between stochastic LLM generation and deterministic verification/allocation logic:

### 1. Deterministic Requirement Coverage
- **Source of Truth**: Requirement coverage is calculated strictly from explicit references in `question.requirement_ids`. It **never** uses semantic embeddings, prompt wording, or natural-language model judgment.
- **Dangling ID Rejection**: Any references in questions to non-existent requirement IDs are ignored when computing coverage.
- **Must-Have Primacy**: Only `must` requirements are mandatory for complete coverage (`hasCompleteMustCoverage`). `nice` requirements are tracked and scored but do not block complete must-coverage certification.
- **Repair Loop Architecture**: The architecture conducts an initial generation pass, runs deterministic coverage analysis, and—in the future generation phase—will trigger exactly one targeted repair pass to generate questions specifically addressing `uncoveredMustRequirementIds`.
- **Zero-Mutation & Purity**: Input arrays and objects are never mutated; percentages are computed as rounded integers (0–100) with division-by-zero protection (e.g. 100% when total requirements is zero).

### 2. Deterministic Study Schedule Allocation
- **Pure Algorithm**: Question scoring, ordering, day allocation, and duration assignment are calculated via pure TypeScript functions without external calls, database queries, current clock access, or pseudo-randomness.
- **Two-Tiered Scoring**:
  - **Priority Weight**:
    - Linked to $\ge 1$ existing `must` requirement $\rightarrow$ `100` points.
    - Linked only to existing `nice` requirements $\rightarrow$ `20` points.
    - Linked to no valid requirements (dangling only) $\rightarrow$ `0` points.
  - **Difficulty Weight**:
    - Difficulty 1 $\rightarrow$ `10` points.
    - Difficulty 2 $\rightarrow$ `20` points.
    - Difficulty 3 $\rightarrow$ `30` points.
  - Total Score = Priority Weight + Difficulty Weight (range: 10 to 130).
- **Tie-Breaking**: When scores are tied, the original input order of the questions is preserved.
- **Round-Robin Day Allocation**:
  - Sorted questions are allocated round-robin: question index $i$ is assigned to day $(i \pmod{\text{daysAvailable}}) + 1$.
  - This guarantees that high-priority, high-difficulty questions appear in early study days.
  - Every unique question is scheduled exactly once. Duplicate raw question IDs in input are scheduled once (first occurrence wins).
- **Empty Days & Focus Labels**:
  - Days containing questions with must requirements receive the focus label: `"Must-have requirements"`.
  - Days containing only nice-to-have questions receive: `"Nice-to-have and supporting topics"`.
  - Empty days (when `daysAvailable > questions.length`) receive: `"Review and practice"` with configured `emptyDayMinutes` (default: 15).
- **Integer Minutes**: Non-empty day durations are the exact sum of question difficulty minutes (defaults: Diff 1 = 10m, Diff 2 = 15m, Diff 3 = 20m). Floating-point minutes are strictly forbidden.

### 3. Implementation Status
- **Implemented in Phase 2**: Coverage engine (`analyzeRequirementCoverage`, `findUncoveredMustRequirementIds`, `hasCompleteMustCoverage`), schedule allocator (`allocateStudySchedule`, `calculateQuestionSchedulingScores`), validation engine (`validateStudySchedule`), and 41 unit tests.
- **Intentionally Unimplemented**: Live web crawling, public forum search, Gemini/LLM prompt generation, UI kit builder forms, flashcard practice mode, and full batch evaluation file generation.

---

## 17. Company Research and Retrieval Design

The platform includes a dedicated, secure web research subsystem (`backend/src/services/research/`) that autonomously discovers, validates, retrieves, cleans, and ranks company information to anchor subsequent interview kit generation in real company context:

### 1. Input Validation & SSRF Protection
- **Scheme Restriction**: Accepts only `http://` and `https://` protocols. Automatically normalizes bare domains (e.g., `acme.com` $\rightarrow$ `https://acme.com/`).
- **Malformed & Credential Filtering**: Rejects empty strings, malformed URLs, and URLs with embedded user credentials (e.g., `user:pass@host`), preventing credential-smuggling attacks.
- **Normalization**: Strips fragments (`#...`), standardizes default ports (80/443), and preserves valid query parameters and subpaths.
- **Literal IP & Hostname Validation**:
  - Validates literal hostnames and IPv4/IPv6 representations without DNS resolution to eliminate DNS-based side-effects in unit tests.
  - Detects shorthand decimal, octal, hex, and single-integer representations of loopback and private networks.

### 2. Localhost & Development/Test Environment Handling
- **Production Mode (`NODE_ENV === "production"`)**:
  - Always strictly rejects `localhost`, `localhost.localdomain`, `*.localhost`, `*.local`.
  - Rejects loopback addresses (`127.0.0.0/8`, `::1`).
  - Rejects all private IPv4 ranges: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `0.0.0.0/8`.
  - Rejects IPv6 unique-local (`fc00::/7`) and link-local (`fe80::/10`) addresses.
  - Rejects cloud metadata and link-local service targets (`169.254.0.0/16`).
- **Development / Test Mode (`NODE_ENV !== "production"`)**:
  - Loopback and local addresses (such as `http://localhost:8099/acme/`) are permitted **only** when `ALLOW_LOCAL_FETCH=true`.
  - If `ALLOW_LOCAL_FETCH=false`, local and private addresses are rejected with `UNSAFE_COMPANY_URL` identically to production.

### 3. robots.txt Compliance & Parsing
- **Resolution**: Dynamically constructs `${origin}/robots.txt`.
- **Precedence**: Evaluates rules specific to the configured User-Agent (`AIInterviewPrepKit/1.0 (+educational-assessment)`) first; falls back to wildcard `*` if no specific group exists.
- **Directives Supported**:
  - `User-agent`: Case-insensitive token matching.
  - `Disallow`: Prefix-based path matching. Empty `Disallow:` is parsed as allow-all.
  - `Allow`: Allows overriding broader Disallow rules when the Allow path match is as specific or more specific than the Disallow match.
  - `Crawl-delay`: Parsed into milliseconds and capped at a maximum of 5000ms.
- **Error Tolerance**:
  - An HTTP 404 response for `robots.txt` is treated as allow-all without issuing warnings.
  - Network failures during robots retrieval generate a non-fatal `PAGE_FETCH_FAILED` warning, allowing the crawl to continue gracefully.
  - Homepage permission is evaluated before executing the homepage request; disallowed homepages abort the crawl with `ROBOTS_DISALLOWED`.

### 4. Fetch Constraints, Safety & Throttling
- **Native Fetch & Redirect Security**: Uses Node.js native `fetch` with `AbortController` timeouts. Follows redirects, but strictly verifies the `finalUrl` after redirect to ensure it remains valid, safe, and on the same origin as the target company.
- **Content-Type Filter**: Only accepts `text/html` or `application/xhtml+xml`. Rejects binary assets, JSON, PDFs, and media files with `UNSUPPORTED_CONTENT_TYPE`.
- **Response Size Limits**: Enforces a strict 1,000,000-byte (1 MB) ceiling both via `Content-Length` header pre-checks and actual post-read UTF-8 byte length verification (`CONTENT_TOO_LARGE`).
- **Deterministic Exponential Backoff**:
  - Retries transient failures: timeouts, network drops, and HTTP 408, 429, 5xx.
  - Backoff delays: Attempt 1 = 400ms, Attempt 2 = 800ms, Attempt 3 = 1600ms, capped at 5000ms.
  - Respects numeric `Retry-After` headers.
  - HTTP 404 immediately throws `PAGE_NOT_FOUND` and is **never** retried.
- **Request Throttling**: The crawler implements an active rate limiter before every fetch (including retries), enforcing `effectiveDelayMs = Math.max(requestDelayMs, robots.crawlDelayMs)`.

### 5. HTML Cleaning & Untrusted Content Handling
- **Cheerio DOM Sanitization**:
  - Removes non-content and layout elements: `script`, `style`, `noscript`, `svg`, `iframe`, `canvas`, `nav`, `footer`, `header`, `form`, `button`, `input`, `select`, `textarea`, `dialog`, `aside`.
  - Strips HTML comments and obvious cookie/consent/modal banners (`[id*='cookie' i]`, `[class*='cookie' i]`, `[aria-modal='true']`, `[role='dialog']`).
  - Converts block-level elements (`p`, `h1`-`h6`, `div`, `li`, `br`) into clean block boundaries without allowing words to merge.
  - Decodes HTML entities and normalizes multi-whitespace sequences.
  - Truncates extracted text to 20,000 characters with UTF-16 surrogate pair protection.
- **Untrusted Data Guarantee**:
  - All retrieved and cleaned text is treated strictly as passive, untrusted string data.
  - Webpage instructions, prompt overrides (e.g. "Ignore previous instructions"), and scripts are never evaluated, interpreted, or executed.

### 6. Internal Link Discovery & Keyword Ranking
- **Real Discovery over Guessing**: Discovered links are parsed directly from `a[href]` tags on the retrieved HTML homepage. The crawler **never** relies on hard-coded or guessed paths.
- **Relative Link Resolution**: Accurately resolves relative and root-relative paths against the page URL, preserving subpath prefixes (e.g. `http://localhost:8099/acme/` + `careers` $\rightarrow$ `http://localhost:8099/acme/careers`).
- **Asset & Scheme Pruning**: Skips `mailto:`, `tel:`, `javascript:`, `#` fragments, and static file extensions (`.pdf`, `.png`, `.jpg`, `.css`, `.js`, `.woff2`, etc.).
- **Deterministic Keyword Scoring**:
  - Links are evaluated based on URL path, query, and anchor text.
  - Interview signals (`interview`, `interviews`, `hiring-process`, `recruiting`): `+14`
  - Career/job signals (`career`, `careers`, `job`, `jobs`, `hiring`, `join`, `work-with-us`): `+12`
  - Application signals (`application`, `apply`, `candidate`): `+7`
  - Company signals (`about`, `company`, `mission`, `values`, `culture`, `team`, `who-we-are`): `+7`, `handbook`: `+6`
  - Tech signals (`engineering`, `tech`, `technology`, `blog`, `architecture`): `+5`
  - Negative signals (`privacy`, `terms`, `cookie`, `login`, `signin`, `signup`, `legal`, `security`): `-15`
  - Deprioritized signals (`press`, `news`, `events`): `-4`
- **Purpose Classification & Filtering**:
  - Links with net scores $\le 0$, external links, `rel="nofollow"` links, and the homepage itself are excluded.
  - Purpose is classified into `interview`, `hiring`, `company`, `engineering`, or `other`.
  - Links are sorted deterministically: score descending $\rightarrow$ purpose priority $\rightarrow$ URL ascending.

### 7. Partial Failure Handling
- **Graceful Continuation**: If an individual ranked page returns 404, times out, or fails security checks, the crawler records a structured warning and advances to the next candidate link rather than aborting.
- **Non-Fatal Missing Pages**: A company site without a discoverable hiring page returns a completed research result (`completed: true`) with a structured `NO_HIRING_PAGE_FOUND` warning.
- **Fatal Homepage Failures**: If the homepage itself cannot be reached or is disallowed by `robots.txt`, the crawler marks `completed: false` and emits `COMPANY_UNREACHABLE` or `ROBOTS_DISALLOWED`.

### 8. Phase 3 & 4 Progression
With Phase 4 completed, the research service powers both real API kit creation and the offline batch evaluation CLI runner.

---

## 18. LLM Structured Generation, Coverage Repair & Batch Evaluation Engine

The platform introduces a production-grade LLM orchestration and evaluation subsystem (`backend/src/services/llm/`, `backend/src/services/generation/`, and `backend/src/scripts/evaluate.ts`).

### 1. LLM Provider & Security Architecture
- **Provider & Model**: Powered by Google Gemini models (default: `gemini-1.5-flash`, configurable via `LLM_MODEL`).
- **Server-Side Exclusivity**: LLM calls execute strictly on the Express backend via native REST API requests. Keys (`LLM_API_KEY`) and models are never sent to or accessible by client browsers.
- **Zero-Secret Guarantee**: API keys, auth headers, full prompts, and raw HTML bodies are strictly omitted from application logs and error traces.
- **Resilient Transport & Exponential Backoff**: Transient errors (HTTP 429, 500, 502, 503, 504, network drops, timeouts) undergo exponential backoff (750ms, 1500ms, 3000ms capped at 5000ms) with support for `Retry-After` headers.
- **1-Pass Structured JSON Repair**: If model output deviates from the expected Zod schema, a single structured repair prompt is dispatched asking the model to fix the JSON formatting without inventing new facts. Unrecoverable schemas throw safe `LLM_INVALID_RESPONSE` errors.

### 2. Deliberate Kit Generation Sequence
The kit generation pipeline (`kitPipeline.ts`) executes a strict sequential workflow:
1. **Input Validation**: Verifies JD length (non-empty, $\le 50,000$ chars), preparation days ($1 \le \text{days} \le 60$), and company URL safety.
2. **Requirement Extraction**: Parses job description into role title, seniority, location, responsibilities, and classified requirements (`technical`, `behavioural`, `domain`, prioritized into `must` vs `nice`).
3. **Company Research**: Safely fetches and cleans homepage and candidate links via SSRF-safe crawler.
4. **Public Discussion Search**: Invokes the safe non-fatal discussion adapter.
5. **Company Brief Synthesis**: Generates summary and business description strictly grounded in verified retrieved `pagesUsed`.
6. **Category-Specific Question Generation**: Generates interview questions in distinct, isolated prompts by category:
   - `technical` for technical competencies
   - `behavioural` for collaboration, mentoring, and leadership competencies
   - `company-fit` for domain knowledge and company culture
   - `system-design` for senior/technical roles where architecture or systems skills are specified
7. **Deterministic Initial Coverage Check**: Evaluates coverage of all requirements using pure code analysis (`analyzeRequirementCoverage`).
8. **Targeted Second-Pass Coverage Repair**:
   - If any `must` requirement lacks an associated interview question, the engine triggers a targeted gap-repair prompt exclusively addressing the missing requirement IDs.
   - Newly generated questions are deduplicated and assigned subsequent sequential IDs (`qN...`).
   - If repair is triggered, `coverage.passes` is marked as `2`; otherwise `1`. Endlessly looping repair cycles are strictly capped.
9. **Active Recall Flashcard Generation**: Synthesizes high-yield study flashcards linked to verified requirement IDs.
10. **Deterministic Study Schedule Allocation**: Calls `allocateStudySchedule` to allocate questions into study days based on priority and difficulty scores.
11. **Final Kit Structural Validation**: Validates the complete kit against the shared `validateInterviewPrepKit` Zod schema before returning or persisting.

### 3. Explicit Division of Responsibilities
| Responsibility | Controlled By | Notes |
|---|---|---|
| Role extraction & categorization | **LLM** | Bounded by strict Zod schema |
| Question & flashcard content | **LLM** | Must reference provided requirement IDs |
| Company brief synthesis | **LLM** | Grounded strictly in retrieved `pagesUsed` |
| Stable ID assignment (`r1`, `q1`, `f1`) | **Deterministic Code** | Generated sequentially; never by LLM |
| Requirement coverage analysis | **Deterministic Code** | Evaluated purely against `question.requirement_ids` |
| Schedule day & duration allocation | **Deterministic Code** | Allocated via score-ranked round robin |
| Schedule & kit validation | **Deterministic Code** | Validated via `validateStudySchedule` and `validateInterviewPrepKit` |
| Deduplication & Request Fingerprinting | **Deterministic Code** | SHA-256 fingerprint matching across user and input |

### 4. Honest Failure Policy & Graceful Degradation
- **Partial Research**: Missing hiring pages (`NO_HIRING_PAGE_FOUND`) or absent public interview discussions (`NO_PUBLIC_INTERVIEW_DISCUSSION`) are recorded as structured research warnings and do not abort kit generation.
- **Unreachable Company**: If the company website is unreachable, the pipeline produces an honest kit using the job description while generating a company brief noting limited retrieval and `sources: []`.
- **Thin Job Descriptions**: JDs with negligible content produce valid thin kits with `requirements: []`, `questions: []`, and `flashcards: []` accompanied by an explicit extraction limitation note, rather than hallucinating artificial requirements.

### 5. Mandatory Batch Evaluation CLI Runner
The batch evaluation command processes an arbitrary JSON array of test cases:
```bash
npm run evaluate -- --input cases.json --output kits.json
```

**Input Case Format (`cases.json`)**:
```json
[
  {
    "id": "case-01",
    "jd": "Senior Backend Engineer with TypeScript, Node.js, and Distributed Systems experience...",
    "company_url": "http://localhost:8099/acme/",
    "days": 5
  }
]
```

**Output Document Format (`kits.json`)**:
```json
{
  "version": "1.0",
  "generated_at": "2026-09-22T14:30:00.000Z",
  "kits": [
    {
      "id": "case-01",
      "status": "ok",
      "kit": { /* exact InterviewPrepKit object */ },
      "error": null
    },
    {
      "id": "case-02",
      "status": "failed",
      "kit": null,
      "error": {
        "code": "INVALID_INPUT",
        "message": "Preparation days must be between 1 and 60."
      }
    }
  ]
}
```

- **Fault Tolerance**: If an individual case fails (e.g., malformed URL or unrecoverable LLM error), the runner records `status: "failed"` with a safe error payload and continues processing remaining cases.
- **Sequential Execution**: Cases are processed sequentially to respect LLM rate limits without overwhelming backend services.
- **Local Fixture Support**: When `ALLOW_LOCAL_FETCH=true`, local assessment URLs (e.g. `http://localhost:8099/`) are fully supported.
- **Clean Stderr Logging**: Progress updates (`[1/5] Processing case-01`, `[1/5] ok case-01`) are logged exclusively to `stderr` without exposing secrets or raw prompts.

---

## 20. Kit Builder, Section Regeneration & Practice Mode Architecture

Phase 5 delivers a complete full-stack Next.js 14 and Express architecture for interactive kit creation, draft builder editing, preservation-aware regeneration, and flashcard active-recall practice.

### 1. Internal Metadata Architecture (`_meta`)
To protect user work during AI regeneration while preserving the exact required public Appendix A kit structure, the system introduces an optional internal `_meta` schema:
- **Questions**:
  ```ts
  type QuestionMeta = {
    origin: "generated" | "user"; // whether synthesized by LLM or added by user
    edited: boolean;              // flagged true whenever user modifies any field
    pinned: boolean;              // protects question from automated regeneration
    createdAt?: string;
    updatedAt?: string;
  };
  ```
- **Flashcards**:
  ```ts
  type FlashcardMeta = {
    origin: "generated" | "user";
    edited: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  ```
- **Company Brief**:
  ```ts
  type CompanyBriefMeta = {
    edited: boolean;
    updatedAt?: string;
  };
  ```
- **Public CLI Cleanliness**: `stripInternalKitMetadata(kit)` recursively removes `_meta` tags from `company_brief`, `questions`, and `flashcards` without mutating input, ensuring batch evaluation output remains 100% compliant with standard Appendix A schemas.

### 2. Preservation-Aware Section Regeneration
Rather than re-running an expensive and destructive full kit generation, `POST /api/kits/:id/regenerate` supports targeted section updates:
- **Company Brief Regeneration**:
  - Re-generates summary and what-they-do using verified crawler research.
  - **Preservation Rule**: If the brief was edited by the user (`_meta.edited === true`), regeneration preserves the user's custom content by default (`preservedEditedContent: true`). Overwriting requires explicit user confirmation (`replaceEdited: true`).
  - Questions, flashcards, and schedule remain completely untouched.
- **Question Category Regeneration**:
  - Operates exclusively on the specified category (`technical`, `behavioural`, `system-design`, or `company-fit`).
  - Questions in all other categories are strictly untouched.
  - **Preservation Rule**: Replaces *only* generated, unedited, and unpinned questions in that category. Any question where `_meta.origin === "user"`, `_meta.edited === true`, or `_meta.pinned === true` is strictly retained with its original ID.
  - Replacement questions are assigned sequential non-conflicting IDs (`qN...`) continuing after the highest existing question ID across the entire kit.
  - Re-evaluates requirement coverage with deterministic code (`analyzeRequirementCoverage`). If replacement caused a must-have requirement to become uncovered, targeted gap questions are synthesized.
  - Rebuilds the study schedule deterministically using `allocateStudySchedule`.
- **Schedule Regeneration**:
  - Deterministically recalculates daily question allocations, integer study minutes, and focus titles using pure code (`allocateStudySchedule`).
  - Zero LLM calls are made. Questions, flashcards, role competencies, and company brief remain untouched.

### 3. Flashcard Practice Mode
- **Active-Recall Study Session (`/kits/[id]/practice`)**: Presents cards one at a time with hidden answers and an explicit "Reveal answer" action.
- **Confidence-Weighted Priority Ordering**: Cards are dynamically ordered using a prioritized multi-tier sort:
  1. Uncovered cards first (never practiced in this kit)
  2. Lower confidence ratings first (`1 = Low` $\rightarrow$ `2 = Medium` $\rightarrow$ `3 = High`)
  3. Older `lastSeenAt` timestamps first
  4. Stable card ID tiebreaker
- **Keyboard-First Accessibility**:
  - `Space`: Reveal answer
  - `1`, `2`, `3`: Record recall confidence
  - `ArrowLeft` / `ArrowRight`: Navigate previous / next card
- **Persistence**: Ratings are upserted into MongoDB via `POST /api/kits/:id/practice`, updating confidence, covered status, and `lastSeenAt`.

### 4. UI/UX Interaction Design & Optimistic Concurrency
- **Local Draft Editing**: User edits update a local in-memory draft immediately. Keystrokes never initiate round-trip network requests.
- **Debounced Autosave**: Draft changes trigger an automatic background save after 800ms of user idle, alongside an explicit "Save changes" button.
- **Optimistic Concurrency Control**: `PATCH /api/kits/:id` and `POST /api/kits/:id/regenerate` verify `clientUpdatedAt` against the stored document's `updatedAt`. If the document was updated elsewhere, the server responds with HTTP 409 `KIT_CONFLICT`, prompting the user to refresh rather than silently overwriting work.
- **Unsaved Changes Guard**: A `beforeunload` listener alerts users before navigating away with unsaved changes.
- **Accessible Controls**: All question reordering controls (move up / move down) and category transfers are fully operable via standard buttons without requiring drag-and-drop.

---

## 21. Security Notes

- **Password Hashing**: Passwords are encrypted using `bcryptjs` with a cost factor of 12. Plaintext passwords are never stored or logged.
- **Credential Storage**: Passwords (`passwordHash`) are excluded from default Mongoose queries (`select: false`).
- **Cookie Security**: Authentication JWTs are stored only in `httpOnly` cookies with `sameSite: "lax"`, preventing cross-site scripting (XSS) access.
- **CORS Protection**: CORS is strictly restricted to the configured `CLIENT_URL` with credentials allowed. Wildcard `*` origins are forbidden.
- **Sensitive Field Redaction**: The request logging middleware specifically filters out cookies, `Authorization` headers, and secrets from all logs.
- **Safe Error Handling**: Internal server errors do not leak stack traces, database strings, or internal file paths to API clients.
- **SSRF Immunity**: The research crawler blocks internal/loopback IPs, enforces HTTP/HTTPS schemes, verifies post-redirect origins, and treats all fetched HTML as untrusted data.
- **Prompt Injection Defense**: All untrusted external inputs (job descriptions, crawled web pages) are sanitized with surrogate-pair preservation, truncated to safe bounds, and wrapped inside passive `<job_description>`, `<company_research>`, and `<interview_discussion>` XML delimiters with explicit instructions to ignore embedded command attempts.

---

## 22. Known Limitations & Future Phase Scope

1. **Public Discussion Adapter**: In Phase 5, the public interview discussion adapter is a safe non-fatal stub emitting `NO_PUBLIC_INTERVIEW_DISCUSSION`. A compliant commercial search API can be integrated in subsequent phases.
2. **Synchronous API Kit Generation**: Initial kit generation currently executes synchronously within the POST request lifecycle. A background worker queue (e.g. BullMQ / Redis) is planned for high-concurrency production deployments.
3. **Deployment**: Project is configured for local development, compilation, and evaluation testing.

---

## 23. MongoDB Atlas Setup Guide

To connect the server to a live MongoDB Atlas cluster:

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com/).
2. Under **Security > Database Access**, create a user with `Read and write to any database` privileges.
3. Under **Security > Network Access**, add your current IP address (or `0.0.0.0/0` for development).
4. Under **Deployment > Database**, click **Connect > Drivers**, copy the connection string.
5. Set `MONGODB_URI` in your root `.env` file:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/ai_interview_prep?retryWrites=true&w=majority
   ```
6. Set `JWT_SECRET` in your root `.env` file with a secure random string (minimum 32 characters).
7. Set `LLM_API_KEY` and optionally `LLM_MODEL=gemini-1.5-flash` in your root `.env` file.
8. Start the server with `npm run dev --workspace backend`.


