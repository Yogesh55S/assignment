import { describe, it, expect } from "vitest";
import { AuthService } from "../../src/services/auth/authService.js";
import { resetEnvCache } from "../../src/config/env.js";

describe("Production Cookie & Token Safety Behavior", () => {
  it("returns development cookie configuration correctly", () => {
    resetEnvCache();
    process.env.NODE_ENV = "development";
    process.env.COOKIE_SAME_SITE = "lax";

    const options = AuthService.getCookieOptions();
    expect(options.httpOnly).toBe(true);
    expect(options.secure).toBe(false);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("enforces secure: true in production environment", () => {
    resetEnvCache();
    process.env.NODE_ENV = "production";
    process.env.COOKIE_SAME_SITE = "lax";

    const options = AuthService.getCookieOptions();
    expect(options.httpOnly).toBe(true);
    expect(options.secure).toBe(true);
    expect(options.sameSite).toBe("lax");
  });

  it("enforces secure: true when sameSite is 'none'", () => {
    resetEnvCache();
    process.env.NODE_ENV = "development";
    process.env.COOKIE_SAME_SITE = "none";

    const options = AuthService.getCookieOptions();
    expect(options.httpOnly).toBe(true);
    expect(options.secure).toBe(true);
    expect(options.sameSite).toBe("none");
  });
});
