"use client";

import React from "react";

export interface StepperStep {
  id: string;
  label: string;
}

export const GENERATION_STEPS: StepperStep[] = [
  { id: "validating_input", label: "Validating input" },
  { id: "extracting_requirements", label: "Extracting job requirements" },
  { id: "researching_company", label: "Researching company & careers" },
  { id: "searching_interview_discussion", label: "Looking for interview context" },
  { id: "generating_company_brief", label: "Building company brief" },
  { id: "generating_questions", label: "Generating question bank" },
  { id: "checking_coverage", label: "Checking requirement coverage" },
  { id: "building_schedule", label: "Allocating study schedule" },
  { id: "validating_kit", label: "Validating kit structure" },
];

interface GenerationStepperProps {
  currentStageIndex: number;
  stageMessage?: string;
}

export function GenerationStepper({
  currentStageIndex,
  stageMessage,
}: GenerationStepperProps) {
  return (
    <div
      className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm"
      role="region"
      aria-label="Generation progress"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Generating your interview prep kit
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generation can take around a minute depending on web crawling and model availability.
          </p>
        </div>
        <div className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-900">
          Step {Math.min(currentStageIndex + 1, GENERATION_STEPS.length)} of {GENERATION_STEPS.length}
        </div>
      </div>

      <div
        className="space-y-3"
        aria-live="polite"
        aria-atomic="true"
      >
        {GENERATION_STEPS.map((step, index) => {
          const isDone = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isPending = index > currentStageIndex;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 text-sm transition-opacity duration-200 ${
                isPending ? "opacity-40" : "opacity-100"
              }`}
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full shrink-0">
                {isDone ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                )}
              </div>

              <span
                className={`font-medium ${
                  isCurrent
                    ? "text-blue-600 dark:text-blue-400 font-semibold"
                    : isDone
                    ? "text-slate-800 dark:text-slate-200"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {step.label}
              </span>

              {isCurrent && stageMessage && (
                <span className="text-xs text-slate-400 italic">
                  — {stageMessage}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
