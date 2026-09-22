"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SaveStatus, type SaveState } from "./SaveStatus";
import { ConfirmDialog } from "./ConfirmDialog";

interface KitHeaderProps {
  kitId: string;
  role: string;
  company: string;
  daysAvailable: number;
  saveState: SaveState;
  lastSavedAt?: string;
  onSave: () => void;
  onDelete: () => void;
  onRefresh?: () => void;
  isSaving: boolean;
}

export function KitHeader({
  kitId,
  role,
  company,
  daysAvailable,
  saveState,
  lastSavedAt,
  onSave,
  onDelete,
  onRefresh,
  isSaving,
}: KitHeaderProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-8 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-xs text-slate-400 font-mono">Kit #{kitId.slice(-6)}</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {role || "Untitled Role"}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Target Company: <span className="font-semibold text-slate-900 dark:text-slate-200">{company}</span>{" "}
            • <span className="font-medium text-blue-600 dark:text-blue-400">{daysAvailable}-Day</span> Prep Plan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SaveStatus
            state={saveState}
            lastSavedAt={lastSavedAt}
            onRefresh={onRefresh}
            onRetry={onSave}
          />

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || saveState === "saved"}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
              saveState === "dirty"
                ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600 shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed"
            }`}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>

          <Link
            href={`/kits/${kitId}/practice`}
            className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Practice Flashcards
          </Link>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
            title="Delete kit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Interview Prep Kit"
        message="Are you sure you want to delete this kit? All questions, flashcard practice history, and study schedules will be permanently deleted."
        confirmText="Delete permanently"
        variant="danger"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
