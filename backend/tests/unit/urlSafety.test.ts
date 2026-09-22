import { describe, it, expect } from "vitest";
import {
  validateCompanyUrl,
  isPrivateOrLoopbackHostname,
  isPrivateOrLoopbackIp,
} from "../../src/services/research/urlSafety.js";

describe("URL Safety & SSRF Protection", () => {
  it("validates https://example.com as valid", () => {
    const result = validateCompanyUrl("https://example.com");
    expect(result.valid).toBe(true);
    expect(result.normalizedUrl).toBe("https://example.com/");
    expect(result.hostname).toBe("example.com");
  });

  it("normalizes bare domain example.com to https://example.com/", () => {
    const result = validateCompanyUrl("example.com");
    expect(result.valid).toBe(true);
    expect(result.normalizedUrl).toBe("https://example.com/");
  });

  it("preserves valid relative path and query in normalization", () => {
    const result = validateCompanyUrl("https://example.com/about/careers?dept=eng");
    expect(result.valid).toBe(true);
    expect(result.normalizedUrl).toBe("https://example.com/about/careers?dept=eng");
  });

  it("removes URL fragments/hashes during normalization", () => {
    const result = validateCompanyUrl("https://example.com/about#team");
    expect(result.valid).toBe(true);
    expect(result.normalizedUrl).toBe("https://example.com/about");
  });

  it("rejects non-http/https protocols such as ftp://example.com", () => {
    const result = validateCompanyUrl("ftp://example.com");
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("INVALID_COMPANY_URL");
  });

  it("rejects malformed input", () => {
    const result = validateCompanyUrl("http://:80");
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("INVALID_COMPANY_URL");
  });

  it("rejects empty URL input", () => {
    const result = validateCompanyUrl("   ");
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("INVALID_COMPANY_URL");
  });

  it("rejects URLs containing embedded credentials (username/password)", () => {
    const result = validateCompanyUrl("https://user:password@example.com");
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("INVALID_COMPANY_URL");
  });

  it("rejects localhost in production", () => {
    const result = validateCompanyUrl("http://localhost", { nodeEnv: "production" });
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("UNSAFE_COMPANY_URL");
  });

  it("rejects 127.0.0.1 in production", () => {
    const result = validateCompanyUrl("http://127.0.0.1", { nodeEnv: "production" });
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("UNSAFE_COMPANY_URL");
  });

  it("rejects [::1] in production", () => {
    const result = validateCompanyUrl("http://[::1]", { nodeEnv: "production" });
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("UNSAFE_COMPANY_URL");
  });

  it("rejects 192.168.1.10 in production", () => {
    const result = validateCompanyUrl("http://192.168.1.10", { nodeEnv: "production" });
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("UNSAFE_COMPANY_URL");
  });

  it("rejects 10.0.0.1 in production", () => {
    const result = validateCompanyUrl("http://10.0.0.1", { nodeEnv: "production" });
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("UNSAFE_COMPANY_URL");
  });

  it("rejects 169.254.169.254 (metadata service)", () => {
    const result = validateCompanyUrl("http://169.254.169.254", { nodeEnv: "production" });
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("UNSAFE_COMPANY_URL");
  });

  it("allows localhost in development/test only when allowLocalFetch=true", () => {
    const disallowed = validateCompanyUrl("http://localhost:8099/acme", {
      nodeEnv: "development",
      allowLocalFetch: false,
    });
    expect(disallowed.valid).toBe(false);
    expect(disallowed.error?.code).toBe("UNSAFE_COMPANY_URL");

    const allowed = validateCompanyUrl("http://localhost:8099/acme", {
      nodeEnv: "development",
      allowLocalFetch: true,
    });
    expect(allowed.valid).toBe(true);
    expect(allowed.normalizedUrl).toBe("http://localhost:8099/acme");
  });

  it("allows a non-local domain containing the word localhost", () => {
    const result = validateCompanyUrl("https://notlocalhost.example.com", {
      nodeEnv: "production",
    });
    expect(result.valid).toBe(true);
    expect(result.hostname).toBe("notlocalhost.example.com");
  });

  it("correctly identifies private or loopback hostnames", () => {
    expect(isPrivateOrLoopbackHostname("localhost")).toBe(true);
    expect(isPrivateOrLoopbackHostname("localhost.localdomain")).toBe(true);
    expect(isPrivateOrLoopbackHostname("app.localhost")).toBe(true);
    expect(isPrivateOrLoopbackHostname("example.com")).toBe(false);
    expect(isPrivateOrLoopbackHostname("notlocalhost.example.com")).toBe(false);
  });

  it("correctly identifies private and loopback IPs", () => {
    expect(isPrivateOrLoopbackIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrLoopbackIp("10.1.2.3")).toBe(true);
    expect(isPrivateOrLoopbackIp("172.20.0.5")).toBe(true);
    expect(isPrivateOrLoopbackIp("192.168.0.1")).toBe(true);
    expect(isPrivateOrLoopbackIp("169.254.1.1")).toBe(true);
    expect(isPrivateOrLoopbackIp("::1")).toBe(true);
    expect(isPrivateOrLoopbackIp("fc00::1")).toBe(true);
    expect(isPrivateOrLoopbackIp("fe80::1")).toBe(true);
    expect(isPrivateOrLoopbackIp("8.8.8.8")).toBe(false);
    expect(isPrivateOrLoopbackIp("93.184.216.34")).toBe(false);
  });
});
