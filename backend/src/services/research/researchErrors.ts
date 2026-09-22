import { AppError } from "../../utils/errors.js";
import type { ResearchWarningCode } from "./types.js";

export class ResearchError extends AppError {
  public override readonly code: ResearchWarningCode;
  public readonly retryable: boolean;
  public readonly url?: string;

  constructor(
    code: ResearchWarningCode,
    statusCode: number,
    message: string,
    options?: { retryable?: boolean; url?: string }
  ) {
    super(statusCode, code, message);
    this.name = "ResearchError";
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.url = options?.url;
    Object.setPrototypeOf(this, ResearchError.prototype);
  }

  static invalidCompanyUrl(url?: string, message = "Invalid company website URL"): ResearchError {
    return new ResearchError("INVALID_COMPANY_URL", 400, message, { retryable: false, url });
  }

  static unsafeCompanyUrl(url?: string, message = "Access to the requested URL is restricted for security"): ResearchError {
    return new ResearchError("UNSAFE_COMPANY_URL", 400, message, { retryable: false, url });
  }

  static pageTimeout(url?: string, message = "Request timed out"): ResearchError {
    return new ResearchError("PAGE_TIMEOUT", 504, message, { retryable: true, url });
  }

  static pageNotFound(url?: string, message = "Page not found"): ResearchError {
    return new ResearchError("PAGE_NOT_FOUND", 404, message, { retryable: false, url });
  }

  static unsupportedContentType(url?: string, contentType?: string): ResearchError {
    const msg = contentType
      ? `Unsupported response content type: ${contentType}`
      : "Unsupported response content type";
    return new ResearchError("UNSUPPORTED_CONTENT_TYPE", 422, msg, { retryable: false, url });
  }

  static contentTooLarge(url?: string, sizeBytes?: number, maxBytes?: number): ResearchError {
    const msg = sizeBytes && maxBytes
      ? `Content size ${sizeBytes} bytes exceeds maximum allowed ${maxBytes} bytes`
      : "Response content exceeded maximum allowed size";
    return new ResearchError("CONTENT_TOO_LARGE", 413, msg, { retryable: false, url });
  }

  static pageFetchFailed(url?: string, message = "Network or transient fetch failure"): ResearchError {
    return new ResearchError("PAGE_FETCH_FAILED", 502, message, { retryable: true, url });
  }

  static companyUnreachable(url?: string, message = "Company homepage could not be reached after all retries"): ResearchError {
    return new ResearchError("COMPANY_UNREACHABLE", 502, message, { retryable: false, url });
  }
}
