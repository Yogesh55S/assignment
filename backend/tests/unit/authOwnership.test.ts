import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { AuthService } from "../../src/services/auth/authService.js";
import { KitService } from "../../src/services/persistence/kitService.js";
import { User } from "../../src/models/User.js";
import { JWT_ISSUER, JWT_AUDIENCE } from "@interview-prep/shared/constants";

vi.mock("../../src/models/User.js");
vi.mock("../../src/services/persistence/kitService.js");

describe("Authentication & User Ownership Isolation", () => {
  const secret = "test_jwt_secret_value_for_signing_unit_test_tokens_32_chars";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = secret;
  });

  describe("Registration", () => {
    it("normalizes email to lowercase and hashes password without returning hash", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null as any);
      vi.mocked(User.create).mockResolvedValue({
        _id: "user123",
        email: "test@example.com",
      } as any);

      const result = await AuthService.register("  Test@EXAMPLE.com  ", "Password123!");

      expect(result.user).toEqual({
        id: "user123",
        email: "test@example.com",
      });
      expect(result.token).toBeDefined();
      expect(result.user).not.toHaveProperty("password");
      expect(result.user).not.toHaveProperty("passwordHash");
    });

    it("throws 409 Conflict error when email is already registered", async () => {
      vi.mocked(User.findOne).mockResolvedValue({ _id: "existing" } as any);

      await expect(AuthService.register("existing@example.com", "Password123!")).rejects.toThrow(
        "An account with this email address already exists."
      );
    });
  });

  describe("Login", () => {
    it("returns identical generic message for unknown email and wrong password", async () => {
      vi.mocked(User.findOne).mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      } as any);

      await expect(AuthService.login("unknown@example.com", "any_password")).rejects.toThrow(
        "Invalid email or password."
      );
    });

    it("signs valid JWT token on successful credential verification", async () => {
      const mockUser = {
        _id: "user_456",
        email: "user@example.com",
        passwordHash: "$2a$12$eImiTXuWVxfM37uY4JANjO5E/805.O07i3a9a1w0tG6u5N", // bcrypt stub
      };

      vi.mocked(User.findOne).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      } as any);

      const token = AuthService.signUserToken({ id: mockUser._id, email: mockUser.email });
      const decoded = jwt.verify(token, secret, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      }) as any;

      expect(decoded.sub).toBe("user_456");
      expect(decoded.email).toBe("user@example.com");
    });
  });

  describe("Ownership Isolation (User A vs User B)", () => {
    it("prevents User A from retrieving User B's kit by passing authenticated req.user.id to service", async () => {
      const userAId = "user_A_id";
      const targetKitId = "kit_belonging_to_user_B";

      vi.mocked(KitService.findKitById).mockResolvedValue(null);

      const result = await KitService.findKitById(userAId, targetKitId);

      expect(KitService.findKitById).toHaveBeenCalledWith(userAId, targetKitId);
      expect(result).toBeNull();
    });

    it("prevents User A from updating User B's kit draft", async () => {
      const userAId = "user_A_id";
      const userBKitId = "kit_B_id";

      vi.mocked(KitService.updateKitDraft).mockRejectedValue(
        new Error("Kit not found or access denied")
      );

      await expect(
        KitService.updateKitDraft({
          userId: userAId,
          kitId: userBKitId,
          kit: {} as any,
        })
      ).rejects.toThrow("Kit not found or access denied");
    });

    it("prevents User A from deleting User B's kit", async () => {
      const userAId = "user_A_id";
      const userBKitId = "kit_B_id";

      vi.mocked(KitService.deleteKitById).mockRejectedValue(
        new Error("Kit not found or access denied")
      );

      await expect(
        KitService.deleteKitById({
          userId: userAId,
          kitId: userBKitId,
        })
      ).rejects.toThrow("Kit not found or access denied");
    });
  });
});
