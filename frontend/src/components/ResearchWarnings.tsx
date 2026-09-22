"use client";

import React, { useState } from "react";

interface ResearchWarningItem {
  code: string;
  message: string;
}

interface ResearchWarningsProps {
  warnings: ResearchWarningItem[];
}

export function ResearchWarnings({ warnings }: ResearchWarningsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const realWarnings = (warnings || []).filter(
    (w) => w && w.code && w.code !== "VERIFIED_RESEARCH" && w.code !== "INFO"
  );

  if (realWarnings.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20 p-3 text-sm text-amber-900 dark:text-amber-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="font-medium">
            {realWarnings.length} research warning{realWarnings.length > 1 ? "s" : ""} detected during generation
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-semibold underline hover:text-amber-800 dark:hover:text-amber-100"
        >
          {isOpen ? "Hide details" : "View details"}
        </button>
      </div>

      {isOpen && (
        <ul className="mt-3 space-y-1.5 pl-6 list-disc text-xs text-amber-800 dark:text-amber-300">
          {realWarnings.map((w, idx) => (
            <li key={idx}>
              <strong className="font-mono text-[11px]">{w.code}</strong>: {w.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
