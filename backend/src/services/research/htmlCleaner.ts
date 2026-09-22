import * as cheerio from "cheerio";
import type { CleanedPage } from "./types.js";

const REMOVED_SELECTORS = [
  "script",
  "style",
  "noscript",
  "svg",
  "iframe",
  "canvas",
  "nav",
  "footer",
  "header",
  "form",
  "button",
  "input",
  "select",
  "textarea",
  "dialog",
  "aside",
  "[id*='cookie' i]",
  "[class*='cookie' i]",
  "[id*='consent' i]",
  "[class*='consent' i]",
  "[id*='gdpr' i]",
  "[class*='gdpr' i]",
  "[aria-modal='true']",
  "[role='dialog']",
  "[role='alertdialog']",
];

const BLOCK_BREAK = " __BLOCK_BREAK__ ";

function truncateSafely(str: string, maxLength = 20_000): string {
  if (str.length <= maxLength) return str;
  let end = maxLength;
  const code = str.charCodeAt(end - 1);
  // If high surrogate at cut boundary, retreat one character
  if (code >= 0xd800 && code <= 0xdbff) {
    end--;
  }
  return str.slice(0, end).trim();
}

export function cleanHtmlToPage(html: string, url: string): CleanedPage {
  if (!html || !html.trim()) {
    return {
      url,
      title: "",
      text: "",
      textLength: 0,
    };
  }

  const $ = cheerio.load(html);

  // Extract title before removing tags
  const title = ($("title").first().text() || $("h1").first().text() || "").trim();

  // Remove unwanted tags and elements
  for (const selector of REMOVED_SELECTORS) {
    $(selector).remove();
  }

  // Insert block markers after block-level elements and br
  $("br").replaceWith(BLOCK_BREAK);
  $("p, div, h1, h2, h3, h4, h5, h6, li, tr, blockquote, article, section").each((_, el) => {
    $(el).append(BLOCK_BREAK);
  });

  const rawText = $("body").length ? $("body").text() : $.text();

  // Normalize whitespace: collapse internal whitespace within blocks, remove empty blocks
  const blocks = rawText
    .split("__BLOCK_BREAK__")
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter((block) => block.length > 0);

  const fullText = blocks.join("\n");
  const truncatedText = truncateSafely(fullText, 20_000);

  return {
    url,
    title,
    text: truncatedText,
    textLength: truncatedText.length,
  };
}
