"use client";

import React from "react";
import type { Requirement } from "@interview-prep/shared/types/kit";

interface RoleBreakdownProps {
  role: {
    title: string;
    seniority: string;
    responsibilities: string[];
    requirements: Requirement[];
  };
  location: string;
}

export function RoleBreakdown({ role, location }: RoleBreakdownProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Role & Competency Breakdown
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Extracted from the job posting to anchor questions and schedule coverage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-slate-700 dark:text-slate-300 font-medium">
            Seniority: <strong className="font-semibold">{role.seniority || "Not specified"}</strong>
          </span>
          <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-slate-700 dark:text-slate-300 font-medium">
            Location: <strong className="font-semibold">{location || "Not specified"}</strong>
          </span>
        </div>
      </div>

      {/* Responsibilities */}
      {role.responsibilities && role.responsibilities.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Key Responsibilities
          </h3>
          <ul className="space-y-1.5 list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
            {role.responsibilities.map((resp, idx) => (
              <li key={idx} className="leading-relaxed">
                {resp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Requirements */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Prioritized Competencies ({role.requirements?.length || 0})
          </h3>
          <span className="text-[11px] text-slate-400">
            Read-only to maintain study schedule integrity
          </span>
        </div>

        {(!role.requirements || role.requirements.length === 0) ? (
          <p className="text-xs text-slate-400 italic">No specific requirements extracted from this posting.</p>
        ) : (
          <div className="space-y-2">
            {role.requirements.map((req) => {
              const isMust = req.priority === "must";
              const kindBadge =
                req.kind === "technical"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-900"
                  : req.kind === "behavioural"
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-900"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900";

              return (
                <div
                  key={req.id}
                  className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono font-bold text-slate-500 text-[11px] mt-0.5">
                      [{req.id}]
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      {req.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${kindBadge}`}
                    >
                      {req.kind}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isMust
                          ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {req.priority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
