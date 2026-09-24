# Section 1: Auth & Data Integrity Quality Assurance Audit

## Executive Summary
This document provides the complete root-cause analysis, architecture changes, persistence policies, error-mapping specifications, and test verification strategy for **Section 1 (Auth-Aware Header, Navbar Flicker, Failed Generation Data Integrity, and Consistent Error Feedback)** of the AI Interview Prep Kit.

---

## Task 1: Auth-Aware Header Logo

### Reported Issue
A logged-in user clicks the main header/logo and gets sent to the public landing page (`/`) showing Login/Signup buttons instead of navigating to `/dashboard`.

### Root Cause
1. `Header.tsx` contained a hardcoded `<Link href="/">` for the logo.
2. Pages lacked a unified, shared client-side auth context (`AuthContext`). Auth state was re-fetched independently per page in isolated `useEffect` hooks, leading to inconsistent header hrefs and routing behavior.

### Files Changed
- `frontend/src/context/AuthContext.tsx` (New shared auth context & provider)
- `frontend/src/components/Header.tsx` (Updated logo href based on auth status, added skeleton placeholder)
- `frontend/src/app/layout.tsx` (Wrapped application in `AuthProvider`)
- `frontend/src/app/page.tsx` (Refactored to use `AuthContext`)
- `frontend/src/app/login/page.tsx` (Refactored to check auth status and redirect authenticated users to `/dashboard`)
- `frontend/src/app/register/page.tsx` (Refactored to redirect authenticated users to `/dashboard`)
- `frontend/src/app/dashboard/page.tsx` (Protected page waiting for auth status resolution before rendering)

### Expected Behavior
- When `status === "loading"`: Logo href is neutralized/inactive until status resolves; auth slot renders a neutral skeleton placeholder.
- When `status === "authenticated"`: Logo navigates to `/dashboard`. Auth slot displays user email & Logout button.
- When `status === "unauthenticated"`: Logo navigates to `/`. Auth slot displays Login & Signup buttons.
- Public auth pages (`/login`, `/register`) redirect authenticated users to `/dashboard` without flash or redirect loops.

---

## Task 2: Navbar Auth Flicker on Refresh

### Reported Issue
On page refresh, the navbar briefly flashes "Log in" and "Sign up" buttons before `/api/auth/me` finishes loading, at which point it switches to showing user email and "Log out".

### Root Cause
`Header.tsx` previously evaluated `userEmail ? <UserNav /> : <GuestNav />`. On page load, `userEmail` was `undefined` during the initial render before the API request completed, causing `Header` to prematurely render `<GuestNav />`.

### Files Changed
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/components/Header.tsx`

### Expected Behavior
- During `loading`, only a neutral skeleton element (`aria-hidden="true"`) is rendered in the auth slot.
- Login/Signup buttons appear **only after** `status === "unauthenticated"` is confirmed.
- User email/Logout buttons appear **only after** `status === "authenticated"` is confirmed.
- No visual layout flicker or shift occurs on page refresh.

---

## Task 3: Failed Kit Generation Data Integrity

### Reported Issue
When kit generation fails, partially generated or broken records were sometimes stored in MongoDB, causing duplicate records or invalid state when retried.

### Root Cause
The backend pipeline did not enforce a strict separation between `ready` and `failed` kit documents. Partial data could be saved before complete validation, and retrying failed requests created new duplicate documents in MongoDB.

### Persistence & Data Integrity Policy
1. **Status Enum**: `"generating" | "ready" | "failed"`.
2. **`ready` Policy**:
   - A Kit document may transition to `ready` ONLY after the full pipeline succeeds and passes structural validation against `validateInterviewPrepKit()`.
   - Must contain full, valid `kit` data.
3. **`failed` Policy**:
   - `kit` field MUST be `null` or absent.
   - Never store raw LLM responses, raw prompts, raw HTML, partial questions, partial flashcards, or secrets.
   - Store only safe metadata: `userId`, `requestFingerprint`, `generationStatus: "failed"`, `generationError: { code, message }`, `warnings`, `createdAt`, `updatedAt`.
4. **Retry & Deduplication Policy**:
   - Retrying a failed generation reuses the existing `failed` document, moving its status back to `"generating"` and clearing `generationError`, preventing duplicate records.
   - Active simultaneous `generating` jobs for the same user and fingerprint are blocked with HTTP `202 Accepted`.
5. **UI & Route Handling**:
   - Dashboard displays failed items with a "Failed" badge, safe error text, "Retry", and "Delete" actions.
   - If a user visits `/kits/[id]` for a failed kit, a dedicated `FailedKitView` is rendered with Retry and Back to Dashboard buttons. Normal builder components are NOT rendered.

### Files Changed
- `backend/src/models/Kit.ts`
- `backend/src/services/persistence/kitService.ts`
- `backend/src/controllers/kitController.ts`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/kits/[id]/page.tsx`
- `frontend/src/components/FailedKitView.tsx`

---

## Task 4: Consistent User Error Feedback & Error Mapper

### Reported Issue
Inconsistent error reporting across the frontend; raw API error strings, 500 status codes, or unformatted errors were occasionally shown to users.

### Solution & Error Mapping Policy
1. **Central Frontend Error Mapper (`frontend/src/lib/errorMapper.ts`)**:
   Maps backend error codes to safe, human-readable user messages and retryability flags:
   - `INVALID_COMPANY_URL`: "Enter a valid public http(s) company website URL."
   - `UNSAFE_COMPANY_URL`: "This company website URL failed security verification."
   - `COMPANY_UNREACHABLE`: "The company website could not be reached. Check the URL and try again."
   - `ROBOTS_DISALLOWED`: "Access to this company site is restricted by web policies."
   - `PAGE_TIMEOUT`: "The company website took too long to respond."
   - `LLM_RATE_LIMITED`: "The AI provider is temporarily busy. Please retry in a moment."
   - `LLM_TIMEOUT`: "AI generation timed out. Please try again."
   - `LLM_PROVIDER_ERROR`: "AI service encountered an issue. Please retry shortly."
   - `GENERATION_NOT_IMPLEMENTED`: "This feature is currently unavailable."
   - `KIT_CONFLICT`: "This kit changed elsewhere. Refresh before saving again."
   - `UNAUTHORIZED`: "Your session ended. Please sign in again."
   - `FORBIDDEN`: "You do not have permission to access this resource."
   - `NOT_FOUND`: "The requested item was not found."
   - `VALIDATION_ERROR`: "Please check the entered fields and try again."
   - `NETWORK_ERROR`: "Network connection error. Please check your internet connection."
   - `UNKNOWN_ERROR`: "An unexpected error occurred. Please try again."

2. **Toast & Alert Components**:
   - Created `ToastProvider.tsx` with accessible `aria-live="polite"` (info/success) and `aria-live="assertive"` (error).
   - Enhanced `ErrorAlert.tsx`, `InlineFieldError.tsx`, `RetryButton.tsx`, `LoadingState.tsx`.
   - Never exposes raw stack traces, database details, LLM prompts, tokens, or passwords.

### Files Changed
- `frontend/src/lib/errorMapper.ts` (New)
- `frontend/src/components/ToastProvider.tsx` (New)
- `frontend/src/components/ErrorAlert.tsx`
- `frontend/src/components/InlineFieldError.tsx`
- `frontend/src/components/RetryButton.tsx`
- `frontend/src/components/LoadingState.tsx`
- `frontend/src/app/layout.tsx`

---

## Tests Added & Verification Plan

### Tests Added
1. **Auth & Header Behavior Tests (`backend/tests/unit/section1AuthHeader.test.ts`)**:
   - Verifies GET `/api/auth/me` 200 vs 401 contract.
   - Verifies credentials: "include" and cookie options.
2. **Failed Generation & Data Integrity Tests (`backend/tests/unit/section1FailedGeneration.test.ts`)**:
   - Verifies invalid pipeline output cannot be saved as `ready`.
   - Verifies `failed` document has `kit: null`.
   - Verifies retry reuses existing failed document instead of creating duplicates.
   - Verifies user ownership checks on kit status, retry, and delete operations.
3. **Frontend Error Mapper Tests (`frontend/tests/unit/errorMapper.test.ts` or `backend/tests/unit/section1ErrorMapper.test.ts`)**:
   - Verifies all backend error codes map to safe user-friendly strings.
   - Verifies raw stack traces and internal errors are masked into `UNKNOWN_ERROR`.

---

## Manual Browser Verification Protocol

1. **Logo Navigation Check**:
   - Sign in ➔ Click header logo ➔ Verify navigation to `/dashboard`.
   - Sign out ➔ Click header logo ➔ Verify navigation to `/`.
2. **Navbar Refresh Check**:
   - Open `/dashboard` and press Refresh (F5).
   - Observe header: verify skeleton placeholder appears during loading; no "Log in / Sign up" flicker occurs.
3. **Failed Generation & Retry Check**:
   - Submit invalid company URL or trigger simulated failure ➔ Verify dashboard shows "Failed" badge with safe error message.
   - Click failed kit card directly ➔ Verify dedicated failed page opens (no broken builder).
   - Click "Retry" button ➔ Verify existing record updates back to `generating` and succeeds upon pipeline resolution.
4. **Error Toast & Accessibility Check**:
   - Trigger an error action ➔ Verify assertive accessible toast notification appears with dismiss button.
