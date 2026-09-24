/**
 * Centralized error mapper for AI Interview Prep Kit.
 * Maps backend error codes / status codes to safe, human-readable user messages
 * and specifies whether the action is retryable.
 *
 * Rules:
 * - Never leak raw stack traces, database errors, HTML snippets, Gemini raw outputs,
 *   tokens, passwords, or secret data.
 */

export interface MappedError {
  code: string;
  message: string;
  retryable: boolean;
}

const ERROR_MAP: Record<string, { message: string; retryable: boolean }> = {
  INVALID_COMPANY_URL: {
    message: "Enter a valid public http(s) company website URL.",
    retryable: true,
  },
  UNSAFE_COMPANY_URL: {
    message: "This company website URL failed security verification.",
    retryable: true,
  },
  COMPANY_UNREACHABLE: {
    message: "The company website could not be reached. Check the URL and try again.",
    retryable: true,
  },
  ROBOTS_DISALLOWED: {
    message: "This company site does not allow automated retrieval for the requested page.",
    retryable: false,
  },
  PAGE_TIMEOUT: {
    message: "The company website took too long to respond.",
    retryable: true,
  },
  LLM_RATE_LIMITED: {
    message: "The AI provider is temporarily busy. Please retry in a moment.",
    retryable: true,
  },
  LLM_TIMEOUT: {
    message: "AI generation timed out. Please try again.",
    retryable: true,
  },
  LLM_PROVIDER_ERROR: {
    message: "AI service encountered an issue. Please retry shortly.",
    retryable: true,
  },
  GENERATION_NOT_IMPLEMENTED: {
    message: "This feature is currently unavailable.",
    retryable: false,
  },
  KIT_CONFLICT: {
    message: "This kit changed elsewhere. Refresh before saving again.",
    retryable: true,
  },
  UNAUTHORIZED: {
    message: "Your session ended. Please sign in again.",
    retryable: false,
  },
  FORBIDDEN: {
    message: "You do not have permission to access this resource.",
    retryable: false,
  },
  NOT_FOUND: {
    message: "The requested item was not found.",
    retryable: false,
  },
  VALIDATION_ERROR: {
    message: "Please check the entered fields and try again.",
    retryable: true,
  },
  INVALID_INPUT: {
    message: "Please check the entered fields and try again.",
    retryable: true,
  },
  NETWORK_ERROR: {
    message: "Network connection error. Please check your internet connection.",
    retryable: true,
  },
  GENERATION_FAILED: {
    message: "Interview prep kit generation encountered an error. You can retry the operation.",
    retryable: true,
  },
  UNKNOWN_ERROR: {
    message: "An unexpected error occurred. Please try again.",
    retryable: true,
  },
};

/**
 * Sanitizes and maps an error code or raw error object into a safe MappedError.
 */
export function mapError(code?: string, rawFallbackMessage?: string): MappedError {
  if (code && ERROR_MAP[code]) {
    const entry = ERROR_MAP[code];
    return {
      code,
      message: entry.message,
      retryable: entry.retryable,
    };
  }

  // Check if raw fallback contains known keywords without leaking sensitive details
  const fallbackLower = (rawFallbackMessage || "").toLowerCase();

  if (fallbackLower.includes("network") || fallbackLower.includes("failed to fetch")) {
    return {
      code: "NETWORK_ERROR",
      message: ERROR_MAP.NETWORK_ERROR.message,
      retryable: true,
    };
  }

  if (fallbackLower.includes("unauthorized") || fallbackLower.includes("session")) {
    return {
      code: "UNAUTHORIZED",
      message: ERROR_MAP.UNAUTHORIZED.message,
      retryable: false,
    };
  }

  // Default safe fallback - do not leak stack traces or internal technical details
  return {
    code: code || "UNKNOWN_ERROR",
    message: ERROR_MAP.UNKNOWN_ERROR.message,
    retryable: true,
  };
}
