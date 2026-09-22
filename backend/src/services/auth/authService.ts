import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { CookieOptions } from "express";
import { User, IUser } from "../../models/User.js";
import { getEnv } from "../../config/env.js";
import { ConflictError, UnauthorizedError } from "../../utils/errors.js";
import {
  AUTH_COOKIE_NAME,
  JWT_EXPIRES_IN,
  JWT_ISSUER,
  JWT_AUDIENCE,
} from "@interview-prep/shared/constants";
import type { UserResponse } from "@interview-prep/shared/types/kit";

export class AuthService {
  public static getCookieOptions(): CookieOptions {
    const env = getEnv();
    const isProd = env.NODE_ENV === "production";

    const sameSite = env.COOKIE_SAME_SITE;
    const secure = isProd || sameSite === "none";

    return {
      httpOnly: true,
      sameSite,
      secure,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    };
  }

  public static signUserToken(user: { id: string; email: string }): string {
    const env = getEnv();
    if (!env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured on server.");
    }

    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      env.JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      }
    );
  }

  public static async register(email: string, password: string): Promise<{ user: UserResponse; token: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check existing
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new ConflictError("An account with this email address already exists.");
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
    });

    const userPayload: UserResponse = {
      id: user._id.toString(),
      email: user.email,
    };

    const token = AuthService.signUserToken(userPayload);

    return { user: userPayload, token };
  }

  public static async login(email: string, password: string): Promise<{ user: UserResponse; token: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Explicitly query passwordHash since it has select: false
    const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
    if (!user) {
      // Generic message to prevent account enumeration
      throw new UnauthorizedError("Invalid email or password.");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const userPayload: UserResponse = {
      id: user._id.toString(),
      email: user.email,
    };

    const token = AuthService.signUserToken(userPayload);

    return { user: userPayload, token };
  }
}
