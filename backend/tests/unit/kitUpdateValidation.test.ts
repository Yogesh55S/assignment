import { describe, it, expect, vi, beforeEach } from "vitest";
import { KitService } from "../../src/services/persistence/kitService.js";
import { Kit } from "../../src/models/Kit.js";
import mongoose from "mongoose";
import type { EditableInterviewPrepKit } from "@interview-prep/shared/types/editableKit";

function createValidKitPayload(): EditableInterviewPrepKit {
  return {
    source: {
      company: "Acme Corp",
      company_url: "https://acme.com",
      role: "Backend Engineer",
      location: "San Francisco, CA",
      jd_chars: 1200,
      researched_at: "2026-09-22T10:00:00.000Z",
      pages_used: ["https://acme.com"],
    },
    company_brief: {
      summary: "Acme Corp is an analytics company.",
      what_they_do: "They develop real-time analytics platforms.",
      sources: ["https://acme.com"],
      _meta: {
        edited: true,
      },
    },
    role: {
      title: "Backend Engineer",
      seniority: "Senior",
      responsibilities: ["Build APIs"],
      requirements: [
        {
          id: "r1",
          text: "TypeScript proficiency",
          kind: "technical",
          priority: "must",
        },
      ],
    },
    questions: [
      {
        id: "q1",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "Explain event loop phases in Node.js.",
        answer_outline: "Timers, I/O callbacks, poll, check, close.",
        difficulty: 2,
        _meta: {
          origin: "generated",
          edited: false,
          pinned: false,
        },
      },
    ],
    flashcards: [
      {
        id: "f1",
        front: "Event loop phases?",
        back: "Timers, poll, check, etc.",
        requirement_ids: ["r1"],
      },
    ],
    schedule: {
      days_available: 1,
      days: [
        {
          day: 1,
          focus: "Event loop",
          question_ids: ["q1"],
          minutes: 15,
        },
      ],
    },
    coverage: {
      uncovered_requirement_ids: [],
      passes: 1,
    },
  };
}

describe("Kit Draft Update Validation", () => {
  const fakeUserId = new mongoose.Types.ObjectId().toString();
  const fakeKitId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects an update payload that contains dangling schedule question IDs", async () => {
    const invalidPayload = createValidKitPayload();
    // Schedule day references q999 which is not in questions
    invalidPayload.schedule.days[0].question_ids = ["q999"];

    const mockDoc = {
      _id: fakeKitId,
      userId: fakeUserId,
      kit: createValidKitPayload(),
      updatedAt: new Date(),
      save: vi.fn(),
    };

    vi.spyOn(Kit, "findOne").mockResolvedValue(mockDoc as any);

    await expect(
      KitService.updateKitDraft({
        userId: fakeUserId,
        kitId: fakeKitId,
        kit: invalidPayload,
      })
    ).rejects.toThrow("references non-existent question ID: 'q999'");
  });

  it("detects optimistic concurrency conflict (KIT_CONFLICT) when client timestamp is stale", async () => {
    const validPayload = createValidKitPayload();
    const serverTimestamp = new Date("2026-09-22T14:00:00Z");
    const staleClientTimestamp = "2026-09-22T13:00:00Z"; // 1 hour older

    const mockDoc = {
      _id: fakeKitId,
      userId: fakeUserId,
      kit: validPayload,
      updatedAt: serverTimestamp,
      save: vi.fn(),
    };

    vi.spyOn(Kit, "findOne").mockResolvedValue(mockDoc as any);

    await expect(
      KitService.updateKitDraft({
        userId: fakeUserId,
        kitId: fakeKitId,
        kit: validPayload,
        clientUpdatedAt: staleClientTimestamp,
      })
    ).rejects.toThrow("This kit changed elsewhere. Refresh and try again.");
  });

  it("preserves immutable provenance source.company_url and source.jd_chars on save", async () => {
    const modifiedPayload = createValidKitPayload();
    // Attempted client manipulation of immutable provenance fields
    modifiedPayload.source.company_url = "https://hacker.com";
    modifiedPayload.source.jd_chars = 999999;

    const originalDoc = {
      _id: fakeKitId,
      userId: fakeUserId,
      kit: {
        source: {
          company_url: "https://acme.com",
          jd_chars: 1200,
        },
      },
      updatedAt: new Date("2026-09-22T12:00:00Z"),
      save: vi.fn().mockImplementation(function (this: any) {
        return this;
      }),
    };

    vi.spyOn(Kit, "findOne").mockResolvedValue(originalDoc as any);

    const saved = await KitService.updateKitDraft({
      userId: fakeUserId,
      kitId: fakeKitId,
      kit: modifiedPayload,
      clientUpdatedAt: "2026-09-22T12:00:00Z",
    });

    expect(saved.kit?.source.company_url).toBe("https://acme.com");
    expect(saved.kit?.source.jd_chars).toBe(1200);
  });
});
