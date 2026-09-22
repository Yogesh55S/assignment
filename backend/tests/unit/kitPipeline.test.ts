import { describe, it, expect } from "vitest";
import { generateInterviewPrepKit } from "../../src/services/generation/kitPipeline.js";
import { validateInterviewPrepKit } from "@interview-prep/shared/validators/kitSchema";
import type { LlmClient, LlmJsonRequest, LlmJsonResponse } from "../../src/services/llm/types.js";
import type { CompanyResearchResult } from "../../src/services/research/types.js";
import type { GenerationProgressEvent } from "../../src/services/generation/generationTypes.js";

function createPipelineMockLlm(options?: {
  omitMustCoverageInFirstPass?: boolean;
  isThinJd?: boolean;
}): LlmClient {
  return {
    async generateJson<T>(request: LlmJsonRequest): Promise<LlmJsonResponse<T>> {
      const name = request.schemaName;

      if (name === "extracted_role_requirements") {
        if (options?.isThinJd) {
          return {
            data: {
              title: "Unknown Role",
              seniority: "Not specified",
              location: "Not specified",
              responsibilities: [],
              requirements: [],
              extraction_note: "Thin JD",
            } as T,
            rawText: "{}",
            model: "mock-model",
          };
        }
        return {
          data: {
            title: "Full Stack Engineer",
            seniority: "Senior",
            location: "Remote",
            responsibilities: ["Develop user-facing features", "Architect APIs"],
            requirements: [
              { text: "TypeScript and Node.js", kind: "technical", priority: "must" },
              { text: "PostgreSQL and Database Indexing", kind: "technical", priority: "must" },
              { text: "Cross-functional collaboration", kind: "behavioural", priority: "nice" },
            ],
            extraction_note: "Extracted all competencies.",
          } as T,
          rawText: "{}",
          model: "mock-model",
        };
      }

      if (name === "company_brief") {
        return {
          data: {
            summary: "Acme is a technology leader building cloud infrastructure.",
            what_they_do: "Cloud software, developer APIs, and monitoring tools.",
            sources: ["https://acme.com", "https://acme.com/about"],
          } as T,
          rawText: "{}",
          model: "mock-model",
        };
      }

      if (name.startsWith("questions_technical")) {
        const reqIds = options?.omitMustCoverageInFirstPass ? ["r1"] : ["r1", "r2"];
        return {
          data: {
            questions: [
              {
                requirement_ids: reqIds,
                category: "technical",
                prompt: "Explain how TypeScript interfaces differ from type aliases.",
                answer_outline: "Declaration merging, unions, and performance considerations.",
                difficulty: 2,
              },
            ],
          } as T,
          rawText: "{}",
          model: "mock-model",
        };
      }

      if (name.startsWith("questions_behavioural")) {
        return {
          data: {
            questions: [
              {
                requirement_ids: ["r3"],
                category: "behavioural",
                prompt: "Describe how you navigate conflicting priorities across teams.",
                answer_outline: "STAR methodology highlighting prioritization frameworks.",
                difficulty: 1,
              },
            ],
          } as T,
          rawText: "{}",
          model: "mock-model",
        };
      }

      if (name.startsWith("questions_system-design")) {
        const sysReqIds = options?.omitMustCoverageInFirstPass ? ["r1"] : ["r1", "r2"];
        return {
          data: {
            questions: [
              {
                requirement_ids: sysReqIds,
                category: "system-design",
                prompt: "Design a high-throughput webhook delivery service.",
                answer_outline: "Queue architectures, retry policies, backoff, deduplication.",
                difficulty: 3,
              },
            ],
          } as T,
          rawText: "{}",
          model: "mock-model",
        };
      }

      if (name === "gap_repair_questions") {
        return {
          data: {
            questions: [
              {
                requirement_ids: ["r2"],
                category: "technical",
                prompt: "How do B-tree indexes work in PostgreSQL under write-heavy loads?",
                answer_outline: "WAL, index page splits, fillfactor tuning.",
                difficulty: 3,
              },
            ],
          } as T,
          rawText: "{}",
          model: "mock-model",
        };
      }

      if (name === "flashcards_generation") {
        return {
          data: {
            flashcards: [
              {
                front: "What is B-tree index fillfactor?",
                back: "Percentage of space reserved on each page for future updates to avoid page splits.",
                requirement_ids: ["r2"],
              },
            ],
          } as T,
          rawText: "{}",
          model: "mock-model",
        };
      }

      return {
        data: {} as T,
        rawText: "{}",
        model: "mock-model",
      };
    },
  };
}

const mockResearchSuccess: CompanyResearchResult = {
  inputUrl: "https://acme.com",
  normalizedCompanyUrl: "https://acme.com/",
  companyHomepage: {
    url: "https://acme.com/",
    title: "Acme Corp",
    text: "Building cloud developer tools.",
    textLength: 30,
  },
  pages: [
    { url: "https://acme.com/", title: "Acme Corp", text: "Building cloud developer tools.", textLength: 30 },
    { url: "https://acme.com/about", title: "About Acme", text: "Our culture and mission.", textLength: 25 },
  ],
  rankedLinks: [],
  pagesUsed: ["https://acme.com/", "https://acme.com/about"],
  hiringPageUrls: ["https://acme.com/careers"],
  warnings: [],
  robots: { robotsUrl: "https://acme.com/robots.txt", fetched: true, allowed: true, disallowRules: [], warnings: [] },
  completed: true,
};

describe("Kit Generation Pipeline (kitPipeline.ts)", () => {
  it("generates a full valid kit that passes validateInterviewPrepKit", async () => {
    const mockLlm = createPipelineMockLlm();
    const progressEvents: GenerationProgressEvent[] = [];

    const result = await generateInterviewPrepKit(
      {
        jd: "Senior Full Stack Engineer with TypeScript, Node.js, and PostgreSQL expertise required.",
        companyUrl: "https://acme.com",
        days: 5,
      },
      {
        llmClient: mockLlm,
        research: async () => mockResearchSuccess,
        onProgress: (ev) => progressEvents.push(ev),
        now: () => new Date("2026-09-22T10:00:00.000Z"),
      }
    );

    expect(result.kit).toBeDefined();
    // Validate with shared Zod validator
    const validated = validateInterviewPrepKit(result.kit);
    expect(validated).toBeDefined();

    expect(result.kit.source.company).toBe("Acme Corp");
    expect(result.kit.schedule.days_available).toBe(5);
    expect(result.kit.schedule.days).toHaveLength(5);
    expect(result.kit.coverage.passes).toBe(1);
    expect(result.kit.coverage.uncovered_requirement_ids).toEqual([]);

    // Check monotonic progress
    expect(progressEvents.length).toBeGreaterThan(5);
    expect(progressEvents[0].stage).toBe("validating_input");
    expect(progressEvents[progressEvents.length - 1].stage).toBe("completed");
  });

  it("triggers targeted gap repair when must-have requirements are uncovered in first pass", async () => {
    const mockLlm = createPipelineMockLlm({ omitMustCoverageInFirstPass: true });

    const result = await generateInterviewPrepKit(
      {
        jd: "Senior Full Stack Engineer with TypeScript, Node.js, and PostgreSQL.",
        companyUrl: "https://acme.com",
        days: 3,
      },
      {
        llmClient: mockLlm,
        research: async () => mockResearchSuccess,
      }
    );

    expect(result.kit.coverage.passes).toBe(2);
    expect(result.kit.coverage.uncovered_requirement_ids).toEqual([]);
    // Ensure the repaired question covered r2
    const repairedQuestion = result.kit.questions.find((q) => q.requirement_ids.includes("r2"));
    expect(repairedQuestion).toBeDefined();
  });

  it("handles unreachable company research honestly and remains a valid kit", async () => {
    const unreachableResearch: CompanyResearchResult = {
      inputUrl: "https://acme.com",
      normalizedCompanyUrl: "https://acme.com/",
      pages: [],
      rankedLinks: [],
      pagesUsed: [],
      hiringPageUrls: [],
      warnings: [
        { code: "COMPANY_UNREACHABLE", message: "Homepage unreachable" },
      ],
      robots: { robotsUrl: "", fetched: false, allowed: true, disallowRules: [], warnings: [] },
      completed: false,
    };

    const mockLlm = createPipelineMockLlm();
    const result = await generateInterviewPrepKit(
      {
        jd: "Senior Engineer with TypeScript experience.",
        companyUrl: "https://acme.com",
        days: 4,
      },
      {
        llmClient: mockLlm,
        research: async () => unreachableResearch,
      }
    );

    expect(result.kit).toBeDefined();
    expect(validateInterviewPrepKit(result.kit)).toBeDefined();
    expect(result.kit.company_brief.sources).toEqual([]);
    expect(result.researchWarnings.some((w) => w.code === "COMPANY_UNREACHABLE")).toBe(true);
  });

  it("handles thin JD gracefully by producing a valid thin kit without inventing requirements", async () => {
    const mockLlm = createPipelineMockLlm({ isThinJd: true });

    const result = await generateInterviewPrepKit(
      {
        jd: "Developer job opening at Acme.",
        companyUrl: "https://acme.com",
        days: 2,
      },
      {
        llmClient: mockLlm,
        research: async () => mockResearchSuccess,
      }
    );

    expect(result.kit).toBeDefined();
    expect(result.kit.role.requirements).toHaveLength(0);
    expect(result.kit.questions).toHaveLength(0);
    expect(result.kit.flashcards).toHaveLength(0);
    expect(result.kit.schedule.days).toHaveLength(2); // review and practice days
    expect(result.kit.schedule.days[0].focus).toBe("Review and practice");
    expect(validateInterviewPrepKit(result.kit)).toBeDefined();
  });
});
