import { describe, it, expect } from "vitest";
import {
  validateEnvForServer,
  validateEnvForGeneration,
} from "../../src/config/env.js";

describe("Production Environment Safety Rules", () => {
  const validBaseProdEnv = {
    NODE_ENV: "production",
    PORT: "5000",
    MONGODB_URI: "mongodb+srv://user:pass@cluster.mongodb.net/db",
    JWT_SECRET: "this_is_a_very_long_secure_jwt_secret_that_is_over_32_chars",
    CLIENT_URL: "https://interviewprep.example.com",
    LLM_API_KEY: "secret_llm_api_key_value",
    LLM_MODEL: "gemini-flash-latest",
    ALLOW_LOCAL_FETCH: "false",
    COOKIE_SAME_SITE: "none",
  };

  it("rejects NODE_ENV=production when ALLOW_LOCAL_FETCH is true", () => {
    const invalidEnv = {
      ...validBaseProdEnv,
      ALLOW_LOCAL_FETCH: "true",
    };
    expect(() => validateEnvForServer(invalidEnv)).toThrow(
      /ALLOW_LOCAL_FETCH must be false in production/
    );
  });

  it("rejects NODE_ENV=production when CLIENT_URL points to localhost", () => {
    const invalidEnv = {
      ...validBaseProdEnv,
      CLIENT_URL: "http://localhost:3000",
    };
    expect(() => validateEnvForServer(invalidEnv)).toThrow(
      /CLIENT_URL cannot point to localhost in production/
    );
  });

  it("rejects NODE_ENV=production when JWT_SECRET is shorter than 32 characters", () => {
    const invalidEnv = {
      ...validBaseProdEnv,
      JWT_SECRET: "short_secret",
    };
    expect(() => validateEnvForServer(invalidEnv)).toThrow(
      /JWT_SECRET must be at least 32 characters in production/
    );
  });

  it("rejects server startup when MONGODB_URI is missing", () => {
    const invalidEnv = {
      ...validBaseProdEnv,
      MONGODB_URI: "",
    };
    expect(() => validateEnvForServer(invalidEnv)).toThrow(
      /Missing required environment variable\(s\): MONGODB_URI/
    );
  });

  it("fails kit-generation config validation when LLM_API_KEY is missing", () => {
    const invalidEnv = {
      ...validBaseProdEnv,
      LLM_API_KEY: "",
    };
    expect(() => validateEnvForGeneration(invalidEnv)).toThrow(
      /LLM_API_KEY is missing or empty/
    );
  });

  it("allows health/unit test start when LLM_API_KEY is missing if generation is not requested", () => {
    const envWithoutLLMKey = {
      ...validBaseProdEnv,
      LLM_API_KEY: "",
    };
    expect(() => validateEnvForServer(envWithoutLLMKey)).not.toThrow();
  });

  it("ensures environment validation errors never expose actual secret values", () => {
    const secretValue = "super_secret_token_12345_67890_abcdef";
    const envWithSecret = {
      NODE_ENV: "production",
      PORT: "5000",
      MONGODB_URI: "mongodb+srv://user:pass@cluster.mongodb.net/db",
      JWT_SECRET: secretValue,
      CLIENT_URL: "http://localhost:3000", // invalid for prod
      ALLOW_LOCAL_FETCH: "false",
    };

    try {
      validateEnvForServer(envWithSecret);
      expect.fail("Should have thrown error");
    } catch (err: any) {
      expect(err.message).not.toContain(secretValue);
    }
  });
});
