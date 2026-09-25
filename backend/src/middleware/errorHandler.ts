import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError, NotFoundError } from "../utils/errors.js";

/**
 * Centralized 404 handler.
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl || req.url}`));
}

/**
 * Centralized error handler returning strictly formatted JSON:
 * {
 *   "error": {
 *     "code": "SOME_CODE",
 *     "message": "Human-readable safe message",
 *     "requestId": "..."
 *   }
 * }
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id || "-";

  // Handle known AppError instances
  if (err instanceof AppError) {
    if (err.statusCode >= 400) {
      console.warn(`[AppError] [req:${requestId}] ${err.code} (${err.statusCode}): ${err.message}`);
    }
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        requestId,
      },
    });
    return;
  }

  // Handle Zod schema validation errors
  if (err instanceof ZodError) {
    const errorMessages = err.errors.map((e) => {
      const field = e.path.join(".");
      return field ? `${field}: ${e.message}` : e.message;
    });

    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: `Validation failed: ${errorMessages.join("; ")}`,
        requestId,
      },
    });
    return;
  }

  // Handle MongoDB duplicate key error (code 11000)
  if (err && err.code === 11000) {
    res.status(409).json({
      error: {
        code: "DUPLICATE_RESOURCE",
        message: "A resource with these details already exists.",
        requestId,
      },
    });
    return;
  }

  // Handle Body-parser / JSON syntax errors
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Malformed JSON payload provided.",
        requestId,
      },
    });
    return;
  }

  // Unexpected / unhandled errors
  // Server-side logging without leaking secrets
  console.error(`[Error] [req:${requestId}] Internal server error:`, err?.message || err);

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected server error occurred. Please try again later.",
      requestId,
    },
  });
}
