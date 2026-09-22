import { ResearchError } from "./researchErrors.js";
import type { FetchedPage } from "./types.js";

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function shouldRetryHttpStatus(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

export function getRetryDelayMs(
  attemptNumber: number,
  options?: {
    baseDelayMs?: number;
    maxDelayMs?: number;
  }
): number {
  const baseDelayMs = options?.baseDelayMs ?? 400;
  const maxDelayMs = options?.maxDelayMs ?? 5000;
  const delay = Math.round(baseDelayMs * Math.pow(2, Math.max(0, attemptNumber - 1)));
  return Math.min(delay, maxDelayMs);
}

export async function fetchHtmlPage(
  url: string,
  options: {
    timeoutMs: number;
    maxContentBytes: number;
    maxRetries: number;
    userAgent: string;
    requestDelayMs: number;
    fetchImpl?: typeof fetch;
    beforeRequest?: () => Promise<void>;
    sleepImpl?: (ms: number) => Promise<void>;
  }
): Promise<FetchedPage> {
  const fetchFn = options.fetchImpl ?? fetch;
  const sleepFn = options.sleepImpl ?? sleep;
  const maxRetries = options.maxRetries ?? 3;

  let lastError: unknown = null;
  let wasTimeout = false;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    if (options.beforeRequest) {
      await options.beforeRequest();
    }

    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | undefined;
    let didTimeout = false;

    if (options.timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        didTimeout = true;
        controller.abort();
      }, options.timeoutMs);
    }

    try {
      const res = await fetchFn(url, {
        method: "GET",
        headers: {
          "User-Agent": options.userAgent,
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
        signal: controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      // 404 Not Found is never retried
      if (res.status === 404) {
        throw ResearchError.pageNotFound(url, `Page not found: ${url} (HTTP 404)`);
      }

      // Check for retryable HTTP statuses (408, 429, 5xx)
      if (shouldRetryHttpStatus(res.status)) {
        if (attempt <= maxRetries) {
          let retryDelay = getRetryDelayMs(attempt);
          const retryAfter = res.headers.get("retry-after");
          if (retryAfter) {
            const sec = parseInt(retryAfter, 10);
            if (!isNaN(sec) && sec > 0) {
              retryDelay = Math.min(sec * 1000, 5000);
            }
          }
          await sleepFn(retryDelay);
          continue;
        } else {
          throw ResearchError.pageFetchFailed(
            url,
            `HTTP ${res.status} error fetching ${url} after ${maxRetries} retries`
          );
        }
      }

      // Non-retryable non-2xx status (e.g. 400, 401, 403)
      if (!res.ok) {
        throw new ResearchError(
          "PAGE_FETCH_FAILED",
          res.status >= 400 && res.status < 500 ? 400 : 502,
          `HTTP ${res.status} fetching ${url}`,
          { retryable: false, url }
        );
      }

      // Check Content-Length header if present
      const contentLengthHeader = res.headers.get("content-length");
      if (contentLengthHeader) {
        const declaredLength = parseInt(contentLengthHeader, 10);
        if (!isNaN(declaredLength) && declaredLength > options.maxContentBytes) {
          throw ResearchError.contentTooLarge(url, declaredLength, options.maxContentBytes);
        }
      }

      // Read text body
      const text = await res.text();
      const actualBytes = Buffer.byteLength(text, "utf-8");
      if (actualBytes > options.maxContentBytes) {
        throw ResearchError.contentTooLarge(url, actualBytes, options.maxContentBytes);
      }

      // Content-Type validation
      const contentType = res.headers.get("content-type") || "";
      const isHtmlHeader = /text\/html|application\/xhtml\+xml/i.test(contentType);

      if (!isHtmlHeader) {
        if (!contentType) {
          // If content-type header missing, allow if starts with basic html doctype/html
          const trimmedText = text.trimStart().toLowerCase();
          if (!trimmedText.startsWith("<!doctype html") && !trimmedText.startsWith("<html")) {
            throw ResearchError.unsupportedContentType(url, contentType);
          }
        } else {
          throw ResearchError.unsupportedContentType(url, contentType);
        }
      }

      return {
        requestedUrl: url,
        finalUrl: res.url || url,
        status: res.status,
        contentType: contentType || "text/html",
        html: text,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      if (timeoutId) clearTimeout(timeoutId);

      // If already a ResearchError with retryable=false, rethrow immediately
      if (err instanceof ResearchError && !err.retryable) {
        throw err;
      }

      const isAbortOrTimeout =
        didTimeout ||
        (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError"));

      if (isAbortOrTimeout) {
        wasTimeout = true;
      }

      lastError = err;

      if (attempt <= maxRetries) {
        const retryDelay = getRetryDelayMs(attempt);
        await sleepFn(retryDelay);
        continue;
      }
    }
  }

  if (wasTimeout) {
    throw ResearchError.pageTimeout(url, `Request timeout fetching ${url} after ${maxRetries} retries`);
  }

  const message = lastError instanceof Error ? lastError.message : "Network error";
  throw ResearchError.pageFetchFailed(url, `Failed to fetch ${url}: ${message}`);
}
