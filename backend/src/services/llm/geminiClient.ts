import { getEnv } from "../../config/env.js";
import {
  LlmNotConfiguredError,
  LlmRateLimitedError,
  LlmTimeoutError,
  LlmInvalidResponseError,
  LlmProviderError,
} from "./llmErrors.js";
import type { LlmClient, LlmJsonRequest, LlmJsonResponse } from "./types.js";

async function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanJsonText(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```json")) {
    text = text.slice(7);
  } else if (text.startsWith("```")) {
    text = text.slice(3);
  }
  if (text.endsWith("```")) {
    text = text.slice(0, -3);
  }
  return text.trim();
}

function sanitizeEnvString(val: string | undefined): string | undefined {
  if (!val) return val;
  // Remove literal wrapping quotes and escaped quotes that Railway might inject
  return val.trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '').trim();
}

export function createGeminiClient(options?: {
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
  sleepImpl?: (ms: number) => Promise<void>;
}): LlmClient {
  const env = getEnv();
  const rawApiKey = options?.apiKey !== undefined ? options.apiKey : env.LLM_API_KEY;
  const apiKey = sanitizeEnvString(rawApiKey);
  
  const rawModel = options?.model || env.LLM_MODEL || "gemini-flash-latest";
  const model = sanitizeEnvString(rawModel) || "gemini-flash-latest";
  
  const fetchFn = options?.fetchImpl ?? fetch;
  const sleepFn = options?.sleepImpl ?? defaultSleep;

  return {
    async generateJson<T>(request: LlmJsonRequest): Promise<LlmJsonResponse<T>> {
      if (!apiKey || apiKey.trim().length === 0) {
        throw new LlmNotConfiguredError();
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent`;

      const maxRetries = request.maxRetries ?? 3;
      const timeoutMs = request.timeoutMs ?? 30000;
      const temperature = request.temperature ?? 0.2;

      const bodyPayload = {
        contents: [
          {
            role: "user",
            parts: [{ text: request.userPrompt }],
          },
        ],
        systemInstruction: {
          parts: [{ text: request.systemInstruction }],
        },
        generationConfig: {
          responseMimeType: "application/json",
          temperature,
        },
      };

      let lastError: unknown = null;

      for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        const controller = new AbortController();
        let timeoutId: NodeJS.Timeout | undefined;
        let didTimeout = false;

        if (timeoutMs > 0) {
          timeoutId = setTimeout(() => {
            didTimeout = true;
            controller.abort();
          }, timeoutMs);
        }

        try {
          const res = await fetchFn(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify(bodyPayload),
            signal: controller.signal,
          });

          if (timeoutId) clearTimeout(timeoutId);

          if (res.status === 429) {
            if (attempt <= maxRetries) {
              let delayMs = Math.min(Math.round(750 * Math.pow(2, attempt - 1)), 5000);
              const retryAfter = res.headers.get("retry-after");
              if (retryAfter) {
                const sec = parseInt(retryAfter, 10);
                if (!isNaN(sec) && sec > 0) {
                  delayMs = Math.min(sec * 1000, 5000);
                }
              }
              await sleepFn(delayMs);
              continue;
            }
            throw new LlmRateLimitedError();
          }

          if (res.status >= 500 && res.status <= 599) {
            if (attempt <= maxRetries) {
              const delayMs = Math.min(Math.round(750 * Math.pow(2, attempt - 1)), 5000);
              await sleepFn(delayMs);
              continue;
            }
            throw new LlmProviderError(res.status, `Gemini server error (${res.status})`, true);
          }

          if (!res.ok) {
            // Non-retryable 4xx client error (e.g. 400 Bad Request)
            throw new LlmProviderError(
              res.status,
              `Gemini API request rejected with HTTP ${res.status}`,
              false
            );
          }

          const json = await res.json();

          // Safe extraction from Gemini response schema
          const candidate = json.candidates?.[0];
          if (!candidate) {
            const promptFeedback = json.promptFeedback?.blockReason;
            if (promptFeedback) {
              throw new LlmInvalidResponseError(`Gemini generation blocked: ${promptFeedback}`);
            }
            throw new LlmInvalidResponseError("Gemini returned no candidates in response.");
          }

          const rawText = candidate.content?.parts?.[0]?.text;
          if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
            throw new LlmInvalidResponseError("Gemini candidate content is empty.");
          }

          const cleaned = cleanJsonText(rawText);
          let parsedData: T;
          try {
            parsedData = JSON.parse(cleaned) as T;
          } catch {
            throw new LlmInvalidResponseError("Failed to parse Gemini output as JSON.");
          }

          const usage = json.usageMetadata
            ? {
                promptTokens: json.usageMetadata.promptTokenCount,
                completionTokens: json.usageMetadata.candidatesTokenCount,
                totalTokens: json.usageMetadata.totalTokenCount,
              }
            : undefined;

          return {
            data: parsedData,
            rawText: cleaned,
            model,
            usage,
          };
        } catch (err: unknown) {
          if (timeoutId) clearTimeout(timeoutId);

          if (didTimeout) {
            if (attempt <= maxRetries) {
              const delayMs = Math.min(Math.round(750 * Math.pow(2, attempt - 1)), 5000);
              await sleepFn(delayMs);
              continue;
            }
            throw new LlmTimeoutError();
          }

          // If it's already an LlmError, rethrow non-retryable ones
          if (err instanceof LlmNotConfiguredError || (err instanceof LlmProviderError && !err.retryable)) {
            throw err;
          }

          lastError = err;

          if (attempt <= maxRetries) {
            const delayMs = Math.min(Math.round(750 * Math.pow(2, attempt - 1)), 5000);
            await sleepFn(delayMs);
            continue;
          }
        }
      }

      if (lastError instanceof LlmInvalidResponseError) {
        throw lastError;
      }

      const message = lastError instanceof Error ? lastError.message : "Provider communication failure";
      throw new LlmProviderError(502, `Failed to communicate with LLM: ${message}`, false);
    },
  };
}
