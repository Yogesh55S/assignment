import mongoose from "mongoose";
import { validateEnvForServer } from "./env.js";

let isConnected = false;

/**
 * Connects to MongoDB via Mongoose.
 * Never logs credentials, passwords, or the raw MongoDB connection string.
 */
export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    return;
  }

  const env = validateEnvForServer();

  try {
    // Mask host/URI safely for logging
    const maskedTarget = env.MONGODB_URI.includes("@")
      ? `mongodb+srv://***:***@${env.MONGODB_URI.split("@")[1].split("?")[0]}`
      : "mongodb://***:***@protected-host";

    console.log(`[Database] Connecting to MongoDB (${maskedTarget})...`);

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      autoIndex: true,
    });

    isConnected = true;
    console.log("[Database] Connected successfully to MongoDB.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database connection error";
    // Sanitize any accidental connection string in error message
    const sanitizedMessage = message.replace(/mongodb(\+srv)?:\/\/[^@]+@/, "mongodb://***:***@");
    console.error(`[Database] Connection failed: ${sanitizedMessage}`);
    throw new Error(`Database connection failed: ${sanitizedMessage}`);
  }
}

/**
 * Disconnects from MongoDB gracefully.
 */
export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("[Database] Disconnected from MongoDB.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Database] Disconnect error: ${message}`);
  }
}

// Graceful termination handling
process.on("SIGINT", async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnectDatabase();
  process.exit(0);
});
