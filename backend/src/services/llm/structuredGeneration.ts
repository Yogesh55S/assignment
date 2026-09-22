import { z } from "zod";
import { LlmInvalidResponseError } from "./llmErrors.js";
import type { LlmClient, LlmJsonRequest } from "./types.js";

export async function generateAndValidateJson<
  T,
  Def extends z.ZodTypeDef = z.ZodTypeDef,
  In = unknown
>(input: {
  client: LlmClient;
  request: LlmJsonRequest;
  schema: z.ZodType<T, Def, In>;
}): Promise<T> {
  const { client, request, schema } = input;

  // First pass
  const response = await client.generateJson<unknown>(request);
  const firstValidation = schema.safeParse(response.data);

  if (firstValidation.success) {
    return firstValidation.data;
  }

  // Exactly one targeted repair attempt
  const errorSummary = firstValidation.error.errors
    .slice(0, 5)
    .map((e) => `${e.path.join(".")}: ${e.message}`)
    .join("; ");

  const repairRequest: LlmJsonRequest = {
    systemInstruction: `${request.systemInstruction}\n\nIMPORTANT: The previous output failed schema validation. Correct the JSON strictly according to the schema rules. Output valid JSON only, without markdown formatting or new facts.`,
    userPrompt: `The previous response failed schema validation with issues: [${errorSummary}].\n\nOriginal prompt was:\n${request.userPrompt}\n\nPrevious invalid response was:\n${response.rawText.slice(0, 3000)}\n\nPlease output the corrected valid JSON adhering to the required schema:`,
    schemaName: `${request.schemaName}_repair`,
    temperature: 0.1,
    timeoutMs: request.timeoutMs,
    maxRetries: 1,
  };

  try {
    const repairResponse = await client.generateJson<unknown>(repairRequest);
    const repairValidation = schema.safeParse(repairResponse.data);

    if (repairValidation.success) {
      return repairValidation.data;
    }

    const finalIssues = repairValidation.error.errors
      .slice(0, 3)
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");

    throw new LlmInvalidResponseError(
      `Schema validation failed after repair: ${finalIssues}`
    );
  } catch (err) {
    if (err instanceof LlmInvalidResponseError) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : "Repair attempt failed";
    throw new LlmInvalidResponseError(`Schema repair failed: ${msg}`);
  }
}
