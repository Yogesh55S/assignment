"use client";

import React, { useState } from "react";
import type { EditableInterviewQuestion } from "@interview-prep/shared/types/editableKit";
import type { QuestionCategory, Requirement } from "@interview-prep/shared/types/kit";
import { ConfirmDialog } from "./ConfirmDialog";

interface QuestionCardProps {
  question: EditableInterviewQuestion;
  index: number;
  totalInCategory: number;
  allRequirements: Requirement[];
  onChange: (updatedQuestion: EditableInterviewQuestion) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

const CATEGORIES: QuestionCategory[] = [
  "technical",
  "behavioural",
  "system-design",
  "company-fit",
];

export function QuestionCard({
  question,
  index,
  totalInCategory,
  allRequirements,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: QuestionCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isUser = question._meta?.origin === "user";
  const isEdited = question._meta?.edited === true;
  const isPinned = question._meta?.pinned === true;

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...question,
      prompt: e.target.value,
      _meta: {
        origin: question._meta?.origin || "generated",
        edited: true,
        pinned: question._meta?.pinned || false,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleAnswerOutlineChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...question,
      answer_outline: e.target.value,
      _meta: {
        origin: question._meta?.origin || "generated",
        edited: true,
        pinned: question._meta?.pinned || false,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const diff = parseInt(e.target.value, 10) as 1 | 2 | 3;
    onChange({
      ...question,
      difficulty: diff,
      _meta: {
        origin: question._meta?.origin || "generated",
        edited: true,
        pinned: question._meta?.pinned || false,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value as QuestionCategory;
    onChange({
      ...question,
      category: cat,
      _meta: {
        origin: question._meta?.origin || "generated",
        edited: true,
        pinned: question._meta?.pinned || false,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleTogglePin = () => {
    onChange({
      ...question,
      _meta: {
        origin: question._meta?.origin || "generated",
        edited: question._meta?.edited || false,
        pinned: !isPinned,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-sm">
      {/* Top bar: ID, metadata badges, controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/70 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            Question {index + 1}
          </span>
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            ID: {question.id}
          </span>

          {/* Badges */}
          {isPinned && (
            <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1">
              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
              </svg>
              Pinned
            </span>
          )}

          {isUser ? (
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Your Question
            </span>
          ) : (
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              Generated
            </span>
          )}

          {isEdited && !isUser && (
            <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              Edited
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Move Up */}
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move up"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* Move Down */}
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={index === totalInCategory - 1}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move down"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Pin toggle */}
          <button
            type="button"
            onClick={handleTogglePin}
            className={`p-1 rounded transition-colors ${
              isPinned
                ? "text-amber-600 hover:text-amber-700 dark:text-amber-400"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            title={isPinned ? "Unpin question" : "Pin question (protects from regeneration)"}
          >
            <svg className="w-4 h-4" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1 rounded text-slate-400 hover:text-red-600 transition-colors"
            title="Delete question"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Selectors: Category & Difficulty */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Category
          </label>
          <select
            value={question.category}
            onChange={handleCategoryChange}
            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Difficulty
          </label>
          <select
            value={question.difficulty}
            onChange={handleDifficultyChange}
            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Level 1 - Foundational (10 min)</option>
            <option value={2}>Level 2 - Applied (15 min)</option>
            <option value={3}>Level 3 - Advanced / Deep-Dive (20 min)</option>
          </select>
        </div>
      </div>

      {/* Inline Prompt Editor */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
          Interview Question Prompt
        </label>
        <textarea
          rows={2}
          value={question.prompt}
          onChange={handlePromptChange}
          className="w-full text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow leading-relaxed"
          placeholder="Enter question prompt..."
        />
      </div>

      {/* Inline Answer Outline Editor */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
          Target Answer Outline & Discussion Points
        </label>
        <textarea
          rows={4}
          value={question.answer_outline}
          onChange={handleAnswerOutlineChange}
          className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow leading-relaxed font-mono"
          placeholder="Bullet points and key concepts expected in an ideal answer..."
        />
      </div>

      {/* Linked Requirement Chips */}
      <div>
        <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Linked Competencies
        </span>
        <div className="flex flex-wrap gap-1.5">
          {question.requirement_ids.map((rId) => {
            const req = allRequirements.find((r) => r.id === rId);
            return (
              <span
                key={rId}
                className="text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900 inline-flex items-center gap-1"
                title={req?.text || rId}
              >
                <strong>{rId}</strong>
                {req ? `: ${req.text.slice(0, 30)}${req.text.length > 30 ? "..." : ""}` : ""}
              </span>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Question"
        message={`Are you sure you want to delete question ${question.id}? The study schedule will need to be regenerated to remove this question from study days.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(question.id);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
