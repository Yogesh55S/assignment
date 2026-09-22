import { describe, it, expect } from "vitest";
import {
  analyzeRequirementCoverage,
  findUncoveredMustRequirementIds,
  findUncoveredRequirementIds,
  hasCompleteMustCoverage,
} from "@interview-prep/shared/services/coverage/coverageService";
import type { Requirement, InterviewQuestion } from "@interview-prep/shared/types/kit";

describe("Deterministic Coverage Service", () => {
  const sampleRequirements: Requirement[] = [
    { id: "r1", text: "TypeScript / Node.js", kind: "technical", priority: "must" },
    { id: "r2", text: "Distributed Systems", kind: "technical", priority: "must" },
    { id: "r3", text: "Docker / Kubernetes", kind: "technical", priority: "nice" },
  ];

  const sampleQuestions: InterviewQuestion[] = [
    {
      id: "q1",
      requirement_ids: ["r1"],
      category: "technical",
      prompt: "Explain Node.js event loop.",
      answer_outline: "Discuss libuv, microtasks, timers.",
      difficulty: 2,
    },
    {
      id: "q2",
      requirement_ids: ["r3", "dangling-id-999"],
      category: "technical",
      prompt: "Describe container orchestration with K8s.",
      answer_outline: "Pods, services, deployments.",
      difficulty: 3,
    },
  ];

  // Test 1: Correct coverage analysis across must and nice requirements
  it("correctly analyzes coverage across must and nice requirements", () => {
    const analysis = analyzeRequirementCoverage(sampleRequirements, sampleQuestions);

    expect(analysis.totalRequirements).toBe(3);
    expect(analysis.coveredRequirementsCount).toBe(2);
    expect(analysis.coveredRequirementIds).toEqual(["r1", "r3"]);
    expect(analysis.uncoveredRequirementIds).toEqual(["r2"]);
    expect(analysis.uncoveredMustRequirementIds).toEqual(["r2"]);
    expect(analysis.uncoveredNiceRequirementIds).toEqual([]);
    expect(analysis.totalMustRequirements).toBe(2);
    expect(analysis.coveredMustRequirementsCount).toBe(1);
    expect(analysis.coveragePercent).toBe(67);
    expect(analysis.mustCoveragePercent).toBe(50);

    // Records verification
    expect(analysis.requirements).toHaveLength(3);
    expect(analysis.requirements[0]).toEqual({
      requirementId: "r1",
      priority: "must",
      questionIds: ["q1"],
      covered: true,
    });
    expect(analysis.requirements[1]).toEqual({
      requirementId: "r2",
      priority: "must",
      questionIds: [],
      covered: false,
    });
    expect(analysis.requirements[2]).toEqual({
      requirementId: "r3",
      priority: "nice",
      questionIds: ["q2"],
      covered: true,
    });
  });

  // Test 2: A requirement with no question is uncovered
  it("identifies requirement with no question as uncovered", () => {
    const reqs: Requirement[] = [
      { id: "r1", text: "SQL Optimization", kind: "technical", priority: "must" },
    ];
    const analysis = analyzeRequirementCoverage(reqs, []);

    expect(analysis.coveredRequirementIds).toEqual([]);
    expect(analysis.uncoveredRequirementIds).toEqual(["r1"]);
    expect(analysis.uncoveredMustRequirementIds).toEqual(["r1"]);
    expect(analysis.coveragePercent).toBe(0);
    expect(analysis.mustCoveragePercent).toBe(0);
  });

  // Test 3: One question can cover multiple requirements
  it("allows one question to cover multiple requirements", () => {
    const reqs: Requirement[] = [
      { id: "r1", text: "React state management", kind: "technical", priority: "must" },
      { id: "r2", text: "Performance profiling", kind: "technical", priority: "nice" },
    ];
    const questions: InterviewQuestion[] = [
      {
        id: "q-multi",
        requirement_ids: ["r1", "r2"],
        category: "technical",
        prompt: "How do you optimize render performance with Redux?",
        answer_outline: "Selectors, memoization, profiling tools.",
        difficulty: 3,
      },
    ];

    const analysis = analyzeRequirementCoverage(reqs, questions);
    expect(analysis.coveredRequirementIds).toEqual(["r1", "r2"]);
    expect(analysis.uncoveredRequirementIds).toEqual([]);
    expect(analysis.coveragePercent).toBe(100);
    expect(analysis.mustCoveragePercent).toBe(100);
  });

  // Test 4: Dangling question requirement IDs do not create coverage
  it("ignores dangling requirement IDs in questions", () => {
    const reqs: Requirement[] = [
      { id: "r1", text: "REST design", kind: "technical", priority: "must" },
    ];
    const questions: InterviewQuestion[] = [
      {
        id: "q1",
        requirement_ids: ["non-existent-1", "non-existent-2"],
        category: "technical",
        prompt: "Question with dangling IDs",
        answer_outline: "Some outline",
        difficulty: 1,
      },
    ];

    const analysis = analyzeRequirementCoverage(reqs, questions);
    expect(analysis.coveredRequirementIds).toEqual([]);
    expect(analysis.uncoveredRequirementIds).toEqual(["r1"]);
    expect(analysis.coveragePercent).toBe(0);
  });

  // Test 5: Empty requirements return valid zero-count analysis and mustCoveragePercent 100
  it("handles empty requirements returning zero counts and 100% must coverage", () => {
    const analysis = analyzeRequirementCoverage([], sampleQuestions);

    expect(analysis.totalRequirements).toBe(0);
    expect(analysis.coveredRequirementsCount).toBe(0);
    expect(analysis.totalMustRequirements).toBe(0);
    expect(analysis.coveredMustRequirementsCount).toBe(0);
    expect(analysis.coveredRequirementIds).toEqual([]);
    expect(analysis.uncoveredRequirementIds).toEqual([]);
    expect(analysis.coveragePercent).toBe(100);
    expect(analysis.mustCoveragePercent).toBe(100);
  });

  // Test 6: Input arrays are not mutated
  it("does not mutate input requirements or questions", () => {
    const reqsClone = JSON.parse(JSON.stringify(sampleRequirements));
    const questionsClone = JSON.parse(JSON.stringify(sampleQuestions));

    analyzeRequirementCoverage(sampleRequirements, sampleQuestions);
    findUncoveredMustRequirementIds(sampleRequirements, sampleQuestions);
    findUncoveredRequirementIds(sampleRequirements, sampleQuestions);
    hasCompleteMustCoverage(sampleRequirements, sampleQuestions);

    expect(sampleRequirements).toEqual(reqsClone);
    expect(sampleQuestions).toEqual(questionsClone);
  });

  // Test 7: Returned IDs preserve requirement input order
  it("preserves requirement input order in returned ID arrays and records", () => {
    const orderedReqs: Requirement[] = [
      { id: "z-req", text: "Last alphabetically", kind: "domain", priority: "must" },
      { id: "a-req", text: "First alphabetically", kind: "technical", priority: "must" },
      { id: "m-req", text: "Middle alphabetically", kind: "behavioural", priority: "nice" },
    ];
    const questions: InterviewQuestion[] = [
      {
        id: "q1",
        requirement_ids: ["a-req", "z-req"],
        category: "technical",
        prompt: "Prompt",
        answer_outline: "Outline",
        difficulty: 1,
      },
    ];

    const analysis = analyzeRequirementCoverage(orderedReqs, questions);
    expect(analysis.coveredRequirementIds).toEqual(["z-req", "a-req"]);
    expect(analysis.uncoveredRequirementIds).toEqual(["m-req"]);
    expect(analysis.uncoveredNiceRequirementIds).toEqual(["m-req"]);
    expect(analysis.requirements.map((r) => r.requirementId)).toEqual(["z-req", "a-req", "m-req"]);

    expect(findUncoveredRequirementIds(orderedReqs, questions)).toEqual(["m-req"]);
    expect(findUncoveredMustRequirementIds(orderedReqs, questions)).toEqual([]);
  });

  // Test 8: hasCompleteMustCoverage is true only when every must requirement has a linked question
  it("evaluates hasCompleteMustCoverage accurately", () => {
    const reqs: Requirement[] = [
      { id: "must-1", text: "Must 1", kind: "technical", priority: "must" },
      { id: "must-2", text: "Must 2", kind: "domain", priority: "must" },
      { id: "nice-1", text: "Nice 1", kind: "behavioural", priority: "nice" },
    ];

    // Only must-1 covered -> false
    const partialQuestions: InterviewQuestion[] = [
      {
        id: "q1",
        requirement_ids: ["must-1"],
        category: "technical",
        prompt: "P1",
        answer_outline: "A1",
        difficulty: 1,
      },
    ];
    expect(hasCompleteMustCoverage(reqs, partialQuestions)).toBe(false);

    // Both must-1 and must-2 covered, nice-1 uncovered -> true
    const completeMustQuestions: InterviewQuestion[] = [
      {
        id: "q1",
        requirement_ids: ["must-1"],
        category: "technical",
        prompt: "P1",
        answer_outline: "A1",
        difficulty: 1,
      },
      {
        id: "q2",
        requirement_ids: ["must-2"],
        category: "domain",
        prompt: "P2",
        answer_outline: "A2",
        difficulty: 2,
      },
    ];
    expect(hasCompleteMustCoverage(reqs, completeMustQuestions)).toBe(true);
  });

  // Test 9: Coverage percentage uses integer rounding: 2 covered out of 3 equals 67
  it("uses integer rounding for coverage percentages (2 out of 3 = 67)", () => {
    const analysis = analyzeRequirementCoverage(sampleRequirements, sampleQuestions);
    // 2/3 = 66.666... -> 67
    expect(analysis.coveragePercent).toBe(67);
    // 1/2 must covered = 50%
    expect(analysis.mustCoveragePercent).toBe(50);
  });
});
