import { z } from "zod";
import type { Requirement } from "@interview-prep/shared/types/kit";
import type { LlmClient } from "../llm/types.js";
import { generateAndValidateJson } from "../llm/structuredGeneration.js";
import { buildRoleExtractionPrompt } from "../llm/prompts.js";
import { sanitizeUntrustedContent } from "../../utils/sanitizePromptContent.js";
import { assignRequirementIds } from "../../utils/stableIds.js";

export const extractedRequirementSchema = z.object({
  title: z.string().trim().default("Role"),
  seniority: z.string().trim().default("Not specified"),
  location: z.string().trim().default("Not specified"),
  responsibilities: z.array(z.string().trim()).max(20).default([]),
  requirements: z
    .array(
      z.object({
        text: z.string().trim().min(1).max(500),
        kind: z.enum(["technical", "behavioural", "domain"]),
        priority: z.enum(["must", "nice"]),
      })
    )
    .max(30)
    .default([]),
  extraction_note: z.string().trim().max(1000).default(""),
});

export type ExtractedRoleData = z.infer<typeof extractedRequirementSchema>;

const KNOWN_TECH_KEYWORDS = new Set([
  "kubernetes",
  "docker",
  "python",
  "golang",
  "java",
  "rust",
  "react",
  "angular",
  "vue",
  "aws",
  "gcp",
  "azure",
  "graphql",
  "kafka",
  "redis",
  "elasticsearch",
  "mongodb",
  "postgresql",
  "mysql",
  "terraform",
  "ansible",
  "jenkins",
  "pytorch",
  "tensorflow",
  "spark",
  "hadoop",
]);

export function isRequirementGrounded(reqText: string, sourceJd: string): boolean {
  if (!reqText || !sourceJd) return true;
  const jdLower = sourceJd.toLowerCase();

  const words = reqText.split(/[\s,./()\-+:=]+/).filter((w) => w.length >= 3);
  if (words.length === 0) return true;

  for (const word of words) {
    const wordLower = word.toLowerCase();
    if (KNOWN_TECH_KEYWORDS.has(wordLower)) {
      if (!jdLower.includes(wordLower)) {
        return false;
      }
    }
  }

  return true;
}

export async function extractRoleFromJobDescription(
  jd: string,
  options: {
    llmClient: LlmClient;
  }
): Promise<{
  title: string;
  seniority: string;
  location: string;
  responsibilities: string[];
  requirements: Requirement[];
  extractionNote: string;
}> {
  const sanitizedJd = sanitizeUntrustedContent(jd, 25000);

  // If JD is empty or effectively empty, return honest thin output immediately
  if (!sanitizedJd || sanitizedJd.length < 25) {
    return {
      title: "Unknown Role",
      seniority: "Not specified",
      location: "Not specified",
      responsibilities: [],
      requirements: [],
      extractionNote: "The provided job description was too brief to extract role requirements.",
    };
  }

  const { systemInstruction, userPrompt } = buildRoleExtractionPrompt(sanitizedJd);

  const rawData = await generateAndValidateJson<ExtractedRoleData>({
    client: options.llmClient,
    request: {
      systemInstruction,
      userPrompt,
      schemaName: "extracted_role_requirements",
      temperature: 0.1,
    },
    schema: extractedRequirementSchema,
  });

  const title = rawData.title || "Role";
  const seniority = rawData.seniority || "Not specified";
  const location = rawData.location || "Not specified";
  const responsibilities = rawData.responsibilities.filter((r) => r.length > 0);

  // Filter ungrounded requirements and deduplicate by normalized text
  const seenTexts = new Set<string>();
  const uniqueRequirements = rawData.requirements.filter((req) => {
    if (!isRequirementGrounded(req.text, sanitizedJd)) {
      return false;
    }
    const key = req.text.trim().toLowerCase();
    if (seenTexts.has(key)) {
      return false;
    }
    seenTexts.add(key);
    return true;
  });

  // Assign deterministic r1, r2, r3... IDs
  const requirements = assignRequirementIds(uniqueRequirements);

  return {
    title,
    seniority,
    location,
    responsibilities,
    requirements,
    extractionNote: rawData.extraction_note,
  };
}
