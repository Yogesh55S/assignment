import { DEFAULT_CRAWLER_OPTIONS, type CompanyCrawlerOptions, type CompanyResearchResult, type CleanedPage, type ResearchWarning } from "./types.js";
import { validateCompanyUrl } from "./urlSafety.js";
import { getRobotsRules, isPathAllowedByRobots } from "./robots.js";
import { fetchHtmlPage, sleep } from "./fetchPage.js";
import { cleanHtmlToPage } from "./htmlCleaner.js";
import { extractInternalLinks, normalizeUrlForComparison } from "./linkExtractor.js";
import { rankCompanyLinks } from "./linkRanker.js";
import { ResearchError } from "./researchErrors.js";

export async function crawlCompanySite(
  rawCompanyUrl: string,
  options?: Partial<CompanyCrawlerOptions> & {
    nodeEnv?: string;
    allowLocalFetch?: boolean;
    fetchImpl?: typeof fetch;
    now?: () => Date;
    sleepImpl?: (ms: number) => Promise<void>;
  }
): Promise<CompanyResearchResult> {
  const mergedOptions: Required<CompanyCrawlerOptions> = {
    maxPages: options?.maxPages ?? DEFAULT_CRAWLER_OPTIONS.maxPages,
    maxRankedLinksToConsider: options?.maxRankedLinksToConsider ?? DEFAULT_CRAWLER_OPTIONS.maxRankedLinksToConsider,
    requestDelayMs: options?.requestDelayMs ?? DEFAULT_CRAWLER_OPTIONS.requestDelayMs,
    timeoutMs: options?.timeoutMs ?? DEFAULT_CRAWLER_OPTIONS.timeoutMs,
    maxContentBytes: options?.maxContentBytes ?? DEFAULT_CRAWLER_OPTIONS.maxContentBytes,
    maxRetries: options?.maxRetries ?? DEFAULT_CRAWLER_OPTIONS.maxRetries,
    userAgent: options?.userAgent ?? DEFAULT_CRAWLER_OPTIONS.userAgent,
  };

  const nodeEnv = options?.nodeEnv ?? process.env.NODE_ENV ?? "development";
  const allowLocalFetch = options?.allowLocalFetch ?? (process.env.ALLOW_LOCAL_FETCH === "true");
  const fetchImpl = options?.fetchImpl;
  const sleepImpl = options?.sleepImpl ?? sleep;

  const warnings: ResearchWarning[] = [];

  // 1. Validate the initial company URL
  const validation = validateCompanyUrl(rawCompanyUrl, { nodeEnv, allowLocalFetch });
  if (!validation.valid || !validation.normalizedUrl) {
    const code = validation.error?.code ?? "INVALID_COMPANY_URL";
    const message = validation.error?.message ?? "Invalid company website URL";
    warnings.push({
      code,
      message,
      url: rawCompanyUrl,
      retryable: false,
    });
    return {
      inputUrl: rawCompanyUrl,
      normalizedCompanyUrl: rawCompanyUrl,
      pages: [],
      rankedLinks: [],
      pagesUsed: [],
      hiringPageUrls: [],
      warnings,
      robots: {
        robotsUrl: "",
        fetched: false,
        allowed: false,
        disallowRules: [],
        warnings: [],
      },
      completed: false,
    };
  }

  const normalizedCompanyUrl = validation.normalizedUrl;

  // 2. Fetch and parse robots.txt
  const robots = await getRobotsRules(normalizedCompanyUrl, {
    userAgent: mergedOptions.userAgent,
    timeoutMs: mergedOptions.timeoutMs,
    allowLocalFetch,
    nodeEnv,
    fetchImpl,
  });

  if (robots.warnings.length > 0) {
    warnings.push(...robots.warnings);
  }

  if (!robots.allowed) {
    warnings.push({
      code: "ROBOTS_DISALLOWED",
      message: `Crawl disallowed by robots.txt for ${normalizedCompanyUrl}`,
      url: normalizedCompanyUrl,
      retryable: false,
    });
    return {
      inputUrl: rawCompanyUrl,
      normalizedCompanyUrl,
      pages: [],
      rankedLinks: [],
      pagesUsed: [],
      hiringPageUrls: [],
      warnings,
      robots,
      completed: false,
    };
  }

  // Determine effective delay between requests
  const effectiveDelayMs = Math.max(
    mergedOptions.requestDelayMs,
    robots.crawlDelayMs ?? 0
  );

  let lastRequestTime = 0;
  const rateLimitBeforeRequest = async (): Promise<void> => {
    if (effectiveDelayMs <= 0) return;
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (lastRequestTime > 0 && elapsed < effectiveDelayMs) {
      await sleepImpl(effectiveDelayMs - elapsed);
    }
    lastRequestTime = Date.now();
  };

  // 3. Fetch Homepage
  let homepageHtml: string;
  let finalHomepageUrl: string;

  try {
    const fetchedHomepage = await fetchHtmlPage(normalizedCompanyUrl, {
      timeoutMs: mergedOptions.timeoutMs,
      maxContentBytes: mergedOptions.maxContentBytes,
      maxRetries: mergedOptions.maxRetries,
      userAgent: mergedOptions.userAgent,
      requestDelayMs: effectiveDelayMs,
      fetchImpl,
      beforeRequest: rateLimitBeforeRequest,
      sleepImpl,
    });

    // Validate final URL after redirects
    const finalValidation = validateCompanyUrl(fetchedHomepage.finalUrl, {
      nodeEnv,
      allowLocalFetch,
    });

    if (!finalValidation.valid) {
      warnings.push({
        code: finalValidation.error?.code ?? "UNSAFE_COMPANY_URL",
        message: `Homepage redirect to unsafe URL: ${fetchedHomepage.finalUrl}`,
        url: fetchedHomepage.finalUrl,
        retryable: false,
      });
      warnings.push({
        code: "COMPANY_UNREACHABLE",
        message: "Homepage redirected to an unsafe target",
        url: normalizedCompanyUrl,
        retryable: false,
      });
      return {
        inputUrl: rawCompanyUrl,
        normalizedCompanyUrl,
        pages: [],
        rankedLinks: [],
        pagesUsed: [],
        hiringPageUrls: [],
        warnings,
        robots,
        completed: false,
      };
    }

    homepageHtml = fetchedHomepage.html;
    finalHomepageUrl = fetchedHomepage.finalUrl;
  } catch (err: unknown) {
    if (err instanceof ResearchError) {
      warnings.push({
        code: err.code,
        message: err.message,
        url: normalizedCompanyUrl,
        retryable: err.retryable,
      });
    } else {
      const msg = err instanceof Error ? err.message : "Homepage fetch failed";
      warnings.push({
        code: "PAGE_FETCH_FAILED",
        message: msg,
        url: normalizedCompanyUrl,
        retryable: false,
      });
    }

    warnings.push({
      code: "COMPANY_UNREACHABLE",
      message: "Company homepage could not be reached after all retries",
      url: normalizedCompanyUrl,
      retryable: false,
    });

    return {
      inputUrl: rawCompanyUrl,
      normalizedCompanyUrl,
      pages: [],
      rankedLinks: [],
      pagesUsed: [],
      hiringPageUrls: [],
      warnings,
      robots,
      completed: false,
    };
  }

  // 4. Clean Homepage
  const cleanedHomepage = cleanHtmlToPage(homepageHtml, finalHomepageUrl);
  const pages: CleanedPage[] = [cleanedHomepage];
  const pagesUsed: string[] = [cleanedHomepage.url];
  const hiringPageUrls: string[] = [];

  const fetchedUrls = new Set<string>([
    normalizeUrlForComparison(normalizedCompanyUrl),
    normalizeUrlForComparison(finalHomepageUrl),
  ]);

  const targetOrigin = new URL(finalHomepageUrl).origin.toLowerCase();

  // 5. Extract and rank links from homepage
  const discoveredLinks = extractInternalLinks(homepageHtml, finalHomepageUrl);
  const rankedLinks = rankCompanyLinks(discoveredLinks, finalHomepageUrl);

  if (rankedLinks.length === 0) {
    warnings.push({
      code: "NO_RELEVANT_INTERNAL_LINKS",
      message: "No relevant internal links discovered on homepage",
      url: finalHomepageUrl,
      retryable: false,
    });
  }

  // 6. Select and crawl candidate pages
  const candidates = rankedLinks.slice(0, mergedOptions.maxRankedLinksToConsider);

  for (const candidate of candidates) {
    if (pages.length >= mergedOptions.maxPages) {
      break;
    }

    const candidateNormUrl = normalizeUrlForComparison(candidate.url);
    if (fetchedUrls.has(candidateNormUrl)) {
      continue;
    }

    // Safety validation
    const candidateValidation = validateCompanyUrl(candidate.url, { nodeEnv, allowLocalFetch });
    if (!candidateValidation.valid) {
      warnings.push({
        code: candidateValidation.error?.code ?? "UNSAFE_COMPANY_URL",
        message: `Skipping unsafe discovered link: ${candidate.url}`,
        url: candidate.url,
        retryable: false,
      });
      continue;
    }

    // Origin check
    try {
      if (new URL(candidate.url).origin.toLowerCase() !== targetOrigin) {
        continue;
      }
    } catch {
      continue;
    }

    // Robots.txt check
    try {
      const candidatePath = new URL(candidate.url).pathname;
      if (!isPathAllowedByRobots(candidatePath, robots.disallowRules, robots.allowRules ?? [])) {
        warnings.push({
          code: "ROBOTS_DISALLOWED",
          message: `Discovered page disallowed by robots.txt: ${candidate.url}`,
          url: candidate.url,
          retryable: false,
        });
        continue;
      }
    } catch {
      // Proceed if URL parsing fails
    }

    fetchedUrls.add(candidateNormUrl);

    try {
      const fetchedPage = await fetchHtmlPage(candidate.url, {
        timeoutMs: mergedOptions.timeoutMs,
        maxContentBytes: mergedOptions.maxContentBytes,
        maxRetries: mergedOptions.maxRetries,
        userAgent: mergedOptions.userAgent,
        requestDelayMs: effectiveDelayMs,
        fetchImpl,
        beforeRequest: rateLimitBeforeRequest,
        sleepImpl,
      });

      // Verify redirect target
      const redirectOrigin = new URL(fetchedPage.finalUrl).origin.toLowerCase();
      if (redirectOrigin !== targetOrigin) {
        warnings.push({
          code: "UNSAFE_COMPANY_URL",
          message: `Discovered page redirected to external origin: ${fetchedPage.finalUrl}`,
          url: candidate.url,
          retryable: false,
        });
        continue;
      }

      const cleanedPage = cleanHtmlToPage(fetchedPage.html, fetchedPage.finalUrl);
      pages.push(cleanedPage);
      pagesUsed.push(cleanedPage.url);

      if (candidate.purpose === "hiring" || candidate.purpose === "interview") {
        hiringPageUrls.push(cleanedPage.url);
      }
    } catch (err: unknown) {
      if (err instanceof ResearchError) {
        warnings.push({
          code: err.code,
          message: err.message,
          url: candidate.url,
          retryable: err.retryable,
        });
      } else {
        const msg = err instanceof Error ? err.message : "Page fetch failed";
        warnings.push({
          code: "PAGE_FETCH_FAILED",
          message: msg,
          url: candidate.url,
          retryable: false,
        });
      }
    }
  }

  // 7. Check if any hiring page was found
  if (hiringPageUrls.length === 0) {
    warnings.push({
      code: "NO_HIRING_PAGE_FOUND",
      message: "No hiring or interview-related pages were found or successfully retrieved",
      url: finalHomepageUrl,
      retryable: false,
    });
  }

  return {
    inputUrl: rawCompanyUrl,
    normalizedCompanyUrl,
    companyHomepage: cleanedHomepage,
    pages,
    rankedLinks,
    pagesUsed,
    hiringPageUrls,
    warnings,
    robots,
    completed: true,
  };
}
