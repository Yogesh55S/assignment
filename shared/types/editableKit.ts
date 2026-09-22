import type {
  InterviewPrepKit,
  InterviewQuestion,
  Flashcard,
  QuestionCategory,
  Requirement,
  ScheduleDay,
} from "./kit.js";

export type ItemOrigin = "generated" | "user";

export interface QuestionMeta {
  origin: ItemOrigin;
  edited: boolean;
  pinned: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlashcardMeta {
  origin: ItemOrigin;
  edited: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyBriefMeta {
  edited: boolean;
  updatedAt?: string;
}

export interface EditableInterviewQuestion extends InterviewQuestion {
  _meta?: QuestionMeta;
}

export interface EditableFlashcard extends Flashcard {
  _meta?: FlashcardMeta;
}

export interface EditableCompanyBrief {
  summary: string;
  what_they_do: string;
  sources: string[];
  _meta?: CompanyBriefMeta;
}

export interface EditableInterviewPrepKit {
  source: {
    company: string;
    company_url: string;
    role: string;
    location: string;
    jd_chars: number;
    researched_at: string;
    pages_used: string[];
  };
  company_brief: EditableCompanyBrief;
  role: {
    title: string;
    seniority: string;
    responsibilities: string[];
    requirements: Requirement[];
  };
  questions: EditableInterviewQuestion[];
  flashcards: EditableFlashcard[];
  schedule: {
    days_available: number;
    days: ScheduleDay[];
  };
  coverage: {
    uncovered_requirement_ids: string[];
    passes: number;
  };
}

export interface KitUpdatePayload {
  kit: EditableInterviewPrepKit;
  clientUpdatedAt?: string;
}

export interface RegenerateSectionRequest {
  section: "company_brief" | "questions" | "schedule";
  category?: QuestionCategory;
  replaceEdited?: boolean;
  clientUpdatedAt?: string;
}

export interface PracticeSubmissionPayload {
  flashcardId: string;
  confidence: 1 | 2 | 3;
  covered?: boolean;
}

export interface FlashcardProgressItem {
  flashcardId: string;
  confidence: 1 | 2 | 3;
  covered: boolean;
  lastSeenAt: string;
}

export interface PracticeProgressSummary {
  total: number;
  covered: number;
  remaining: number;
}

export interface PracticeProgressResponse {
  progress: FlashcardProgressItem[];
  summary: PracticeProgressSummary;
}
