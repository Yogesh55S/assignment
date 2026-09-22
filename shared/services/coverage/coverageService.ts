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
export function analyzeRequirementCoverage(
  requirements: Requirement[],
  questions: InterviewQuestion[]
): CoverageAnalysis {
  // Map valid requirement IDs to their index and priority for fast, exact lookup
  const reqMap = new Map<string, { priority: "must" | "nice"; questionIds: string[] }>();

  for (const req of requirements) {
    if (!reqMap.has(req.id)) {
      reqMap.set(req.id, {
        priority: req.priority,
        questionIds: [],
      });
    }
  }

  // Iterate over questions and link valid requirement IDs
  for (const q of questions) {
    if (!q || !Array.isArray(q.requirement_ids)) continue;

    // Deduplicate within the same question to prevent duplicate question IDs
    const seenInQuestion = new Set<string>();
    for (const rId of q.requirement_ids) {
      if (seenInQuestion.has(rId)) continue;
      seenInQuestion.add(rId);

      const entry = reqMap.get(rId);
      if (entry) {
        entry.questionIds.push(q.id);
      }
      // Dangling requirement IDs not in requirements are ignored
    }
  }

  const coverageRecords: RequirementCoverage[] = [];
  const coveredRequirementIds: string[] = [];
  const uncoveredRequirementIds: string[] = [];
  const uncoveredMustRequirementIds: string[] = [];
  const uncoveredNiceRequirementIds: string[] = [];

  let coveredMustRequirementsCount = 0;
  let totalMustRequirements = 0;

  // Process requirements in original input order
  for (const req of requirements) {
    const entry = reqMap.get(req.id)!;
    const isCovered = entry.questionIds.length > 0;
    const isMust = req.priority === "must";

    if (isMust) {
      totalMustRequirements++;
      if (isCovered) {
        coveredMustRequirementsCount++;
      } else {
        uncoveredMustRequirementIds.push(req.id);
      }
    } else {
      if (!isCovered) {
        uncoveredNiceRequirementIds.push(req.id);
      }
    }

    if (isCovered) {
      coveredRequirementIds.push(req.id);
    } else {
      uncoveredRequirementIds.push(req.id);
    }

    coverageRecords.push({
      requirementId: req.id,
      priority: req.priority,
      questionIds: [...entry.questionIds],
      covered: isCovered,
    });
  }

  const totalRequirements = requirements.length;
  const coveredRequirementsCount = coveredRequirementIds.length;

  // Coverage percentage rounding (0-100 integer)
  const coveragePercent =
    totalRequirements === 0
      ? 100
      : Math.round((coveredRequirementsCount / totalRequirements) * 100);

  // Must coverage percentage: when zero must-have requirements exist, mustCoveragePercent is 100
  const mustCoveragePercent =
    totalMustRequirements === 0
      ? 100
      : Math.round((coveredMustRequirementsCount / totalMustRequirements) * 100);

  return {
    requirements: coverageRecords,
    coveredRequirementIds,
    uncoveredRequirementIds,
    uncoveredMustRequirementIds,
    uncoveredNiceRequirementIds,
    totalRequirements,
    coveredRequirementsCount,
    totalMustRequirements,
    coveredMustRequirementsCount,
    coveragePercent,
    mustCoveragePercent,
  };
}

/**
 * Returns IDs of uncovered must-have requirements in original input order.
 */
export function findUncoveredMustRequirementIds(
  requirements: Requirement[],
  questions: InterviewQuestion[]
): string[] {
  const analysis = analyzeRequirementCoverage(requirements, questions);
  return analysis.uncoveredMustRequirementIds;
}

/**
 * Returns IDs of uncovered requirements in original input order, optionally filtered by priority.
 */
export function findUncoveredRequirementIds(
  requirements: Requirement[],
  questions: InterviewQuestion[],
  priority?: "must" | "nice"
): string[] {
  const analysis = analyzeRequirementCoverage(requirements, questions);
  if (priority === "must") {
    return analysis.uncoveredMustRequirementIds;
  }
  if (priority === "nice") {
    return analysis.uncoveredNiceRequirementIds;
  }
  return analysis.uncoveredRequirementIds;
}

/**
 * Returns true if and only if every must-have requirement has at least one linked question.
 */
export function hasCompleteMustCoverage(
  requirements: Requirement[],
  questions: InterviewQuestion[]
): boolean {
  const analysis = analyzeRequirementCoverage(requirements, questions);
  return analysis.uncoveredMustRequirementIds.length === 0;
}
