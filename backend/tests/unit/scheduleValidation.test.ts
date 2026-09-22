import { describe, it, expect } from "vitest";
import { validateStudySchedule } from "@interview-prep/shared/services/schedule/scheduleValidation";
import { allocateStudySchedule } from "@interview-prep/shared/services/schedule/scheduleService";
import type { Requirement, InterviewQuestion, InterviewPrepKit } from "@interview-prep/shared/types/kit";

describe("Schedule Validation Engine", () => {
  const reqs: Requirement[] = [
    { id: "req-1", text: "Core React", kind: "technical", priority: "must" },
    { id: "req-2", text: "Team communication", kind: "behavioural", priority: "nice" },
  ];

  const questions: InterviewQuestion[] = [
    {
      id: "q-1",
      requirement_ids: ["req-1"],
      category: "technical",
      prompt: "React hooks explanation.",
      answer_outline: "State and effect lifecycle.",
      difficulty: 2,
    },
    {
      id: "q-2",
      requirement_ids: ["req-2"],
      category: "behavioural",
      prompt: "Describe handling conflict.",
      answer_outline: "STAR method.",
      difficulty: 1,
    },
  ];

  // Helper to create valid schedule
  const getValidSchedule = (): InterviewPrepKit["schedule"] => {
    const res = allocateStudySchedule({
      daysAvailable: 2,
      requirements: reqs,
      questions,
    });
    return res.schedule;
  };

  // Test 1: A valid generated schedule passes
  it("passes validation for a valid generated schedule", () => {
    const validSchedule = getValidSchedule();
    const result = validateStudySchedule({
      schedule: validSchedule,
      requirements: reqs,
      questions,
    });

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  // Test 2: Wrong day count reports DAY_COUNT_MISMATCH
  it("reports DAY_COUNT_MISMATCH when schedule.days count does not equal days_available", () => {
    const schedule = getValidSchedule();
    schedule.days_available = 3; // But days only has 2 items

    const result = validateStudySchedule({ schedule, requirements: reqs, questions });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === "DAY_COUNT_MISMATCH")).toBe(true);
  });

  // Test 3: Non-sequential day numbers report INVALID_DAY_NUMBER
  it("reports INVALID_DAY_NUMBER for non-sequential day numbers", () => {
    const schedule = getValidSchedule();
    schedule.days[1].day = 99; // Should be 2

    const result = validateStudySchedule({ schedule, requirements: reqs, questions });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === "INVALID_DAY_NUMBER")).toBe(true);
  });

  // Test 4: Float minutes report INVALID_MINUTES
  it("reports INVALID_MINUTES when minutes contains a float", () => {
    const schedule = getValidSchedule();
    (schedule.days[0] as any).minutes = 30.5;

    const result = validateStudySchedule({ schedule, requirements: reqs, questions });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === "INVALID_MINUTES")).toBe(true);
  });

  // Test 5: Unknown scheduled question ID reports UNKNOWN_QUESTION_ID
  it("reports UNKNOWN_QUESTION_ID when a scheduled question does not exist in questions array", () => {
    const schedule = getValidSchedule();
    schedule.days[0].question_ids.push("unknown-question-xyz");

    const result = validateStudySchedule({ schedule, requirements: reqs, questions });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === "UNKNOWN_QUESTION_ID")).toBe(true);
  });

  // Test 6: Duplicate scheduled question IDs report DUPLICATE_SCHEDULED_QUESTION
  it("reports DUPLICATE_SCHEDULED_QUESTION when a question is scheduled more than once", () => {
    const schedule = getValidSchedule();
    // Schedule q-1 on both day 1 and day 2
    schedule.days[1].question_ids.push("q-1");

    const result = validateStudySchedule({ schedule, requirements: reqs, questions });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === "DUPLICATE_SCHEDULED_QUESTION")).toBe(true);
  });

  // Test 7: A question not included in any day reports UNSCHEDULED_QUESTION
  it("reports UNSCHEDULED_QUESTION when a question from input questions is missing from schedule", () => {
    const schedule = getValidSchedule();
    // Remove q-2 from day 2
    schedule.days[1].question_ids = [];

    const result = validateStudySchedule({ schedule, requirements: reqs, questions });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === "UNSCHEDULED_QUESTION" && i.questionId === "q-2")).toBe(true);
  });

  // Test 8: Missing scheduled coverage for a must requirement reports UNSCHEDULED_MUST_REQUIREMENT
  it("reports UNSCHEDULED_MUST_REQUIREMENT when a must requirement is not covered by any scheduled question", () => {
    const reqsWithUncoveredMust: Requirement[] = [
      ...reqs,
      { id: "must-uncovered", text: "Security architecture", kind: "technical", priority: "must" },
    ];

    const schedule = getValidSchedule();
    const result = validateStudySchedule({
      schedule,
      requirements: reqsWithUncoveredMust,
      questions,
    });

    expect(result.valid).toBe(false);
    expect(
      result.issues.some(
        (i) => i.code === "UNSCHEDULED_MUST_REQUIREMENT" && i.requirementId === "must-uncovered"
      )
    ).toBe(true);
  });

  // Test 9: No exceptions are thrown for invalid ordinary data
  it("does not throw exceptions for malformed or invalid ordinary data", () => {
    const malformedSchedule: any = {
      days_available: -5,
      days: [
        { day: -1, focus: "", question_ids: ["invalid-1", "invalid-1"], minutes: -10 },
      ],
    };

    expect(() =>
      validateStudySchedule({
        schedule: malformedSchedule,
        requirements: reqs,
        questions,
      })
    ).not.toThrow();

    const result = validateStudySchedule({
      schedule: malformedSchedule,
      requirements: reqs,
      questions,
    });
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
