import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createGeminiClient } from "../../src/services/llm/geminiClient.js";
import { generateAndValidateJson } from "../../src/services/llm/structuredGeneration.js";
import {
  LlmNotConfiguredError,
  LlmRateLimitedError,
  LlmInvalidResponseError,
} from "../../src/services/llm/llmErrors.js";

describe("Gemini Client & Structured Generation", () => {
  const instantSleep = async () => {};

  it("throws LlmNotConfiguredError if no API key is provided", async () => {
    const client = createGeminiClient({ apiKey: "" });
    await expect(
      client.generateJson({
        systemInstruction: "test",
        userPrompt: "test",
        schemaName: "test",
      })
    ).rejects.toThrow(LlmNotConfiguredError);
  });

  it("successfully parses JSON output from Gemini candidate response", async () => {
    const mockFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: '{"message": "Hello from Gemini"}' }],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    const client = createGeminiClient({
      apiKey: "dummy-key",
      fetchImpl: mockFetch,
      sleepImpl: instantSleep,
    });

    const response = await client.generateJson<{ message: string }>({
      systemInstruction: "test",
      userPrompt: "test",
      schemaName: "test",
    });

    expect(response.data).toEqual({ message: "Hello from Gemini" });
  });

  it("retries on HTTP 429 rate limit error", async () => {
    let callCount = 0;
    const mockFetch: typeof fetch = async () => {
      callCount++;
      if (callCount < 2) {
        return new Response("Rate limited", { status: 429, headers: { "Retry-After": "1" } });
      }
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: '{"success": true}' }] } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const client = createGeminiClient({
      apiKey: "dummy-key",
      fetchImpl: mockFetch,
      sleepImpl: instantSleep,
    });

    const response = await client.generateJson<{ success: boolean }>({
      systemInstruction: "test",
      userPrompt: "test",
      schemaName: "test",
    });

    expect(response.data.success).toBe(true);
    expect(callCount).toBe(2);
  });

  it("performs one targeted repair attempt when schema validation fails", async () => {
    let callCount = 0;
    const mockClient = {
      async generateJson<T>() {
        callCount++;
        if (callCount === 1) {
          // First attempt fails schema (number is string)
          return {
            data: { score: "not-a-number" } as T,
            rawText: '{"score": "not-a-number"}',
            model: "mock-model",
          };
        }
        // Second attempt is repaired
        return {
          data: { score: 42 } as T,
          rawText: '{"score": 42}',
          model: "mock-model",
        };
      },
    };

    const targetSchema = z.object({ score: z.number() });

    const result = await generateAndValidateJson({
      client: mockClient,
      request: {
        systemInstruction: "test",
        userPrompt: "test",
        schemaName: "test",
      },
      schema: targetSchema,
    });

    expect(result.score).toBe(42);
    expect(callCount).toBe(2);
  });

  it("throws LlmInvalidResponseError if repair attempt also fails validation", async () => {
    const mockClient = {
      async generateJson<T>() {
        return {
          data: { score: "still-not-a-number" } as T,
          rawText: '{"score": "still-not-a-number"}',
          model: "mock-model",
        };
      },
    };

    const targetSchema = z.object({ score: z.number() });

    await expect(
      generateAndValidateJson({
        client: mockClient,
        request: {
          systemInstruction: "test",
          userPrompt: "test",
          schemaName: "test",
        },
        schema: targetSchema,
      })
    ).rejects.toThrow(LlmInvalidResponseError);
  });
});
