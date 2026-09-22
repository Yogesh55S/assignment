"use client";

import React, { useState } from "react";
import type { ScheduleDay } from "@interview-prep/shared/types/kit";
import type { EditableInterviewQuestion } from "@interview-prep/shared/types/editableKit";
import { ConfirmDialog } from "./ConfirmDialog";

interface StudyScheduleProps {
  schedule: {
    days_available: number;
    days: ScheduleDay[];
  };
  questions: EditableInterviewQuestion[];
  onRegenerateSchedule: () => Promise<void>;
  isRegeneratingSchedule: boolean;
  hasUnsavedChanges: boolean;
}

export function StudySchedule({
  schedule,
  questions,
  onRegenerateSchedule,
  isRegeneratingSchedule,
  hasUnsavedChanges,
}: StudyScheduleProps) {
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  // Check if any schedule day references a question that no longer exists in questions
  const validQuestionIdSet = new Set(questions.map((q) => q.id));
  const hasDanglingReferences = schedule.days.some((day) =>
    day.question_ids.some((qId) => !validQuestionIdSet.has(qId))
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Daily Study Schedule ({schedule.days_available} Days)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Optimized study sequence prioritizing must-have topics and higher-difficulty practice.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRegenConfirm(true)}
          disabled={isRegeneratingSchedule}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1.5 border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          {isRegeneratingSchedule ? (
            <>
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Recalculating schedule...</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Regenerate Schedule</span>
            </>
          )}
        </button>
      </div>

      {/* Warning banner if questions changed or dangling IDs exist */}
      {(hasDanglingReferences || hasUnsavedChanges) && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <span className="font-semibold">Questions have been modified or deleted.</span>
            <p className="mt-0.5 text-amber-800 dark:text-amber-300">
              Regenerate the study schedule to ensure every practice day has accurate question assignments and time allocations.
            </p>
          </div>
        </div>
      )}

      {/* Days grid */}
      <div className="space-y-4">
        {schedule.days.map((day) => {
          return (
            <div
              key={day.day}
              className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold font-mono bg-blue-600 text-white px-2.5 py-1 rounded-md">
                    Day {day.day}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {day.focus}
                  </span>
                </div>

                <div className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded">
                  ~{day.minutes} min
                </div>
              </div>

              {/* Linked Questions */}
              {day.question_ids && day.question_ids.length > 0 ? (
                <div className="space-y-1.5 pl-2 border-l-2 border-slate-200 dark:border-slate-800">
                  {day.question_ids.map((qId) => {
                    const qObj = questions.find((q) => q.id === qId);
                    if (!qObj) {
                      return (
                        <div
                          key={qId}
                          className="text-xs text-red-500 dark:text-red-400 font-mono italic"
                        >
                          [Deleted Question: {qId}] — Please regenerate schedule
                        </div>
                      );
                    }

                    return (
                      <div
                        key={qId}
                        className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                      >
                        <span className="font-mono font-bold text-slate-500 shrink-0">
                          {qId}:
                        </span>
                        <span className="line-clamp-1">{qObj.prompt}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono ml-auto shrink-0">
                          ({qObj.category})
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Review, consolidation, and practice session.</p>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={showRegenConfirm}
        title="Regenerate Study Schedule"
        message="This recalculates the daily schedule based on your current questions. It will not alter questions, flashcards, or your company brief."
        confirmText="Recalculate Schedule"
        variant="primary"
        onConfirm={() => {
          setShowRegenConfirm(false);
          onRegenerateSchedule();
        }}
        onCancel={() => setShowRegenConfirm(false)}
      />
    </div>
  );
}
