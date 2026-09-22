import { describe, it, expect } from "vitest";
import {
  assignRequirementIds,
  assignQuestionIds,
  assignFlashcardIds,
} from "../../src/utils/stableIds.js";

describe("Stable ID Generation", () => {
  it("generates sequential requirement IDs starting at r1", () => {
    const input = [
      { text: "TypeScript expertise", kind: "technical" as const, priority: "must" as const },
      { text: "Team collaboration", kind: "behavioural" as const, priority: "nice" as const },
    ];
    const result = assignRequirementIds(input);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "r1",
      text: "TypeScript expertise",
      kind: "technical",
      priority: "must",
    });
    expect(result[1]).toEqual({
      id: "r2",
      text: "Team collaboration",
      kind: "behavioural",
      priority: "nice",
    });
  });

  it("generates sequential question IDs starting at q1 or custom offset", () => {
    const questions = [
      {
        requirement_ids: ["r1", "r2"],
        category: "technical" as const,
        prompt: "Explain event loop in Node.js",
        answer_outline: "Covers call stack, libuv, microtask queue",
        difficulty: 2 as const,
      },
      {
        requirement_ids: ["r2"],
        category: "behavioural" as const,
        prompt: "Tell me about a time you handled conflict",
        answer_outline: "STAR response",
        difficulty: 1 as const,
      },
    ];

    const normal = assignQuestionIds(questions);
    expect(normal[0].id).toBe("q1");
    expect(normal[1].id).toBe("q2");

    const offset = assignQuestionIds(questions, 5);
    expect(offset[0].id).toBe("q5");
    expect(offset[1].id).toBe("q6");
  });

  it("generates sequential flashcard IDs starting at f1 or custom offset", () => {
    const cards = [
      { front: "What is an idempotent API?", back: "Same result on repeat calls", requirement_ids: ["r1"] },
      { front: "CAP theorem stands for?", back: "Consistency, Availability, Partition tolerance", requirement_ids: ["r1"] },
    ];

    const normal = assignFlashcardIds(cards);
    expect(normal[0].id).toBe("f1");
    expect(normal[1].id).toBe("f2");

    const offset = assignFlashcardIds(cards, 10);
    expect(offset[0].id).toBe("f10");
    expect(offset[1].id).toBe("f11");
  });

  it("deduplicates requirement reference IDs while preserving order", () => {
    const questions = [
      {
        requirement_ids: ["r1", "r2", "r1", "r3", "r2"],
        category: "technical" as const,
        prompt: "Sample question prompt here",
        answer_outline: "Sample answer outline here",
        difficulty: 2 as const,
      },
    ];

    const assigned = assignQuestionIds(questions);
    expect(assigned[0].requirement_ids).toEqual(["r1", "r2", "r3"]);
  });

  it("does not mutate original input arrays or objects", () => {
    const inputReqs = [
      { text: "Docker experience", kind: "technical" as const, priority: "must" as const },
    ];
    const frozenInput = Object.freeze([...inputReqs]);

    const result = assignRequirementIds(frozenInput as any);
    expect(result[0].id).toBe("r1");
    expect((inputReqs[0] as any).id).toBeUndefined();
  });
});
