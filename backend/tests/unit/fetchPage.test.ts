import { describe, it, expect, vi } from "vitest";
import {
  fetchHtmlPage,
  getRetryDelayMs,
  shouldRetryHttpStatus,
} from "../../src/services/research/fetchPage.js";
import { ResearchError } from "../../src/services/research/researchErrors.js";

describe("Safe Page Fetching & Retry Policy", () => {
  const instantSleep = async () => {};
  const defaultOptions = {
    timeoutMs: 1000,
    maxContentBytes: 100_000,
    maxRetries: 3,
    userAgent: "AIInterviewPrepKit/1.0 (+test)",
    requestDelayMs: 0,
    sleepImpl: instantSleep,
  };

  it("calculates deterministic exponential backoff delays", () => {
    expect(getRetryDelayMs(1)).toBe(400);
    expect(getRetryDelayMs(2)).toBe(800);
    expect(getRetryDelayMs(3)).toBe(1600);
    expect(getRetryDelayMs(4)).toBe(3200);
    expect(getRetryDelayMs(5)).toBe(5000); // capped at 5000ms
  });

  it("identifies retryable HTTP statuses properly", () => {
    expect(shouldRetryHttpStatus(408)).toBe(true);
    expect(shouldRetryHttpStatus(429)).toBe(true);
    expect(shouldRetryHttpStatus(500)).toBe(true);
    expect(shouldRetryHttpStatus(503)).toBe(true);
    expect(shouldRetryHttpStatus(404)).toBe(false);
    expect(shouldRetryHttpStatus(400)).toBe(false);
    expect(shouldRetryHttpStatus(200)).toBe(false);
  });

  it("successfully fetches an HTML page and passes required headers", async () => {
    let capturedHeaders: Headers | undefined;
    const mockFetch: typeof fetch = async (_url, init) => {
      capturedHeaders = new Headers(init?.headers);
      return new Response("<!doctype html><html><body><h1>Acme</h1></body></html>", {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    };

    const result = await fetchHtmlPage("https://acme.com", {
      ...defaultOptions,
      fetchImpl: mockFetch,
    });

    expect(result.status).toBe(200);
    expect(result.html).toContain("Acme");
    expect(capturedHeaders?.get("User-Agent")).toBe(defaultOptions.userAgent);
    expect(capturedHeaders?.get("Accept")).toContain("text/html");
  });

  it("rejects non-HTML content types such as application/json", async () => {
    const mockFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ message: "hello" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    await expect(
      fetchHtmlPage("https://acme.com/api/data", {
        ...defaultOptions,
        fetchImpl: mockFetch,
      })
    ).rejects.toThrowError(ResearchError);
  });

  it("rejects responses with Content-Length exceeding maxContentBytes before reading body", async () => {
    const mockFetch: typeof fetch = async () =>
      new Response("Huge content...", {
        status: 200,
        headers: {
          "Content-Type": "text/html",
          "Content-Length": "200000",
        },
      });

    await expect(
      fetchHtmlPage("https://acme.com/huge", {
        ...defaultOptions,
        maxContentBytes: 1000,
        fetchImpl: mockFetch,
      })
    ).rejects.toThrowError(ResearchError);
  });

  it("rejects actual text exceeding maxContentBytes if Content-Length was absent", async () => {
    const mockFetch: typeof fetch = async () =>
      new Response("<!doctype html><html>" + "A".repeat(5000) + "</html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    await expect(
      fetchHtmlPage("https://acme.com/large", {
        ...defaultOptions,
        maxContentBytes: 2000,
        fetchImpl: mockFetch,
      })
    ).rejects.toThrowError(ResearchError);
  });

  it("does not retry HTTP 404 responses and immediately throws PAGE_NOT_FOUND", async () => {
    let callCount = 0;
    const mockFetch: typeof fetch = async () => {
      callCount++;
      return new Response("Not Found", { status: 404 });
    };

    try {
      await fetchHtmlPage("https://acme.com/missing", {
        ...defaultOptions,
        fetchImpl: mockFetch,
      });
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ResearchError);
      expect((err as ResearchError).code).toBe("PAGE_NOT_FOUND");
      expect(callCount).toBe(1); // exactly 1 attempt
    }
  });

  it("retries HTTP 429 rate limit responses and succeeds on subsequent attempt", async () => {
    let callCount = 0;
    const mockFetch: typeof fetch = async () => {
      callCount++;
      if (callCount < 3) {
        return new Response("Rate Limited", {
          status: 429,
          headers: { "Retry-After": "1" },
        });
      }
      return new Response("<!doctype html><html><body><h1>Success</h1></body></html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    };

    const result = await fetchHtmlPage("https://acme.com/retry-me", {
      ...defaultOptions,
      fetchImpl: mockFetch,
    });

    expect(result.status).toBe(200);
    expect(callCount).toBe(3);
  });

  it("retries HTTP 500 server errors and succeeds on subsequent attempt", async () => {
    let callCount = 0;
    const mockFetch: typeof fetch = async () => {
      callCount++;
      if (callCount === 1) {
        return new Response("Internal Server Error", { status: 500 });
      }
      return new Response("<!doctype html><html><body><h1>OK</h1></body></html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    };

    const result = await fetchHtmlPage("https://acme.com/flaky", {
      ...defaultOptions,
      fetchImpl: mockFetch,
    });

    expect(result.status).toBe(200);
    expect(callCount).toBe(2);
  });

  it("maps timeout to PAGE_TIMEOUT after exhausting retries", async () => {
    const mockFetch: typeof fetch = async () => {
      const error = new Error("The operation was aborted");
      error.name = "AbortError";
      throw error;
    };

    try {
      await fetchHtmlPage("https://acme.com/timeout", {
        ...defaultOptions,
        maxRetries: 2,
        fetchImpl: mockFetch,
      });
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ResearchError);
      expect((err as ResearchError).code).toBe("PAGE_TIMEOUT");
    }
  });

  it("maps non-retryable 400 Bad Request to safe failure without retrying", async () => {
    let callCount = 0;
    const mockFetch: typeof fetch = async () => {
      callCount++;
      return new Response("Bad Request", { status: 400 });
    };

    await expect(
      fetchHtmlPage("https://acme.com/bad", {
        ...defaultOptions,
        fetchImpl: mockFetch,
      })
    ).rejects.toThrowError(ResearchError);

    expect(callCount).toBe(1);
  });
});
