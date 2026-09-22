import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";
import { UnauthorizedError } from "../utils/errors.js";
import { AUTH_COOKIE_NAME, JWT_ISSUER, JWT_AUDIENCE } from "@interview-prep/shared/constants";

interface JwtPayload {
  sub: string;
  email: string;
  iss?: string;
  aud?: string;
}

/**
 * Authentication middleware that verifies JWT from HTTP-only cookie.
 * Populates req.user on success; rejects with 401 UnauthorizedError on failure.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    next(new UnauthorizedError("Authentication required. Please log in."));
    return;
  }

  const env = getEnv();
  const secret = env.JWT_SECRET;

  if (!secret) {
    // If JWT_SECRET is somehow not configured in runtime
    next(new UnauthorizedError("Server authentication configuration error."));
    return;
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as JwtPayload;

    if (!decoded.sub || !decoded.email) {
      next(new UnauthorizedError("Invalid authentication token claims."));
      return;
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };

    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      next(new UnauthorizedError("Session expired. Please log in again."));
      return;
    }
    next(new UnauthorizedError("Invalid or corrupted authentication session."));
  }
}
