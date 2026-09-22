import type {
  InterviewPrepKit,
  InterviewQuestion,
} from "@interview-prep/shared/types/kit";
import { validateInterviewPrepKit } from "@interview-prep/shared/validators/kitSchema";
import {
  analyzeRequirementCoverage,
  findUncoveredMustRequirementIds,
} from "@interview-prep/shared/services/coverage/coverageService";
import { allocateStudySchedule } from "@interview-prep/shared/services/schedule/scheduleService";
import { validateStudySchedule } from "@interview-prep/shared/services/schedule/scheduleValidation";
import { validateCompanyUrl } from "../research/urlSafety.js";
import { researchCompany as defaultResearchCompany } from "../research/researchService.js";
import type { ResearchWarning } from "../research/types.js";
import { createGeminiClient } from "../llm/geminiClient.js";
import { emitProgress } from "../../utils/asyncProgress.js";
import { assignQuestionIds } from "../../utils/stableIds.js";
import { createRequestFingerprint } from "../../utils/requestFingerprint.js";
import {
  STAGE_PERCENTS,
  type GenerateKitInput,
  type GenerateKitOptions,
  type GeneratedKitResult,
} from "./generationTypes.js";
import { extractRoleFromJobDescription } from "./requirementExtractionService.js";
import { generateCompanyBrief } from "./companyBriefService.js";
import { findPublicInterviewDiscussion } from "./interviewDiscussionService.js";
import {
  generateQuestionsForCategory,
  generateQuestionsForRequirementGaps,
  type GeneratedQuestionDraft,
} from "./questionGenerationService.js";
import { generateFlashcards } from "./flashcardGenerationService.js";
import { AppError } from "../../utils/errors.js";

function deriveCompanyName(url: string, title?: string): string {
  if (title && title.trim().length > 0) {
    const parts = title.split(/[|\-—–:]/);
    const candidate = parts[0]?.trim();
    if (candidate && candidate.length > 1 && candidate.length < 50) {
      return candidate;
    }
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "");
    const namePart = host.split(".")[0];
    if (namePart) {
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
  } catch {
    // fallback
  }

  return "Target Company";
}

export async function generateInterviewPrepKit(
  input: GenerateKitInput,
  options?: GenerateKitOptions
): Promise<GeneratedKitResult> {
  const onProgress = options?.onProgress;
  const now = options?.now ?? (() => new Date());
  const llmClient = options?.llmClient ?? createGeminiClient();
  const researchFn = options?.research ?? defaultResearchCompany;
  const maxCoveragePasses = options?.maxCoveragePasses ?? 2;

  // 1. Validating input
  await emitProgress(onProgress, {
    stage: "validating_input",
    message: "Validating input parameters and target URL...",
    percent: STAGE_PERCENTS.validating_input,
  });

  const trimmedJd = input.jd?.trim();
  if (!trimmedJd) {
    throw new AppError(400, "INVALID_INPUT", "Job description cannot be empty.");
  }
  if (trimmedJd.length > 50000) {
    throw new AppError(400, "INVALID_INPUT", "Job description exceeds maximum 50,000 characters.");
  }

  const days = Math.round(input.days);
  if (isNaN(days) || days < 1 || days > 60) {
    throw new AppError(400, "INVALID_INPUT", "Days available must be an integer between 1 and 60.");
  }

  const urlValidation = validateCompanyUrl(input.companyUrl);
  if (!urlValidation.valid || !urlValidation.normalizedUrl) {
    throw new AppError(
      400,
      urlValidation.error?.code ?? "INVALID_COMPANY_URL",
      urlValidation.error?.message ?? "Invalid company URL"
    );
  }
  const normalizedCompanyUrl = urlValidation.normalizedUrl;

  // 2. Extract role requirements from JD
  await emitProgress(onProgress, {
    stage: "extracting_requirements",
    message: "Extracting core competencies and role requirements from job description...",
    percent: STAGE_PERCENTS.extracting_requirements,
  });

  const extractedRole = await extractRoleFromJobDescription(trimmedJd, { llmClient });

  // 3. Research company website
  await emitProgress(onProgress, {
    stage: "researching_company",
    message: "Retrieving and analyzing company website...",
    percent: STAGE_PERCENTS.researching_company,
  });

  const researchResult = await researchFn(normalizedCompanyUrl);
  const allWarnings: ResearchWarning[] = [...researchResult.warnings];

  // 4. Public interview discussion search
  await emitProgress(onProgress, {
    stage: "searching_interview_discussion",
    message: "Checking for public interview discussion sources...",
    percent: STAGE_PERCENTS.searching_interview_discussion,
  });

  const companyName = deriveCompanyName(
    normalizedCompanyUrl,
    researchResult.companyHomepage?.title
  );

  const interviewDiscussion = await findPublicInterviewDiscussion({
    companyName,
    companyUrl: normalizedCompanyUrl,
  });
  allWarnings.push(...interviewDiscussion.warnings);

  // 5. Generate company brief
  await emitProgress(onProgress, {
    stage: "generating_company_brief",
    message: "Synthesizing company brief from verified sources...",
    percent: STAGE_PERCENTS.generating_company_brief,
  });

  const companyBrief = await generateCompanyBrief({
    companyName,
    companyUrl: normalizedCompanyUrl,
    research: researchResult,
    llmClient,
  });

  // 6. Category-specific question generation
  const allQuestionDrafts: GeneratedQuestionDraft[] = [];

  const technicalReqs = extractedRole.requirements.filter((r) => r.kind === "technical");
  const behaviouralReqs = extractedRole.requirements.filter((r) => r.kind === "behavioural");
  const domainReqs = extractedRole.requirements.filter((r) => r.kind === "domain");

  // Technical
  if (technicalReqs.length > 0) {
    await emitProgress(onProgress, {
      stage: "generating_technical_questions",
      message: "Generating technical interview questions...",
      percent: STAGE_PERCENTS.generating_technical_questions,
    });
    const techDrafts = await generateQuestionsForCategory({
      category: "technical",
      requirements: technicalReqs,
      research: researchResult,
      interviewDiscussion,
      llmClient,
    });
    allQuestionDrafts.push(...techDrafts);
  }

  // Behavioural
  if (behaviouralReqs.length > 0) {
    await emitProgress(onProgress, {
      stage: "generating_behavioural_questions",
      message: "Generating behavioural STAR interview questions...",
      percent: STAGE_PERCENTS.generating_behavioural_questions,
    });
    const behavDrafts = await generateQuestionsForCategory({
      category: "behavioural",
      requirements: behaviouralReqs,
      research: researchResult,
      interviewDiscussion,
      llmClient,
    });
    allQuestionDrafts.push(...behavDrafts);
  }

  // System Design (if technical requirements exist or research indicates)
  if (technicalReqs.length > 0) {
    await emitProgress(onProgress, {
      stage: "generating_system_design_questions",
      message: "Generating architectural and system design questions...",
      percent: STAGE_PERCENTS.generating_system_design_questions,
    });
    const sysDrafts = await generateQuestionsForCategory({
      category: "system-design",
      requirements: technicalReqs,
      research: researchResult,
      interviewDiscussion,
      llmClient,
    });
    allQuestionDrafts.push(...sysDrafts);
  }

  // Company Fit / Domain
  if (domainReqs.length > 0) {
    await emitProgress(onProgress, {
      stage: "generating_company_fit_questions",
      message: "Generating domain and company-fit questions...",
      percent: STAGE_PERCENTS.generating_company_fit_questions,
    });
    const fitDrafts = await generateQuestionsForCategory({
      category: "company-fit",
      requirements: domainReqs,
      research: researchResult,
      interviewDiscussion,
      llmClient,
    });
    allQuestionDrafts.push(...fitDrafts);
  }

  // Assign initial q IDs deterministically
  let currentQuestions: InterviewQuestion[] = assignQuestionIds(allQuestionDrafts);

  // 7. Deterministic Coverage Check
  await emitProgress(onProgress, {
    stage: "checking_coverage",
    message: "Verifying requirement coverage...",
    percent: STAGE_PERCENTS.checking_coverage,
  });

  let coverageAnalysis = analyzeRequirementCoverage(
    extractedRole.requirements,
    currentQuestions
  );

  let coveragePasses = 1;

  // 8. Targeted Gap Repair Loop (at most 1 repair pass)
  if (
    coverageAnalysis.uncoveredMustRequirementIds.length > 0 &&
    maxCoveragePasses >= 2
  ) {
    await emitProgress(onProgress, {
      stage: "repairing_coverage",
      message: "Executing targeted second pass for uncovered mandatory requirements...",
      percent: STAGE_PERCENTS.repairing_coverage,
    });

    const missingMustReqs = extractedRole.requirements.filter((r) =>
      coverageAnalysis.uncoveredMustRequirementIds.includes(r.id)
    );

    const gapDrafts = await generateQuestionsForRequirementGaps({
      requirements: missingMustReqs,
      research: researchResult,
      interviewDiscussion,
      llmClient,
    });

    if (gapDrafts.length > 0) {
      const assignedGapQuestions = assignQuestionIds(
        gapDrafts,
        currentQuestions.length + 1
      );
      currentQuestions = [...currentQuestions, ...assignedGapQuestions];
    }

    coveragePasses = 2;
    coverageAnalysis = analyzeRequirementCoverage(
      extractedRole.requirements,
      currentQuestions
    );
  }

  // Final uncovered must requirements list
  const finalUncoveredMustIds = findUncoveredMustRequirementIds(
    extractedRole.requirements,
    currentQuestions
  );

  // 9. Generate active recall flashcards
  await emitProgress(onProgress, {
    stage: "generating_flashcards",
    message: "Generating active recall revision flashcards...",
    percent: STAGE_PERCENTS.generating_flashcards,
  });

  const flashcards = await generateFlashcards({
    requirements: extractedRole.requirements,
    questions: currentQuestions,
    llmClient,
  });

  // 10. Deterministic Study Schedule Allocation
  await emitProgress(onProgress, {
    stage: "building_schedule",
    message: "Allocating study schedule across available days...",
    percent: STAGE_PERCENTS.building_schedule,
  });

  const scheduleResult = allocateStudySchedule({
    daysAvailable: days,
    requirements: extractedRole.requirements,
    questions: currentQuestions,
  });

  // Validate schedule
  const scheduleValidation = validateStudySchedule({
    schedule: scheduleResult.schedule,
    requirements: extractedRole.requirements,
    questions: currentQuestions,
  });

  if (!scheduleValidation.valid) {
    const errorMsg = scheduleValidation.issues.map((i) => i.message).join("; ");
    throw new AppError(500, "SCHEDULE_VALIDATION_ERROR", `Generated schedule failed validation: ${errorMsg}`);
  }

  // 11. Compose Final InterviewPrepKit
  await emitProgress(onProgress, {
    stage: "validating_kit",
    message: "Performing final structural validation...",
    percent: STAGE_PERCENTS.validating_kit,
  });

  const rawKit: InterviewPrepKit = {
    source: {
      company: companyName,
      company_url: normalizedCompanyUrl,
      role: extractedRole.title,
      location: extractedRole.location,
      jd_chars: trimmedJd.length,
      researched_at: now().toISOString(),
      pages_used: researchResult.pagesUsed,
    },
    company_brief: companyBrief,
    role: {
      title: extractedRole.title,
      seniority: extractedRole.seniority,
      responsibilities: extractedRole.responsibilities,
      requirements: extractedRole.requirements,
    },
    questions: currentQuestions,
    flashcards,
    schedule: scheduleResult.schedule,
    coverage: {
      uncovered_requirement_ids: finalUncoveredMustIds,
      passes: coveragePasses,
    },
  };

  // Strict validation against shared InterviewPrepKit Zod schema
  const validatedKit = validateInterviewPrepKit(rawKit);

  const requestFingerprint = createRequestFingerprint({
    userId: options?.userId,
    jd: trimmedJd,
    companyUrl: normalizedCompanyUrl,
    days,
  });

  await emitProgress(onProgress, {
    stage: "completed",
    message: "Interview prep kit successfully generated!",
    percent: STAGE_PERCENTS.completed,
  });

  return {
    kit: validatedKit,
    researchWarnings: allWarnings,
    requestFingerprint,
    reusedExistingKit: false,
  };
}
