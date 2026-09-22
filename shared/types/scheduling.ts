import type { InterviewPrepKit } from "./kit.js";

export type QuestionSchedulingScore = {
  questionId: string;
  score: number;
  priorityWeight: number;
  difficultyWeight: number;
  linkedRequirementIds: string[];
  hasMustRequirement: boolean;
  highestDifficulty: 1 | 2 | 3;
};

export type ScheduleAllocationOptions = {
  minutesByDifficulty?: {
    1: number;
    2: number;
    3: number;
  };
  emptyDayMinutes?: number;
};

export type ScheduleAllocationResult = {
  schedule: InterviewPrepKit["schedule"];
  questionScores: QuestionSchedulingScore[];
  scheduledQuestionIds: string[];
  unscheduledQuestionIds: string[];
  mustRequirementIdsScheduled: string[];
};
