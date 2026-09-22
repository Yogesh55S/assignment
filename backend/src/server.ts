import { createApp } from "./app.js";
import { validateEnvForServer } from "./config/env.js";
import { connectDatabase } from "./config/database.js";

async function startServer(): Promise<void> {
  try {
    // Validate required configuration (MONGODB_URI, JWT_SECRET) on startup
    const env = validateEnvForServer();

    const app = createApp();

    const port = Number(process.env.PORT ?? 5000);
    const server = app.listen(port, "0.0.0.0", () => {
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

startServer();
