"use client";

import React from "react";

export type SaveState = "saved" | "saving" | "dirty" | "conflict" | "error";

interface SaveStatusProps {
  state: SaveState;
  lastSavedAt?: string;
  onRefresh?: () => void;
  onRetry?: () => void;
}

export function SaveStatus({
  state,
  lastSavedAt,
  onRefresh,
  onRetry,
}: SaveStatusProps) {
  if (state === "saving") {
    return (
      <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <svg
          className="animate-spin h-3.5 w-3.5 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        <span>Saving changes...</span>
      </div>
    );
  }

  if (state === "dirty") {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        <span>Unsaved changes</span>
      </div>
    );
  }

  if (state === "conflict") {
    return (
      <div className="inline-flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded border border-red-200 dark:border-red-900">
        <span>Version conflict: kit changed elsewhere.</span>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="underline font-semibold hover:text-red-700"
          >
            Refresh
          </button>
        )}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="inline-flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400">
        <span>Save failed.</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="underline font-semibold hover:text-red-700"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span>
        Saved
        {lastSavedAt
          ? ` (${new Date(lastSavedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })})`
          : ""}
      </span>
    </div>
  );
}
