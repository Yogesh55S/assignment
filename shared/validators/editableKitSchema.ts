import { z } from "zod";
import type { InterviewPrepKit } from "../types/kit.js";
import type { EditableInterviewPrepKit } from "../types/editableKit.js";
import {
  kitSourceSchema,
  roleSchema,
  scheduleSchema,
  coverageSchema,
  questionCategorySchema,
} from "./kitSchema.js";

// Metadata schemas
export const questionMetaSchema = z.object({
  origin: z.enum(["generated", "user"]),
  edited: z.boolean(),
  pinned: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const flashcardMetaSchema = z.object({
  origin: z.enum(["generated", "user"]),
  edited: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const companyBriefMetaSchema = z.object({
  edited: z.boolean(),
  updatedAt: z.string().optional(),
});

// Editable component schemas
export const editableCompanyBriefSchema = z.object({
  summary: z.string().min(1, "Summary must be non-empty"),
  what_they_do: z.string().min(1, "What they do must be non-empty"),
  sources: z.array(z.string()),
  _meta: companyBriefMetaSchema.optional(),
});

export const editableInterviewQuestionSchema = z.object({
  id: z.string().min(1, "Question ID must be non-empty"),
  requirement_ids: z
    .array(z.string().min(1, "Requirement ID must be non-empty"))
    .min(1, "Question must reference at least one requirement ID"),
  category: questionCategorySchema,
  prompt: z.string().min(1, "Question prompt must be non-empty"),
  answer_outline: z.string().min(1, "Answer outline must be non-empty"),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  _meta: questionMetaSchema.optional(),
});

export const editableFlashcardSchema = z.object({
  id: z.string().min(1, "Flashcard ID must be non-empty"),
  front: z.string().min(1, "Flashcard front must be non-empty"),
  back: z.string().min(1, "Flashcard back must be non-empty"),
  requirement_ids: z
    .array(z.string().min(1, "Requirement ID must be non-empty"))
    .min(1, "Flashcard must reference at least one requirement ID"),
  _meta: flashcardMetaSchema.optional(),
});

// Editable InterviewPrepKit Base Schema
export const editableInterviewPrepKitBaseSchema = z.object({
  source: kitSourceSchema,
  company_brief: editableCompanyBriefSchema,
  role: roleSchema,
  questions: z.array(editableInterviewQuestionSchema),
  flashcards: z.array(editableFlashcardSchema),
  schedule: scheduleSchema,
  coverage: coverageSchema,
});

// Referential Integrity & Consistency Refinement
export const editableInterviewPrepKitSchema = editableInterviewPrepKitBaseSchema.superRefine(
  (data, ctx) => {
    // 1. Requirement IDs must be unique
    const reqIdSet = new Set<string>();
    for (let i = 0; i < data.role.requirements.length; i++) {
      const req = data.role.requirements[i];
      if (reqIdSet.has(req.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate requirement ID found: '${req.id}'`,
          path: ["role", "requirements", i, "id"],
        });
      }
      reqIdSet.add(req.id);
    }

    // 2. Question IDs must be unique
    const questionIdSet = new Set<string>();
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      if (questionIdSet.has(q.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate question ID found: '${q.id}'`,
          path: ["questions", i, "id"],
        });
      }
      questionIdSet.add(q.id);

      // Every question.requirement_ids reference must exist in role.requirements
      for (let r = 0; r < q.requirement_ids.length; r++) {
        const rId = q.requirement_ids[r];
        if (!reqIdSet.has(rId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Question '${q.id}' references non-existent requirement ID: '${rId}'`,
            path: ["questions", i, "requirement_ids", r],
          });
        }
      }
    }

    // 3. Flashcard IDs must be unique
    const flashcardIdSet = new Set<string>();
    for (let i = 0; i < data.flashcards.length; i++) {
      const fc = data.flashcards[i];
      if (flashcardIdSet.has(fc.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate flashcard ID found: '${fc.id}'`,
          path: ["flashcards", i, "id"],
        });
      }
      flashcardIdSet.add(fc.id);

      // Every flashcard.requirement_ids reference must exist in role.requirements
      for (let r = 0; r < fc.requirement_ids.length; r++) {
        const rId = fc.requirement_ids[r];
        if (!reqIdSet.has(rId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Flashcard '${fc.id}' references non-existent requirement ID: '${rId}'`,
            path: ["flashcards", i, "requirement_ids", r],
          });
        }
      }
    }

    // 4. Schedule checks
    if (data.schedule.days.length !== data.schedule.days_available) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `schedule.days count (${data.schedule.days.length}) must equal schedule.days_available (${data.schedule.days_available})`,
        path: ["schedule", "days"],
      });
    }

    // Every schedule day question_ids reference must exist in questions
    for (let d = 0; d < data.schedule.days.length; d++) {
      const day = data.schedule.days[d];
      for (let q = 0; q < day.question_ids.length; q++) {
        const qId = day.question_ids[q];
        if (!questionIdSet.has(qId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Schedule day ${day.day} references non-existent question ID: '${qId}'`,
            path: ["schedule", "days", d, "question_ids", q],
          });
        }
      }
    }

    // 5. Coverage uncovered requirement IDs must refer to actual requirements
    for (let u = 0; u < data.coverage.uncovered_requirement_ids.length; u++) {
      const uId = data.coverage.uncovered_requirement_ids[u];
      if (!reqIdSet.has(uId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Coverage uncovered_requirement_ids references non-existent requirement ID: '${uId}'`,
          path: ["coverage", "uncovered_requirement_ids", u],
        });
      }
    }
  }
);

export function validateEditableInterviewPrepKit(input: unknown): EditableInterviewPrepKit {
  return editableInterviewPrepKitSchema.parse(input) as EditableInterviewPrepKit;
}

// Section regeneration schema
export const regenerateSectionSchema = z
  .object({
    section: z.enum(["company_brief", "questions", "schedule"]),
    category: questionCategorySchema.optional(),
    replaceEdited: z.boolean().optional(),
    clientUpdatedAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.section === "questions" && !data.category) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Category is required when regenerating questions.",
        path: ["category"],
      });
    }
    if (data.section !== "questions" && data.category) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Category must not be provided when regenerating non-question sections.",
        path: ["category"],
      });
    }
  });

// Kit update request schema
export const kitUpdatePayloadSchema = z.object({
  kit: editableInterviewPrepKitSchema,
  clientUpdatedAt: z.string().optional(),
});

// Flashcard practice submission schema
export const practiceSubmissionSchema = z.object({
  flashcardId: z.string().min(1, "Flashcard ID must be non-empty"),
  confidence: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  covered: z.boolean().optional(),
});

/**
 * Strips internal UI metadata (_meta) recursively without mutating the input object,
 * producing a pristine InterviewPrepKit conforming exactly to Appendix A requirements.
 */
export function stripInternalKitMetadata(kit: EditableInterviewPrepKit): InterviewPrepKit {
  // Deep clone to guarantee immutability
  const clone = JSON.parse(JSON.stringify(kit)) as EditableInterviewPrepKit;

  if (clone.company_brief && "_meta" in clone.company_brief) {
    delete clone.company_brief._meta;
  }

  if (Array.isArray(clone.questions)) {
    for (const q of clone.questions) {
      if ("_meta" in q) {
        delete q._meta;
      }
    }
  }

  if (Array.isArray(clone.flashcards)) {
    for (const f of clone.flashcards) {
      if ("_meta" in f) {
        delete f._meta;
      }
    }
  }

  return clone as InterviewPrepKit;
}
