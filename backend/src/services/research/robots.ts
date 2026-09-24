import type { RobotsRules, ResearchWarning } from "./types.js";

export function getRobotsUrl(pageUrl: string): string {
  const url = new URL(pageUrl);
  return `${url.origin}/robots.txt`;
}

interface ParsedRobots {
  disallowRules: string[];
  allowRules: string[];
  crawlDelayMs?: number;
}

export function parseRobotsTxt(
  robotsText: string,
  userAgent: string
): {
  disallowRules: string[];
  allowRules?: string[];
  crawlDelayMs?: number;
} {
  const targetTokens = Array.from(
    new Set([
      userAgent.trim().toLowerCase(),
      userAgent.split("/")[0].trim().toLowerCase(),
      userAgent.split(" ")[0].trim().toLowerCase(),
      userAgent.split("/")[0].split(" ")[0].trim().toLowerCase(),
    ])
  ).filter(Boolean);

  const lines = robotsText.split(/\r?\n/);

  interface AgentGroup {
    agents: string[];
    disallows: string[];
    allows: string[];
    crawlDelayMs?: number;
  }

  const groups: AgentGroup[] = [];
  let currentGroup: AgentGroup | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const directive = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (directive === "user-agent") {
      const agent = value.toLowerCase();
      if (!currentGroup || currentGroup.disallows.length > 0 || currentGroup.allows.length > 0 || currentGroup.crawlDelayMs !== undefined) {
        currentGroup = { agents: [agent], disallows: [], allows: [] };
        groups.push(currentGroup);
      } else {
        currentGroup.agents.push(agent);
      }
    } else if (currentGroup) {
      if (directive === "disallow") {
        if (value) {
          currentGroup.disallows.push(value);
        }
      } else if (directive === "allow") {
        if (value) {
          currentGroup.allows.push(value);
        }
      } else if (directive === "crawl-delay") {
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed >= 0) {
          currentGroup.crawlDelayMs = Math.min(Math.round(parsed * 1000), 5000);
        }
      }
    }
  }

  // Find most specific matching group
  let matchedGroup: AgentGroup | null = null;

  // 1. Check exact configured userAgent match
  for (const group of groups) {
    if (group.agents.some((ag) => targetTokens.includes(ag))) {
      matchedGroup = group;
      break;
    }
  }

  // 2. Fall back to wildcard '*'
  if (!matchedGroup) {
    for (const group of groups) {
      if (group.agents.includes("*")) {
        matchedGroup = group;
        break;
      }
    }
  }

  if (!matchedGroup) {
    return {
      disallowRules: [],
      allowRules: [],
    };
  }

  return {
    disallowRules: matchedGroup.disallows,
    allowRules: matchedGroup.allows,
    crawlDelayMs: matchedGroup.crawlDelayMs,
  };
}

export function isPathAllowedByRobots(
  pathWithQuery: string,
  disallowRules: string[],
  allowRules: string[] = []
): boolean {
  const path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;

  let maxDisallowMatchLength = -1;
  for (const rule of disallowRules) {
    if (!rule) continue;
    if (path.startsWith(rule) && rule.length > maxDisallowMatchLength) {
      maxDisallowMatchLength = rule.length;
    }
  }

  if (maxDisallowMatchLength === -1) {
    return true;
  }

  let maxAllowMatchLength = -1;
  for (const rule of allowRules) {
    if (!rule) continue;
    if (path.startsWith(rule) && rule.length > maxAllowMatchLength) {
      maxAllowMatchLength = rule.length;
    }
  }

  // If allow rule is as specific or more specific than disallow rule, allow wins
  if (maxAllowMatchLength >= maxDisallowMatchLength) {
    return true;
  }

  return false;
}

export async function getRobotsRules(
  companyUrl: string,
  options: {
    userAgent: string;
    timeoutMs: number;
    allowLocalFetch: boolean;
    nodeEnv: string;
    fetchImpl?: typeof fetch;
  }
): Promise<RobotsRules> {
  const robotsUrl = getRobotsUrl(companyUrl);
  const fetchFn = options.fetchImpl ?? fetch;
  const warnings: ResearchWarning[] = [];

  let homepagePath = "/";
  try {
    const parsed = new URL(companyUrl);
    homepagePath = parsed.pathname || "/";
  } catch {
    // fallback to "/"
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    let res: Response;
    try {
      res = await fetchFn(robotsUrl, {
        method: "GET",
        headers: {
          "User-Agent": options.userAgent,
          Accept: "text/plain,text/*",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (res.status === 404) {
      return {
        robotsUrl,
        fetched: true,
        allowed: true,
        disallowRules: [],
        allowRules: [],
        warnings: [],
      };
    }

    if (!res.ok) {
      warnings.push({
        code: "PAGE_FETCH_FAILED",
        message: `HTTP ${res.status} when fetching robots.txt`,
        url: robotsUrl,
        retryable: false,
      });
      return {
        robotsUrl,
        fetched: false,
        allowed: true,
        disallowRules: [],
        allowRules: [],
        warnings,
      };
    }

    const text = await res.text();
    const parsed = parseRobotsTxt(text, options.userAgent);
    const allowed = isPathAllowedByRobots(
      homepagePath,
      parsed.disallowRules,
      parsed.allowRules ?? []
    );

    return {
      robotsUrl,
      fetched: true,
      allowed,
      disallowRules: parsed.disallowRules,
      allowRules: parsed.allowRules ?? [],
      crawlDelayMs: parsed.crawlDelayMs,
      warnings: [],
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch robots.txt";
    warnings.push({
      code: "PAGE_FETCH_FAILED",
      message: `Failed to fetch robots.txt: ${message}`,
      url: robotsUrl,
      retryable: false,
    });
    return {
      robotsUrl,
      fetched: false,
      allowed: true,
      disallowRules: [],
      allowRules: [],
      warnings,
    };
  }
}
