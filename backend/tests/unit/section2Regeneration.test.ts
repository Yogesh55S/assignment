import { describe, it, expect } from "vitest";
import {
  regenerateKitSection,
  isQuestionProtectedFromRegeneration,
  findNextQuestionSequence,
} from "../../src/services/generation/regenerationService.js";
import type { EditableInterviewPrepKit } from "@interview-prep/shared/types/editableKit";
import type { LlmClient } from "../../src/services/llm/types.js";

const MOCK_EDITABLE_KIT: EditableInterviewPrepKit = {
  source: {
    company: "Acme Corp",
    company_url: "https://acme.example.com",
    role: "Senior Engineer",
    location: "Remote",
    jd_chars: 500,
    researched_at: new Date().toISOString(),
    pages_used: [],
  },
  company_brief: {
    summary: "Acme summary",
    what_they_do: "Tech company",
    sources: [],
    _meta: { edited: false },
  },
  role: {
    title: "Senior Engineer",
    seniority: "Senior",
    responsibilities: ["Lead design"],
    requirements: [
      { id: "r1", text: "React knowledge", kind: "technical", priority: "must" },
      { id: "r2", text: "Communication", kind: "behavioural", priority: "must" },
    ],
  },
  questions: [
    {
      id: "q1",
      requirement_ids: ["r1"],
      category: "technical",
      prompt: "Explain React hooks lifecycle.",
      answer_outline: "Hooks outline",
      difficulty: 2,
      _meta: { origin: "user", edited: false, pinned: false },
    },
    {
      id: "q2",
      requirement_ids: ["r1"],
      category: "technical",
      prompt: "What is Virtual DOM?",
      answer_outline: "Virtual DOM outline",
      difficulty: 1,
      _meta: { origin: "generated", edited: true, pinned: false },
    },
    {
      id: "q3",
      requirement_ids: ["r1"],
      category: "technical",
      prompt: "Explain React Reconciliation.",
      answer_outline: "Reconciliation outline",
      difficulty: 3,
      _meta: { origin: "generated", edited: false, pinned: true },
    },
    {
      id: "q4",
      requirement_ids: ["r1"],
      category: "technical",
      prompt: "Unprotected technical q4 to be replaced.",
      answer_outline: "Old outline",
      difficulty: 1,
      _meta: { origin: "generated", edited: false, pinned: false },
    },
    {
      id: "q5",
      requirement_ids: ["r2"],
      category: "behavioural",
      prompt: "Describe a conflict resolution.",
      answer_outline: "STAR response outline",
      difficulty: 2,
      _meta: { origin: "generated", edited: false, pinned: false },
    },
  ],
  flashcards: [
    {
      id: "f1",
      front: "What is React hook?",
      back: "Function enabling state.",
      requirement_ids: ["r1"],
    },
  ],
  schedule: {
    days_available: 3,
    days: [
      { day: 1, focus: "React Focus", question_ids: ["q1", "q2"], minutes: 45 },
      { day: 2, focus: "Reconciliation", question_ids: ["q3", "q4"], minutes: 45 },
      { day: 3, focus: "Behavioural", question_ids: ["q5"], minutes: 30 },
    ],
  },
  coverage: {
    uncovered_requirement_ids: [],
    passes: 1,
  },
};

describe("Section 2: Category & Schedule Regeneration Verification", () => {
  it("isQuestionProtectedFromRegeneration returns true for user, edited, or pinned questions", () => {
    expect(isQuestionProtectedFromRegeneration(MOCK_EDITABLE_KIT.questions[0])).toBe(true); // origin = user
    expect(isQuestionProtectedFromRegeneration(MOCK_EDITABLE_KIT.questions[1])).toBe(true); // edited = true
    expect(isQuestionProtectedFromRegeneration(MOCK_EDITABLE_KIT.questions[2])).toBe(true); // pinned = true
    expect(isQuestionProtectedFromRegeneration(MOCK_EDITABLE_KIT.questions[3])).toBe(false); // unprotected
  });

  it("findNextQuestionSequence finds highest numeric suffix q5 -> 6", () => {
    const nextSeq = findNextQuestionSequence(MOCK_EDITABLE_KIT.questions);
    expect(nextSeq).toBe(6);
  });

  it("regenerates category questions preserving user, edited, pinned questions & other categories with new IDs starting at q6", async () => {
    const mockLlmClient: LlmClient = {
      generateJson: async () => {
        const data = {
          questions: [
            {
              requirement_ids: ["r1"],
              category: "technical" as const,
              prompt: "Newly generated React Server Components question?",
              answer_outline: "RSC answer outline",
              difficulty: 2,
            },
          ],
        };
        return {
          data,
          rawText: JSON.stringify(data),
        };
      },
    };

    const result = await regenerateKitSection({
      kit: MOCK_EDITABLE_KIT,
      section: "questions",
      category: "technical",
      llmClient: mockLlmClient,
    });

    const finalQuestions = result.kit.questions;

    // Preserved check: q1 (user), q2 (edited), q3 (pinned) must exist with unchanged IDs
    expect(finalQuestions.some((q) => q.id === "q1")).toBe(true);
    expect(finalQuestions.some((q) => q.id === "q2")).toBe(true);
    expect(finalQuestions.some((q) => q.id === "q3")).toBe(true);

    // Unprotected q4 should have been replaced
    expect(finalQuestions.some((q) => q.id === "q4")).toBe(false);

    // Other category q5 (behavioural) must remain unchanged
    const q5 = finalQuestions.find((q) => q.id === "q5");
    expect(q5).toBeDefined();
    expect(q5?.category).toBe("behavioural");

    // New generated question must get ID q6
    const newQ = finalQuestions.find((q) => q.id === "q6");
    expect(newQ).toBeDefined();
    expect(newQ?.prompt).toContain("React Server Components");

    // Flashcards must not be modified
    expect(result.kit.flashcards).toEqual(MOCK_EDITABLE_KIT.flashcards);
  });

  it("regenerates schedule deterministically without calling LLM", async () => {
    let llmCalled = false;
    const trackingLlmClient: LlmClient = {
      generateJson: async () => {
        llmCalled = true;
        throw new Error("LLM should not be called during schedule regeneration");
      },
    };

    const result = await regenerateKitSection({
      kit: MOCK_EDITABLE_KIT,
      section: "schedule",
      llmClient: trackingLlmClient,
    });

    expect(llmCalled).toBe(false);
    expect(result.kit.schedule.days_available).toBe(3);
    expect(result.kit.schedule.days.length).toBe(3);
    expect(result.kit.questions).toEqual(MOCK_EDITABLE_KIT.questions);
    expect(result.kit.flashcards).toEqual(MOCK_EDITABLE_KIT.flashcards);

    // Minutes must be non-negative integers
    for (const day of result.kit.schedule.days) {
      expect(Number.isInteger(day.minutes)).toBe(true);
      expect(day.minutes).toBeGreaterThanOrEqual(0);
    }
  });

  it("regenerate schedule works for 1 day and 60 days limits", async () => {
    const kit1Day: EditableInterviewPrepKit = {
      ...MOCK_EDITABLE_KIT,
      schedule: { days_available: 1, days: [] },
    };

    const result1Day = await regenerateKitSection({
      kit: kit1Day,
      section: "schedule",
    });

    expect(result1Day.kit.schedule.days_available).toBe(1);
    expect(result1Day.kit.schedule.days.length).toBe(1);

    const kit60Days: EditableInterviewPrepKit = {
      ...MOCK_EDITABLE_KIT,
      schedule: { days_available: 60, days: [] },
    };

    const result60Days = await regenerateKitSection({
      kit: kit60Days,
      section: "schedule",
    });

    expect(result60Days.kit.schedule.days_available).toBe(60);
    expect(result60Days.kit.schedule.days.length).toBe(60);
  });
});
