import { AppError } from "../../utils/errors.js";

export class LlmError extends AppError {
  public readonly retryable: boolean;

  constructor(statusCode: number, code: string, message: string, retryable = false) {
    super(statusCode, code, message);
    this.name = "LlmError";
    this.retryable = retryable;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class LlmNotConfiguredError extends LlmError {
  constructor(message = "LLM service is not configured. Please set LLM_API_KEY.") {
    super(500, "LLM_NOT_CONFIGURED", message, false);
    this.name = "LlmNotConfiguredError";
    Object.setPrototypeOf(this, LlmNotConfiguredError.prototype);
  }
}

export class LlmRateLimitedError extends LlmError {
  constructor(message = "LLM provider rate limit exceeded. Please retry shortly.") {
    super(429, "LLM_RATE_LIMITED", message, true);
    this.name = "LlmRateLimitedError";
    Object.setPrototypeOf(this, LlmRateLimitedError.prototype);
  }
}

export class LlmTimeoutError extends LlmError {
  constructor(message = "LLM request timed out.") {
    super(504, "LLM_TIMEOUT", message, true);
    this.name = "LlmTimeoutError";
    Object.setPrototypeOf(this, LlmTimeoutError.prototype);
  }
}

export class LlmInvalidResponseError extends LlmError {
  constructor(message = "LLM returned an invalid or unparseable response.") {
    super(502, "LLM_INVALID_RESPONSE", message, false);
    this.name = "LlmInvalidResponseError";
    Object.setPrototypeOf(this, LlmInvalidResponseError.prototype);
  }
}

export class LlmProviderError extends LlmError {
  constructor(statusCode = 502, message = "LLM provider error occurred.", retryable = false) {
    super(statusCode, "LLM_PROVIDER_ERROR", message, retryable);
    this.name = "LlmProviderError";
    Object.setPrototypeOf(this, LlmProviderError.prototype);
  }
}
