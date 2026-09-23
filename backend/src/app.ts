import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { getEnv } from "./config/env.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import kitRoutes from "./routes/kitRoutes.js";

export function createApp() {
  const app = express();
  const env = getEnv();

  // Trust first proxy (Railway/Vercel load balancer) for HTTPS cookie support
  app.set("trust proxy", 1);

  // 1. Security & Core Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // 2. Health Check Endpoint (Public, no auth, no sensitive data)
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "api",
      timestamp: new Date().toISOString(),
    });
  });

  // 3. API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/kits", kitRoutes);

  // 4. Centralized Not Found & Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
