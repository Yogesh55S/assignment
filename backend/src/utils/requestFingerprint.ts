import { createHash } from "node:crypto";
import { normalizeUrlForComparison } from "../services/research/linkExtractor.js";

export function createRequestFingerprint(input: {
  userId?: string;
  jd: string;
  companyUrl: string;
  days: number;
}): string {
  // Normalize JD whitespace and linebreaks
  const normalizedJd = input.jd
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  // Normalize company URL
  const normalizedUrl = normalizeUrlForComparison(input.companyUrl.trim());

  const payload = [
    input.userId ? `user:${input.userId.trim()}` : "user:anon",
    `days:${Math.round(input.days)}`,
    `url:${normalizedUrl}`,
    `jd:${normalizedJd}`,
  ].join("|");

  return createHash("sha256").update(payload, "utf8").digest("hex");
}
