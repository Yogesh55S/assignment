import { z } from "zod";
import type { InterviewPrepKit } from "../types/kit.js";
import { MIN_SCHEDULE_DAYS, MAX_SCHEDULE_DAYS, MAX_JD_LENGTH } from "../constants/index.js";

// Requirement Schema
export const requirementKindSchema = z.enum(["technical", "behavioural", "domain"]);
export const requirementPrioritySchema = z.enum(["must", "nice"]);

export const requirementSchema = z.object({
  id: z.string().min(1, "Requirement ID must be non-empty"),
  text: z.string().min(1, "Requirement text must be non-empty"),
  kind: requirementKindSchema,
  priority: requirementPrioritySchema,
});

// Interview Question Schema
export const questionCategorySchema = z.enum([
  "technical",
  "behavioural",
  "system-design",
  "company-fit",
]);

export const interviewQuestionSchema = z.object({
  id: z.string().min(1, "Question ID must be non-empty"),
  requirement_ids: z
    .array(z.string().min(1, "Requirement ID must be non-empty"))
    .min(1, "Question must reference at least one requirement ID"),
  category: questionCategorySchema,
  prompt: z.string().min(1, "Question prompt must be non-empty"),
  answer_outline: z.string().min(1, "Answer outline must be non-empty"),
  difficulty: z
    .number()
    .int("Difficulty must be an integer")
    .min(1, "Difficulty must be between 1 and 3")
    .max(3, "Difficulty must be between 1 and 3"),
});

// Flashcard Schema
export const flashcardSchema = z.object({
  id: z.string().min(1, "Flashcard ID must be non-empty"),
  front: z.string().min(1, "Flashcard front must be non-empty"),
  back: z.string().min(1, "Flashcard back must be non-empty"),
  requirement_ids: z
    .array(z.string().min(1, "Requirement ID must be non-empty"))
    .min(1, "Flashcard must reference at least one requirement ID"),
});

// Schedule Day Schema
export const scheduleDaySchema = z.object({
  day: z.number().int("Schedule day must be an integer").positive("Schedule day must be a positive integer"),
  focus: z.string().min(1, "Schedule day focus must be non-empty"),
  question_ids: z.array(z.string().min(1, "Question ID must be non-empty")),
  minutes: z
    .number()
    .int("Minutes must be an integer")
    .min(0, "Minutes must be a non-negative integer"),
});

// Schedule Schema
export const scheduleSchema = z.object({
  days_available: z
    .number()
    .int("Days available must be an integer")
    .min(MIN_SCHEDULE_DAYS, `Days available must be between ${MIN_SCHEDULE_DAYS} and ${MAX_SCHEDULE_DAYS}`)
    .max(MAX_SCHEDULE_DAYS, `Days available must be between ${MIN_SCHEDULE_DAYS} and ${MAX_SCHEDULE_DAYS}`),
  days: z.array(scheduleDaySchema),
});

// Source Schema
export const kitSourceSchema = z.object({
  company: z.string().min(1, "Company name must be non-empty"),
  company_url: z.string().url("Company URL must be a valid URL"),
  role: z.string().min(1, "Role must be non-empty"),
  location: z.string().min(1, "Location must be non-empty"),
  jd_chars: z.number().int().min(0, "Job description character count must be non-negative"),
  researched_at: z.string().min(1, "Researched at timestamp must be non-empty"),
  pages_used: z.array(z.string()),
});

// Company Brief Schema
export const companyBriefSchema = z.object({
  summary: z.string().min(1, "Summary must be non-empty"),
  what_they_do: z.string().min(1, "What they do must be non-empty"),
  sources: z.array(z.string()),
});

// Role Schema
export const roleSchema = z.object({
  title: z.string().min(1, "Role title must be non-empty"),
  seniority: z.string().min(1, "Seniority must be non-empty"),
  responsibilities: z.array(z.string().min(1, "Responsibility must be non-empty")),
  requirements: z.array(requirementSchema),
});

// Coverage Schema
export const coverageSchema = z.object({
  uncovered_requirement_ids: z.array(z.string()),
  passes: z.number().int().min(0, "Coverage passes must be a non-negative integer"),
});

// Full InterviewPrepKit Base Object Schema
export const interviewPrepKitBaseSchema = z.object({
  source: kitSourceSchema,
  company_brief: companyBriefSchema,
  role: roleSchema,
  questions: z.array(interviewQuestionSchema),
  flashcards: z.array(flashcardSchema),
  schedule: scheduleSchema,
  coverage: coverageSchema,
});

// Refinement for Cross-Field & Referential Integrity Rules
export const interviewPrepKitSchema = interviewPrepKitBaseSchema.superRefine((data, ctx) => {
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
  // schedule.days.length must equal schedule.days_available
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
});

/**
 * Validates input against the InterviewPrepKit schema.
 * Throws a ZodError if validation fails, otherwise returns typed InterviewPrepKit.
 */
export function validateInterviewPrepKit(input: unknown): InterviewPrepKit {
  return interviewPrepKitSchema.parse(input) as InterviewPrepKit;
}

// Request validation schema for POST /api/kits
export const createKitInputSchema = z.object({
  jd: z
    .string()
    .trim()
    .min(1, "Job description cannot be empty")
    .max(MAX_JD_LENGTH, `Job description exceeds maximum length of ${MAX_JD_LENGTH} characters`),
  company_url: z
    .string()
    .trim()
    .url("Invalid URL format")
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Company URL must use http: or https: protocol" }
    ),
  days: z
    .number()
    .int("Days must be an integer")
    .min(MIN_SCHEDULE_DAYS, `Days must be between ${MIN_SCHEDULE_DAYS} and ${MAX_SCHEDULE_DAYS}`)
    .max(MAX_SCHEDULE_DAYS, `Days must be between ${MIN_SCHEDULE_DAYS} and ${MAX_SCHEDULE_DAYS}`),
});

// Auth validation schemas
export const registerInputSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const loginInputSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
