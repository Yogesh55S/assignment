import * as cheerio from "cheerio";
import type { DiscoveredLink } from "./types.js";

const ASSET_EXTENSIONS = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "ico",
  "css",
  "js",
  "map",
  "zip",
  "mp4",
  "mp3",
  "wav",
  "avi",
  "mov",
  "woff",
  "woff2",
  "ttf",
  "eot",
]);

const IGNORED_SCHEMES = [
  "mailto:",
  "tel:",
  "javascript:",
  "data:",
  "ftp:",
  "file:",
];

export function normalizeUrlForComparison(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();

    // Standardize default ports
    if (
      (parsed.protocol === "http:" && parsed.port === "80") ||
      (parsed.protocol === "https:" && parsed.port === "443")
    ) {
      parsed.port = "";
    }

    // Remove trailing slash if path is more than just "/"
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    return parsed.toString();
  } catch {
    return rawUrl.trim().replace(/#.*$/, "").replace(/\/+$/, "");
  }
}

function isAssetPath(pathname: string): boolean {
  const match = pathname.match(/\.([a-z0-9]+)$/i);
  if (!match) return false;
  return ASSET_EXTENSIONS.has(match[1].toLowerCase());
}

export function extractInternalLinks(
  html: string,
  pageUrl: string
): DiscoveredLink[] {
  if (!html || !html.trim()) {
    return [];
  }

  let pageOrigin: string;
  try {
    pageOrigin = new URL(pageUrl).origin.toLowerCase();
  } catch {
    return [];
  }

  const $ = cheerio.load(html);
  const discovered: DiscoveredLink[] = [];
  const seenUrls = new Set<string>();

  $("a[href]").each((_, el) => {
    const rawHref = ($(el).attr("href") || "").trim();
    if (!rawHref || rawHref === "#" || rawHref.startsWith("#")) {
      return;
    }

    const lowerHref = rawHref.toLowerCase();
    if (IGNORED_SCHEMES.some((scheme) => lowerHref.startsWith(scheme))) {
      return;
    }

    let resolved: URL;
    try {
      resolved = new URL(rawHref, pageUrl);
    } catch {
      return;
    }

    // Only keep http and https
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return;
    }

    // Remove fragment
    resolved.hash = "";

    // Ignore asset extensions
    if (isAssetPath(resolved.pathname)) {
      return;
    }

    const normalizedUrl = normalizeUrlForComparison(resolved.toString());
    if (seenUrls.has(normalizedUrl)) {
      return;
    }
    seenUrls.add(normalizedUrl);

    const sameOrigin = resolved.origin.toLowerCase() === pageOrigin;

    const anchorText = $(el).text().replace(/\s+/g, " ").trim();
    const rawRel = $(el).attr("rel") || "";
    const rel = rawRel
      .split(/\s+/)
      .map((r) => r.trim().toLowerCase())
      .filter(Boolean);

    discovered.push({
      url: resolved.toString(),
      rawHref,
      anchorText,
      rel,
      sameOrigin,
    });
  });

  return discovered;
}
