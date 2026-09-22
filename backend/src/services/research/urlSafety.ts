import type { SafeUrlValidationResult } from "./types.js";

function parseIpv4ToNumber(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length === 0 || parts.length > 4) return null;

  const nums: number[] = [];
  for (const part of parts) {
    if (!part || !/^(0x[0-9a-f]+|0[0-7]+|[0-9]+)$/i.test(part)) {
      return null;
    }
    const val = part.startsWith("0x") || part.startsWith("0X")
      ? parseInt(part, 16)
      : part.length > 1 && part.startsWith("0")
      ? parseInt(part, 8)
      : parseInt(part, 10);

    if (isNaN(val) || val < 0) return null;
    nums.push(val);
  }

  if (nums.length === 1) {
    return nums[0] >>> 0;
  }
  if (nums.length === 2) {
    if (nums[0] > 255 || nums[1] > 0xffffff) return null;
    return ((nums[0] << 24) | (nums[1] & 0xffffff)) >>> 0;
  }
  if (nums.length === 3) {
    if (nums[0] > 255 || nums[1] > 255 || nums[2] > 0xffff) return null;
    return ((nums[0] << 24) | (nums[1] << 16) | (nums[2] & 0xffff)) >>> 0;
  }
  if (nums.length === 4) {
    if (nums[0] > 255 || nums[1] > 255 || nums[2] > 255 || nums[3] > 255) return null;
    return ((nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0;
  }
  return null;
}

export function isPrivateOrLoopbackIp(rawIp: string): boolean {
  const ip = rawIp.replace(/^\[|\]$/g, "").trim().toLowerCase();

  // IPv4 or dotted octal/hex
  const ipv4Num = parseIpv4ToNumber(ip);
  if (ipv4Num !== null) {
    const b0 = (ipv4Num >>> 24) & 0xff;
    const b1 = (ipv4Num >>> 16) & 0xff;

    // 0.0.0.0/8
    if (b0 === 0) return true;
    // 10.0.0.0/8
    if (b0 === 10) return true;
    // 127.0.0.0/8 (loopback)
    if (b0 === 127) return true;
    // 169.254.0.0/16 (link-local / AWS metadata)
    if (b0 === 169 && b1 === 254) return true;
    // 172.16.0.0/12
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
    // 192.168.0.0/16
    if (b0 === 192 && b1 === 168) return true;
    // 100.64.0.0/10 (carrier-grade NAT)
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;
    // 255.255.255.255 broadcast
    if (ipv4Num === 0xffffffff) return true;

    return false;
  }

  // IPv6 checks
  if (
    ip === "::1" ||
    ip === "::" ||
    ip === "0:0:0:0:0:0:0:1" ||
    ip === "0:0:0:0:0:0:0:0"
  ) {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  if (ip.startsWith("::ffff:")) {
    const mapped = ip.slice("::ffff:".length);
    if (isPrivateOrLoopbackIp(mapped)) return true;
  }

  // Unique local addresses (fc00::/7 -> fc.. or fd..)
  if (ip.startsWith("fc") || ip.startsWith("fd")) {
    return true;
  }

  // Link-local addresses (fe80::/10 -> fe8.. to feb..)
  if (/^fe[89ab]/i.test(ip)) {
    return true;
  }

  return false;
}

export function isPrivateOrLoopbackHostname(rawHostname: string): boolean {
  const hostname = rawHostname.replace(/^\[|\]$/g, "").trim().toLowerCase();

  if (isPrivateOrLoopbackIp(hostname)) {
    return true;
  }

  if (hostname === "localhost" || hostname === "localhost.localdomain") {
    return true;
  }

  if (
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".localhost.localdomain") ||
    hostname.endsWith(".localdomain") ||
    hostname.endsWith(".local")
  ) {
    return true;
  }

  return false;
}

export function validateCompanyUrl(
  rawUrl: string,
  options?: {
    nodeEnv?: string;
    allowLocalFetch?: boolean;
  }
): SafeUrlValidationResult {
  const trimmed = rawUrl?.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: {
        code: "INVALID_COMPANY_URL",
        message: "Company URL cannot be empty",
      },
    };
  }

  let urlToParse = trimmed;
  if (!/^https?:\/\//i.test(urlToParse)) {
    if (urlToParse.includes("://")) {
      return {
        valid: false,
        error: {
          code: "INVALID_COMPANY_URL",
          message: "Only HTTP and HTTPS URLs are supported",
        },
      };
    }
    urlToParse = `https://${urlToParse}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlToParse);
  } catch {
    return {
      valid: false,
      error: {
        code: "INVALID_COMPANY_URL",
        message: "Malformed URL",
      },
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      valid: false,
      error: {
        code: "INVALID_COMPANY_URL",
        message: "Only HTTP and HTTPS protocols are allowed",
      },
    };
  }

  // Disallow embedded credentials (including username/password or encoded credentials)
  if (parsed.username || parsed.password) {
    return {
      valid: false,
      error: {
        code: "INVALID_COMPANY_URL",
        message: "URLs with embedded credentials are not allowed",
      },
    };
  }

  const hostname = parsed.hostname.replace(/\.$/, "").toLowerCase();
  if (!hostname) {
    return {
      valid: false,
      error: {
        code: "INVALID_COMPANY_URL",
        message: "Missing hostname",
      },
    };
  }

  const nodeEnv = options?.nodeEnv ?? process.env.NODE_ENV ?? "development";
  const isProduction = nodeEnv === "production";
  const allowLocal = options?.allowLocalFetch ?? (process.env.ALLOW_LOCAL_FETCH === "true");

  if (isProduction || !allowLocal) {
    if (isPrivateOrLoopbackHostname(hostname)) {
      return {
        valid: false,
        hostname,
        error: {
          code: "UNSAFE_COMPANY_URL",
          message: "Access to private and loopback addresses is restricted",
        },
      };
    }
  }

  // Remove fragment
  parsed.hash = "";

  return {
    valid: true,
    normalizedUrl: parsed.toString(),
    hostname,
  };
}
