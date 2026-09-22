"use client";

import React, { useState } from "react";
import type { EditableCompanyBrief } from "@interview-prep/shared/types/editableKit";
import { ConfirmDialog } from "./ConfirmDialog";

interface CompanyBriefEditorProps {
  brief: EditableCompanyBrief;
  onChange: (updatedBrief: EditableCompanyBrief) => void;
  onRegenerate: (replaceEdited?: boolean) => Promise<void>;
  isRegenerating: boolean;
}

export function CompanyBriefEditor({
  brief,
  onChange,
  onRegenerate,
  isRegenerating,
}: CompanyBriefEditorProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isEdited = brief._meta?.edited === true;

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...brief,
      summary: e.target.value,
      _meta: {
        edited: true,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleWhatTheyDoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...brief,
      what_they_do: e.target.value,
      _meta: {
        edited: true,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleRegenerateClick = () => {
    if (isEdited) {
      setShowConfirmModal(true);
    } else {
      onRegenerate(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Target Company Brief
          </h2>
          {isEdited && (
            <span className="text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              Edited by you
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleRegenerateClick}
          disabled={isRegenerating}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1.5 border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {isRegenerating ? (
            <>
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Regenerating brief...</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Regenerate Brief</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="company-summary"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
          >
            Executive Summary
          </label>
          <textarea
            id="company-summary"
            rows={3}
            value={brief.summary}
            onChange={handleSummaryChange}
            className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow leading-relaxed"
            placeholder="Summarize target company background and mission..."
          />
        </div>

        <div>
          <label
            htmlFor="what-they-do"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
          >
            What They Do & Products
          </label>
          <textarea
            id="what-they-do"
            rows={4}
            value={brief.what_they_do}
            onChange={handleWhatTheyDoChange}
            className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow leading-relaxed"
            placeholder="Detail the core business, engineering focus, and products..."
          />
        </div>

        {brief.sources && brief.sources.length > 0 && (
          <div>
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Verified Web Sources
            </span>
            <div className="flex flex-wrap gap-2">
              {brief.sources.map((src, idx) => (
                <a
                  key={idx}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                >
                  <span>{src}</span>
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirmModal}
        title="Regenerate Company Brief"
        message="You have edited this company brief. By default, regeneration preserves your custom edits. Would you like to keep your edited brief or overwrite it with a freshly generated version?"
        confirmText="Replace with generated brief"
        cancelText="Keep my edits"
        variant="warning"
        onConfirm={() => {
          setShowConfirmModal(false);
          onRegenerate(true); // explicit replace
        }}
        onCancel={() => {
          setShowConfirmModal(false);
          onRegenerate(false); // keep edits
        }}
      />
    </div>
  );
}
