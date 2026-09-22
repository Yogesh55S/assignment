import { describe, it, expect } from "vitest";
import {
  interviewPrepKitSchema,
  validateInterviewPrepKit,
} from "@interview-prep/shared/validators/kitSchema";
import type { InterviewPrepKit } from "@interview-prep/shared/types/kit";

describe("Interview Prep Kit Validation Schema", () => {
  const getMinimalValidKit = (): InterviewPrepKit => ({
    source: {
      company: "Acme Corp",
      company_url: "https://example.com",
      role: "Senior Backend Engineer",
      location: "Remote",
      jd_chars: 1200,
      researched_at: "2026-09-22T12:00:00.000Z",
      pages_used: ["https://example.com/about"],
    },
    company_brief: {
      summary: "Acme builds scalable cloud software.",
      what_they_do: "Enterprise SaaS and cloud infrastructure.",
      sources: ["https://example.com"],
    },
    role: {
      title: "Senior Backend Engineer",
      seniority: "Senior",
      responsibilities: ["Design scalable APIs", "Maintain microservices"],
      requirements: [
        {
          id: "req-1",
          text: "Experience with TypeScript and Node.js",
          kind: "technical",
          priority: "must",
        },
      ],
    },
    questions: [
      {
        id: "q-1",
        requirement_ids: ["req-1"],
        category: "technical",
        prompt: "Explain the Node.js event loop and how asynchronous I/O is handled.",
        answer_outline: "Discuss libuv, call stack, microtask queue, macrotask queue.",
        difficulty: 2,
      },
    ],
    flashcards: [
      {
        id: "fc-1",
        front: "What is event-driven architecture?",
        back: "A software design pattern where decoupled components communicate through event emission.",
        requirement_ids: ["req-1"],
      },
    ],
    schedule: {
      days_available: 1,
      days: [
        {
          day: 1,
          focus: "Core Node.js Concurrency",
          question_ids: ["q-1"],
          minutes: 45,
        },
      ],
    },
    coverage: {
      uncovered_requirement_ids: [],
      passes: 1,
    },
  });

  // Test 1: Accepts minimal valid kit
  it("accepts a valid minimal kit with exactly one requirement, one question, one flashcard, one schedule day", () => {
    const validKit = getMinimalValidKit();
    const result = validateInterviewPrepKit(validKit);
    expect(result).toBeDefined();
    expect(result.source.company).toBe("Acme Corp");
    expect(result.role.requirements).toHaveLength(1);
    expect(result.questions).toHaveLength(1);
    expect(result.flashcards).toHaveLength(1);
    expect(result.schedule.days).toHaveLength(1);
  });

  // Test 2: Rejects question with difficulty 4
  it("rejects a question with difficulty 4", () => {
    const kit = getMinimalValidKit();
    (kit.questions[0] as any).difficulty = 4;

    expect(() => validateInterviewPrepKit(kit)).toThrowError();
    const parsed = interviewPrepKitSchema.safeParse(kit);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issue = parsed.error.issues.find(
        (i) => i.path.includes("questions") && i.path.includes("difficulty")
      );
      expect(issue).toBeDefined();
    }
  });

  // Test 3: Rejects schedule with floating point minutes
  it("rejects a schedule with floating point minutes", () => {
    const kit = getMinimalValidKit();
    (kit.schedule.days[0] as any).minutes = 45.5;

    expect(() => validateInterviewPrepKit(kit)).toThrowError();
    const parsed = interviewPrepKitSchema.safeParse(kit);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issue = parsed.error.issues.find(
        (i) => i.path.includes("schedule") && i.path.includes("minutes")
      );
      expect(issue).toBeDefined();
    }
  });

  // Test 4: Rejects question reference to a missing requirement
  it("rejects a question reference to a missing requirement", () => {
    const kit = getMinimalValidKit();
    kit.questions[0].requirement_ids = ["req-non-existent"];

    expect(() => validateInterviewPrepKit(kit)).toThrowError();
    const parsed = interviewPrepKitSchema.safeParse(kit);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issue = parsed.error.issues.find(
        (i) => i.message.includes("references non-existent requirement ID")
      );
      expect(issue).toBeDefined();
    }
  });

  // Test 5: Rejects schedule question ID that does not exist
  it("rejects a schedule question ID that does not exist", () => {
    const kit = getMinimalValidKit();
    kit.schedule.days[0].question_ids = ["q-unknown"];

    expect(() => validateInterviewPrepKit(kit)).toThrowError();
    const parsed = interviewPrepKitSchema.safeParse(kit);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issue = parsed.error.issues.find(
        (i) => i.message.includes("references non-existent question ID")
      );
      expect(issue).toBeDefined();
    }
  });

  // Test 6: Rejects schedule whose days count differs from days_available
  it("rejects a schedule whose days count differs from days_available", () => {
    const kit = getMinimalValidKit();
    kit.schedule.days_available = 2; // But schedule.days only has 1 day

    expect(() => validateInterviewPrepKit(kit)).toThrowError();
    const parsed = interviewPrepKitSchema.safeParse(kit);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issue = parsed.error.issues.find(
        (i) => i.message.includes("must equal schedule.days_available")
      );
      expect(issue).toBeDefined();
    }
  });
});
