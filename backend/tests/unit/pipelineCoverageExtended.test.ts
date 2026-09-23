import { describe, it, expect } from "vitest";
import { assignQuestionIds, assignFlashcardIds } from "../../src/utils/stableIds.js";
import { stripInternalKitMetadata } from "@interview-prep/shared/validators/editableKitSchema";

describe("Core Generation Pipeline - Extended Verification (Part 5 Requirements)", () => {
  it("assigns stable sequential IDs q1, q2 to generated question drafts in code", () => {
    const questions = assignQuestionIds([
      { requirement_ids: ["r1"], category: "technical", prompt: "Prompt 1", answer_outline: "Outline 1", difficulty: 1 },
      { requirement_ids: ["r2"], category: "behavioural", prompt: "Prompt 2", answer_outline: "Outline 2", difficulty: 2 },
    ]);

    expect(questions[0].id).toBe("q1");
    expect(questions[1].id).toBe("q2");
  });

  it("assigns stable sequential IDs f1, f2 to generated flashcards in code", () => {
    const flashcards = assignFlashcardIds([
      { front: "Front 1", back: "Back 1", requirement_ids: ["r1"] },
      { front: "Front 2", back: "Back 2", requirement_ids: ["r2"] },
    ]);

    expect(flashcards[0].id).toBe("f1");
    expect(flashcards[1].id).toBe("f2");
  });

  it("strips internal _meta fields from company_brief, questions, and flashcards", () => {
    const kitWithMeta = {
      source: {
        company: "Acme",
        company_url: "https://acme.com",
        role: "Engineer",
        location: "Remote",
        jd_chars: 100,
        researched_at: new Date().toISOString(),
        pages_used: [],
      },
      company_brief: { summary: "Brief", what_they_do: "Tech", sources: [], _meta: { edited: true } },
      role: { title: "Engineer", seniority: "Senior", responsibilities: [], requirements: [] },
      questions: [
        {
          id: "q1",
          requirement_ids: [],
          category: "technical",
          prompt: "Q1",
          answer_outline: "A1",
          difficulty: 1,
          _meta: { origin: "generated", edited: false, pinned: false },
        },
      ],
      flashcards: [
        {
          id: "f1",
          front: "F1",
          back: "B1",
          requirement_ids: [],
          _meta: { origin: "generated", edited: false },
        },
      ],
      schedule: { days_available: 1, days: [{ day: 1, focus: "Focus", question_ids: ["q1"], minutes: 30 }] },
      coverage: { uncovered_requirement_ids: [], passes: 1 },
    };

    const stripped = stripInternalKitMetadata(kitWithMeta as any);
    expect((stripped.company_brief as any)._meta).toBeUndefined();
    expect((stripped.questions[0] as any)._meta).toBeUndefined();
    expect((stripped.flashcards[0] as any)._meta).toBeUndefined();
  });
});
