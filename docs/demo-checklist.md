# Demo & Assessment Reviewer Checklist

This checklist verifies all required features and architectural standards for the AI Interview Prep Kit.

---

## 1. Local Setup & Verification

- [ ] Node.js version is 20+ (`node -v`)
- [ ] Root dependencies installed via npm workspaces:
  ```bash
  npm install
  ```
- [ ] Automated unit test suite passes (all 24 suites):
  ```bash
  npm run test
  ```
- [ ] Full project builds cleanly:
  ```bash
  npm run build
  ```
- [ ] Typechecking and linting pass with zero errors:
  ```bash
  npm run lint
  ```
- [ ] Mandatory evaluation CLI runs successfully on sample cases:
  ```bash
  npm run evaluate -- --input examples/cases.sample.json --output output/kits.sample.json
  ```

---

## 2. Security & Architecture Checks

- [ ] No secrets committed in source code, READMEs, or test fixtures.
- [ ] `.gitignore` properly ignores `.env`, `.env.local`, `output`, `dist`, `.next`, `coverage`.
- [ ] Express API binds to `0.0.0.0` on `PORT` from environment.
- [ ] Public `/health` endpoint responds with HTTP 200 without requiring auth.
- [ ] Private IP ranges (SSRF protection) are strictly blocked during company web crawling unless `ALLOW_LOCAL_FETCH=true`.
- [ ] Deterministic algorithms (coverage analysis, schedule allocation) are pure code independent of LLM or network.

---

## 3. Web UI Experience (Phase 5)

- [ ] Start local development server:
  ```bash
  npm run dev
  ```
- [ ] Access frontend at `http://localhost:3000`.
- [ ] Register a new account / login (secure HTTP-only cookie session).
- [ ] Generate a new Interview Prep Kit with job description, company URL, and days available.
- [ ] Observe generation progress polling.
- [ ] View generated kit details:
  - Company Brief
  - Role Breakdown & extracted requirements
  - Question Bank with difficulty, answer outlines, and requirement tags
  - Study Schedule allocated across days
  - Coverage summary
- [ ] Inline edit questions, reorder questions between categories, and add/remove questions.
- [ ] Regenerate a specific section while preserving user customizations.
- [ ] Launch Flashcard Practice mode and test flip/rating state.
