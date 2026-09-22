import type { DiscoveredLink, LinkPurpose, RankedLink } from "./types.js";
import { normalizeUrlForComparison } from "./linkExtractor.js";

export interface KeywordSignal {
  keyword: string;
  weight: number;
  category: "interview" | "hiring" | "company" | "engineering" | "negative";
}

export const KEYWORD_SIGNALS: KeywordSignal[] = [
  // Interview / hiring process
  { keyword: "interview", weight: 14, category: "interview" },
  { keyword: "interviews", weight: 14, category: "interview" },
  { keyword: "hiring-process", weight: 14, category: "interview" },
  { keyword: "hiring process", weight: 14, category: "interview" },
  { keyword: "recruiting", weight: 14, category: "interview" },

  // Hiring / careers
  { keyword: "career", weight: 12, category: "hiring" },
  { keyword: "careers", weight: 12, category: "hiring" },
  { keyword: "job", weight: 12, category: "hiring" },
  { keyword: "jobs", weight: 12, category: "hiring" },
  { keyword: "hiring", weight: 12, category: "hiring" },
  { keyword: "join", weight: 12, category: "hiring" },
  { keyword: "work-with-us", weight: 12, category: "hiring" },
  { keyword: "work with us", weight: 12, category: "hiring" },
  { keyword: "application", weight: 7, category: "hiring" },
  { keyword: "apply", weight: 7, category: "hiring" },
  { keyword: "candidate", weight: 7, category: "hiring" },

  // Company / culture
  { keyword: "about", weight: 7, category: "company" },
  { keyword: "company", weight: 7, category: "company" },
  { keyword: "mission", weight: 7, category: "company" },
  { keyword: "values", weight: 7, category: "company" },
  { keyword: "culture", weight: 7, category: "company" },
  { keyword: "team", weight: 7, category: "company" },
  { keyword: "people", weight: 7, category: "company" },
  { keyword: "who-we-are", weight: 7, category: "company" },
  { keyword: "who we are", weight: 7, category: "company" },
  { keyword: "handbook", weight: 6, category: "company" },

  // Engineering / tech
  { keyword: "engineering", weight: 5, category: "engineering" },
  { keyword: "tech", weight: 5, category: "engineering" },
  { keyword: "technology", weight: 5, category: "engineering" },
  { keyword: "blog", weight: 5, category: "engineering" },
  { keyword: "architecture", weight: 5, category: "engineering" },

  // Negative signals
  { keyword: "privacy", weight: -15, category: "negative" },
  { keyword: "terms", weight: -15, category: "negative" },
  { keyword: "cookie", weight: -15, category: "negative" },
  { keyword: "login", weight: -15, category: "negative" },
  { keyword: "signin", weight: -15, category: "negative" },
  { keyword: "signup", weight: -15, category: "negative" },
  { keyword: "legal", weight: -15, category: "negative" },
  { keyword: "security", weight: -15, category: "negative" },
  { keyword: "press", weight: -4, category: "negative" },
  { keyword: "news", weight: -4, category: "negative" },
  { keyword: "events", weight: -4, category: "negative" },
];

const PURPOSE_PRIORITY: Record<LinkPurpose, number> = {
  interview: 1,
  hiring: 2,
  company: 3,
  engineering: 4,
  other: 5,
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function rankCompanyLinks(
  links: DiscoveredLink[],
  companyUrl: string
): RankedLink[] {
  const normalizedCompanyUrl = normalizeUrlForComparison(companyUrl);
  const ranked: RankedLink[] = [];

  for (const link of links) {
    // 1. Only same-origin links
    if (!link.sameOrigin) {
      continue;
    }

    // 2. Ignore nofollow links
    if (link.rel.includes("nofollow")) {
      continue;
    }

    // 3. Avoid ranking the normalized homepage itself
    const normalizedLinkUrl = normalizeUrlForComparison(link.url);
    if (normalizedLinkUrl === normalizedCompanyUrl) {
      continue;
    }

    let urlObj: URL;
    try {
      urlObj = new URL(link.url);
    } catch {
      continue;
    }

    // Inspect URL path, search, and anchor text
    const targetText = `${urlObj.pathname} ${urlObj.search} ${link.anchorText}`.toLowerCase();

    let totalScore = 0;
    const matchedKeywords: string[] = [];
    const catScores: Record<"interview" | "hiring" | "company" | "engineering" | "negative", number> = {
      interview: 0,
      hiring: 0,
      company: 0,
      engineering: 0,
      negative: 0,
    };

    for (const signal of KEYWORD_SIGNALS) {
      // Check word boundary or path delimiter match
      const regex = new RegExp(`(?:^|[^a-z0-9])${escapeRegex(signal.keyword)}(?:$|[^a-z0-9])`, "i");
      if (regex.test(targetText)) {
        totalScore += signal.weight;
        matchedKeywords.push(signal.keyword);
        catScores[signal.category] += signal.weight;
      }
    }

    // Only include links with positive score
    if (totalScore <= 0) {
      continue;
    }

    // Determine purpose
    let purpose: LinkPurpose = "other";
    if (catScores.interview > 0) {
      purpose = "interview";
    } else if (
      catScores.hiring > catScores.company &&
      catScores.hiring > catScores.engineering &&
      catScores.hiring > 0
    ) {
      purpose = "hiring";
    } else if (catScores.company >= catScores.engineering && catScores.company > 0) {
      purpose = "company";
    } else if (catScores.engineering > 0) {
      purpose = "engineering";
    }

    ranked.push({
      ...link,
      score: totalScore,
      purpose,
      matchedKeywords,
    });
  }

  // Deterministic sort:
  // 1. score descending
  // 2. purpose priority
  // 3. URL ascending
  ranked.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const pDiff = PURPOSE_PRIORITY[a.purpose] - PURPOSE_PRIORITY[b.purpose];
    if (pDiff !== 0) {
      return pDiff;
    }
    return a.url.localeCompare(b.url);
  });

  return ranked;
}
