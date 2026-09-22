import { describe, it, expect } from "vitest";
import {
  calculateQuestionSchedulingScores,
  allocateStudySchedule,
} from "@interview-prep/shared/services/schedule/scheduleService";
import type { Requirement, InterviewQuestion } from "@interview-prep/shared/types/kit";

describe("Deterministic Schedule Service", () => {
  const reqs: Requirement[] = [
    { id: "req-must-1", text: "Distributed consensus", kind: "technical", priority: "must" },
    { id: "req-must-2", text: "Database sharding", kind: "technical", priority: "must" },
    { id: "req-nice-1", text: "CSS layout", kind: "technical", priority: "nice" },
  ];

  const questions: InterviewQuestion[] = [
    {
      id: "q-must-hard",
      requirement_ids: ["req-must-1"],
      category: "technical",
      prompt: "Explain Paxos vs Raft in detail.",
      answer_outline: "Consensus stages, leader election, log replication.",
      difficulty: 3,
    },
    {
      id: "q-must-easy",
      requirement_ids: ["req-must-2"],
      category: "technical",
      prompt: "What is database sharding?",
      answer_outline: "Horizontal partitioning, shard keys.",
      difficulty: 1,
    },
    {
      id: "q-nice-hard",
      requirement_ids: ["req-nice-1"],
      category: "technical",
      prompt: "Advanced Flexbox and Grid tricks.",
      answer_outline: "Subgrid, auto-fill vs auto-fit.",
      difficulty: 3,
    },
    {
      id: "q-nice-med",
      requirement_ids: ["req-nice-1"],
      category: "technical",
      prompt: "CSS box-sizing property.",
      answer_outline: "Border-box vs content-box.",
      difficulty: 2,
    },
    {
      id: "q-dangling",
      requirement_ids: ["non-existent-req"],
      category: "technical",
      prompt: "Explain arbitrary topic.",
      answer_outline: "Outline.",
      difficulty: 2,
    },
  ];

  // Test 1: Schedule contains exactly daysAvailable days
  it("contains exactly daysAvailable days", () => {
    const res3 = allocateStudySchedule({ daysAvailable: 3, requirements: reqs, questions });
    expect(res3.schedule.days).toHaveLength(3);
    expect(res3.schedule.days_available).toBe(3);

    const res7 = allocateStudySchedule({ daysAvailable: 7, requirements: reqs, questions });
    expect(res7.schedule.days).toHaveLength(7);
    expect(res7.schedule.days_available).toBe(7);
  });

  // Test 2: Every unique question ID appears once only
  it("schedules every unique question ID exactly once across all days", () => {
    const res = allocateStudySchedule({ daysAvailable: 3, requirements: reqs, questions });
    const allDayQuestionIds: string[] = [];

    for (const day of res.schedule.days) {
      allDayQuestionIds.push(...day.question_ids);
    }

    expect(allDayQuestionIds).toHaveLength(5);
    expect(new Set(allDayQuestionIds).size).toBe(5);
    expect(new Set(res.scheduledQuestionIds)).toEqual(new Set(allDayQuestionIds));
    expect(res.unscheduledQuestionIds).toEqual([]);
  });

  // Test 3: Higher-priority and harder questions are allocated to earlier days
  it("allocates higher-priority and harder questions to earlier days", () => {
    const res = allocateStudySchedule({ daysAvailable: 2, requirements: reqs, questions });

    // Sorted scores should be:
    // 1. q-must-hard (score: 100 + 30 = 130) -> Day 1
    // 2. q-must-easy (score: 100 + 10 = 110) -> Day 2
    // 3. q-nice-hard (score: 20 + 30 = 50) -> Day 1
    // 4. q-nice-med  (score: 20 + 20 = 40) -> Day 2
    // 5. q-dangling  (score: 0 + 20 = 20) -> Day 1

    expect(res.schedule.days[0].question_ids).toEqual(["q-must-hard", "q-nice-hard", "q-dangling"]);
    expect(res.schedule.days[1].question_ids).toEqual(["q-must-easy", "q-nice-med"]);
  });

  // Test 4: A question with a must requirement scores 100 plus difficulty weight
  it("scores a question with a must requirement as 100 + difficulty weight", () => {
    const scores = calculateQuestionSchedulingScores(reqs, [questions[0]]); // q-must-hard (difficulty 3)
    expect(scores[0].priorityWeight).toBe(100);
    expect(scores[0].difficultyWeight).toBe(30);
    expect(scores[0].score).toBe(130);
    expect(scores[0].hasMustRequirement).toBe(true);
  });

  // Test 5: A nice-only question scores 20 plus difficulty weight
  it("scores a nice-only question as 20 + difficulty weight", () => {
    const scores = calculateQuestionSchedulingScores(reqs, [questions[2]]); // q-nice-hard (difficulty 3)
    expect(scores[0].priorityWeight).toBe(20);
    expect(scores[0].difficultyWeight).toBe(30);
    expect(scores[0].score).toBe(50);
    expect(scores[0].hasMustRequirement).toBe(false);
  });

  // Test 6: A question with only dangling requirement IDs scores difficulty weight only
  it("scores a question with only dangling requirement IDs with difficulty weight only (0 priority weight)", () => {
    const scores = calculateQuestionSchedulingScores(reqs, [questions[4]]); // q-dangling (difficulty 2)
    expect(scores[0].priorityWeight).toBe(0);
    expect(scores[0].difficultyWeight).toBe(20);
    expect(scores[0].score).toBe(20);
    expect(scores[0].hasMustRequirement).toBe(false);
    expect(scores[0].linkedRequirementIds).toEqual([]);
  });

  // Test 7: Questions are distributed round-robin across requested days
  it("distributes questions round-robin across days", () => {
    const res = allocateStudySchedule({ daysAvailable: 3, requirements: reqs, questions });
    // Sorted questions by score:
    // index 0: q-must-hard -> Day 1 (index 0 % 3 = 0)
    // index 1: q-must-easy -> Day 2 (index 1 % 3 = 1)
    // index 2: q-nice-hard -> Day 3 (index 2 % 3 = 2)
    // index 3: q-nice-med  -> Day 1 (index 3 % 3 = 0)
    // index 4: q-dangling  -> Day 2 (index 4 % 3 = 1)

    expect(res.schedule.days[0].question_ids).toEqual(["q-must-hard", "q-nice-med"]);
    expect(res.schedule.days[1].question_ids).toEqual(["q-must-easy", "q-dangling"]);
    expect(res.schedule.days[2].question_ids).toEqual(["q-nice-hard"]);
  });

  // Test 8: Schedule supports 1 day
  it("supports 1 day schedule with all questions placed in that day", () => {
    const res = allocateStudySchedule({ daysAvailable: 1, requirements: reqs, questions });
    expect(res.schedule.days).toHaveLength(1);
    expect(res.schedule.days[0].day).toBe(1);
    expect(res.schedule.days[0].question_ids).toHaveLength(5);
    expect(res.schedule.days[0].focus).toBe("Must-have requirements");
  });

  // Test 9: Schedule supports 60 days
  it("supports 60 days schedule with trailing empty review days", () => {
    const res = allocateStudySchedule({ daysAvailable: 60, requirements: reqs, questions });
    expect(res.schedule.days).toHaveLength(60);
    expect(res.schedule.days[0].question_ids).toEqual(["q-must-hard"]);
    expect(res.schedule.days[4].question_ids).toEqual(["q-dangling"]);
    expect(res.schedule.days[5].question_ids).toEqual([]);
    expect(res.schedule.days[5].focus).toBe("Review and practice");
    expect(res.schedule.days[59].focus).toBe("Review and practice");
    expect(res.schedule.days[59].day).toBe(60);
  });

  // Test 10: Empty days receive “Review and practice” and default integer minutes
  it("assigns empty days the 'Review and practice' focus and default 15 minutes", () => {
    const res = allocateStudySchedule({ daysAvailable: 10, requirements: reqs, questions: [] });
    for (const day of res.schedule.days) {
      expect(day.focus).toBe("Review and practice");
      expect(day.minutes).toBe(15);
      expect(day.question_ids).toEqual([]);
    }
  });

  // Test 11: Non-empty day minutes equal difficulty-minute sum
  it("sums question minutes by difficulty for non-empty days", () => {
    // Default difficulty minutes: 1=10, 2=15, 3=20
    const res = allocateStudySchedule({ daysAvailable: 3, requirements: reqs, questions });

    // Day 1: q-must-hard (diff 3: 20) + q-nice-med (diff 2: 15) = 35 mins
    expect(res.schedule.days[0].minutes).toBe(35);

    // Day 2: q-must-easy (diff 1: 10) + q-dangling (diff 2: 15) = 25 mins
    expect(res.schedule.days[1].minutes).toBe(25);

    // Day 3: q-nice-hard (diff 3: 20) = 20 mins
    expect(res.schedule.days[2].minutes).toBe(20);
  });

  // Test 12: Custom minutesByDifficulty changes computed minutes
  it("allows custom minutesByDifficulty and emptyDayMinutes", () => {
    const res = allocateStudySchedule({
      daysAvailable: 2,
      requirements: reqs,
      questions: [questions[0]], // 1 question (difficulty 3)
      options: {
        minutesByDifficulty: { 1: 5, 2: 10, 3: 50 },
        emptyDayMinutes: 30,
      },
    });

    expect(res.schedule.days[0].minutes).toBe(50);
    expect(res.schedule.days[1].minutes).toBe(30);
  });

  // Test 13: Invalid daysAvailable throws
  it("throws for invalid daysAvailable", () => {
    expect(() =>
      allocateStudySchedule({ daysAvailable: 0, requirements: reqs, questions })
    ).toThrowError(/Invalid daysAvailable/);

    expect(() =>
      allocateStudySchedule({ daysAvailable: 61, requirements: reqs, questions })
    ).toThrowError(/Invalid daysAvailable/);

    expect(() =>
      allocateStudySchedule({ daysAvailable: 3.5, requirements: reqs, questions })
    ).toThrowError(/Invalid daysAvailable/);
  });

  // Test 14: Duplicate raw question IDs are scheduled only once
  it("schedules duplicate raw question IDs only once (first occurrence wins)", () => {
    const duplicatedQuestions: InterviewQuestion[] = [
      questions[0],
      { ...questions[0], prompt: "Duplicate q-must-hard" },
      questions[1],
    ];

    const res = allocateStudySchedule({
      daysAvailable: 2,
      requirements: reqs,
      questions: duplicatedQuestions,
    });

    expect(res.scheduledQuestionIds).toEqual(["q-must-hard", "q-must-easy"]);
    expect(res.schedule.days[0].question_ids).toEqual(["q-must-hard"]);
    expect(res.schedule.days[1].question_ids).toEqual(["q-must-easy"]);
  });

  // Test 15: Input arrays are not mutated
  it("does not mutate input requirements or questions", () => {
    const reqsClone = JSON.parse(JSON.stringify(reqs));
    const questionsClone = JSON.parse(JSON.stringify(questions));

    allocateStudySchedule({ daysAvailable: 3, requirements: reqs, questions });
    calculateQuestionSchedulingScores(reqs, questions);

    expect(reqs).toEqual(reqsClone);
    expect(questions).toEqual(questionsClone);
  });

  // Test 16: Repeated execution with same input returns deeply equal output
  it("returns strictly deterministic, deeply equal output for repeated runs", () => {
    const run1 = allocateStudySchedule({ daysAvailable: 4, requirements: reqs, questions });
    const run2 = allocateStudySchedule({ daysAvailable: 4, requirements: reqs, questions });
    expect(run1).toEqual(run2);
  });
});
