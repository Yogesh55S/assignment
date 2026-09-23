# Live Railway Smoke Test Guide

This document describes how to execute the optional live Railway backend smoke test script (`npm run smoke:railway`).

> [!IMPORTANT]
> The live smoke test interacts with live network endpoints and **MUST NEVER** be run automatically during normal build (`npm run build`), unit test (`npm run test`), lint (`npm run lint`), or CI pipelines.

---

## 1. Safe Unauthenticated Smoke Test

To verify that the deployed Railway backend is online, accepting public traffic, handling 401s on protected endpoints, parsing CORS preflights, and returning structured 404 error payloads:

```bash
npm run smoke:railway -- --base-url https://assignment-production-46b3.up.railway.app
```

### Expected Output
```text
==================================================
LIVE RAILWAY BACKEND SMOKE TEST
Target Base URL: https://assignment-production-46b3.up.railway.app
==================================================

[PASS] GET /health -> 200 OK (api, 2026-09-22T16:40:00.000Z)
[PASS] GET /api/auth/me -> 401 Unauthorized (Protected as expected)
[PASS] GET /api/kits -> 401 Unauthorized (Protected as expected)
[PASS] OPTIONS /api/kits -> 204 (CORS Preflight checked)
[PASS] GET /not-a-real-route -> 404 Not Found (Structured 404)

==================================================
SUMMARY: ALL SMOKE TESTS PASSED!
==================================================
```

---

## 2. Optional Authenticated Smoke Test

> [!WARNING]
> **NEVER** hardcode real passwords, production secrets, or personal credentials into code, command histories, log files, or documentation. Always use disposable local test accounts or environment variables.

To test authentication cookies, user identity verification (`GET /api/auth/me`), kit access (`GET /api/kits`), and input rejection on `POST /api/kits`:

```bash
npm run smoke:railway -- --base-url https://assignment-production-46b3.up.railway.app --test-email "test@example.com" --test-password "REPLACE_LOCALLY" --allow-register-test
```

### Key Safety Guarantees
- Email addresses are masked in terminal logs (e.g. `t***t@example.com`).
- Cookies and JWT session tokens are stored in an in-memory jar and never logged.
- The script automatically calls `POST /api/auth/logout` upon test completion to clean up the HTTP session.
- Real Gemini generation calls are **not** triggered automatically during smoke testing.

---

## 3. Exit Codes

- `0`: All expected smoke checks passed.
- `1`: One or more live HTTP requests failed or returned an unexpected status code.
- `2`: Usage or CLI configuration error (e.g. missing `--base-url`).

---

## 4. Troubleshooting Live Deployment Failures

If `npm run smoke:railway` reports a failure:

1. **`Backend unreachable` / Network Error:**
   - Verify Railway project status and service health in Railway console.
   - Confirm public networking domain exists (`assignment-production-46b3.up.railway.app`).
   - Ensure `PORT` environment variable is automatically assigned by Railway and `server.ts` binds to `0.0.0.0`.
2. **`GET /health` Returns 500 or Fails:**
   - Inspect Railway runtime logs for crashes on startup.
   - Check mandatory environment variables: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`.
3. **CORS Rejection Errors:**
   - Verify `CLIENT_URL` in Railway environment settings matches the deployed frontend URL (e.g., `https://frontend-production-xxxx.up.railway.app`).
