import type { Requirement, InterviewQuestion } from "../../types/kit.js";
export type RequirementCoverage = {
    requirementId: string;
    priority: "must" | "nice";
    questionIds: string[];
    covered: boolean;
};
export type CoverageAnalysis = {
    requirements: RequirementCoverage[];
    coveredRequirementIds: string[];
    uncoveredRequirementIds: string[];
    uncoveredMustRequirementIds: string[];
    uncoveredNiceRequirementIds: string[];
    totalRequirements: number;
    coveredRequirementsCount: number;
    totalMustRequirements: number;
    coveredMustRequirementsCount: number;
    coveragePercent: number;
    mustCoveragePercent: number;
};
/**
 * Deterministically analyzes job requirement coverage against generated interview questions.
 * Pure, side-effect-free, and does not mutate input arrays or objects.
 */
export declare function analyzeRequirementCoverage(requirements: Requirement[], questions: InterviewQuestion[]): CoverageAnalysis;
/**
 * Returns IDs of uncovered must-have requirements in original input order.
 */
export declare function findUncoveredMustRequirementIds(requirements: Requirement[], questions: InterviewQuestion[]): string[];
/**
 * Returns IDs of uncovered requirements in original input order, optionally filtered by priority.
 */
export declare function findUncoveredRequirementIds(requirements: Requirement[], questions: InterviewQuestion[], priority?: "must" | "nice"): string[];
/**
 * Returns true if and only if every must-have requirement has at least one linked question.
 */
export declare function hasCompleteMustCoverage(requirements: Requirement[], questions: InterviewQuestion[]): boolean;
