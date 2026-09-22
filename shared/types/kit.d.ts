export type RequirementKind = "technical" | "behavioural" | "domain";
export type RequirementPriority = "must" | "nice";
export type QuestionCategory = "technical" | "behavioural" | "system-design" | "company-fit";
export interface Requirement {
    id: string;
    text: string;
    kind: RequirementKind;
    priority: RequirementPriority;
}
export interface InterviewQuestion {
    id: string;
    requirement_ids: string[];
    category: QuestionCategory;
    prompt: string;
    answer_outline: string;
    difficulty: 1 | 2 | 3;
}
export interface Flashcard {
    id: string;
    front: string;
    back: string;
    requirement_ids: string[];
}
export interface ScheduleDay {
    day: number;
    focus: string;
    question_ids: string[];
    minutes: number;
}
export interface InterviewPrepKit {
    source: {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        researched_at: string;
        pages_used: string[];
    };
    company_brief: {
        summary: string;
        what_they_do: string;
        sources: string[];
    };
    role: {
        title: string;
        seniority: string;
        responsibilities: string[];
        requirements: Requirement[];
    };
    questions: InterviewQuestion[];
    flashcards: Flashcard[];
    schedule: {
        days_available: number;
        days: ScheduleDay[];
    };
    coverage: {
        uncovered_requirement_ids: string[];
        passes: number;
    };
}
export interface EvaluationCase {
    id: string;
    jd: string;
    company_url: string;
    days: number;
}
export interface EvaluationError {
    code: string;
    message: string;
}
export interface EvaluationResult {
    id: string;
    status: "ok" | "failed";
    kit: InterviewPrepKit | null;
    error: EvaluationError | null;
}
export interface EvaluationOutput {
    version: "1.0";
    generated_at: string;
    kits: EvaluationResult[];
}
export interface CreateKitInput {
    jd: string;
    company_url: string;
    days: number;
}
export interface UserResponse {
    id: string;
    email: string;
}
export interface AuthResponse {
    user: UserResponse;
}
export interface ApiErrorPayload {
    code: string;
    message: string;
    requestId?: string;
}
export interface ApiErrorResponse {
    error: ApiErrorPayload;
}
