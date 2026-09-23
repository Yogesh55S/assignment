import { describe, it, expect } from "vitest";
import { createKitInputSchema } from "@interview-prep/shared/validators/kitSchema";
import { validateCompanyUrl } from "../../src/services/research/urlSafety.js";

describe("POST /api/kits Input Validation Rules", () => {
  describe("Job Description (JD) Validation", () => {
    it("rejects missing or empty JD", () => {
      const result = createKitInputSchema.safeParse({
        company_url: "https://example.com",
        days: 7,
      });
      expect(result.success).toBe(false);
    });

    it("rejects whitespace-only JD", () => {
      const result = createKitInputSchema.safeParse({
        jd: "   \n\t   ",
        company_url: "https://example.com",
        days: 7,
      });
      expect(result.success).toBe(false);
    });

    it("rejects JD over 50,000 characters", () => {
      const overlongJd = "A".repeat(50001);
      const result = createKitInputSchema.safeParse({
        jd: overlongJd,
        company_url: "https://example.com",
        days: 7,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Company URL & Protocol Safety Validation", () => {
    it("rejects missing company URL", () => {
      const result = createKitInputSchema.safeParse({
        jd: "Senior Software Engineer role requiring React and Node.js",
        days: 7,
      });
      expect(result.success).toBe(false);
    });

    it("rejects malformed URLs", () => {
      const res = validateCompanyUrl("http://:80");
      expect(res.valid).toBe(false);
      expect(res.error?.code).toBe("INVALID_COMPANY_URL");
    });

    it("rejects unsupported protocols (ftp, file, javascript)", () => {
      expect(validateCompanyUrl("ftp://files.example.com").valid).toBe(false);
      expect(validateCompanyUrl("file:///C:/passwords.txt").valid).toBe(false);
      expect(validateCompanyUrl("javascript:alert(1)").valid).toBe(false);
    });

    it("rejects private and loopback IPs in production mode (ALLOW_LOCAL_FETCH=false)", () => {
      const prevEnv = process.env.ALLOW_LOCAL_FETCH;
      process.env.ALLOW_LOCAL_FETCH = "false";

      try {
        expect(validateCompanyUrl("http://localhost:3000").valid).toBe(false);
        expect(validateCompanyUrl("http://127.0.0.1/admin").valid).toBe(false);
        expect(validateCompanyUrl("http://[::1]/").valid).toBe(false);
        expect(validateCompanyUrl("http://10.0.0.1/").valid).toBe(false);
        expect(validateCompanyUrl("http://192.168.1.1/").valid).toBe(false);
        expect(validateCompanyUrl("http://169.254.169.254/").valid).toBe(false);
      } finally {
        process.env.ALLOW_LOCAL_FETCH = prevEnv;
      }
    });

    it("allows local URLs when ALLOW_LOCAL_FETCH=true in test/development", () => {
      const prevEnv = process.env.ALLOW_LOCAL_FETCH;
      process.env.ALLOW_LOCAL_FETCH = "true";

      try {
        expect(validateCompanyUrl("http://localhost:3000").valid).toBe(true);
      } finally {
        process.env.ALLOW_LOCAL_FETCH = prevEnv;
      }
    });
  });

  describe("Study Days Validation", () => {
    it("rejects invalid days values (0, -1, 61, float, non-numeric strings)", () => {
      const invalidDays = [0, -1, 61, 3.5, "five", null, undefined];
      for (const dayVal of invalidDays) {
        const result = createKitInputSchema.safeParse({
          jd: "Valid job description content with required length.",
          company_url: "https://example.com",
          days: dayVal,
        });
        expect(result.success).toBe(false);
      }
    });

    it("accepts valid integer days values within 1 to 60 boundary (1, 5, 60)", () => {
      const validDays = [1, 5, 60];
      for (const dayVal of validDays) {
        const result = createKitInputSchema.safeParse({
          jd: "Valid job description content with required length.",
          company_url: "https://example.com",
          days: dayVal,
        });
        expect(result.success).toBe(true);
      }
    });
  });
});
