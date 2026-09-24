import { describe, it, expect } from "vitest";
import { extractRoleFromJobDescription } from "../../src/services/generation/requirementExtractionService.js";
import type { LlmClient } from "../../src/services/llm/types.js";

const DETAILED_JD_FIXTURE = `
Senior Full-Stack Engineer

About the Role:
We are looking for a Senior Full-Stack Engineer. You must have strong hands-on experience with React, Node.js, and MongoDB.

Key Responsibilities:
- Mentoring junior engineers and leading technical design reviews.
- Building scalable backend microservices and modern frontend UIs.

Requirements (Must Have):
- Required: Proficiency in React, Node.js, and MongoDB.
- Required: Experience mentoring junior engineers and leading code reviews.

Nice to Have:
- Preferred: Knowledge of fintech domain and payment processing workflows.
- Bonus: Experience with AWS cloud infrastructure.
`;

const THIN_JD_FIXTURE = `Need a web dev.`;

describe("Requirement Extraction Quality & Safeguards", () => {
  it("extracts role title, requirement kinds, priorities, and stable IDs from detailed JD fixture", async () => {
    const mockLlmClient: LlmClient = {
      generateJson: async () => ({
        data: {
          title: "Senior Full-Stack Engineer",
          seniority: "Senior",
          location: "Not specified",
          responsibilities: [
            "Mentoring junior engineers and leading technical design reviews.",
            "Building scalable backend microservices and modern frontend UIs.",
          ],
          requirements: [
            { text: "React experience", kind: "technical", priority: "must" },
            { text: "Node.js proficiency", kind: "technical", priority: "must" },
            { text: "MongoDB database design", kind: "technical", priority: "must" },
            { text: "Mentoring junior engineers", kind: "behavioural", priority: "must" },
            { text: "Fintech domain knowledge", kind: "domain", priority: "nice" },
            { text: "AWS cloud experience", kind: "technical", priority: "nice" },
            { text: "React experience", kind: "technical", priority: "must" },
          ],
          extraction_note: "Extracted 6 distinct requirements.",
        },
      }),
    };

    const result = await extractRoleFromJobDescription(DETAILED_JD_FIXTURE, {
      llmClient: mockLlmClient,
    });

    expect(result.title).toBe("Senior Full-Stack Engineer");

    const reactReq = result.requirements.find((r) => r.text.includes("React"));
    expect(reactReq).toBeDefined();
    expect(reactReq?.kind).toBe("technical");
    expect(reactReq?.priority).toBe("must");

    const nodeReq = result.requirements.find((r) => r.text.includes("Node.js"));
    expect(nodeReq).toBeDefined();
    expect(nodeReq?.kind).toBe("technical");
    expect(nodeReq?.priority).toBe("must");

    const mongoReq = result.requirements.find((r) => r.text.includes("MongoDB"));
    expect(mongoReq).toBeDefined();
    expect(mongoReq?.kind).toBe("technical");
    expect(mongoReq?.priority).toBe("must");

    const mentorReq = result.requirements.find((r) => r.text.includes("Mentoring"));
    expect(mentorReq).toBeDefined();
    expect(mentorReq?.kind).toBe("behavioural");
    expect(mentorReq?.priority).toBe("must");

    const fintechReq = result.requirements.find((r) => r.text.includes("Fintech"));
    expect(fintechReq).toBeDefined();
    expect(fintechReq?.kind).toBe("domain");
    expect(fintechReq?.priority).toBe("nice");

    const awsReq = result.requirements.find((r) => r.text.includes("AWS"));
    expect(awsReq).toBeDefined();
    expect(awsReq?.kind).toBe("technical");
    expect(awsReq?.priority).toBe("nice");

    const unmentioned = result.requirements.filter((r) =>
      /docker|kubernetes|python/i.test(r.text)
    );
    expect(unmentioned.length).toBe(0);

    expect(result.requirements[0].id).toBe("r1");
    expect(result.requirements[1].id).toBe("r2");

    const reactCount = result.requirements.filter((r) => r.text.includes("React")).length;
    expect(reactCount).toBe(1);
  });

  it("handles thin JD gracefully without inventing requirements", async () => {
    const mockLlmClient: LlmClient = {
      generateJson: async () => ({
        data: {
          title: "Web Developer",
          seniority: "Not specified",
          location: "Not specified",
          responsibilities: [],
          requirements: [],
          extraction_note: "Thin job description provided.",
        },
      }),
    };

    const result = await extractRoleFromJobDescription(THIN_JD_FIXTURE, {
      llmClient: mockLlmClient,
    });

    expect(result.requirements).toEqual([]);
    expect(result.extractionNote).toBeDefined();
  });
});
