import { describe, it, expect } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { parseCliArgs, runEvaluation } from "../../src/scripts/evaluate.js";
import type { GeneratedKitResult } from "../../src/services/generation/generationTypes.js";
import type { InterviewPrepKit } from "@interview-prep/shared/types/kit";

const sampleValidKit: InterviewPrepKit = {
  source: {
    company: "Acme",
    company_url: "https://acme.com",
    role: "Backend Engineer",
    location: "Remote",
    jd_chars: 100,
    researched_at: "2026-09-22T00:00:00.000Z",
    pages_used: ["https://acme.com"],
  },
  company_brief: {
    summary: "Acme builds APIs.",
    what_they_do: "Cloud software.",
    sources: ["https://acme.com"],
  },
  role: {
    title: "Backend Engineer",
    seniority: "Mid",
    responsibilities: ["Develop features"],
    requirements: [{ id: "r1", text: "TypeScript", kind: "technical", priority: "must" }],
  },
  questions: [
    {
      id: "q1",
      requirement_ids: ["r1"],
      category: "technical",
      prompt: "Explain TS generics.",
      answer_outline: "Type parameters.",
      difficulty: 1,
    },
  ],
  flashcards: [
    { id: "f1", front: "What is a generic?", back: "Type variable.", requirement_ids: ["r1"] },
  ],
  schedule: {
    days_available: 1,
    days: [{ day: 1, focus: "Must-have requirements", question_ids: ["q1"], minutes: 10 }],
  },
  coverage: {
    uncovered_requirement_ids: [],
    passes: 1,
  },
};

describe("Batch Evaluation CLI (evaluate.ts)", () => {
  it("parses valid CLI arguments correctly", () => {
    const parsed1 = parseCliArgs(["--input", "cases.json", "--output", "kits.json"]);
    expect(parsed1.inputPath).toBe("cases.json");
    expect(parsed1.outputPath).toBe("kits.json");

    const parsed2 = parseCliArgs(["--input=test/cases.json", "--output=test/kits.json"]);
    expect(parsed2.inputPath).toBe("test/cases.json");
    expect(parsed2.outputPath).toBe("test/kits.json");
  });

  it("throws a helpful error when required arguments are missing", () => {
    expect(() => parseCliArgs(["--input", "cases.json"])).toThrow(/Missing required/);
    expect(() => parseCliArgs([])).toThrow(/Missing required/);
  });

  it("converts input cases to exact version 1.0 output structure and writes to disk", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "prep-eval-test-"));
    const inputFile = path.join(tmpDir, "cases.json");
    const outputFile = path.join(tmpDir, "output", "kits.json");

    const cases = [
      {
        id: "case-01",
        jd: "Senior Backend Engineer with TypeScript.",
        company_url: "https://acme.com",
        days: 3,
      },
    ];

    await fs.writeFile(inputFile, JSON.stringify(cases), "utf-8");

    const mockGenerator = async (): Promise<GeneratedKitResult> => ({
      kit: sampleValidKit,
      researchWarnings: [],
      requestFingerprint: "mock-hash",
      reusedExistingKit: false,
    });

    const output = await runEvaluation(inputFile, outputFile, {
      generator: mockGenerator,
      logStderr: () => {},
      now: () => new Date("2026-09-22T12:00:00.000Z"),
    });

    expect(output.version).toBe("1.0");
    expect(output.generated_at).toBe("2026-09-22T12:00:00.000Z");
    expect(output.kits).toHaveLength(1);
    expect(output.kits[0].id).toBe("case-01");
    expect(output.kits[0].status).toBe("ok");
    expect(output.kits[0].kit).toEqual(sampleValidKit);
    expect(output.kits[0].error).toBeNull();

    // Verify written file exists and contains trailing newline
    const writtenRaw = await fs.readFile(outputFile, "utf-8");
    expect(writtenRaw.endsWith("\n")).toBe(true);
    const parsedDisk = JSON.parse(writtenRaw);
    expect(parsedDisk.version).toBe("1.0");

    // Clean up
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("continues batch processing when an individual case fails", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "prep-eval-test-fail-"));
    const inputFile = path.join(tmpDir, "cases.json");
    const outputFile = path.join(tmpDir, "kits.json");

    const cases = [
      { id: "case-01", jd: "Job 1", company_url: "https://acme.com", days: 2 },
      { id: "case-02", jd: "Job 2", company_url: "https://beta.com", days: 2 },
    ];

    await fs.writeFile(inputFile, JSON.stringify(cases), "utf-8");

    const mockGenerator = async (input: { jd: string }): Promise<GeneratedKitResult> => {
      if (input.jd === "Job 1") {
        throw new Error("Network timeout reaching LLM");
      }
      return {
        kit: sampleValidKit,
        researchWarnings: [],
        requestFingerprint: "hash-2",
        reusedExistingKit: false,
      };
    };

    const output = await runEvaluation(inputFile, outputFile, {
      generator: mockGenerator,
      logStderr: () => {},
    });

    expect(output.kits).toHaveLength(2);
    expect(output.kits[0].id).toBe("case-01");
    expect(output.kits[0].status).toBe("failed");
    expect(output.kits[0].kit).toBeNull();
    expect(output.kits[0].error?.message).toContain("Network timeout");

    expect(output.kits[1].id).toBe("case-02");
    expect(output.kits[1].status).toBe("ok");
    expect(output.kits[1].kit).toBeDefined();

    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
