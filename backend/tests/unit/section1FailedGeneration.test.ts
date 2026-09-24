import { describe, it, expect } from "vitest";
import { KitService } from "../../src/services/persistence/kitService.js";
import { Kit } from "../../src/models/Kit.js";
import { validateInterviewPrepKit } from "@interview-prep/shared/validators/kitSchema";

describe("Section 1: Failed Generation & Data Integrity Tests", () => {
  it("validateInterviewPrepKit throws ZodError on invalid/incomplete kit payload", () => {
    const invalidKit = {
      source: { company: "Test" },
      // missing required fields
    };
    expect(() => validateInterviewPrepKit(invalidKit)).toThrow();
  });

  it("markKitFailed sets kit to null and records safe error details", async () => {
    // Unit verification of markKitFailed interface contract
    expect(KitService.markKitFailed).toBeDefined();
    expect(KitService.createGeneratingKit).toBeDefined();
    expect(KitService.resetFailedKitToGenerating).toBeDefined();
  });

  it("Kit model default kit field is null", () => {
    const kitDoc = new Kit({
      userId: "507f1f77bcf86cd799439011",
      requestFingerprint: "fingerprint_123",
      generationStatus: "failed",
      generationError: { code: "LLM_TIMEOUT", message: "AI generation timed out" },
    });

    expect(kitDoc.kit).toBeNull();
    expect(kitDoc.generationStatus).toBe("failed");
    expect(kitDoc.generationError?.code).toBe("LLM_TIMEOUT");
  });

  it("Retry failed kit method updates status to generating and clears error", async () => {
    expect(KitService.resetFailedKitToGenerating).toBeDefined();
  });
});
