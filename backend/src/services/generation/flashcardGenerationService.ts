import { z } from "zod";
import type {
  Requirement,
  InterviewQuestion,
  Flashcard,
} from "@interview-prep/shared/types/kit";
import type { LlmClient } from "../llm/types.js";
import { generateAndValidateJson } from "../llm/structuredGeneration.js";
import { buildFlashcardsPrompt } from "../llm/prompts.js";
import { assignFlashcardIds } from "../../utils/stableIds.js";

export const flashcardDraftSchema = z.object({
  flashcards: z
    .array(
      z.object({
        front: z.string().trim().min(3).max(500),
        back: z.string().trim().min(3).max(2000),
        requirement_ids: z.array(z.string().min(1)).min(1).max(10),
      })
    )
    .max(40),
});

export type GeneratedFlashcardsResponse = z.infer<typeof flashcardDraftSchema>;

export async function generateFlashcards(input: {
  requirements: Requirement[];
  questions: InterviewQuestion[];
  llmClient: LlmClient;
}): Promise<Flashcard[]> {
  const { requirements, questions, llmClient } = input;

  if (requirements.length === 0) {
    return [];
  }

  const validReqIdSet = new Set(requirements.map((r) => r.id));

  // Build question summary for context (capped)
  const questionContext = questions
    .slice(0, 15)
    .map((q) => `Q: ${q.prompt}\nKey concepts: ${q.answer_outline.slice(0, 150)}`)
    .join("\n\n");

  const { systemInstruction, userPrompt } = buildFlashcardsPrompt({
    requirements,
    questionsContext: questionContext,
  });

  const parsed = await generateAndValidateJson<GeneratedFlashcardsResponse>({
    client: llmClient,
    request: {
      systemInstruction,
      userPrompt,
      schemaName: "flashcards_generation",
      temperature: 0.2,
    },
    schema: flashcardDraftSchema,
  });

  const validDrafts: Array<{ front: string; back: string; requirement_ids: string[] }> = [];

  for (const fc of parsed.flashcards) {
    const validIds = fc.requirement_ids.filter((id) => validReqIdSet.has(id));
    if (validIds.length === 0) {
      continue;
    }
    validDrafts.push({
      front: fc.front,
      back: fc.back,
      requirement_ids: validIds,
    });
    if (validDrafts.length >= 30) {
      break;
    }
  }

  // Assign deterministic IDs: f1, f2, f3...
  return assignFlashcardIds(validDrafts);
}
