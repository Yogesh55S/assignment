"use client";

import React from "react";
import type { QuestionCategory } from "@interview-prep/shared/types/kit";

interface RegenerateCategoryModalProps {
  isOpen: boolean;
  category: QuestionCategory;
  replaceableCount: number;
  preservedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isRegenerating: boolean;
}

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  technical: "Technical Questions",
  behavioural: "Behavioural Questions",
  "system-design": "System Design Questions",
  "company-fit": "Company Fit Questions",
};

export const RegenerateCategoryModal: React.FC<RegenerateCategoryModalProps> = ({
  isOpen,
  category,
  replaceableCount,
  preservedCount,
  onConfirm,
  onCancel,
  isRegenerating,
}) => {
  if (!isOpen) return null;

  const categoryName = CATEGORY_LABELS[category] || category;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <h3 id="modal-title" className="text-base font-bold text-slate-900 dark:text-white">
              Regenerate {categoryName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Confirm replacing unedited AI questions
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Regenerating this category will replace only generated, unedited, and unpinned questions in this category. Your edited, pinned, and manually added questions will be preserved.
        </p>

        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400">Questions to Replace:</span>
            <p className="font-bold text-slate-900 dark:text-white text-sm">{replaceableCount}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Protected / Preserved:</span>
            <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{preservedCount}</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
          Note: Your schedule will be recalculated using the final question set.
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
                Regenerating...
              </>
            ) : (
              "Confirm & Regenerate"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
