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
        console.error("[LLM Config Error] LLM_API_KEY is not configured in environment.");
        throw new LlmNotConfiguredError();
      }

      const isOpenRouter =
        apiKey.startsWith("sk-or-v1-") ||
        (env.LLM_PROVIDER?.toLowerCase() === "openrouter" && !options?.apiKey);

      const effectiveModel = isOpenRouter
        ? !model || model === "gemini-flash-latest" || model.includes("gemini-2.5")
          ? "openai/gpt-4o-mini"
          : model
        : model;

      const endpoint = isOpenRouter
        ? "https://openrouter.ai/api/v1/chat/completions"
        : `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            effectiveModel
          )}:generateContent`;

      const maxRetries = request.maxRetries ?? 3;
      const timeoutMs = request.timeoutMs ?? 30000;
      const temperature = request.temperature ?? 0.2;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (isOpenRouter) {
        headers["Authorization"] = `Bearer ${apiKey}`;
        headers["HTTP-Referer"] = env.CLIENT_URL || "https://interviewprep.app";
        headers["X-Title"] = "AI Interview Prep Kit";
      } else {
        headers["x-goog-api-key"] = apiKey;
      }

      const bodyPayload = isOpenRouter
        ? {
            model: effectiveModel,
            messages: [
              { role: "system", content: request.systemInstruction },
              { role: "user", content: request.userPrompt },
            ],
            temperature,
            max_tokens: 4000,
            response_format: { type: "json_object" },
          }
        : {
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

        console.log(
          `[LLM Request] [Attempt ${attempt}/${maxRetries + 1}] Provider: ${
            isOpenRouter ? "OpenRouter" : "Gemini"
          } | Model: ${effectiveModel} | Schema: ${request.schemaName || "unknown"}`
        );

        try {
          const res = await fetchFn(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(bodyPayload),
            signal: controller.signal,
          });

          if (timeoutId) clearTimeout(timeoutId);

          if (res.status === 429) {
            let errorDetail = "";
            try {
              const errTxt = await res.text();
              const parsed = JSON.parse(errTxt);
              errorDetail = parsed.error?.message || parsed.error?.metadata?.raw || errTxt;
            } catch {
              errorDetail = "Rate limit exceeded";
            }

            console.warn(
              `[LLM Rate Limit] [Attempt ${attempt}/${maxRetries + 1}] HTTP 429 from ${
                isOpenRouter ? "OpenRouter" : "Gemini"
              }: ${errorDetail}`
            );

            if (attempt <= maxRetries) {
              let delayMs = Math.min(Math.round(750 * Math.pow(2, attempt - 1)), 5000);
              const retryAfter = res.headers.get("retry-after");
              if (retryAfter) {
                const sec = parseInt(retryAfter, 10);
                if (!isNaN(sec) && sec > 0) {
                  delayMs = Math.min(sec * 1000, 5000);
                }
              }
              console.log(`[LLM Retry] Waiting ${delayMs}ms before retrying...`);
              await sleepFn(delayMs);
              continue;
            }
            throw new LlmRateLimitedError(`LLM rate limited (429): ${errorDetail}`);
          }

          if (res.status >= 500 && res.status <= 599) {
            let errorDetail = "";
            try {
              const errTxt = await res.text();
              const parsed = JSON.parse(errTxt);
              errorDetail = parsed.error?.message || errTxt;
            } catch {
              errorDetail = `Server returned HTTP ${res.status}`;
            }

            console.error(
              `[LLM Server Error] [Attempt ${attempt}/${maxRetries + 1}] HTTP ${res.status} from ${
                isOpenRouter ? "OpenRouter" : "Gemini"
              }: ${errorDetail}`
            );

            if (attempt <= maxRetries) {
              const delayMs = Math.min(Math.round(750 * Math.pow(2, attempt - 1)), 5000);
              console.log(`[LLM Retry] Waiting ${delayMs}ms before retrying...`);
              await sleepFn(delayMs);
              continue;
            }
            throw new LlmProviderError(res.status, `LLM provider server error (${res.status}): ${errorDetail}`, true);
          }

          if (!res.ok) {
            // Non-retryable 4xx client error (e.g. 400 Bad Request, 401 Unauthorized, 402 Payment Required)
            let errorDetail = "";
            try {
              const errTxt = await res.text();
              const parsed = JSON.parse(errTxt);
              errorDetail = parsed.error?.message || errTxt;
              if (parsed.error?.metadata?.remedy_hint) {
                errorDetail += ` (Hint: ${parsed.error.metadata.remedy_hint})`;
              }
            } catch {
              errorDetail = res.statusText || `HTTP ${res.status}`;
            }

            console.error(
              `[LLM Client Error] HTTP ${res.status} ${res.statusText} from ${
                isOpenRouter ? "OpenRouter" : "Gemini"
              } for model "${effectiveModel}": ${errorDetail}`
            );

            throw new LlmProviderError(
              res.status,
              `LLM API request rejected with HTTP ${res.status}: ${errorDetail}`,
              false
            );
          }

          const json = await res.json();

          let rawText: string | undefined;

          if (isOpenRouter) {
            const messageObj = json.choices?.[0]?.message;
            if (typeof messageObj?.content === "string") {
              rawText = messageObj.content;
            } else if (Array.isArray(messageObj?.content)) {
              rawText = messageObj.content
                .map((part: { text?: string }) => part.text || "")
                .join("");
            }
          } else {
            // Safe extraction from Gemini response schema
            const candidate = json.candidates?.[0];
            if (!candidate) {
              const promptFeedback = json.promptFeedback?.blockReason;
              if (promptFeedback) {
                console.error(`[LLM Generation Blocked] Gemini blocked prompt: ${promptFeedback}`);
                throw new LlmInvalidResponseError(`Gemini generation blocked: ${promptFeedback}`);
              }
              console.error("[LLM Error] Gemini returned no candidates in response payload.");
              throw new LlmInvalidResponseError("Gemini returned no candidates in response.");
            }
            rawText = candidate.content?.parts?.[0]?.text;
          }

          if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
            console.error("[LLM Error] Response content is empty or invalid string.", json);
            throw new LlmInvalidResponseError("LLM response content is empty.");
          }

          const cleaned = cleanJsonText(rawText);
          let parsedData: T;
          try {
            parsedData = JSON.parse(cleaned) as T;
          } catch (jsonErr) {
            console.error("[LLM JSON Parse Error] Failed to parse LLM output as JSON. Raw text:", rawText);
            throw new LlmInvalidResponseError("Failed to parse LLM output as JSON.");
          }

          const usage = json.usageMetadata
            ? {
                promptTokens: json.usageMetadata.promptTokenCount,
                completionTokens: json.usageMetadata.candidatesTokenCount,
                totalTokens: json.usageMetadata.totalTokenCount,
              }
            : json.usage
            ? {
                promptTokens: json.usage.prompt_tokens,
                completionTokens: json.usage.completion_tokens,
                totalTokens: json.usage.total_tokens,
              }
            : undefined;

          console.log(
            `[LLM Success] Model: ${effectiveModel} | Total tokens: ${
              usage?.totalTokens ?? "N/A"
            }`
          );

          return {
            data: parsedData,
            rawText: cleaned,
            model: effectiveModel,
            usage,
          };
        } catch (err: unknown) {
          if (timeoutId) clearTimeout(timeoutId);

          if (didTimeout) {
            console.warn(`[LLM Timeout] Attempt ${attempt}/${maxRetries + 1} timed out after ${timeoutMs}ms.`);
            if (attempt <= maxRetries) {
              const delayMs = Math.min(Math.round(750 * Math.pow(2, attempt - 1)), 5000);
              console.log(`[LLM Retry] Waiting ${delayMs}ms before retrying...`);
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

          console.warn(
            `[LLM Warning] Attempt ${attempt}/${maxRetries + 1} failed: ${
              err instanceof Error ? err.message : String(err)
            }`
          );

          if (attempt <= maxRetries) {
            const delayMs = Math.min(Math.round(750 * Math.pow(2, attempt - 1)), 5000);
            console.log(`[LLM Retry] Waiting ${delayMs}ms before retrying...`);
            await sleepFn(delayMs);
            continue;
          }
        }
      }

      if (lastError instanceof LlmInvalidResponseError) {
        throw lastError;
      }

      const message = lastError instanceof Error ? lastError.message : "Provider communication failure";
      console.error(`[LLM Fatal Error] Exhausted all retries. Error: ${message}`);
      throw new LlmProviderError(502, `Failed to communicate with LLM: ${message}`, false);
    },
  };
}

