# Final Test Matrix

This matrix maps assessment requirements across automated test suites, manual verification steps, expected results, and verification status.

| Assessment Requirement | Automated Test Coverage | Manual Test Step | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Robots URL & Parsing** | `section3Robots.test.ts` (`1`, `2`, `3`) | Check URL resolution & robots parsing on custom sites. | Derived as origin + `/robots.txt`. Correctly parses disallow, allow, and crawl-delay. | PASS |
| **User-Agent Precedence** | `section3Robots.test.ts` (`4`, `5`) | Configure custom user-agent in robots.txt. | Exact configured user-agent rules override wildcard `*` rules. | PASS |
| **Crawl-Delay Capping** | `section3Robots.test.ts` (`6`) | Test high crawl-delay in robots.txt (e.g. 25s). | Delay is capped at maximum 5000ms. | PASS |
| **Robots 404 & Failures** | `section3Robots.test.ts` (`7`, `8`) | Test unreachable or 404 `robots.txt`. | Allows crawl, logs warning, never causes `COMPANY_UNREACHABLE`. | PASS |
| **Homepage Blocked** | `section3Robots.test.ts` (`9`) | Attempt crawl on domain disallowing `/`. | Short-circuits immediately. UI shows safe research note. | PASS |
| **Linked Page Blocked** | `section3Robots.test.ts` (`10`) | Crawl domain disallowing specific subpath `/blocked`. | Skips `/blocked`, continues allowed pages (`/careers`). | PASS |
| **Prompt Delimiters & Notice** | `section3PromptSafety.test.ts` (`1`, `2`) | Inspect prompt logs during generation. | Untrusted data isolated in `<job_description>` / `<company_research>` with untrusted notice. | PASS |
| **Sanitization & Control Chars** | `section3PromptSafety.test.ts` (`3`) | Input null bytes and control chars into JD field. | Null bytes and control chars stripped prior to prompt assembly. | PASS |
| **Secret Prevention in Prompts** | `section3PromptSafety.test.ts` (`4`) | Check prompt builders with environment variables set. | Zero environment secrets or API keys placed into LLM prompts. | PASS |
| **Grounded Skill Extraction** | `section3PromptSafety.test.ts` (`5`) | Submit prompt-injected JD with fake tech skills. | Model-invented skills absent from JD are filtered out. | PASS |
| **HTML Script Stripping** | `section3PromptSafety.test.ts` (`6`) | Crawl HTML page containing `<script>` and `<iframe>`. | Cheerio removes scripts/iframes; JS is never executed. | PASS |
| **Failed Generation Data Integrity** | `section3DataModel.test.ts` (`1`) | Trigger simulated backend error during generation. | `kit` field set to `null`; status `failed`; error recorded cleanly. | PASS |
| **Ready Kit Schema Validation** | `section3DataModel.test.ts` (`2`) | Save completed kit payload. | Passes Zod and Mongoose validation cleanly. | PASS |
| **Flashcard Progress Isolation** | `section3DataModel.test.ts` (`3`) | Save flashcard progress score. | Stored in `flashcard_progress` collection with unique index `{userId, kitId, flashcardId}`. | PASS |
| **Optimistic Concurrency** | `section3DataModel.test.ts` (`4`) | Check `Kit` schema options. | `optimisticConcurrency: true` enabled with `__v` versioning. | PASS |
| **Kit Schema Indexing** | `section3DataModel.test.ts` (`5`) | Inspect indexes on `Kit` Mongoose schema. | Indexes present for `{userId: 1, updatedAt: -1}` and `{userId: 1, requestFingerprint: 1}`. | PASS |
| **Dry-Run Migration Script** | `section3DataModel.test.ts` (`7`) | Execute `migrateKitDocuments.ts`. | Runs in dry-run mode by default; requiring `--apply` to write changes. | PASS |
| **Navbar & Auth Flicker** | `section1AuthFlicker.test.ts` | Refresh browser page on `/kits/[id]`. | Hydrates session without unwanted redirect or UI flicker. | PASS |
| **Category Question Preservation** | `section2Regeneration.test.ts` | Edit question `q2` and regenerate technical category. | Preserves `q2`, generates new questions with sequential IDs. | PASS |
| **Deterministic Schedule Calculation** | `section2Schedule.test.ts` | Regenerate prep schedule for 7 days. | Calculates schedule deterministically without LLM calls. | PASS |
| **Batch CLI Evaluation** | `batchEvaluation.test.ts` | Run `npm run evaluate -- --input cases.json --output kits.json`. | Outputs valid kit batch complying with Appendix A & B schemas. | PASS |
