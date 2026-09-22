import { describe, it, expect, vi, beforeEach } from "vitest";
import { PracticeService } from "../../src/services/persistence/practiceService.js";
import { Kit } from "../../src/models/Kit.js";
import { FlashcardProgress } from "../../src/models/FlashcardProgress.js";
import mongoose from "mongoose";

describe("PracticeService", () => {
  const fakeUserId = new mongoose.Types.ObjectId().toString();
  const fakeKitId = new mongoose.Types.ObjectId().toString();

  const fakeKitDoc = {
    _id: fakeKitId,
    userId: fakeUserId,
    kit: {
      flashcards: [
        { id: "f1", front: "Front 1", back: "Back 1", requirement_ids: ["r1"] },
        { id: "f2", front: "Front 2", back: "Back 2", requirement_ids: ["r1"] },
        { id: "f3", front: "Front 3", back: "Back 3", requirement_ids: ["r1"] },
      ],
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws NotFoundError if kit does not exist or user does not own it", async () => {
    vi.spyOn(Kit, "findOne").mockResolvedValue(null);

    await expect(
      PracticeService.saveFlashcardProgress({
        userId: fakeUserId,
        kitId: fakeKitId,
        flashcardId: "f1",
        confidence: 2,
      })
    ).rejects.toThrow("Kit not found or access denied");
  });

  it("throws NotFoundError if flashcard is not part of the kit", async () => {
    vi.spyOn(Kit, "findOne").mockResolvedValue(fakeKitDoc as any);

    await expect(
      PracticeService.saveFlashcardProgress({
        userId: fakeUserId,
        kitId: fakeKitId,
        flashcardId: "f999",
        confidence: 3,
      })
    ).rejects.toThrow("does not exist in this kit");
  });

  it("upserts progress record for a valid flashcard", async () => {
    vi.spyOn(Kit, "findOne").mockResolvedValue(fakeKitDoc as any);

    const mockSavedDoc = {
      userId: fakeUserId,
      kitId: fakeKitId,
      flashcardId: "f1",
      confidence: 3,
      covered: true,
      lastSeenAt: new Date(),
    };

    vi.spyOn(FlashcardProgress, "findOneAndUpdate").mockResolvedValue(mockSavedDoc as any);

    const result = await PracticeService.saveFlashcardProgress({
      userId: fakeUserId,
      kitId: fakeKitId,
      flashcardId: "f1",
      confidence: 3,
      covered: true,
    });

    expect(result.flashcardId).toBe("f1");
    expect(result.confidence).toBe(3);
    expect(result.covered).toBe(true);
  });

  it("retrieves practice progress and computes accurate completion summary", async () => {
    vi.spyOn(Kit, "findOne").mockResolvedValue(fakeKitDoc as any);

    const mockProgressDocs = [
      {
        flashcardId: "f1",
        confidence: 3,
        covered: true,
        lastSeenAt: new Date("2026-09-22T10:00:00Z"),
      },
      {
        flashcardId: "f2",
        confidence: 1,
        covered: true,
        lastSeenAt: new Date("2026-09-22T11:00:00Z"),
      },
      // Dangling card from an earlier draft that is no longer in kit
      {
        flashcardId: "f_old",
        confidence: 2,
        covered: true,
        lastSeenAt: new Date("2026-09-22T09:00:00Z"),
      },
    ];

    const sortMock = vi.fn().mockResolvedValue(mockProgressDocs);
    vi.spyOn(FlashcardProgress, "find").mockReturnValue({ sort: sortMock } as any);

    const result = await PracticeService.getKitPracticeProgress({
      userId: fakeUserId,
      kitId: fakeKitId,
    });

    // 3 total flashcards in kit, 2 valid covered cards
    expect(result.summary.total).toBe(3);
    expect(result.summary.covered).toBe(2);
    expect(result.summary.remaining).toBe(1);
    expect(result.progress.length).toBe(2);
    expect(result.progress[0].flashcardId).toBe("f1");
  });
});
