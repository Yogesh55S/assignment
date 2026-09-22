import { describe, it, expect } from "vitest";
import {
  getRobotsUrl,
  parseRobotsTxt,
  isPathAllowedByRobots,
  getRobotsRules,
} from "../../src/services/research/robots.js";

describe("Robots.txt Parser & Enforcement", () => {
  const userAgent = "AIInterviewPrepKit/1.0 (+educational-assessment)";

  it("constructs robots.txt URL from origin", () => {
    expect(getRobotsUrl("https://acme.com/about")).toBe("https://acme.com/robots.txt");
    expect(getRobotsUrl("http://localhost:8099/acme/")).toBe("http://localhost:8099/robots.txt");
  });

  it("handles wildcard disallow rules", () => {
    const txt = `
      User-agent: *
      Disallow: /private
      Disallow: /admin/
    `;
    const parsed = parseRobotsTxt(txt, userAgent);
    expect(parsed.disallowRules).toContain("/private");
    expect(parsed.disallowRules).toContain("/admin/");

    expect(isPathAllowedByRobots("/about", parsed.disallowRules)).toBe(true);
    expect(isPathAllowedByRobots("/private/docs", parsed.disallowRules)).toBe(false);
    expect(isPathAllowedByRobots("/admin/dashboard", parsed.disallowRules)).toBe(false);
  });

  it("prioritizes specific user-agent group over wildcard group", () => {
    const txt = `
      User-agent: *
      Disallow: /careers

      User-agent: AIInterviewPrepKit
      Disallow: /private
      Allow: /careers
    `;
    const parsed = parseRobotsTxt(txt, userAgent);
    expect(parsed.disallowRules).toEqual(["/private"]);
    expect(isPathAllowedByRobots("/careers", parsed.disallowRules, parsed.allowRules)).toBe(true);
    expect(isPathAllowedByRobots("/private", parsed.disallowRules, parsed.allowRules)).toBe(false);
  });

  it("treats empty Disallow as allow-all", () => {
    const txt = `
      User-agent: *
      Disallow:
    `;
    const parsed = parseRobotsTxt(txt, userAgent);
    expect(parsed.disallowRules.length).toBe(0);
    expect(isPathAllowedByRobots("/any-path", parsed.disallowRules)).toBe(true);
  });

  it("parses and caps Crawl-delay at 5000ms", () => {
    const txt1 = `
      User-agent: *
      Crawl-delay: 2.5
    `;
    const parsed1 = parseRobotsTxt(txt1, userAgent);
    expect(parsed1.crawlDelayMs).toBe(2500);

    const txt2 = `
      User-agent: *
      Crawl-delay: 15
    `;
    const parsed2 = parseRobotsTxt(txt2, userAgent);
    expect(parsed2.crawlDelayMs).toBe(5000); // capped
  });

  it("allows path when more specific Allow rule overrides Disallow rule", () => {
    const txt = `
      User-agent: *
      Disallow: /careers
      Allow: /careers/openings
    `;
    const parsed = parseRobotsTxt(txt, userAgent);
    expect(isPathAllowedByRobots("/careers", parsed.disallowRules, parsed.allowRules)).toBe(false);
    expect(isPathAllowedByRobots("/careers/openings", parsed.disallowRules, parsed.allowRules)).toBe(true);
  });

  it("treats 404 response as allowed with no warnings", async () => {
    const mockFetch: typeof fetch = async () =>
      new Response("Not Found", { status: 404 });

    const rules = await getRobotsRules("https://acme.com", {
      userAgent,
      timeoutMs: 1000,
      allowLocalFetch: true,
      nodeEnv: "test",
      fetchImpl: mockFetch,
    });

    expect(rules.fetched).toBe(true);
    expect(rules.allowed).toBe(true);
    expect(rules.disallowRules).toEqual([]);
    expect(rules.warnings).toEqual([]);
  });

  it("handles fetch network failure by allowing crawl and adding a non-fatal warning", async () => {
    const mockFetch: typeof fetch = async () => {
      throw new Error("Network connection dropped");
    };

    const rules = await getRobotsRules("https://acme.com", {
      userAgent,
      timeoutMs: 1000,
      allowLocalFetch: true,
      nodeEnv: "test",
      fetchImpl: mockFetch,
    });

    expect(rules.fetched).toBe(false);
    expect(rules.allowed).toBe(true);
    expect(rules.warnings.length).toBe(1);
    expect(rules.warnings[0].code).toBe("PAGE_FETCH_FAILED");
  });
});
