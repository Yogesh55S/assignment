# @interview-prep/backend

Express REST API, MongoDB/Mongoose persistence, Gemini structured generation pipeline, SSRF-safe company crawler, and mandatory batch evaluation CLI for the AI Interview Prep Kit.

---

## 1. Overview & Architecture

The backend workspace encapsulates all server-side logic:
- **Express API**: Modular routes for auth (`/api/auth`), kits (`/api/kits`), practice mode, and section regeneration.
- **Persistence**: MongoDB via Mongoose with strict schema validation, optimistic concurrency control, and user ownership isolation.
- **LLM Pipeline**: Google Gemini integration using `@google/genai` with strict JSON schema validation, targeted coverage repair, and company grounding.
- **Web Crawler**: Two-hop in-domain crawler with robots.txt parsing, link scoring, HTML sanitization, and SSRF prevention (private IP blocking).
- **Batch Evaluation CLI**: Evaluates batch job descriptions deterministically or with LLM assistance, generating standard-compliant JSON outputs.

---

## 2. Directory Structure

```text
backend/
├── Dockerfile                  # Multi-stage production container build
├── eslint.config.js
├── package.json
├── README.md
├── src/
│   ├── app.ts                  # Express application factory & security middlewares
│   ├── server.ts               # HTTP server entrypoint (0.0.0.0 binding)
│   ├── config/                 # Environment validation and MongoDB connection
│   ├── controllers/            # Route controllers (auth, kits, practice)
│   ├── middleware/             # Auth, error handling, rate limiting, request logging
│   ├── models/                 # Mongoose schemas (User, Kit, FlashcardProgress)
│   ├── routes/                 # Express routers
│   ├── scripts/
│   │   └── evaluate.ts         # Batch evaluation CLI entrypoint
│   ├── services/
│   │   ├── auth/               # Bcrypt hashing and JWT cookie signing
│   │   ├── generation/         # Deliberate multi-step kit generation pipeline
│   │   ├── llm/                # Gemini client and structured generation
│   │   ├── persistence/        # Database operations with ownership checks
│   │   └── research/           # SSRF-safe company crawler & content cleaner
│   ├── utils/                  # Safe errors, ID generators, URL helpers
│   └── validators/             # Zod input schemas
├── tests/
│   ├── fixtures/               # Test fixtures and mocks
│   └── unit/                   # 24 Vitest unit test suites
├── tsconfig.json
└── vitest.config.ts
```

---

## 3. Local Development

From the monorepo root:

```bash
# Run backend development server with hot-reload
npm run dev --workspace backend

# Or run both frontend and backend concurrently
npm run dev
```

The backend server listens on `http://localhost:5000` (or `PORT` from `.env`).

---

## 4. Testing & Linting

```bash
# Run all unit test suites
npm run test --workspace backend

# Run TypeScript typecheck / lint
npm run lint --workspace backend
```

---

## 5. Mandatory Batch CLI Command

Run evaluation from the repository root:

```bash
npm run evaluate -- --input examples/cases.sample.json --output output/kits.sample.json
```

Command options:
- `--input`, `-i`: Path to JSON file containing array of `EvaluationCase` objects.
- `--output`, `-o`: Path where generated `EvaluationOutput` JSON will be saved.

---

## 6. Production Deployment Guide

### Deployment Root Context
Deploy from the **repository root** because `@interview-prep/backend` depends on the workspace package `@interview-prep/shared`.

### Standard Host Commands
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run start --workspace backend`
- **Health Check Path**: `/health` (returns HTTP 200 `{ "status": "ok", "service": "api" }`)

### Required Environment Variables
Configure the following environment variables on your hosting provider (e.g., Render, Railway, AWS ECS, Fly.io):

| Variable Name | Purpose / Recommended Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `5000` (or host-assigned dynamic port) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | 32+ character random secret string |
| `CLIENT_URL` | Full URL of the deployed frontend (e.g., `https://your-frontend.vercel.app`) |
| `LLM_API_KEY` | Google Gemini API key |
| `LLM_MODEL` | `gemini-flash-latest` (or `gemini-1.5-flash`) |
| `ALLOW_LOCAL_FETCH` | `false` (enforces strict SSRF protection in production) |
| `COOKIE_SAME_SITE` | `none` (required when frontend and backend are hosted on different origins) |
