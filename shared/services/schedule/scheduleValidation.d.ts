import type { InterviewPrepKit, Requirement, InterviewQuestion } from "../../types/kit.js";
export type ScheduleValidationIssue = {
    code: string;
    message: string;
    day?: number;
    questionId?: string;
    requirementId?: string;
};
export type ScheduleValidationResult = {
    valid: boolean;
    issues: ScheduleValidationIssue[];
};
/**
 * Validates a generated study schedule against domain and consistency rules.
 * Never throws for ordinary invalid input; collects and returns all issues.
 */
export declare function validateStudySchedule(input: {
    schedule: InterviewPrepKit["schedule"];
    requirements: Requirement[];
    questions: InterviewQuestion[];
}): ScheduleValidationResult;
