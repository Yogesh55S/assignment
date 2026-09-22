import { describe, it, expect } from "vitest";
import {
  extractInternalLinks,
  normalizeUrlForComparison,
} from "../../src/services/research/linkExtractor.js";

describe("Link Extractor", () => {
  it("resolves relative and root-relative links properly", () => {
    const html = `
      <html>
        <body>
          <a href="about">About Us</a>
          <a href="/careers">Careers</a>
          <a href="./team">Team</a>
        </body>
      </html>
    `;
    const links = extractInternalLinks(html, "https://acme.com/company/");
    const urls = links.map((l) => l.url);

    expect(urls).toContain("https://acme.com/company/about");
    expect(urls).toContain("https://acme.com/careers");
    expect(urls).toContain("https://acme.com/company/team");
  });

  it("identifies sameOrigin links vs external links", () => {
    const html = `
      <html>
        <body>
          <a href="/careers">Internal Careers</a>
          <a href="https://external-jobs.com/acme">External Job Board</a>
        </body>
      </html>
    `;
    const links = extractInternalLinks(html, "https://acme.com");
    const internal = links.find((l) => l.url.includes("acme.com"));
    const external = links.find((l) => l.url.includes("external-jobs.com"));

    expect(internal?.sameOrigin).toBe(true);
    expect(external?.sameOrigin).toBe(false);
  });

  it("ignores non-http schemes like mailto, tel, and javascript", () => {
    const html = `
      <html>
        <body>
          <a href="mailto:contact@acme.com">Email Us</a>
          <a href="tel:+123456789">Call Us</a>
          <a href="javascript:void(0)">Do Not Click</a>
          <a href="#">Empty Anchor</a>
          <a href="/valid">Valid Link</a>
        </body>
      </html>
    `;
    const links = extractInternalLinks(html, "https://acme.com");
    expect(links.length).toBe(1);
    expect(links[0].url).toBe("https://acme.com/valid");
  });

  it("strips fragments and removes duplicate URLs", () => {
    const html = `
      <html>
        <body>
          <a href="/careers#engineering">Engineering Careers</a>
          <a href="/careers#design">Design Careers</a>
          <a href="/careers">Careers Home</a>
        </body>
      </html>
    `;
    const links = extractInternalLinks(html, "https://acme.com");
    expect(links.length).toBe(1);
    expect(links[0].url).toBe("https://acme.com/careers");
    expect(links[0].anchorText).toBe("Engineering Careers");
  });

  it("excludes static asset URLs (pdf, images, css, js, fonts)", () => {
    const html = `
      <html>
        <body>
          <a href="/handbook.pdf">Handbook PDF</a>
          <a href="/logo.png">Logo</a>
          <a href="/style.css">Styles</a>
          <a href="/app.js">Script</a>
          <a href="/font.woff2">Font</a>
          <a href="/careers">Careers Page</a>
        </body>
      </html>
    `;
    const links = extractInternalLinks(html, "https://acme.com");
    expect(links.length).toBe(1);
    expect(links[0].url).toBe("https://acme.com/careers");
  });

  it("normalizes anchor text whitespace and parses rel attributes", () => {
    const html = `
      <html>
        <body>
          <a href="/privacy" rel="nofollow noopener">
            Privacy    
            Policy
          </a>
        </body>
      </html>
    `;
    const links = extractInternalLinks(html, "https://acme.com");
    expect(links[0].anchorText).toBe("Privacy Policy");
    expect(links[0].rel).toEqual(["nofollow", "noopener"]);
  });

  it("correctly resolves relative links for local URLs with path prefix", () => {
    const html = `
      <html>
        <body>
          <a href="careers">Careers</a>
          <a href="/about">About</a>
        </body>
      </html>
    `;
    const links = extractInternalLinks(html, "http://localhost:8099/acme/");
    const urls = links.map((l) => l.url);

    expect(urls).toContain("http://localhost:8099/acme/careers");
    expect(urls).toContain("http://localhost:8099/about");
  });

  it("normalizes URLs for comparison consistently", () => {
    const u1 = normalizeUrlForComparison("https://acme.com:443/careers/");
    const u2 = normalizeUrlForComparison("https://acme.com/careers#top");
    expect(u1).toBe(u2);
  });
});
