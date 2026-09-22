# Production Deployment Guide

This guide details how to deploy the AI Interview Prep Kit monorepo to production with independent hosting for frontend and backend while maintaining strict security and environment hygiene.

---

## Architecture Overview

```text
  [ Client Browser ]
          |
          +-------------------------------+
          | (HTTPS Requests)              | (HTTPS API Calls + Cookies)
          v                               v
[ Frontend: Vercel ]            [ Backend: Node.js Host ]
(Next.js App Router)            (Express API + Gemini + Crawler)
Root Directory: frontend                  |
                                          +----> [ MongoDB Atlas ]
                                          +----> [ Google Gemini API ]
                                          +----> [ Target Company Websites ]
```

---

## 1. Frontend Deployment (Vercel)

1. **New Project**: Connect your GitHub repository to Vercel.
2. **Project Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)
3. **Environment Variables**:
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```
   > **Note**: Do not set any database or LLM secrets in Vercel.

---

## 2. Backend Deployment (Render, Railway, Fly.io, or AWS ECS)

The backend relies on `@interview-prep/shared`, so the build context should be the repository root.

### Build & Run Commands
- **Repository**: Single Monorepo
- **Root Directory**: `/` (Monorepo root)
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run start --workspace backend`
- **Health Check Endpoint**: `/health`

### Environment Variables
Configure the following environment variables securely in your host's dashboard:

| Name | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production mode optimizations |
| `PORT` | `5000` | Port for Express (host-assigned) |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/prod?retryWrites=true` | MongoDB Atlas URI |
| `JWT_SECRET` | `openssl rand -base64 32` | 32+ character random secret |
| `CLIENT_URL` | `https://your-frontend.vercel.app` | Allowed CORS origin |
| `LLM_API_KEY` | `AIzaSy...` | Google Gemini API key |
| `LLM_MODEL` | `gemini-flash-latest` | Gemini model name |
| `ALLOW_LOCAL_FETCH` | `false` | Strict SSRF protection (blocks private IP ranges) |
| `COOKIE_SAME_SITE` | `none` | Cross-site cookie support for separate domains |

### Docker Deployment Option
A production multi-stage Dockerfile is provided at `backend/Dockerfile`.
Build from root:
```bash
docker build -f backend/Dockerfile -t interview-prep-backend:latest .
docker run -p 5000:5000 --env-file .env interview-prep-backend:latest
```
