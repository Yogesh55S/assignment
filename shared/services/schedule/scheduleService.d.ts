import type { Requirement, InterviewQuestion } from "../../types/kit.js";
import type { QuestionSchedulingScore, ScheduleAllocationOptions, ScheduleAllocationResult } from "../../types/scheduling.js";
/**
 * Calculates deterministic scheduling scores for questions based on requirement priorities and difficulty.
 * Deduplicates questions by question.id (preserving the first occurrence).
 */
export declare function calculateQuestionSchedulingScores(requirements: Requirement[], questions: InterviewQuestion[]): QuestionSchedulingScore[];
/**
 * Deterministically allocates questions across preparation days using a round-robin priority algorithm.
 * Guarantees exactly daysAvailable days, integer minutes, and consistent ordering.
 */
export declare function allocateStudySchedule(input: {
    daysAvailable: number;
    requirements: Requirement[];
    questions: InterviewQuestion[];
    options?: ScheduleAllocationOptions;
}): ScheduleAllocationResult;
