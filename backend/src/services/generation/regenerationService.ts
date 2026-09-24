import type {
  EditableInterviewPrepKit,
  EditableInterviewQuestion,
  QuestionMeta,
} from "@interview-prep/shared/types/editableKit";
import type {
  QuestionCategory,
  Requirement,
  InterviewPrepKit,
} from "@interview-prep/shared/types/kit";
import { analyzeRequirementCoverage } from "@interview-prep/shared/services/coverage/coverageService";
import { allocateStudySchedule } from "@interview-prep/shared/services/schedule/scheduleService";
import { validateEditableInterviewPrepKit } from "@interview-prep/shared/validators/editableKitSchema";
import { validateInterviewPrepKit } from "@interview-prep/shared/validators/kitSchema";
import { stripInternalKitMetadata } from "@interview-prep/shared/validators/editableKitSchema";
import type { LlmClient } from "../llm/types.js";
import { createGeminiClient } from "../llm/geminiClient.js";
import { generateCompanyBrief } from "./companyBriefService.js";
import {
  generateQuestionsForCategory,
  generateQuestionsForRequirementGaps,
} from "./questionGenerationService.js";
import { researchCompany } from "../research/researchService.js";
import type { CompanyResearchResult, ResearchWarning } from "../research/types.js";
import { findPublicInterviewDiscussion } from "./interviewDiscussionService.js";
import { assignQuestionIds } from "../../utils/stableIds.js";
import { AppError } from "../../utils/errors.js";

export interface RegenerateKitSectionInput {
  kit: EditableInterviewPrepKit;
  section: "company_brief" | "questions" | "schedule";
  category?: QuestionCategory;
  replaceEdited?: boolean;
  llmClient?: LlmClient;
  research?: typeof researchCompany;
  now?: () => Date;
}

export interface RegenerateKitSectionResult {
  kit: EditableInterviewPrepKit;
  preservedEditedContent: boolean;
  regeneratedCount: number;
  preservedCount: number;
  warnings: ResearchWarning[];
}

/**
 * Checks whether a question is protected from deletion/replacement during category regeneration.
 * User-created, edited, or pinned questions are strictly protected.
 */
export function isQuestionProtectedFromRegeneration(q: EditableInterviewQuestion): boolean {
  if (!q._meta) {
    return false;
  }
  return q._meta.origin === "user" || q._meta.edited === true || q._meta.pinned === true;
}

/**
 * Finds the highest numeric suffix in existing question IDs (e.g. "q14" -> 14)
 * and returns the next integer to start generating non-conflicting new IDs.
 */
export function findNextQuestionSequence(questions: EditableInterviewQuestion[]): number {
  let maxId = 0;
  for (const q of questions) {
    const match = q.id.match(/^q(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    }
  }
  return maxId + 1;
}

/**
 * Rebuilds the study schedule deterministically from current questions.
 */
export function rebuildSchedule(
  kit: EditableInterviewPrepKit
): EditableInterviewPrepKit["schedule"] {
  const daysAvailable = kit.schedule?.days_available || 5;
  const scheduleResult = allocateStudySchedule({
    questions: kit.questions,
    requirements: kit.role.requirements,
    daysAvailable,
  });

  return scheduleResult.schedule;
}

/**
 * Regenerates the company brief.
 * Preserves user edits unless explicitly requested to replace.
 */
export async function regenerateCompanyBriefHelper(
  kit: EditableInterviewPrepKit,
  options: {
    replaceEdited?: boolean;
    llmClient: LlmClient;
    research: typeof researchCompany;
  }
): Promise<{
  company_brief: EditableInterviewPrepKit["company_brief"];
  preservedEditedContent: boolean;
  warnings: ResearchWarning[];
}> {
  // If edited and replaceEdited is not true, preserve user edits
  if (kit.company_brief._meta?.edited === true && !options.replaceEdited) {
    return {
      company_brief: kit.company_brief,
      preservedEditedContent: true,
      warnings: [],
    };
  }

  // Conduct fresh research if needed
  const researchResult = await options.research(kit.source.company_url);
  const warnings = [...researchResult.warnings];

  const newBrief = await generateCompanyBrief({
    companyName: kit.source.company,
    companyUrl: kit.source.company_url,
    research: researchResult,
    llmClient: options.llmClient,
  });

  return {
    company_brief: {
      summary: newBrief.summary,
      what_they_do: newBrief.what_they_do,
      sources: newBrief.sources,
      _meta: {
        edited: false,
        updatedAt: new Date().toISOString(),
      },
    },
    preservedEditedContent: false,
    warnings,
  };
}

/**
 * Regenerates a single question category while preserving user/edited/pinned questions.
 */
export async function regenerateQuestionCategoryHelper(
  kit: EditableInterviewPrepKit,
  category: QuestionCategory,
  options: {
    llmClient: LlmClient;
    research: typeof researchCompany;
  }
): Promise<{
  questions: EditableInterviewQuestion[];
  coverage: EditableInterviewPrepKit["coverage"];
  schedule: EditableInterviewPrepKit["schedule"];
  regeneratedCount: number;
  preservedCount: number;
  warnings: ResearchWarning[];
}> {
  // 1. Separate questions into:
  // - Other categories (untouched)
  // - Current category protected (user, edited, pinned)
  // - Current category to replace
  const otherCategoryQuestions: EditableInterviewQuestion[] = [];
  const protectedCategoryQuestions: EditableInterviewQuestion[] = [];

  for (const q of kit.questions) {
    if (q.category !== category) {
      otherCategoryQuestions.push(q);
    } else if (isQuestionProtectedFromRegeneration(q)) {
      protectedCategoryQuestions.push(q);
    }
  }

  const preservedCount = protectedCategoryQuestions.length;

  // 2. Fetch mock or cached research for context
  const researchResult: CompanyResearchResult = {
    inputUrl: kit.source.company_url,
    normalizedCompanyUrl: kit.source.company_url,
    completed: true,
    pagesUsed: kit.source.pages_used || [],
    pages: [],
    rankedLinks: [],
    hiringPageUrls: [],
    warnings: [],
    robots: {
      robotsUrl: "",
      fetched: false,
      allowed: true,
      disallowRules: [],
      warnings: [],
    },
  };
  const discussionResult = await findPublicInterviewDiscussion({
    companyName: kit.source.company,
    companyUrl: kit.source.company_url,
  });

  // 3. Filter requirements matching this category
  const relevantRequirements = kit.role.requirements.filter((req: Requirement) => {
    if (category === "technical") return req.kind === "technical";
    if (category === "behavioural") return req.kind === "behavioural";
    if (category === "company-fit") return req.kind === "domain";
    if (category === "system-design") return req.kind === "technical";
    return false;
  });

  const warnings: ResearchWarning[] = [];

  let newQuestionDrafts = await generateQuestionsForCategory({
    category,
    requirements: relevantRequirements,
    research: researchResult,
    interviewDiscussion: discussionResult,
    llmClient: options.llmClient,
  });

  if (relevantRequirements.length > 0 && newQuestionDrafts.length < relevantRequirements.length) {
    warnings.push({
      code: "PARTIAL_REGENERATION_WARNING",
      message: "Fewer questions were generated because some model results were unavailable or invalid.",
    });
  }

  // Deduplicate new questions against preserved questions by prompt
  const existingPrompts = new Set(
    protectedCategoryQuestions.map((q) => q.prompt.trim().toLowerCase())
  );
  newQuestionDrafts = newQuestionDrafts.filter(
    (draft) => !existingPrompts.has(draft.prompt.trim().toLowerCase())
  );

  // 4. Assign non-conflicting IDs continuing after highest existing question ID
  const allExistingQuestions = [...otherCategoryQuestions, ...protectedCategoryQuestions];
  const startIdOffset = findNextQuestionSequence(allExistingQuestions);

  const assignedNewQuestions = assignQuestionIds(newQuestionDrafts, startIdOffset);

  // Attach _meta: origin "generated", edited: false, pinned: false
  const newEditableQuestions: EditableInterviewQuestion[] = assignedNewQuestions.map((q) => ({
    ...q,
    _meta: {
      origin: "generated",
      edited: false,
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }));

  let mergedQuestions = [
    ...otherCategoryQuestions,
    ...protectedCategoryQuestions,
    ...newEditableQuestions,
  ];

  // 5. Check coverage
  const initialCoverage = analyzeRequirementCoverage(
    kit.role.requirements,
    mergedQuestions
  );

  let coveragePasses = 1;

  // 6. Targeted gap repair if must requirements became uncovered
  if (initialCoverage.uncoveredMustRequirementIds.length > 0) {
    const missingMustReqs = kit.role.requirements.filter((r: Requirement) =>
      initialCoverage.uncoveredMustRequirementIds.includes(r.id)
    );

    const gapDrafts = await generateQuestionsForRequirementGaps({
      requirements: missingMustReqs,
      research: researchResult,
      interviewDiscussion: discussionResult,
      llmClient: options.llmClient,
    });

    if (gapDrafts.length > 0) {
      const gapStartOffset = findNextQuestionSequence(mergedQuestions);
      const gapQuestions = assignQuestionIds(gapDrafts, gapStartOffset);

      const gapEditableQuestions: EditableInterviewQuestion[] = gapQuestions.map((q) => ({
        ...q,
        _meta: {
          origin: "generated",
          edited: false,
          pinned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }));

      mergedQuestions.push(...gapEditableQuestions);
      coveragePasses = 2;
    }
  }

  // Final coverage calculation
  const finalCoverage = analyzeRequirementCoverage(
    kit.role.requirements,
    mergedQuestions
  );

  const coverageObj = {
    uncovered_requirement_ids: finalCoverage.uncoveredMustRequirementIds,
    passes: coveragePasses,
  };

  // 7. Deterministically rebuild schedule
  const updatedKitForSchedule: EditableInterviewPrepKit = {
    ...kit,
    questions: mergedQuestions,
  };
  const updatedSchedule = rebuildSchedule(updatedKitForSchedule);

  return {
    questions: mergedQuestions,
    coverage: coverageObj,
    schedule: updatedSchedule,
    regeneratedCount: newEditableQuestions.length,
    preservedCount,
    warnings: [],
  };
}

/**
 * Regenerates a specified section of an interview prep kit.
 */
export async function regenerateKitSection(
  input: RegenerateKitSectionInput
): Promise<RegenerateKitSectionResult> {
  const llmClient = input.llmClient || createGeminiClient();
  const researchImpl = input.research || researchCompany;

  // Clone kit to prevent mutation
  const draft: EditableInterviewPrepKit = JSON.parse(JSON.stringify(input.kit));

  if (input.section === "company_brief") {
    const result = await regenerateCompanyBriefHelper(draft, {
      replaceEdited: input.replaceEdited,
      llmClient,
      research: researchImpl,
    });

    draft.company_brief = result.company_brief;

    // Validate updated kit
    validateEditableInterviewPrepKit(draft);

    return {
      kit: draft,
      preservedEditedContent: result.preservedEditedContent,
      regeneratedCount: result.preservedEditedContent ? 0 : 1,
      preservedCount: result.preservedEditedContent ? 1 : 0,
      warnings: result.warnings,
    };
  }

  if (input.section === "questions") {
    if (!input.category) {
      throw new AppError(
        400,
        "INVALID_REGENERATION_REQUEST",
        "Category is required when regenerating questions."
      );
    }

    const result = await regenerateQuestionCategoryHelper(draft, input.category, {
      llmClient,
      research: researchImpl,
    });

    draft.questions = result.questions;
    draft.coverage = result.coverage;
    draft.schedule = result.schedule;

    // Validate updated kit
    validateEditableInterviewPrepKit(draft);
    // Also verify public strip passes
    validateInterviewPrepKit(stripInternalKitMetadata(draft));

    return {
      kit: draft,
      preservedEditedContent: false,
      regeneratedCount: result.regeneratedCount,
      preservedCount: result.preservedCount,
      warnings: result.warnings,
    };
  }

  if (input.section === "schedule") {
    // Pure deterministic schedule regeneration - no LLM call
    const newSchedule = rebuildSchedule(draft);
    draft.schedule = newSchedule;

    validateEditableInterviewPrepKit(draft);
    validateInterviewPrepKit(stripInternalKitMetadata(draft));

    return {
      kit: draft,
      preservedEditedContent: false,
      regeneratedCount: 1,
      preservedCount: draft.questions.length,
      warnings: [],
    };
  }

  throw new AppError(
    400,
    "INVALID_SECTION",
    `Unsupported regeneration section: '${input.section}'`
  );
}
