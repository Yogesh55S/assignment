import { describe, it, expect } from "vitest";
import {
  validateEditableInterviewPrepKit,
  editableInterviewPrepKitSchema,
  regenerateSectionSchema,
  stripInternalKitMetadata,
} from "@interview-prep/shared/validators/editableKitSchema";
import { validateInterviewPrepKit } from "@interview-prep/shared/validators/kitSchema";
import type { EditableInterviewPrepKit } from "@interview-prep/shared/types/editableKit";

function createValidBaseKit(): EditableInterviewPrepKit {
  return {
    source: {
      company: "Acme Corp",
      company_url: "https://acme.com",
      role: "Senior Backend Engineer",
      location: "San Francisco, CA",
      jd_chars: 1200,
      researched_at: "2026-09-22T10:00:00.000Z",
      pages_used: ["https://acme.com", "https://acme.com/careers"],
    },
    company_brief: {
      summary: "Acme Corp builds high-scale data infrastructure.",
      what_they_do: "They develop real-time analytics platforms.",
      sources: ["https://acme.com"],
      _meta: {
        edited: false,
      },
    },
    role: {
      title: "Senior Backend Engineer",
      seniority: "Senior",
      responsibilities: ["Build distributed systems", "Mentor junior engineers"],
      requirements: [
        {
          id: "r1",
          text: "Experience with Node.js and TypeScript",
          kind: "technical",
          priority: "must",
        },
        {
          id: "r2",
          text: "Mentorship and cross-functional leadership",
          kind: "behavioural",
          priority: "nice",
        },
      ],
    },
    questions: [
      {
        id: "q1",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "Explain event loop starvation in Node.js.",
        answer_outline: "Discuss microtask queues, process.nextTick, and unblocking the loop.",
        difficulty: 2,
        _meta: {
          origin: "generated",
          edited: false,
          pinned: false,
        },
      },
      {
        id: "q2",
        requirement_ids: ["r2"],
        category: "behavioural",
        prompt: "Tell me about a time you mentored an engineer through a challenging task.",
        answer_outline: "STAR approach highlighting empathy, coaching, and positive outcome.",
        difficulty: 1,
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
        front: "What is the order of phases in the Node.js event loop?",
        back: "timers, pending callbacks, idle/prepare, poll, check, close callbacks.",
        requirement_ids: ["r1"],
        _meta: {
          origin: "generated",
          edited: false,
        },
      },
    ],
    schedule: {
      days_available: 2,
      days: [
        {
          day: 1,
          focus: "Core Node.js technical concepts",
          question_ids: ["q1"],
          minutes: 15,
        },
        {
          day: 2,
          focus: "Leadership & behavioural practice",
          question_ids: ["q2"],
          minutes: 10,
        },
      ],
    },
    coverage: {
      uncovered_requirement_ids: [],
      passes: 1,
    },
  };
}

describe("Editable Kit Schema Validation", () => {
  it("validates an editable kit containing valid _meta fields", () => {
    const kit = createValidBaseKit();
    const validated = validateEditableInterviewPrepKit(kit);
    expect(validated.company_brief._meta?.edited).toBe(false);
    expect(validated.questions[0]._meta?.origin).toBe("generated");
    expect(validated.questions[1]._meta?.origin).toBe("user");
    expect(validated.questions[1]._meta?.pinned).toBe(true);
  });

  it("validates a kit without any _meta fields under both schemas", () => {
    const kit = createValidBaseKit();
    delete kit.company_brief._meta;
    delete kit.questions[0]._meta;
    delete kit.questions[1]._meta;
    delete kit.flashcards[0]._meta;

    expect(() => validateEditableInterviewPrepKit(kit)).not.toThrow();
    expect(() => validateInterviewPrepKit(kit)).not.toThrow();
  });

  it("rejects an invalid origin enum in question _meta", () => {
    const kit = createValidBaseKit();
    (kit.questions[0]._meta as any).origin = "ai-bot";

    expect(() => validateEditableInterviewPrepKit(kit)).toThrow();
  });

  it("validates regenerateSectionSchema requirements correctly", () => {
    // Questions requires category
    expect(() =>
      regenerateSectionSchema.parse({
        section: "questions",
        category: "technical",
      })
    ).not.toThrow();

    // Questions without category fails
    expect(() =>
      regenerateSectionSchema.parse({
        section: "questions",
      })
    ).toThrow();

    // Company brief with category fails
    expect(() =>
      regenerateSectionSchema.parse({
        section: "company_brief",
        category: "technical",
      })
    ).toThrow();

    // Schedule without category passes
    expect(() =>
      regenerateSectionSchema.parse({
        section: "schedule",
      })
    ).not.toThrow();
  });
});
