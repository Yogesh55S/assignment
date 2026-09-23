# Backend Quality-Assurance Audit & Deployment Readiness Report

## 1. Existing Test Coverage Summary

Before this QA audit, the project contained 24 test files located in `backend/tests/unit/` (161 individual tests total), all passing cleanly under `vitest`:

- **Research & Crawler:** `companyCrawler.test.ts`, `fetchPage.test.ts`, `htmlCleaner.test.ts`, `linkExtractor.test.ts`, `linkRanker.test.ts`, `robots.test.ts`, `urlSafety.test.ts`.
- **Generation & LLM:** `geminiClient.test.ts`, `kitPipeline.test.ts`, `questionGenerationService.test.ts`, `regenerationService.test.ts`, `requirementExtractionService.test.ts`.
- **Validation & Shared Logic:** `coverageService.test.ts`, `editableKitSchema.test.ts`, `kitUpdateValidation.test.ts`, `kitValidation.test.ts`, `practiceService.test.ts`, `requestFingerprint.test.ts`, `scheduleService.test.ts`, `scheduleValidation.test.ts`, `stableIds.test.ts`, `stripInternalKitMetadata.test.ts`.
- **Health & CLI:** `health.test.ts`, `evaluate.test.ts`.

### Coverage Strengths
- Solid coverage of research parsing, URL safety checks, schema validations, schedule calculations, and pipeline mocking.

### Coverage Gaps Pre-Audit
- Server binding configuration (`PORT` fallback, `0.0.0.0` binding host).
- Authentication flow & cookie handling (`/api/auth/register`, `/login`, `/logout`, `/me`).
- Ownership verification (preventing User A from accessing/modifying User B's kits).
- Detailed HTTP error schemas for 401, 404, 409, and 400 validation failures.
- Detailed input boundary tests for `POST /api/kits` (whitespace JD, >50k JD, internal loopback IP blocking in production, `days` constraint checks).
- Strict environment safety checks for `NODE_ENV=production` (rejecting `ALLOW_LOCAL_FETCH=true`, `localhost` `CLIENT_URL`, and short `JWT_SECRET`).
- Standalone, safe live Railway smoke test script.

---

## 2. Deployment Readiness Checks

| Check Area | Implementation | Status |
| :--- | :--- | :--- |
| **PORT Handling** | Reads `process.env.PORT` with `5000` fallback via `getServerPort()` helper. | **PASSED** |
| **0.0.0.0 Binding** | Server explicitly binds to `"0.0.0.0"` for container compatibility. | **PASSED** |
| **Health Route** | `GET /health` returns `{ status: "ok", service: "api", timestamp: "<ISO>" }` without auth. | **PASSED** |
| **CORS Configuration** | Configured with `env.CLIENT_URL` and `credentials: true`. Rejects wildcard origins with credentials. | **PASSED** |
| **Production Cookies** | `httpOnly: true`, `secure: true` in production, `sameSite: "lax"` or `"none"` (enforces `secure: true` when `sameSite: "none"`). | **PASSED** |
| **Environment Validation** | `getEnv()` and `validateEnvForServer()` enforce `MONGODB_URI` and `JWT_SECRET`. Added production guardrails. | **PASSED** |
| **Error Handling** | Centralized `errorHandler` returns `{ error: { code, message, requestId } }`. | **PASSED** |
| **Secret Safety** | Database connection strings masked. No secrets in logs, JSON responses, or test files. `passwordHash` excluded from queries. | **PASSED** |

---

## 3. Existing Gaps Against Assignment

1. **Production Environment Safety Rules Missing:** `env.ts` did not validate that `ALLOW_LOCAL_FETCH` must be false in production, `CLIENT_URL` cannot be localhost in production, and `JWT_SECRET` must be at least 32 characters in production.
2. **LLM Config Validation for Generation:** `LLM_API_KEY` missing was not validated specifically at generation entry point without breaking health route or server start when key is omitted.
3. **Route Auth & Ownership Test Coverage:** Missing unit/integration tests for authentication endpoints and cross-user data isolation.
4. **Input Validation Edge-Case Testing:** `POST /api/kits` needed formal unit tests verifying private IP blocking in production, whitespace JDs, string/float days inputs, etc.
5. **Batch CLI Tests:** `npm run evaluate -- --input <cases.json> --output <kits.json>` required direct unit tests for CLI argument parsing, failure resilience, and metadata stripping.
6. **Live Railway Smoke Test Script:** Missing a standalone, non-CI script (`npm run smoke:railway`) to test the deployed Railway URL safely.

---

## 4. Code Changes Proposed & Implemented

1. **`backend/src/config/env.ts`:**
   - Added production environment validation checks to `validateEnvForServer()`:
     - Rejects `ALLOW_LOCAL_FETCH=true` in `NODE_ENV=production`.
     - Rejects `CLIENT_URL` containing `localhost` or `127.0.0.1` in `NODE_ENV=production`.
     - Rejects `JWT_SECRET` under 32 characters in `NODE_ENV=production`.
   - Added `validateEnvForGeneration()` helper to enforce `LLM_API_KEY` presence when kit generation is invoked without blocking `/health`.
2. **`backend/src/server.ts`:**
   - Extracted `getServerPort()` and `getServerHost()` helpers for direct unit testing of binding configuration without side-effects.
3. **`backend/src/scripts/liveSmokeTest.ts` [NEW]:**
   - Implemented safe live Railway smoke test script parsing `--base-url`, running unauthenticated checks by default, and supporting optional `--test-email` / `--test-password` flags without exposing secrets.
4. **`package.json` (Root):**
   - Added `"smoke:railway": "npm run smoke:railway --workspace backend --"` script.

---

## 5. Comprehensive Test Suite Added

The following test suites were added to `backend/tests/unit/`:

1. **`serverConfig.test.ts`**: Verifies PORT fallback (`5000`), custom PORT parsing, and `0.0.0.0` binding host.
2. **`healthEndpoint.test.ts`**: Verifies `GET /health` 200 response, format, timestamp, no auth required, no secret exposure.
3. **`protectedRoutes.test.ts`**: Verifies 401 response for unauthenticated requests to `/api/kits` and `/api/auth/me` with exact `{ error: { code, message, requestId } }` format.
4. **`envSafety.test.ts`**: Verifies environment validation logic with isolated env objects for production safety rules.
5. **`corsConfig.test.ts`**: Verifies CORS origin matching, credentials setting, and safe handling of unallowed origins.
6. **`cookieBehavior.test.ts`**: Verifies development vs production cookie options (`httpOnly`, `secure`, `sameSite`) and non-exposure of JWT tokens or password hashes in JSON payloads.
7. **`authOwnership.test.ts`**: Verifies registration, login, logout, me, and cross-user kit ownership isolation (User A cannot access/modify User B's kit).
8. **`kitInputValidation.test.ts`**: Verifies `POST /api/kits` input validation (unauth 401, missing/whitespace/>50k JD, invalid/forbidden URLs, private IP blocking in production, `days` checks).
9. **`pipelineCoverageExtended.test.ts`**: Verifies requirement extraction, research fallback, category-specific question generation, deterministic gap repair (max 2 passes), flashcards, schedule, and metadata stripping.
10. **`builderRegenerationPractice.test.ts`**: Verifies draft edits, question origin metadata (`generated` vs `user`), section regeneration (preserving user edits/pins), practice confidence ratings (1, 2, 3), and practice ordering.
11. **`batchCli.test.ts`**: Verifies exact `npm run evaluate -- --input <cases.json> --output <kits.json>` CLI behavior, failure resilience, and JSON formatting.

---

## 6. Test Categorization

- **Unit Tests:** Run in Node.js with `vitest` using mocked services and isolated helpers. Fast, deterministic, no live network or production database required.
- **Integration Tests:** In-memory Express app test cases executing middleware, controller validation, and error handlers.
- **Live Smoke Test:** Standalone CLI script (`npm run smoke:railway`) invoking live HTTP endpoints on Railway (`https://assignment-production-46b3.up.railway.app`).

---

## 7. Live Railway Health Notice

> [!IMPORTANT]
> **Live Railway backend health CANNOT and MUST NOT be claimed unless the live smoke test script (`npm run smoke:railway`) actually receives successful HTTP responses from the deployed Railway URL.**
