import { describe, it, expect } from "vitest";
import {
  regenerateKitSection,
  findNextQuestionSequence,
  isQuestionProtectedFromRegeneration,
} from "../../src/services/generation/regenerationService.js";
import type { LlmClient, LlmJsonRequest, LlmJsonResponse } from "../../src/services/llm/types.js";
import type { EditableInterviewPrepKit } from "@interview-prep/shared/types/editableKit";

function createFakeLlmClient(mockQuestions: any[] = []): LlmClient {
  return {
    async generateJson<T>(request: LlmJsonRequest): Promise<LlmJsonResponse<T>> {
      if (request.schemaName.startsWith("questions") || request.schemaName === "question_gaps") {
        return {
          data: { questions: mockQuestions } as unknown as T,
          rawText: JSON.stringify({ questions: mockQuestions }),
          model: "gemini-mock",
        };
      }
      if (request.schemaName === "company_brief" || request.schemaName === "companyBriefSchema") {
        const brief = {
          summary: "Newly regenerated company summary.",
          what_they_do: "Newly regenerated business description.",
          sources: ["https://example.com"],
        };
        return {
          data: brief as unknown as T,
          rawText: JSON.stringify(brief),
          model: "gemini-mock",
        };
      }
      return {
        data: {} as T,
        rawText: "{}",
        model: "gemini-mock",
      };
    },
  };
}

const fakeResearch = async (url: string) => ({
  inputUrl: url,
  normalizedCompanyUrl: url,
  completed: true,
  companyHomepage: {
    url,
    title: "Example Co",
    text: "Example company description with details.",
    textLength: 40,
  },
  pages: [
    {
      url,
      title: "Example Co",
      text: "Example company description with details.",
      textLength: 40,
    },
  ],
  rankedLinks: [],
  pagesUsed: ["https://example.com"],
  hiringPageUrls: [],
  warnings: [],
  robots: {
    robotsUrl: "",
    fetched: false,
    allowed: true,
    disallowRules: [],
    warnings: [],
  },
});

function createTestKit(): EditableInterviewPrepKit {
  return {
    source: {
      company: "Tech Co",
      company_url: "https://example.com",
      role: "Backend Engineer",
      location: "San Francisco, CA",
      jd_chars: 1000,
      researched_at: "2026-09-22T00:00:00.000Z",
      pages_used: ["https://example.com"],
    },
    company_brief: {
      summary: "Original summary.",
      what_they_do: "Original work.",
      sources: ["https://example.com"],
      _meta: {
        edited: true,
      },
    },
    role: {
      title: "Backend Engineer",
      seniority: "Mid",
      responsibilities: ["Develop APIs"],
      requirements: [
        {
          id: "r1",
          text: "Node.js and TypeScript",
          kind: "technical",
          priority: "must",
        },
        {
          id: "r2",
          text: "Collaboration and teamwork",
          kind: "behavioural",
          priority: "must",
        },
      ],
    },
    questions: [
      {
        id: "q1",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "Generated unedited technical question",
        answer_outline: "Outline 1",
        difficulty: 2,
        _meta: {
          origin: "generated",
          edited: false,
          pinned: false,
        },
      },
      {
        id: "q2",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "User created custom technical question",
        answer_outline: "Outline 2",
        difficulty: 3,
        _meta: {
          origin: "user",
          edited: true,
          pinned: true,
        },
      },
      {
        id: "q3",
        requirement_ids: ["r2"],
        category: "behavioural",
        prompt: "Behavioural question",
        answer_outline: "Outline 3",
        difficulty: 1,
        _meta: {
          origin: "generated",
          edited: false,
          pinned: false,
        },
      },
    ],
    flashcards: [
      {
        id: "f1",
        front: "Flashcard front",
        back: "Flashcard back",
        requirement_ids: ["r1"],
      },
    ],
    schedule: {
      days_available: 2,
      days: [
        {
          day: 1,
          focus: "Technical",
          question_ids: ["q1", "q2"],
          minutes: 35,
        },
        {
          day: 2,
          focus: "Behavioural",
          question_ids: ["q3"],
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

describe("Regeneration Service", () => {
  it("determines question protection rules correctly", () => {
    expect(
      isQuestionProtectedFromRegeneration({
        id: "q1",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "P",
        answer_outline: "A",
        difficulty: 1,
        _meta: { origin: "user", edited: false, pinned: false },
      })
    ).toBe(true);

    expect(
      isQuestionProtectedFromRegeneration({
        id: "q2",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "P",
        answer_outline: "A",
        difficulty: 1,
        _meta: { origin: "generated", edited: true, pinned: false },
      })
    ).toBe(true);

    expect(
      isQuestionProtectedFromRegeneration({
        id: "q3",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "P",
        answer_outline: "A",
        difficulty: 1,
        _meta: { origin: "generated", edited: false, pinned: true },
      })
    ).toBe(true);

    expect(
      isQuestionProtectedFromRegeneration({
        id: "q4",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "P",
        answer_outline: "A",
        difficulty: 1,
        _meta: { origin: "generated", edited: false, pinned: false },
      })
    ).toBe(false);
  });

  it("calculates next sequential question ID accurately", () => {
    const kit = createTestKit();
    expect(findNextQuestionSequence(kit.questions)).toBe(4);
  });

  it("preserves user-created questions and replaces unedited questions in category regeneration", async () => {
    const kit = createTestKit();
    const fakeClient = createFakeLlmClient([
      {
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "Freshly generated Node question",
        answer_outline: "Fresh outline",
        difficulty: 2,
      },
    ]);

    const result = await regenerateKitSection({
      kit,
      section: "questions",
      category: "technical",
      llmClient: fakeClient,
      research: fakeResearch as any,
    });

    // q1 (generated, unedited) should be replaced
    const questionIds = result.kit.questions.map((q) => q.id);
    expect(questionIds).not.toContain("q1");

    // q2 (user, pinned) must be preserved
    expect(questionIds).toContain("q2");
    const preservedQ2 = result.kit.questions.find((q) => q.id === "q2");
    expect(preservedQ2?.prompt).toBe("User created custom technical question");

    // q3 (behavioural, other category) must be preserved
    expect(questionIds).toContain("q3");

    // New question should have sequential ID continuing after q3 -> q4
    expect(questionIds).toContain("q4");
    expect(result.regeneratedCount).toBe(1);
    expect(result.preservedCount).toBe(1);

    // Schedule should be rebuilt with valid question IDs
    const scheduleQuestionIds = result.kit.schedule.days.flatMap((d) => d.question_ids);
    for (const sqId of scheduleQuestionIds) {
      expect(questionIds).toContain(sqId);
    }
  });

  it("preserves edited company brief by default and replaces it when replaceEdited is true", async () => {
    const kit = createTestKit();
    const fakeClient = createFakeLlmClient();

    // Default: preserves edited brief
    const defaultResult = await regenerateKitSection({
      kit,
      section: "company_brief",
      llmClient: fakeClient,
      research: fakeResearch as any,
    });

    expect(defaultResult.preservedEditedContent).toBe(true);
    expect(defaultResult.kit.company_brief.summary).toBe("Original summary.");

    // Explicit override: replaces edited brief
    const overrideResult = await regenerateKitSection({
      kit,
      section: "company_brief",
      replaceEdited: true,
      llmClient: fakeClient,
      research: fakeResearch as any,
    });

    expect(overrideResult.preservedEditedContent).toBe(false);
    expect(overrideResult.kit.company_brief.summary).toBe("Newly regenerated company summary.");
    expect(overrideResult.kit.company_brief._meta?.edited).toBe(false);
  });

  it("regenerates schedule without altering question or brief content and without calling LLM", async () => {
    const kit = createTestKit();
    let llmCalled = false;
    const trackingLlm: LlmClient = {
      async generateJson() {
        llmCalled = true;
        throw new Error("LLM should not be called for schedule regeneration");
      },
    };

    const result = await regenerateKitSection({
      kit,
      section: "schedule",
      llmClient: trackingLlm,
    });

    expect(llmCalled).toBe(false);
    expect(result.kit.schedule.days.length).toBe(kit.schedule.days_available);
    expect(result.kit.questions).toEqual(kit.questions);
    expect(result.kit.company_brief).toEqual(kit.company_brief);
  });
});
