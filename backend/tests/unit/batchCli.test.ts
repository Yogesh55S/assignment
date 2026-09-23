import { describe, it, expect } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { runEvaluation } from "../../src/scripts/evaluate.js";

describe("Batch Evaluation CLI Input Validation (Part 7)", () => {
  it("rejects non-array JSON input", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "prep-cli-test-"));
    const inputFile = path.join(tmpDir, "invalid.json");
    const outputFile = path.join(tmpDir, "out.json");

    await fs.writeFile(inputFile, JSON.stringify({ not: "an array" }), "utf-8");

    await expect(runEvaluation(inputFile, outputFile)).rejects.toThrow(
      /must contain a JSON array/
    );

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("rejects invalid case schemas (missing mandatory fields or invalid days)", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "prep-cli-test-schema-"));
    const inputFile = path.join(tmpDir, "invalid-case.json");
    const outputFile = path.join(tmpDir, "out.json");

    const invalidCases = [
      { id: "c1", jd: "Job description", company_url: "https://example.com", days: 0 }, // days < 1
    ];

    await fs.writeFile(inputFile, JSON.stringify(invalidCases), "utf-8");

    await expect(runEvaluation(inputFile, outputFile)).rejects.toThrow(
      /failed schema validation/
    );

    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
