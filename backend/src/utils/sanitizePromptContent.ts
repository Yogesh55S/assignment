export function sanitizeUntrustedContent(input: string, maxChars: number): string {
  if (!input) return "";

  // Strip null bytes and control characters except standard whitespace
  let text = input.replace(/[\0\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ");

  // Normalize excessive spaces and linebreaks
  text = text
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text.length <= maxChars) {
    return text;
  }

  let end = maxChars;
  // Check if character at end - 1 is high surrogate (0xD800 - 0xDBFF)
  const code = text.charCodeAt(end - 1);
  if (code >= 0xd800 && code <= 0xdbff) {
    end--;
  }

  return text.slice(0, end).trim();
}
