import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { validateEnvForServer } from "./config/env.js";
import { connectDatabase } from "./config/database.js";

export function getServerPort(customEnvPort?: string | number): number {
  const val = customEnvPort ?? process.env.PORT;
  const parsed = Number(val);
  return !isNaN(parsed) && parsed > 0 ? parsed : 5000;
}

export function getServerHost(): string {
  return "0.0.0.0";
}

export async function startServer(): Promise<void> {
  try {
    // Validate required configuration (MONGODB_URI, JWT_SECRET) on startup
    const env = validateEnvForServer();

    const app = createApp();

    const port = getServerPort();
    const host = getServerHost();
    const server = app.listen(port, host, () => {
      console.log(`[Server] AI Interview Prep Kit API listening on port ${port} (${env.NODE_ENV})`);
    });

    // Connect to database
    connectDatabase().catch((err) => {
      console.error(`[Server] Database connection error: ${err.message}`);
    });

    // Handle unexpected shutdown signals cleanly
    const shutdown = () => {
      console.log("[Server] Shutting down HTTP server...");
      server.close(() => {
        console.log("[Server] HTTP server closed.");
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown startup error";
    console.error(`[Server] Startup failed: ${message}`);
    process.exit(1);
  }
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isDirectRun || process.env.START_SERVER === "true") {
  startServer();
}

