import { describe, it, expect, vi } from "vitest";
import {
  parseRobotsTxt,
  isPathAllowedByRobots,
  getRobotsRules,
  getRobotsUrl,
} from "../../src/services/research/robots.js";
import { crawlCompanySite } from "../../src/services/research/companyCrawler.js";
import { mapError } from "../../../frontend/src/lib/errorMapper.js";

describe("Section 3 — Task 1: Robots.txt & Blocked Content Verification", () => {
  const userAgent = "AIInterviewPrepKit/1.0 (+educational-assessment)";

  it("1. derives robots URL as origin + /robots.txt", () => {
    expect(getRobotsUrl("https://example.com/jobs/senior-dev")).toBe(
      "https://example.com/robots.txt"
    );
    expect(getRobotsUrl("https://acme.org:8080/deep/path?query=1")).toBe(
      "https://acme.org:8080/robots.txt"
    );
  });

  it("2. allows all when disallow rules are empty", () => {
    const robotsTxt = `
User-agent: *
Disallow:
    `;
    const parsed = parseRobotsTxt(robotsTxt, userAgent);
    expect(parsed.disallowRules).toEqual([]);
    expect(isPathAllowedByRobots("/careers", parsed.disallowRules)).toBe(true);
  });

  it("3. handles wildcard disallow rule", () => {
    const robotsTxt = `
User-agent: *
Disallow: /
    `;
    const parsed = parseRobotsTxt(robotsTxt, userAgent);
    expect(parsed.disallowRules).toEqual(["/"]);
    expect(isPathAllowedByRobots("/careers", parsed.disallowRules)).toBe(false);
  });

  it("4. enforces user-agent specific rules taking precedence over wildcard *", () => {
    const robotsTxt = `
User-agent: *
Disallow: /

User-agent: AIInterviewPrepKit
Disallow: /blocked
Allow: /
    `;
    const parsed = parseRobotsTxt(robotsTxt, userAgent);
    expect(parsed.disallowRules).toEqual(["/blocked"]);
    expect(parsed.allowRules).toEqual(["/"]);
    expect(isPathAllowedByRobots("/careers", parsed.disallowRules, parsed.allowRules)).toBe(true);
    expect(isPathAllowedByRobots("/blocked", parsed.disallowRules, parsed.allowRules)).toBe(false);
  });

  it("5. handles Allow rule overriding a more general or equal Disallow rule", () => {
    const disallows = ["/api", "/admin"];
    const allows = ["/api/public"];

    expect(isPathAllowedByRobots("/admin", disallows, allows)).toBe(false);
    expect(isPathAllowedByRobots("/api/private", disallows, allows)).toBe(false);
    expect(isPathAllowedByRobots("/api/public", disallows, allows)).toBe(true);
    expect(isPathAllowedByRobots("/api/public/v1", disallows, allows)).toBe(true);
  });

  it("6. caps Crawl-delay at 5000ms max", () => {
    const robotsTxt = `
User-agent: *
Crawl-delay: 25
    `;
    const parsed = parseRobotsTxt(robotsTxt, userAgent);
    expect(parsed.crawlDelayMs).toBe(5000);
  });

  it("7. handles robots.txt 404 safely (allows crawl, no failure)", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response("Not Found", { status: 404 })
    );

    const rules = await getRobotsRules("https://acme.com", {
      userAgent,
      timeoutMs: 1000,
      allowLocalFetch: true,
      nodeEnv: "test",
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    expect(rules.fetched).toBe(true);
    expect(rules.allowed).toBe(true);
    expect(rules.disallowRules).toEqual([]);
    expect(rules.warnings).toEqual([]);
  });

  it("8. handles robots.txt network failure gracefully (allows crawl, records warning)", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network connection reset"));

    const rules = await getRobotsRules("https://acme.com", {
      userAgent,
      timeoutMs: 1000,
      allowLocalFetch: true,
      nodeEnv: "test",
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    expect(rules.fetched).toBe(false);
    expect(rules.allowed).toBe(true);
    expect(rules.warnings).toHaveLength(1);
    expect(rules.warnings[0].code).toBe("PAGE_FETCH_FAILED");
  });

  it("9. homepage blocked by robots.txt returns ROBOTS_DISALLOWED and does not fetch homepage", async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/robots.txt")) {
        return new Response("User-agent: *\nDisallow: /", { status: 200 });
      }
      throw new Error("Homepage should not be fetched!");
    });

    const result = await crawlCompanySite("https://acme.com", {
      userAgent,
      fetchImpl: mockFetch as unknown as typeof fetch,
      allowLocalFetch: true,
      nodeEnv: "test",
    });

    expect(result.robots.allowed).toBe(false);
    expect(result.completed).toBe(false);
    expect(result.pages).toHaveLength(0);
    const robotsWarning = result.warnings.find((w) => w.code === "ROBOTS_DISALLOWED");
    expect(robotsWarning).toBeDefined();

    // Verify UI error mapper produces required safe research note
    const mapped = mapError(robotsWarning?.code);
    expect(mapped.message).toBe("This company site does not allow automated retrieval for the requested page.");
  });

  it("10. local fixture: linked page blocked skips only blocked page, fetches careers, non-fatal warning", async () => {
    const homepageHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Acme Corp</title></head>
        <body>
          <h1>Welcome to Acme Corp</h1>
          <a href="/blocked">Blocked Engineering Careers</a>
          <a href="/careers">Engineering Careers</a>
        </body>
      </html>
    `;

    const careersHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Acme Careers</title></head>
        <body>
          <h1>Join Our Team</h1>
          <p>We are hiring Software Engineers to build scalability tools.</p>
        </body>
      </html>
    `;

    const robotsTxt = `
      User-agent: *
      Disallow: /blocked
    `;

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/robots.txt")) {
        return new Response(robotsTxt, { status: 200 });
      }
      if (url === "https://acme.com/" || url === "https://acme.com") {
        return new Response(homepageHtml, { status: 200, headers: { "content-type": "text/html" } });
      }
      if (url.includes("/careers")) {
        return new Response(careersHtml, { status: 200, headers: { "content-type": "text/html" } });
      }
      if (url.includes("/blocked")) {
        throw new Error("Blocked URL should not be fetched");
      }
      return new Response("Not Found", { status: 404 });
    });

    const result = await crawlCompanySite("https://acme.com", {
      userAgent,
      fetchImpl: mockFetch as unknown as typeof fetch,
      allowLocalFetch: true,
      nodeEnv: "test",
    });

    expect(result.completed).toBe(true);
    expect(result.robots.allowed).toBe(true);
    // Should have crawled homepage and careers page, but skipped /blocked
    const fetchedUrls = result.pages.map((p) => p.url);
    expect(fetchedUrls.some((u) => u.includes("/careers"))).toBe(true);
    expect(fetchedUrls.some((u) => u.includes("/blocked"))).toBe(false);

    // Should have a non-fatal ROBOTS_DISALLOWED warning for /blocked
    const blockedWarning = result.warnings.find(
      (w) => w.code === "ROBOTS_DISALLOWED" && w.url?.includes("/blocked")
    );
    expect(blockedWarning).toBeDefined();
  });
});
