import type { ResearchWarning } from "../research/types.js";

export interface InterviewDiscussionSource {
  url: string;
  title: string;
  text: string;
}

export interface InterviewDiscussionResult {
  sources: InterviewDiscussionSource[];
  warnings: ResearchWarning[];
}

export async function findPublicInterviewDiscussion(_input: {
  companyName: string;
  companyUrl: string;
}): Promise<InterviewDiscussionResult> {
  // Safe, honest no-op adapter for Phase 4 pending compliant discussion provider
  return {
    sources: [],
    warnings: [
      {
        code: "NO_PUBLIC_INTERVIEW_DISCUSSION",
        message:
          "No public interview-discussion source was available from the configured search adapter.",
      },
    ],
  };
}
