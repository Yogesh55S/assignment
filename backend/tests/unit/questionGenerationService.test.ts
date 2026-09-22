import { describe, it, expect } from "vitest";
import {
  categoryForRequirement,
  generateQuestionsForCategory,
  generateQuestionsForRequirementGaps,
} from "../../src/services/generation/questionGenerationService.js";
import type { Requirement } from "@interview-prep/shared/types/kit";
import type { LlmClient, LlmJsonRequest, LlmJsonResponse } from "../../src/services/llm/types.js";
import type { CompanyResearchResult } from "../../src/services/research/types.js";
import type { InterviewDiscussionResult } from "../../src/services/generation/interviewDiscussionService.js";

const emptyResearch: CompanyResearchResult = {
  inputUrl: "https://acme.com",
  normalizedCompanyUrl: "https://acme.com",
  pages: [],
  rankedLinks: [],
  pagesUsed: [],
  hiringPageUrls: [],
  warnings: [],
  robots: { robotsUrl: "", fetched: false, allowed: true, disallowRules: [], warnings: [] },
  completed: true,
};

const emptyDiscussion: InterviewDiscussionResult = {
  sources: [],
  warnings: [],
};

function createMockLlmClient(returnData: unknown): LlmClient {
  return {
    async generateJson<T>(_request: LlmJsonRequest): Promise<LlmJsonResponse<T>> {
      return {
        data: returnData as T,
        rawText: JSON.stringify(returnData),
        model: "mock-gemini",
      };
    },
  };
}

describe("Question Generation Service", () => {
  it("maps requirements to the appropriate question categories", () => {
    const techReq: Requirement = { id: "r1", text: "Go", kind: "technical", priority: "must" };
    const behavReq: Requirement = { id: "r2", text: "Leadership", kind: "behavioural", priority: "nice" };
    const domainReq: Requirement = { id: "r3", text: "Fintech", kind: "domain", priority: "must" };

    expect(categoryForRequirement(techReq)).toBe("technical");
    expect(categoryForRequirement(behavReq)).toBe("behavioural");
    expect(categoryForRequirement(domainReq)).toBe("company-fit");
  });

  it("strips invalid requirement IDs and drops questions with no valid requirement references", async () => {
    const reqs: Requirement[] = [
      { id: "r1", text: "React", kind: "technical", priority: "must" },
      { id: "r2", text: "TypeScript", kind: "technical", priority: "must" },
    ];

    const mockOutput = {
      questions: [
        {
          requirement_ids: ["r1", "non-existent-r99"],
          category: "technical",
          prompt: "How does React reconciliation work?",
          answer_outline: "Covers virtual DOM and fiber tree diffing",
          difficulty: 2,
        },
        {
          requirement_ids: ["invalid-id-only"],
          category: "technical",
          prompt: "What is CSS Grid?",
          answer_outline: "Two dimensional layout system",
          difficulty: 1,
        },
      ],
    };

    const client = createMockLlmClient(mockOutput);
    const drafts = await generateQuestionsForCategory({
      category: "technical",
      requirements: reqs,
      research: emptyResearch,
      interviewDiscussion: emptyDiscussion,
      llmClient: client,
    });

    expect(drafts).toHaveLength(1);
    expect(drafts[0].prompt).toBe("How does React reconciliation work?");
    expect(drafts[0].requirement_ids).toEqual(["r1"]); // non-existent-r99 stripped
  });

  it("strictly enforces the requested category even if model returns another", async () => {
    const reqs: Requirement[] = [
      { id: "r1", text: "Collaboration", kind: "behavioural", priority: "must" },
    ];

    const mockOutput = {
      questions: [
        {
          requirement_ids: ["r1"],
          category: "technical", // Model tried to change it
          prompt: "Tell me about a time you handled a difficult stakeholder.",
          answer_outline: "STAR response format",
          difficulty: 2,
        },
      ],
    };

    const client = createMockLlmClient(mockOutput);
    const drafts = await generateQuestionsForCategory({
      category: "behavioural",
      requirements: reqs,
      research: emptyResearch,
      interviewDiscussion: emptyDiscussion,
      llmClient: client,
    });

    expect(drafts[0].category).toBe("behavioural");
  });

  it("deduplicates questions with identical prompts", async () => {
    const reqs: Requirement[] = [
      { id: "r1", text: "SQL", kind: "technical", priority: "must" },
    ];

    const mockOutput = {
      questions: [
        {
          requirement_ids: ["r1"],
          category: "technical",
          prompt: "Explain SQL indexing tradeoffs.",
          answer_outline: "Faster reads vs slower writes",
          difficulty: 2,
        },
        {
          requirement_ids: ["r1"],
          category: "technical",
          prompt: "Explain SQL indexing tradeoffs.", // duplicate
          answer_outline: "Duplicate answer outline",
          difficulty: 2,
        },
      ],
    };

    const client = createMockLlmClient(mockOutput);
    const drafts = await generateQuestionsForCategory({
      category: "technical",
      requirements: reqs,
      research: emptyResearch,
      interviewDiscussion: emptyDiscussion,
      llmClient: client,
    });

    expect(drafts).toHaveLength(1);
  });

  it("returns empty drafts immediately if requirements list is empty", async () => {
    const client = createMockLlmClient({});
    const drafts = await generateQuestionsForCategory({
      category: "technical",
      requirements: [],
      research: emptyResearch,
      interviewDiscussion: emptyDiscussion,
      llmClient: client,
    });

    expect(drafts).toEqual([]);
  });

  it("generates targeted repair questions for uncovered mandatory requirements", async () => {
    const missingMustReqs: Requirement[] = [
      { id: "r3", text: "Kafka streaming pipelines", kind: "technical", priority: "must" },
    ];

    const mockOutput = {
      questions: [
        {
          requirement_ids: ["r3"],
          category: "technical",
          prompt: "Describe how Kafka guarantees message ordering within partitions.",
          answer_outline: "Partition keying, consumer offset tracking",
          difficulty: 3,
        },
      ],
    };

    const client = createMockLlmClient(mockOutput);
    const drafts = await generateQuestionsForRequirementGaps({
      requirements: missingMustReqs,
      research: emptyResearch,
      interviewDiscussion: emptyDiscussion,
      llmClient: client,
    });

    expect(drafts).toHaveLength(1);
    expect(drafts[0].requirement_ids).toContain("r3");
  });
});
