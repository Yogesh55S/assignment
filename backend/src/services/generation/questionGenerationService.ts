import { z } from "zod";
import type {
  Requirement,
  QuestionCategory,
} from "@interview-prep/shared/types/kit";
import type { CompanyResearchResult } from "../research/types.js";
import type { InterviewDiscussionResult } from "./interviewDiscussionService.js";
import type { LlmClient } from "../llm/types.js";
import { generateAndValidateJson } from "../llm/structuredGeneration.js";
import {
  buildCategoryQuestionsPrompt,
  buildGapQuestionsPrompt,
} from "../llm/prompts.js";
import { sanitizeUntrustedContent } from "../../utils/sanitizePromptContent.js";

export interface GeneratedQuestionDraft {
  requirement_ids: string[];
  category: QuestionCategory;
  prompt: string;
  answer_outline: string;
  difficulty: 1 | 2 | 3;
}

export const generatedQuestionDraftSchema = z.object({
  questions: z
    .array(
      z.object({
        requirement_ids: z.array(z.string().min(1)).min(1).max(10),
        category: z.enum([
          "technical",
          "behavioural",
          "system-design",
          "company-fit",
        ]),
        prompt: z.string().trim().min(10).max(1200),
        answer_outline: z.string().trim().min(10).max(3000),
        difficulty: z.number().int().min(1).max(3),
      })
    )
    .max(30),
});

export type GeneratedQuestionDraftsResponse = z.infer<
  typeof generatedQuestionDraftSchema
>;

export function categoryForRequirement(requirement: Requirement): QuestionCategory {
  switch (requirement.kind) {
    case "technical":
      return "technical";
    case "behavioural":
      return "behavioural";
    case "domain":
      return "company-fit";
    default:
      return "technical";
  }
}

export async function generateQuestionsForCategory(input: {
  category: QuestionCategory;
  requirements: Requirement[];
  research: CompanyResearchResult;
  interviewDiscussion: InterviewDiscussionResult;
  llmClient: LlmClient;
  maxQuestionsPerRequirement?: number;
}): Promise<GeneratedQuestionDraft[]> {
  const { category, requirements, research, interviewDiscussion, llmClient } = input;

  // If no requirements, return empty array
  if (requirements.length === 0) {
    return [];
  }

  const validReqIdSet = new Set(requirements.map((r) => r.id));

  // Extract concise company context
  const companyContext = research.companyHomepage?.text
    ? sanitizeUntrustedContent(research.companyHomepage.text, 3000)
    : undefined;

  const interviewContext =
    interviewDiscussion.sources.length > 0
      ? sanitizeUntrustedContent(interviewDiscussion.sources.map((s) => s.text).join("\n"), 2000)
      : undefined;

  const { systemInstruction, userPrompt } = buildCategoryQuestionsPrompt({
    category,
    requirements,
    companyContext,
    interviewContext,
  });

  const parsed = await generateAndValidateJson<GeneratedQuestionDraftsResponse>({
    client: llmClient,
    request: {
      systemInstruction,
      userPrompt,
      schemaName: `questions_${category}`,
      temperature: 0.2,
    },
    schema: generatedQuestionDraftSchema,
  });

  const seenPrompts = new Set<string>();
  const sanitizedDrafts: GeneratedQuestionDraft[] = [];

  for (const q of parsed.questions) {
    // 1. Filter requirement IDs to only those actually provided in the input set
    const validIds = q.requirement_ids.filter((id) => validReqIdSet.has(id));
    if (validIds.length === 0) {
      continue;
    }

    // 2. Normalize and check duplicates
    const normalizedPrompt = q.prompt.toLowerCase().replace(/\s+/g, " ").trim();
    if (seenPrompts.has(normalizedPrompt)) {
      continue;
    }
    seenPrompts.add(normalizedPrompt);

    sanitizedDrafts.push({
      requirement_ids: validIds,
      category, // enforce the requested category strictly
      prompt: q.prompt.trim(),
      answer_outline: q.answer_outline.trim(),
      difficulty: q.difficulty as 1 | 2 | 3,
    });
  }

  return sanitizedDrafts;
}

export async function generateQuestionsForRequirementGaps(input: {
  requirements: Requirement[];
  research: CompanyResearchResult;
  interviewDiscussion: InterviewDiscussionResult;
  llmClient: LlmClient;
}): Promise<GeneratedQuestionDraft[]> {
  const { requirements, research, llmClient } = input;

  if (requirements.length === 0) {
    return [];
  }

  const validReqIdSet = new Set(requirements.map((r) => r.id));
  const companyContext = research.companyHomepage?.text
    ? sanitizeUntrustedContent(research.companyHomepage.text, 2000)
    : undefined;

  const { systemInstruction, userPrompt } = buildGapQuestionsPrompt({
    uncoveredMustRequirements: requirements,
    companyContext,
  });

  const parsed = await generateAndValidateJson<GeneratedQuestionDraftsResponse>({
    client: llmClient,
    request: {
      systemInstruction,
      userPrompt,
      schemaName: "gap_repair_questions",
      temperature: 0.1,
    },
    schema: generatedQuestionDraftSchema,
  });

  const sanitizedDrafts: GeneratedQuestionDraft[] = [];
  const seenPrompts = new Set<string>();

  for (const q of parsed.questions) {
    const validIds = q.requirement_ids.filter((id) => validReqIdSet.has(id));
    if (validIds.length === 0) {
      continue;
    }

    const normalizedPrompt = q.prompt.toLowerCase().replace(/\s+/g, " ").trim();
    if (seenPrompts.has(normalizedPrompt)) {
      continue;
    }
    seenPrompts.add(normalizedPrompt);

    sanitizedDrafts.push({
      requirement_ids: validIds,
      category: q.category,
      prompt: q.prompt.trim(),
      answer_outline: q.answer_outline.trim(),
      difficulty: q.difficulty as 1 | 2 | 3,
    });
  }

  return sanitizedDrafts;
}
