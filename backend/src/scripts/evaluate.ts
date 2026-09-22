import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type {
  EvaluationCase,
  EvaluationOutput,
  EvaluationResult,
} from "@interview-prep/shared/types/kit";
import { generateInterviewPrepKit } from "../services/generation/kitPipeline.js";
import { AppError } from "../utils/errors.js";

const evaluationCaseSchema = z.object({
  id: z.string().trim().min(1, "Case ID must be a non-empty string"),
  jd: z.string().min(1, "Job description must be non-empty"),
  company_url: z.string().trim().min(1, "Company URL must be non-empty"),
  days: z.number().int().min(1).max(60),
});

export interface CliArgs {
  inputPath: string;
  outputPath: string;
}

export function parseCliArgs(argv: string[]): CliArgs {
  let inputPath = "";
  let outputPath = "";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--input" || arg === "-i") {
      inputPath = argv[i + 1] || "";
      i++;
    } else if (arg.startsWith("--input=")) {
      inputPath = arg.slice("--input=".length);
    } else if (arg === "--output" || arg === "-o") {
      outputPath = argv[i + 1] || "";
      i++;
    } else if (arg.startsWith("--output=")) {
      outputPath = arg.slice("--output=".length);
    }
  }

  if (!inputPath || !outputPath) {
    throw new Error(
      "Usage: npm run evaluate -- --input <cases.json> --output <kits.json>\n" +
        "Missing required --input or --output argument."
    );
  }

  return { inputPath, outputPath };
}

export async function runEvaluation(
  inputPath: string,
  outputPath: string,
  options?: {
    generator?: typeof generateInterviewPrepKit;
    logStderr?: (msg: string) => void;
    now?: () => Date;
  }
): Promise<EvaluationOutput> {
  const log = options?.logStderr ?? ((msg: string) => process.stderr.write(`${msg}\n`));
  const generateFn = options?.generator ?? generateInterviewPrepKit;
  const now = options?.now ?? (() => new Date());

  const baseDir = process.env.INIT_CWD || process.cwd();
  const resolvedInput = path.resolve(baseDir, inputPath);
  const resolvedOutput = path.resolve(baseDir, outputPath);

  let rawFileContent: string;
  try {
    rawFileContent = await fs.readFile(resolvedInput, "utf-8");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "File read error";
    throw new Error(`Failed to read input file "${inputPath}": ${msg}`);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawFileContent);
  } catch {
    throw new Error(`Input file "${inputPath}" is not valid JSON.`);
  }

  if (!Array.isArray(parsedJson)) {
    throw new Error(`Input file "${inputPath}" must contain a JSON array of evaluation cases.`);
  }

  const cases: EvaluationCase[] = [];
  for (let idx = 0; idx < parsedJson.length; idx++) {
    const validation = evaluationCaseSchema.safeParse(parsedJson[idx]);
    if (!validation.success) {
      const issueMsg = validation.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      throw new Error(`Case at index ${idx} failed schema validation: ${issueMsg}`);
    }
    cases.push(validation.data);
  }

  const results: EvaluationResult[] = [];
  const total = cases.length;

  for (let idx = 0; idx < total; idx++) {
    const c = cases[idx];
    const caseNum = idx + 1;
    log(`[${caseNum}/${total}] Processing ${c.id}`);

    try {
      const genResult = await generateFn(
        {
          jd: c.jd,
          companyUrl: c.company_url,
          days: c.days,
        },
        {
          skipPersistence: true,
          now,
        }
      );

      results.push({
        id: c.id,
        status: "ok",
        kit: genResult.kit,
        error: null,
      });

      log(`[${caseNum}/${total}] ok ${c.id}`);
    } catch (err: unknown) {
      const code = err instanceof AppError ? err.code : "EVALUATION_CASE_FAILED";
      const message = err instanceof Error ? err.message : "Case generation failed";

      results.push({
        id: c.id,
        status: "failed",
        kit: null,
        error: {
          code,
          message: message.slice(0, 300),
        },
      });

      log(`[${caseNum}/${total}] failed ${c.id}: ${code}`);
    }
  }

  const outputDocument: EvaluationOutput = {
    version: "1.0",
    generated_at: now().toISOString(),
    kits: results,
  };

  // Ensure target directory exists
  const parentDir = path.dirname(resolvedOutput);
  await fs.mkdir(parentDir, { recursive: true });

  // Write formatted JSON with trailing newline
  await fs.writeFile(resolvedOutput, JSON.stringify(outputDocument, null, 2) + "\n", "utf-8");

  return outputDocument;
}

// Direct execution entrypoint
const isDirectRun =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isDirectRun) {
  try {
    const args = parseCliArgs(process.argv.slice(2));
    await runEvaluation(args.inputPath, args.outputPath);
    process.exit(0);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[Error] ${msg}\n`);
    process.exit(1);
  }
}
