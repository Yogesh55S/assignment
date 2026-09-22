import type { Request, Response } from "express";
import { AuthService } from "../services/auth/authService.js";
import { registerInputSchema, loginInputSchema } from "@interview-prep/shared/validators/kitSchema";
import { AUTH_COOKIE_NAME } from "@interview-prep/shared/constants";
import { UnauthorizedError } from "../utils/errors.js";

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    const validated = registerInputSchema.parse(req.body);
    const { user, token } = await AuthService.register(validated.email, validated.password);

    res.cookie(AUTH_COOKIE_NAME, token, AuthService.getCookieOptions());

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  }

  public static async login(req: Request, res: Response): Promise<void> {
    const validated = loginInputSchema.parse(req.body);
    const { user, token } = await AuthService.login(validated.email, validated.password);

    res.cookie(AUTH_COOKIE_NAME, token, AuthService.getCookieOptions());

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  }

  public static async logout(_req: Request, res: Response): Promise<void> {
    const cookieOptions = AuthService.getCookieOptions();
    // Delete maxAge from clearCookie options
    const { maxAge: _, ...clearOptions } = cookieOptions;

    res.clearCookie(AUTH_COOKIE_NAME, clearOptions);

    res.status(200).json({
      status: "ok",
      message: "Successfully logged out.",
    });
  }

  public static async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError("Not authenticated");
    }

    res.status(200).json({
      user: {
        id: req.user.id,
        email: req.user.email,
      },
    });
  }
}
