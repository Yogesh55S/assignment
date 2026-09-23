import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly locate root .env regardless of whether executed from root or server workspace
const rootEnvPath = path.resolve(__dirname, "../../../.env");
dotenv.config({ path: rootEnvPath });
dotenv.config(); // fallback to current working directory

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().optional(),
  ALLOW_LOCAL_FETCH: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === "true" || val === "1")
    .default(true),
  COOKIE_SAME_SITE: z.enum(["lax", "none", "strict"]).default("lax"),
});

export type EnvConfig = z.infer<typeof baseEnvSchema>;

let parsedEnv: EnvConfig | null = null;

export function resetEnvCache(): void {
  parsedEnv = null;
}

export function getEnv(customEnv?: Record<string, string | undefined>): EnvConfig {
  if (customEnv) {
    const result = baseEnvSchema.safeParse(customEnv);
    if (!result.success) {
      const errorDetails = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      throw new Error(`Environment validation error: ${errorDetails}`);
    }
    return result.data;
  }

  if (parsedEnv) {
    return parsedEnv;
  }

  const result = baseEnvSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new Error(`Environment validation error: ${errorDetails}`);
  }

  parsedEnv = result.data;
  return parsedEnv;
}

export interface ValidatedServerEnv extends EnvConfig {
  MONGODB_URI: string;
  JWT_SECRET: string;
}

/**
 * Validates required secrets strictly for HTTP server runtime.
 * Never called on initial module import or during unit tests.
 * Never logs actual secret values.
 */
export function validateEnvForServer(customEnv?: Record<string, string | undefined>): ValidatedServerEnv {
  const env = customEnv ? getEnv(customEnv) : getEnv();

  const missing: string[] = [];
  if (!env.MONGODB_URI || env.MONGODB_URI.trim().length === 0) {
    missing.push("MONGODB_URI");
  }

  if (!env.JWT_SECRET || env.JWT_SECRET.trim().length === 0) {
    missing.push("JWT_SECRET");
  }

  if (missing.length > 0) {
    throw new Error(
      `Fatal server startup error: Missing required environment variable(s): ${missing.join(", ")}. Please check your .env file.`
    );
  }

  if (env.NODE_ENV === "production") {
    if (env.ALLOW_LOCAL_FETCH) {
      throw new Error("Production environment validation error: ALLOW_LOCAL_FETCH must be false in production.");
    }
    if (env.CLIENT_URL.includes("localhost") || env.CLIENT_URL.includes("127.0.0.1")) {
      throw new Error("Production environment validation error: CLIENT_URL cannot point to localhost in production.");
    }
    if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
      throw new Error("Production environment validation error: JWT_SECRET must be at least 32 characters in production.");
    }
  }

  return env as ValidatedServerEnv;
}

/**
 * Validates LLM API configuration when generation is requested.
 * Does not block server startup or health endpoints if LLM_API_KEY is not supplied.
 */
export function validateEnvForGeneration(customEnv?: Record<string, string | undefined>): void {
  const env = customEnv ? getEnv(customEnv) : getEnv();
  if (!env.LLM_API_KEY || env.LLM_API_KEY.trim().length === 0) {
    throw new Error("Kit generation error: LLM_API_KEY is missing or empty.");
  }
}

