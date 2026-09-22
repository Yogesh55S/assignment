import { describe, it, expect } from "vitest";
import { rankCompanyLinks } from "../../src/services/research/linkRanker.js";
import type { DiscoveredLink } from "../../src/services/research/types.js";

describe("Link Ranker", () => {
  const companyUrl = "https://acme.com";

  it("ranks career link above negative/privacy links", () => {
    const links: DiscoveredLink[] = [
      {
        url: "https://acme.com/privacy",
        rawHref: "/privacy",
        anchorText: "Privacy Policy",
        rel: [],
        sameOrigin: true,
      },
      {
        url: "https://acme.com/careers",
        rawHref: "/careers",
        anchorText: "Join Our Team Careers",
        rel: [],
        sameOrigin: true,
      },
    ];

    const ranked = rankCompanyLinks(links, companyUrl);
    expect(ranked.length).toBe(1); // privacy has negative score and is excluded
    expect(ranked[0].url).toBe("https://acme.com/careers");
    expect(ranked[0].purpose).toBe("hiring");
  });

  it("ranks direct hiring process / interview link with high score and interview purpose", () => {
    const links: DiscoveredLink[] = [
      {
        url: "https://acme.com/hiring-process",
        rawHref: "/hiring-process",
        anchorText: "Our Interview and Hiring Process",
        rel: [],
        sameOrigin: true,
      },
    ];

    const ranked = rankCompanyLinks(links, companyUrl);
    expect(ranked.length).toBe(1);
    expect(ranked[0].purpose).toBe("interview");
    expect(ranked[0].score).toBeGreaterThanOrEqual(14);
    expect(ranked[0].matchedKeywords).toContain("hiring-process");
    expect(ranked[0].matchedKeywords).toContain("interview");
  });

  it("classifies about page as company purpose", () => {
    const links: DiscoveredLink[] = [
      {
        url: "https://acme.com/about",
        rawHref: "/about",
        anchorText: "About Us & Culture",
        rel: [],
        sameOrigin: true,
      },
    ];

    const ranked = rankCompanyLinks(links, companyUrl);
    expect(ranked.length).toBe(1);
    expect(ranked[0].purpose).toBe("company");
    expect(ranked[0].matchedKeywords).toContain("about");
    expect(ranked[0].matchedKeywords).toContain("culture");
  });

  it("classifies engineering blog as engineering purpose", () => {
    const links: DiscoveredLink[] = [
      {
        url: "https://acme.com/blog/tech",
        rawHref: "/blog/tech",
        anchorText: "Engineering Blog",
        rel: [],
        sameOrigin: true,
      },
    ];

    const ranked = rankCompanyLinks(links, companyUrl);
    expect(ranked.length).toBe(1);
    expect(ranked[0].purpose).toBe("engineering");
    expect(ranked[0].matchedKeywords).toContain("engineering");
    expect(ranked[0].matchedKeywords).toContain("blog");
  });

  it("excludes external links", () => {
    const links: DiscoveredLink[] = [
      {
        url: "https://lever.co/acme-jobs",
        rawHref: "https://lever.co/acme-jobs",
        anchorText: "Jobs and Careers",
        rel: [],
        sameOrigin: false,
      },
    ];

    const ranked = rankCompanyLinks(links, companyUrl);
    expect(ranked.length).toBe(0);
  });

  it("excludes nofollow links", () => {
    const links: DiscoveredLink[] = [
      {
        url: "https://acme.com/careers",
        rawHref: "/careers",
        anchorText: "Careers",
        rel: ["nofollow"],
        sameOrigin: true,
      },
    ];

    const ranked = rankCompanyLinks(links, companyUrl);
    expect(ranked.length).toBe(0);
  });

  it("excludes the homepage itself", () => {
    const links: DiscoveredLink[] = [
      {
        url: "https://acme.com/",
        rawHref: "/",
        anchorText: "Home Careers Company",
        rel: [],
        sameOrigin: true,
      },
    ];

    const ranked = rankCompanyLinks(links, "https://acme.com");
    expect(ranked.length).toBe(0);
  });

  it("sorts ties deterministically by purpose and URL", () => {
    const links: DiscoveredLink[] = [
      {
        url: "https://acme.com/z-team",
        rawHref: "/z-team",
        anchorText: "Our Team",
        rel: [],
        sameOrigin: true,
      },
      {
        url: "https://acme.com/a-team",
        rawHref: "/a-team",
        anchorText: "Our Team",
        rel: [],
        sameOrigin: true,
      },
    ];

    const ranked = rankCompanyLinks(links, companyUrl);
    expect(ranked.length).toBe(2);
    expect(ranked[0].score).toBe(ranked[1].score);
    // Alphabetical tiebreak
    expect(ranked[0].url).toBe("https://acme.com/a-team");
    expect(ranked[1].url).toBe("https://acme.com/z-team");
  });
});
