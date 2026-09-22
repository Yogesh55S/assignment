# AI Interview Prep Kit: Top-Level Folder Refactor Plan (client/ -> frontend/, server/ -> backend/)

## 1. Executive Summary & Objective

The objective of this refactor is to clarify the top-level monorepo structure for engineering-assessment reviewers while keeping **exactly one GitHub repository**.
The two primary application folders are renamed:
- `client/` -> `frontend/`
- `server/` -> `backend/`

The shared library remains at `shared/` at the repository root.
All working functionality, business logic, deterministic algorithms (coverage analysis, study schedule allocation), SSRF-safe crawling, Gemini LLM pipeline, Next.js UI, authentication, database models, Vitest test suites, and the mandatory batch evaluation CLI are strictly preserved.

---

## 2. Old vs. New Top-Level Structure

### Old Top-Level Structure
```text
/
├── client/                           # Next.js 14 App Router UI
│   ├── .env.local.example
│   ├── next.config.mjs
│   ├── package.json                  # @interview-prep/client
│   ├── postcss.config.js
│   ├── src/
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── server/                           # Express + Mongoose + Gemini API
│   ├── eslint.config.js
│   ├── package.json                  # @interview-prep/server
│   ├── src/
│   ├── tests/
│   ├── tsconfig.json
│   └── vitest.config.ts
├── shared/                           # Pure domain types, Zod schemas, deterministic services
│   ├── constants/
│   ├── index.ts
│   ├── package.json                  # @interview-prep/shared
│   ├── services/
│   ├── tsconfig.json
│   ├── types/
│   └── validators/
├── .env.example
├── .gitignore
├── package.json                      # Workspaces: ["client", "server", "shared"]
├── package-lock.json
└── README.md
```

### New Target Structure
```text
/
├── frontend/                         # Next.js + Tailwind user interface
│   ├── .env.local.example
│   ├── next.config.mjs
│   ├── package.json                  # @interview-prep/frontend
│   ├── postcss.config.js
│   ├── public/
│   ├── README.md                     # Frontend architecture & Vercel deployment docs
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types/
│   │   └── styles/
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── backend/                          # Express + MongoDB + Gemini + crawler + CLI
│   ├── Dockerfile                    # Containerization for Node.js hosts
│   ├── eslint.config.js
│   ├── package.json                  # @interview-prep/backend
│   ├── README.md                     # Backend API & host deployment docs
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   │   └── evaluate.ts
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   ├── generation/
│   │   │   ├── llm/
│   │   │   ├── persistence/
│   │   │   └── research/
│   │   ├── utils/
│   │   └── validators/
│   ├── tests/
│   │   ├── fixtures/
│   │   └── unit/
│   ├── tsconfig.json
│   └── vitest.config.ts
├── shared/                           # Shared pure types, schemas, coverage, schedules
│   ├── constants/
│   ├── index.ts
│   ├── package.json                  # @interview-prep/shared
│   ├── services/
│   │   ├── coverage/
│   │   └── schedule/
│   ├── tsconfig.json
│   ├── types/
│   └── validators/
├── examples/                         # Sample batch input files
│   └── cases.sample.json
├── output/                           # Generated evaluation outputs (gitignored)
├── docs/                             # Architecture/demo/deployment documentation
│   ├── folder-refactor-plan.md
│   ├── deployment-guide.md
│   └── demo-checklist.md
├── .env.example                      # Safe environment template only
├── .gitignore                        # Standardized ignore rules
├── package.json                      # Root npm workspace scripts
├── package-lock.json
└── README.md                         # Comprehensive monorepo guide
```

---

## 3. Path & Reference Replacements

| Component / File | Old Reference | New Replacement | Rationale |
| :--- | :--- | :--- | :--- |
| Root `package.json` | `"workspaces": ["client", "server", "shared"]` | `"workspaces": ["frontend", "backend", "shared"]` | Maps to new top-level directories |
| Root `package.json` | `npm run dev --workspace client` | `npm run dev --workspace frontend` | Workspace script target update |
| Root `package.json` | `npm run dev --workspace server` | `npm run dev --workspace backend` | Workspace script target update |
| Root `package.json` | `npm run build --workspace client` | `npm run build --workspace frontend` | Workspace script target update |
| Root `package.json` | `npm run build --workspace server` | `npm run build --workspace backend` | Workspace script target update |
| Root `package.json` | `npm run test --workspace server` | `npm run test --workspace backend` | Workspace script target update |
| Root `package.json` | `npm run lint --workspace client` | `npm run lint --workspace frontend` | Workspace script target update |
| Root `package.json` | `npm run lint --workspace server` | `npm run lint --workspace backend` | Workspace script target update |
| Root `package.json` | `npm run evaluate --workspace server` | `npm run evaluate --workspace backend` | Evaluator script target update |
| `frontend/package.json` | `"name": "@interview-prep/client"` | `"name": "@interview-prep/frontend"` | Standard package naming |
| `backend/package.json` | `"name": "@interview-prep/server"` | `"name": "@interview-prep/backend"` | Standard package naming |
| `backend/src/config/env.ts` | `path.resolve(__dirname, "../../../.env")` | `path.resolve(__dirname, "../../../.env")` | Relative depth from `backend/src/config` remains 3 levels |
| `backend/src/server.ts` | `app.listen(env.PORT, ...)` | `const port = Number(process.env.PORT ?? 5000); app.listen(port, "0.0.0.0", ...)` | Support any normal Node.js cloud host (Render, Railway, etc.) |
| `backend/vitest.config.ts` | `path.resolve(__dirname, "../shared")` | `path.resolve(__dirname, "../shared")` | Preserved resolution to sibling directory |
| `frontend/next.config.mjs` | `transpilePackages: ["@interview-prep/shared"]` | `transpilePackages: ["@interview-prep/shared"]` | Preserved transpilation of shared TypeScript package |
| `.gitignore` | Generic patterns | Explicit paths: `frontend/.next`, `backend/dist`, `backend/coverage`, `output`, etc. | Robust ignore configuration |

---

## 4. Package & Workspace Changes

1. **Root `package.json`**:
   - `"workspaces": ["frontend", "backend", "shared"]`
   - Node requirement `>=20` preserved.
   - Script definitions updated to target `frontend` and `backend`.
2. **Frontend `package.json`**:
   - Rename to `@interview-prep/frontend`.
   - Preserve all scripts: `dev`, `build`, `start`, `lint`.
   - Preserve dependency `@interview-prep/shared: "*"`.
3. **Backend `package.json`**:
   - Rename to `@interview-prep/backend`.
   - Preserve all scripts: `dev`, `build`, `start`, `test`, `lint`, `evaluate`.
   - Preserve dependency `@interview-prep/shared: "*"`.

---

## 5. TypeScript Import Alias & Resolution

- Both `frontend` and `backend` resolve `@interview-prep/shared` via the root npm workspace symlinks.
- In `frontend/tsconfig.json`, path alias `@/*` maps to `./src/*`.
- In `backend/tsconfig.json`, module resolution is `NodeNext` with output directory `./dist`.
- In `backend/vitest.config.ts`, alias `@interview-prep/shared` explicitly points to `path.resolve(__dirname, "../shared")`.

---

## 6. Test & Config Changes

- Vitest configuration remains in `backend/vitest.config.ts`.
- All 24 test suites under `backend/tests/unit` will run cleanly with `npm run test` or `npm run test --workspace backend`.
- Evaluator CLI tests (`evaluate.test.ts`) continue testing argument parsing and batch execution logic.

---

## 7. Deployment Configuration Changes

### Frontend (Vercel)
- **Repository**: Single Monorepo
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (or default Vercel Next.js build)
- **Output Directory**: `.next`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL=https://YOUR_BACKEND_DOMAIN` (No backend secrets!)

### Backend (Render, Railway, Fly.io, or Container Host)
- **Repository**: Single Monorepo
- **Root Directory**: Root of monorepo (because backend builds and depends on `shared/`)
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run start --workspace backend`
- **Health Check Endpoint**: `/health` (returns HTTP 200 `{ status: "ok", service: "api", ... }`)
- **Required Environment Variables (by name only)**:
  - `NODE_ENV=production`
  - `PORT=5000` (or host-assigned)
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `CLIENT_URL=https://YOUR_FRONTEND_DOMAIN`
  - `LLM_API_KEY`
  - `LLM_MODEL=gemini-flash-latest`
  - `ALLOW_LOCAL_FETCH=false`
  - `COOKIE_SAME_SITE=none` (if frontend and backend reside on different domains)

---

## 8. Rollback Guidance

If migration verification fails at any intermediate step:
1. The original `client/` and `server/` directories are not deleted until complete verification succeeds.
2. If rollback is necessary, revert `package.json` workspaces to `["client", "server", "shared"]`.
3. Run `npm install` from root to restore original workspace symlinks.
4. Verify original build with `npm run build` and `npm run test`.
5. Remove `frontend/` and `backend/` directories.

---

## 9. Verification Commands

Run sequentially from repository root:

1. `npm install`
2. `npm run test`
3. `npm run build`
4. `npm run lint`
5. `npm run evaluate -- --input examples/cases.sample.json --output output/kits.sample.json`
6. Local dev smoke test:
   - `npm run dev`
   - Check `http://localhost:5000/health` -> HTTP 200 `{ "status": "ok" }`
   - Check `http://localhost:3000` -> HTTP 200 (Dashboard renders)
