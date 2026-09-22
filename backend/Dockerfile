# Multi-stage production Dockerfile for @interview-prep/backend
# Build context MUST be the repository root because backend relies on workspace shared/ package.

FROM node:20-alpine AS builder

WORKDIR /app

# Copy root manifest and workspace manifests for efficient caching
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install dependencies for backend and shared packages
RUN npm ci

# Copy full source code for backend and shared
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build backend TypeScript
RUN npm run build --workspace backend

# Remove devDependencies to minimize image size
RUN npm prune --production

# Final lightweight runtime image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy necessary files from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules

EXPOSE 5000

# Health check using the public /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-5000}/health || exit 1

# Start the Express server
CMD ["npm", "run", "start", "--workspace", "backend"]
