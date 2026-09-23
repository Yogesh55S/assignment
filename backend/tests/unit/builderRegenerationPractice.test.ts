import { describe, it, expect } from "vitest";
import { practiceSubmissionSchema } from "@interview-prep/shared/validators/editableKitSchema";
import { regenerateKitSection } from "../../src/services/generation/regenerationService.js";

describe("Builder / Regeneration / Practice - Additional Checks (Part 6)", () => {
  describe("Practice Confidence Validation", () => {
    it("accepts confidence values of 1, 2, and 3", () => {
      expect(practiceSubmissionSchema.safeParse({ flashcardId: "f1", confidence: 1 }).success).toBe(true);
      expect(practiceSubmissionSchema.safeParse({ flashcardId: "f1", confidence: 2 }).success).toBe(true);
      expect(practiceSubmissionSchema.safeParse({ flashcardId: "f1", confidence: 3 }).success).toBe(true);
    });

    it("rejects confidence values outside 1-3 range", () => {
      expect(practiceSubmissionSchema.safeParse({ flashcardId: "f1", confidence: 0 }).success).toBe(false);
      expect(practiceSubmissionSchema.safeParse({ flashcardId: "f1", confidence: 4 }).success).toBe(false);
      expect(practiceSubmissionSchema.safeParse({ flashcardId: "f1", confidence: -1 }).success).toBe(false);
    });
  });

  describe("Schedule Regeneration Without LLM", () => {
    it("recalculates schedule deterministically without invoking LLM or altering questions/brief", async () => {
      const sampleKit: any = {
        source: { company: "Acme", company_url: "https://acme.com", role: "Dev", location: "Remote", jd_chars: 100, researched_at: new Date().toISOString(), pages_used: [] },
        company_brief: { summary: "Summary", what_they_do: "Tech", sources: [] },
        role: { title: "Dev", seniority: "Senior", responsibilities: [], requirements: [{ id: "r1", text: "TypeScript", kind: "technical", priority: "must" }] },
        questions: [{ id: "q1", requirement_ids: ["r1"], category: "technical", prompt: "Explain TS", answer_outline: "Interfaces vs Types", difficulty: 2 }],
        flashcards: [{ id: "f1", front: "TS Front", back: "TS Back", requirement_ids: ["r1"] }],
        schedule: { days_available: 1, days: [{ day: 1, focus: "Focus", question_ids: ["q1"], estimated_minutes: 30 }] },
        coverage: { uncovered_requirement_ids: [], passes: 1 },
      };

      const result = await regenerateKitSection({
        kit: sampleKit,
        section: "schedule",
      });

      expect(result.kit.schedule).toBeDefined();
      expect(result.kit.questions).toEqual(sampleKit.questions);
      expect(result.kit.company_brief).toEqual(sampleKit.company_brief);
      expect(result.kit.flashcards).toEqual(sampleKit.flashcards);
      expect(result.regeneratedCount).toBe(1);
    });
  });
});
