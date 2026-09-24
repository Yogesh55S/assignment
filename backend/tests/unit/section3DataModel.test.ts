import { describe, it, expect } from "vitest";
import { Kit, IKit } from "../../src/models/Kit.js";
import { FlashcardProgress } from "../../src/models/FlashcardProgress.js";
import { runKitMigration } from "../../src/scripts/migrateKitDocuments.ts";

describe("MongoDB Data Model Validation", () => {
  it("enforces failed generation kit field is null", () => {
    const failedDoc = new Kit({
      userId: "507f1f77bcf86cd799439011",
      generationStatus: "failed",
      requestFingerprint: "fingerprint_abc_123",
      kit: null,
      generationError: {
        code: "LLM_PROVIDER_ERROR",
        message: "Gemini service temporarily unavailable",
      },
    });

    const error = failedDoc.validateSync();
    expect(error).toBeUndefined();
    expect(failedDoc.kit).toBeNull();
    expect(failedDoc.generationStatus).toBe("failed");
    expect(failedDoc.generationError?.code).toBe("LLM_PROVIDER_ERROR");
  });

  it("validates ready kit schema and status", () => {
    const readyDoc = new Kit({
      userId: "507f1f77bcf86cd799439011",
      generationStatus: "ready",
      requestFingerprint: "fingerprint_ready_456",
      kit: {
        title: "Senior Backend Developer",
        company_name: "Acme Corp",
        seniority: "Senior",
        location: "Remote",
        requirements: [{ id: "r1", text: "Node.js", kind: "technical", priority: "must" }],
        questions: [],
        flashcards: [],
        schedule: [],
      },
    });

    const error = readyDoc.validateSync();
    expect(error).toBeUndefined();
    expect(readyDoc.generationStatus).toBe("ready");
    expect(readyDoc.kit).toBeDefined();
  });

  it("validates separate flashcard_progress collection unique compound index schema", () => {
    const progressDoc = new FlashcardProgress({
      userId: "507f1f77bcf86cd799439011",
      kitId: "507f1f77bcf86cd799439012",
      flashcardId: "fc1",
      confidence: 3,
      covered: true,
      lastSeenAt: new Date(),
    });

    const error = progressDoc.validateSync();
    expect(error).toBeUndefined();
    expect(progressDoc.confidence).toBe(3);
    expect(progressDoc.covered).toBe(true);

    const indexes = FlashcardProgress.schema.indexes();
    const compoundIndex = indexes.find(
      (idx) => idx[0].userId === 1 && idx[0].kitId === 1 && idx[0].flashcardId === 1
    );
    expect(compoundIndex).toBeDefined();
    expect(compoundIndex?.[1]?.unique).toBe(true);
  });

  it("verifies optimistic concurrency versioning (__v) is enabled on Kit schema", () => {
    expect(Kit.schema.options.optimisticConcurrency).toBe(true);
    expect(Kit.schema.options.timestamps).toBe(true);
  });

  it("verifies expected compound indexes exist on Kit schema", () => {
    const indexes = Kit.schema.indexes();

    const updatedAtIndex = indexes.find(
      (idx) => idx[0].userId === 1 && idx[0].updatedAt === -1
    );
    expect(updatedAtIndex).toBeDefined();

    const fingerprintIndex = indexes.find(
      (idx) => idx[0].userId === 1 && idx[0].requestFingerprint === 1
    );
    expect(fingerprintIndex).toBeDefined();
  });

  it("validates researchSnapshot field is optional and handles bounded payload", () => {
    const docWithSnapshot = new Kit({
      userId: "507f1f77bcf86cd799439011",
      generationStatus: "ready",
      requestFingerprint: "fingerprint_snapshot_789",
      researchSnapshot: {
        companyHomepageTitle: "Acme Corp",
        pagesSummarized: 3,
      },
    });

    const error = docWithSnapshot.validateSync();
    expect(error).toBeUndefined();
    expect(docWithSnapshot.researchSnapshot).toEqual({
      companyHomepageTitle: "Acme Corp",
      pagesSummarized: 3,
    });
  });

  it("verifies offline dry-run migration script throws clear error if MONGODB_URI is missing", async () => {
    const oldUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;

    await expect(runKitMigration({ apply: false })).rejects.toThrow(
      "MONGODB_URI environment variable is required to run migration"
    );

    if (oldUri) process.env.MONGODB_URI = oldUri;
  });
});
