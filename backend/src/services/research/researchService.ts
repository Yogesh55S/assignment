import { crawlCompanySite } from "./companyCrawler.js";
import type { CompanyResearchResult } from "./types.js";

export async function researchCompany(
  companyUrl: string,
  options?: Parameters<typeof crawlCompanySite>[1]
): Promise<CompanyResearchResult> {
  return crawlCompanySite(companyUrl, options);
}
