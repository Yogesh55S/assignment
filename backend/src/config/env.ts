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

export function getEnv(): EnvConfig {
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
export function validateEnvForServer(): ValidatedServerEnv {
  const env = getEnv();

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

  return env as ValidatedServerEnv;
}
