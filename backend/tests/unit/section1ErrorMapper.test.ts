import { describe, it, expect } from "vitest";
import { mapError } from "../../../frontend/src/lib/errorMapper.js";

describe("Section 1: Error Mapper Verification Tests", () => {
  it("maps known backend error codes to safe user messages and retryability flags", () => {
    const invalidUrl = mapError("INVALID_COMPANY_URL");
    expect(invalidUrl.message).toBe("Enter a valid public http(s) company website URL.");
    expect(invalidUrl.retryable).toBe(true);

    const rateLimited = mapError("LLM_RATE_LIMITED");
    expect(rateLimited.message).toBe("The AI provider is temporarily busy. Please retry in a moment.");
    expect(rateLimited.retryable).toBe(true);

    const robots = mapError("ROBOTS_DISALLOWED");
    expect(robots.message).toBe("This company site does not allow automated retrieval for the requested page.");
    expect(robots.retryable).toBe(false);

    const conflict = mapError("KIT_CONFLICT");
    expect(conflict.message).toBe("This kit changed elsewhere. Refresh before saving again.");
    expect(conflict.retryable).toBe(true);
  });

  it("masks raw technical stack trace / database error string into safe UNKNOWN_ERROR message", () => {
    const rawError = "MongoServerError: E11000 duplicate key error collection: interview_prep.users index: email_1 dup key";
    const mapped = mapError("INTERNAL_SERVER_ERROR", rawError);
    expect(mapped.message).not.toContain("MongoServerError");
    expect(mapped.message).not.toContain("E11000");
    expect(mapped.message).toBe("An unexpected error occurred. Please try again.");
    expect(mapped.retryable).toBe(true);
  });

  it("correctly identifies network errors from fetch exception messages", () => {
    const networkErr = mapError(undefined, "TypeError: Failed to fetch");
    expect(networkErr.code).toBe("NETWORK_ERROR");
    expect(networkErr.message).toBe("Network connection error. Please check your internet connection.");
    expect(networkErr.retryable).toBe(true);
  });
});
