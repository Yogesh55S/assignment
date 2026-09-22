# @interview-prep/frontend

Next.js 14 App Router + Tailwind CSS user interface for the AI Interview Prep Kit.

---

## 1. Overview

The frontend workspace delivers the interactive user experience:
- **Authentication**: Email/password registration and login with secure HTTP-only cookies.
- **Kit Generation Dashboard**: Real-time progress updates, status polling, and duplicate request avoidance.
- **Kit Builder**: Inline editing, requirement-to-question mappings, drag/move question reordering between categories, add/delete questions, and section-by-section regeneration preserving customized user edits.
- **Flashcard Practice Mode**: Spaced review cards with flip animations, rating tracking, and persistent progress.
- **Research Transparency**: Clean visibility of verified crawler provenance and genuine company research warnings.

---

## 2. Directory Structure

```text
frontend/
├── .env.local.example          # Client environment template
├── next.config.mjs             # Next.js config with @interview-prep/shared transpilation
├── package.json
├── postcss.config.js
├── public/                     # Static public assets
├── README.md
├── src/
│   ├── app/                    # Next.js App Router routes
│   │   ├── (auth)/             # Login and Registration pages
│   │   ├── kits/               # Kit builder and flashcard practice routes
│   │   ├── layout.tsx          # Root layout with theme provider and header
│   │   └── page.tsx            # Dashboard listing owned kits & create kit form
│   ├── components/             # Reusable modular UI components
│   ├── hooks/                  # Custom React hooks (auth, autosave, polling)
│   ├── lib/                    # Native fetch API client with credentials: "include"
│   ├── styles/                 # Tailwind CSS globals
│   └── types/                  # Client-specific UI state types
├── tailwind.config.ts
└── tsconfig.json
```

---

## 3. Local Development

From the monorepo root:

```bash
# Run frontend development server
npm run dev --workspace frontend

# Or run both frontend and backend concurrently from root
npm run dev
```

The frontend application runs on `http://localhost:3000`.

### Environment Setup

Copy `.env.local.example` to `.env.local` inside `frontend/`:

```bash
cp .env.local.example .env.local
```

Contents:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> **Security Rule**: Never configure backend secrets (`MONGODB_URI`, `JWT_SECRET`, `LLM_API_KEY`) in frontend environment files. Only public variables starting with `NEXT_PUBLIC_` are allowed.

---

## 4. Building & Linting

```bash
# Typecheck and lint
npm run lint --workspace frontend

# Production build
npm run build --workspace frontend
```

---

## 5. Vercel Deployment Settings

When deploying the frontend to [Vercel](https://vercel.com):

1. **Import Project**: Select the GitHub repository.
2. **Framework Preset**: `Next.js`
3. **Root Directory**: Select `frontend`
4. **Build Command**: Leave as default (`npm run build` or `next build`)
5. **Output Directory**: Leave as default (`.next`)
6. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Set to your deployed backend domain (e.g., `https://api.yourdomain.com`). Do not include trailing slash.
