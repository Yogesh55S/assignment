export type ResearchWarningCode =
  | "INVALID_COMPANY_URL"
  | "UNSAFE_COMPANY_URL"
  | "COMPANY_UNREACHABLE"
  | "PAGE_NOT_FOUND"
  | "PAGE_TIMEOUT"
  | "ROBOTS_DISALLOWED"
  | "UNSUPPORTED_CONTENT_TYPE"
  | "CONTENT_TOO_LARGE"
  | "PAGE_FETCH_FAILED"
  | "NO_RELEVANT_INTERNAL_LINKS"
  | "NO_HIRING_PAGE_FOUND"
  | "NO_PUBLIC_INTERVIEW_DISCUSSION"
  | "MAX_PAGE_LIMIT_REACHED"
  | "PARTIAL_REGENERATION_WARNING";

export interface ResearchWarning {
  code: ResearchWarningCode;
  message: string;
  url?: string;
  retryable?: boolean;
}

export interface SafeUrlValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  hostname?: string;
  error?: {
    code: "INVALID_COMPANY_URL" | "UNSAFE_COMPANY_URL";
    message: string;
  };
}

export interface RobotsRules {
  robotsUrl: string;
  fetched: boolean;
  allowed: boolean;
  disallowRules: string[];
  allowRules?: string[];
  crawlDelayMs?: number;
  warnings: ResearchWarning[];
}

export interface FetchedPage {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  contentType: string;
  html: string;
  fetchedAt: string;
}

export interface CleanedPage {
  url: string;
  title: string;
  text: string;
  textLength: number;
}

export type LinkPurpose =
  | "hiring"
  | "company"
  | "engineering"
  | "interview"
  | "other";

export interface DiscoveredLink {
  url: string;
  rawHref: string;
  anchorText: string;
  rel: string[];
  sameOrigin: boolean;
}

export interface RankedLink extends DiscoveredLink {
  score: number;
  purpose: LinkPurpose;
  matchedKeywords: string[];
}

export interface CompanyResearchResult {
  inputUrl: string;
  normalizedCompanyUrl: string;
  companyHomepage?: CleanedPage;
  pages: CleanedPage[];
  rankedLinks: RankedLink[];
  pagesUsed: string[];
  hiringPageUrls: string[];
  warnings: ResearchWarning[];
  robots: RobotsRules;
  completed: boolean;
}

export interface CompanyCrawlerOptions {
  maxPages?: number;
  maxRankedLinksToConsider?: number;
  requestDelayMs?: number;
  timeoutMs?: number;
  maxContentBytes?: number;
  maxRetries?: number;
  userAgent?: string;
}

export const DEFAULT_CRAWLER_OPTIONS: Required<CompanyCrawlerOptions> = {
  maxPages: 8,
  maxRankedLinksToConsider: 20,
  requestDelayMs: 350,
  timeoutMs: 8000,
  maxContentBytes: 1_000_000,
  maxRetries: 3,
  userAgent: "AIInterviewPrepKit/1.0 (+educational-assessment)",
};
