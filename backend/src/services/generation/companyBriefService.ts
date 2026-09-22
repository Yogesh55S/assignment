import { z } from "zod";
import type { CompanyResearchResult } from "../research/types.js";
import type { LlmClient } from "../llm/types.js";
import { generateAndValidateJson } from "../llm/structuredGeneration.js";
import { buildCompanyBriefPrompt } from "../llm/prompts.js";
import { sanitizeUntrustedContent } from "../../utils/sanitizePromptContent.js";

export const companyBriefSchema = z.object({
  summary: z.string().trim().min(1),
  what_they_do: z.string().trim().min(1),
  sources: z.array(z.string().trim()).default([]),
});

export type GeneratedCompanyBrief = z.infer<typeof companyBriefSchema>;

export async function generateCompanyBrief(input: {
  companyName: string;
  companyUrl: string;
  research: CompanyResearchResult;
  llmClient: LlmClient;
}): Promise<{
  summary: string;
  what_they_do: string;
  sources: string[];
}> {
  const { companyName, companyUrl, research, llmClient } = input;

  const validPages = research.pages.filter((p) => p.text && p.text.trim().length > 0);
  const allowedSources = new Set(research.pagesUsed);

  // If no usable company text exists, return honest fallback without LLM call
  if (validPages.length === 0 || allowedSources.size === 0) {
    return {
      summary: "Limited company information could be retrieved from the provided website.",
      what_they_do: "No reliable description could be generated from the retrieved company pages.",
      sources: [],
    };
  }

  // Assemble research text capped at 30,000 characters
  let combinedText = "";
  for (const page of validPages) {
    const section = `Page: ${page.title || page.url} (${page.url})\n${page.text}\n\n`;
    if (combinedText.length + section.length > 30000) {
      break;
    }
    combinedText += section;
  }

  const sanitizedResearch = sanitizeUntrustedContent(combinedText, 30000);

  const { systemInstruction, userPrompt } = buildCompanyBriefPrompt({
    companyName,
    companyUrl,
    sanitizedResearch,
    availablePages: Array.from(allowedSources),
  });

  const rawBrief = await generateAndValidateJson<GeneratedCompanyBrief>({
    client: llmClient,
    request: {
      systemInstruction,
      userPrompt,
      schemaName: "company_brief",
      temperature: 0.1,
    },
    schema: companyBriefSchema,
  });

  // Filter returned sources strictly to pages actually in research.pagesUsed
  const verifiedSources = rawBrief.sources.filter((url) => allowedSources.has(url));

  // If none matched but pages were used, default to the top pagesUsed
  const finalSources = verifiedSources.length > 0 ? verifiedSources : research.pagesUsed.slice(0, 3);

  return {
    summary: rawBrief.summary,
    what_they_do: rawBrief.what_they_do,
    sources: finalSources,
  };
}
