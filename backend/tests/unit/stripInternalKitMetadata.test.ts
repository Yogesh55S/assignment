import { describe, it, expect } from "vitest";
import { stripInternalKitMetadata } from "@interview-prep/shared/validators/editableKitSchema";
import { validateInterviewPrepKit } from "@interview-prep/shared/validators/kitSchema";
import type { EditableInterviewPrepKit } from "@interview-prep/shared/types/editableKit";

describe("stripInternalKitMetadata", () => {
  const sampleKit: EditableInterviewPrepKit = {
    source: {
      company: "Acme Corp",
      company_url: "https://acme.com",
      role: "Backend Engineer",
      location: "Remote",
      jd_chars: 1000,
      researched_at: "2026-09-22T12:00:00.000Z",
      pages_used: ["https://acme.com"],
    },
    company_brief: {
      summary: "Acme is a tech company.",
      what_they_do: "They build cloud software.",
      sources: ["https://acme.com"],
      _meta: {
        edited: true,
        updatedAt: "2026-09-22T13:00:00.000Z",
      },
    },
    role: {
      title: "Backend Engineer",
      seniority: "Mid",
      responsibilities: ["Code in TypeScript"],
      requirements: [
        {
          id: "r1",
          text: "TypeScript proficiency",
          kind: "technical",
          priority: "must",
        },
      ],
    },
    questions: [
      {
        id: "q1",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "Explain generic constraints in TypeScript.",
        answer_outline: "Explain extends keyword and narrowing.",
        difficulty: 2,
        _meta: {
          origin: "user",
          edited: true,
          pinned: true,
        },
      },
    ],
    flashcards: [
      {
        id: "f1",
        front: "What is unknown vs any in TypeScript?",
        back: "unknown is type-safe counterpart of any.",
        requirement_ids: ["r1"],
        _meta: {
          origin: "generated",
          edited: false,
        },
      },
    ],
    schedule: {
      days_available: 1,
      days: [
        {
          day: 1,
          focus: "TypeScript Generics",
          question_ids: ["q1"],
          minutes: 15,
        },
      ],
    },
    coverage: {
      uncovered_requirement_ids: [],
      passes: 1,
    },
  };

  it("removes _meta from company_brief, questions, and flashcards", () => {
    const stripped = stripInternalKitMetadata(sampleKit);

    expect("_meta" in stripped.company_brief).toBe(false);
    expect("_meta" in stripped.questions[0]).toBe(false);
    expect("_meta" in stripped.flashcards[0]).toBe(false);
  });

  it("does not mutate the original input kit", () => {
    const kitCopy = JSON.parse(JSON.stringify(sampleKit));
    stripInternalKitMetadata(sampleKit);

    expect(sampleKit).toEqual(kitCopy);
    expect(sampleKit.company_brief._meta?.edited).toBe(true);
    expect(sampleKit.questions[0]._meta?.pinned).toBe(true);
  });

  it("produces output that strictly passes validateInterviewPrepKit()", () => {
    const stripped = stripInternalKitMetadata(sampleKit);
    expect(() => validateInterviewPrepKit(stripped)).not.toThrow();
  });
});
