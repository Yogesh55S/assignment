"use client";

import React from "react";

interface RegenerateScheduleModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isRegenerating: boolean;
}

export const RegenerateScheduleModal: React.FC<RegenerateScheduleModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  isRegenerating,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 id="schedule-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
              Regenerate Study Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deterministic schedule recalculation
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Regenerate schedule will recalculate only your day-by-day study plan using the current questions and priorities. It will not change your questions, flashcards, company brief, or practice progress.
        </p>

        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
          Note: Schedule allocation is computed purely by code algorithms based on question difficulty and requirement priority. No AI model calls are made.
        </p>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isRegenerating}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isRegenerating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {isRegenerating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Recalculating...
              </>
            ) : (
              "Confirm & Recalculate"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
