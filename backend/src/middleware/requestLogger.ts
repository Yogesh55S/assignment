import type { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = req.id || "-";
  const method = req.method;
  const url = req.originalUrl || req.url;

  // Intercept the finish event to log outcome
  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Redaction guarantee: never log headers (cookies, auth), query parameters with keys, or bodies
    console.log(
      `[${new Date().toISOString()}] [req:${requestId}] ${method} ${url} ${statusCode} ${durationMs}ms`
    );
  });

  next();
}
