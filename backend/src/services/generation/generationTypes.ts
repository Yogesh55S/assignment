import type { InterviewPrepKit } from "@interview-prep/shared/types/kit";
import type { LlmClient } from "../llm/types.js";
import type { researchCompany } from "../research/researchService.js";
import type { ResearchWarning } from "../research/types.js";

export type GenerationStage =
  | "validating_input"
  | "extracting_requirements"
  | "researching_company"
  | "searching_interview_discussion"
  | "generating_company_brief"
  | "generating_technical_questions"
  | "generating_behavioural_questions"
  | "generating_system_design_questions"
  | "generating_company_fit_questions"
  | "checking_coverage"
  | "repairing_coverage"
  | "generating_flashcards"
  | "building_schedule"
  | "validating_kit"
  | "saving_kit"
  | "completed"
  | "failed";

export interface GenerationProgressEvent {
  stage: GenerationStage;
  message: string;
  percent: number;
  warning?: string;
}

export interface GenerateKitInput {
  jd: string;
  companyUrl: string;
  days: number;
}

export interface GenerateKitOptions {
  llmClient?: LlmClient;
  research?: typeof researchCompany;
  onProgress?: (event: GenerationProgressEvent) => void | Promise<void>;
  maxCoveragePasses?: number;
  skipPersistence?: boolean;
  userId?: string;
  now?: () => Date;
}

export interface GeneratedKitResult {
  kit: InterviewPrepKit;
  researchWarnings: ResearchWarning[];
  requestFingerprint: string;
  reusedExistingKit: boolean;
}

export const STAGE_PERCENTS: Record<GenerationStage, number> = {
  validating_input: 5,
  extracting_requirements: 15,
  researching_company: 30,
  searching_interview_discussion: 35,
  generating_company_brief: 45,
  generating_technical_questions: 55,
  generating_behavioural_questions: 60,
  generating_system_design_questions: 65,
  generating_company_fit_questions: 70,
  checking_coverage: 75,
  repairing_coverage: 80,
  generating_flashcards: 85,
  building_schedule: 90,
  validating_kit: 95,
  saving_kit: 98,
  completed: 100,
  failed: 100,
};
