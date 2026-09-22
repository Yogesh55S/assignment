import { describe, it, expect } from "vitest";
import { createRequestFingerprint } from "../../src/utils/requestFingerprint.js";

describe("Request Fingerprinting", () => {
  const baseInput = {
    userId: "user-123",
    jd: "Senior Backend Engineer with Node.js and TypeScript.\nMust know SQL.",
    companyUrl: "https://acme.com",
    days: 7,
  };

  it("yields identical fingerprint for identical semantic input", () => {
    const fp1 = createRequestFingerprint(baseInput);
    const fp2 = createRequestFingerprint({ ...baseInput });
    expect(fp1).toBe(fp2);
    expect(fp1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("normalizes carriage returns and trailing/leading whitespace", () => {
    const fp1 = createRequestFingerprint({
      ...baseInput,
      jd: "Senior Backend Engineer with Node.js and TypeScript.\r\nMust know SQL.\n  ",
    });
    const fp2 = createRequestFingerprint({
      ...baseInput,
      jd: "Senior Backend Engineer with Node.js and TypeScript.\nMust know SQL.",
    });
    expect(fp1).toBe(fp2);
  });

  it("produces different fingerprints for different day allocations", () => {
    const fp1 = createRequestFingerprint({ ...baseInput, days: 7 });
    const fp2 = createRequestFingerprint({ ...baseInput, days: 14 });
    expect(fp1).not.toBe(fp2);
  });

  it("produces different fingerprints for different user IDs", () => {
    const fp1 = createRequestFingerprint({ ...baseInput, userId: "user-1" });
    const fp2 = createRequestFingerprint({ ...baseInput, userId: "user-2" });
    expect(fp1).not.toBe(fp2);
  });

  it("produces different fingerprints for different company URLs", () => {
    const fp1 = createRequestFingerprint({ ...baseInput, companyUrl: "https://acme.com" });
    const fp2 = createRequestFingerprint({ ...baseInput, companyUrl: "https://beta.com" });
    expect(fp1).not.toBe(fp2);
  });
});
