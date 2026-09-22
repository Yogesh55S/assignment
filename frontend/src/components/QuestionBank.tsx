"use client";

import React, { useState } from "react";
import type { EditableInterviewQuestion } from "@interview-prep/shared/types/editableKit";
import type { QuestionCategory, Requirement } from "@interview-prep/shared/types/kit";
import { QuestionCard } from "./QuestionCard";
import { QuestionEditor } from "./QuestionEditor";
import { ConfirmDialog } from "./ConfirmDialog";

interface QuestionBankProps {
  questions: EditableInterviewQuestion[];
  requirements: Requirement[];
  onChange: (updatedQuestions: EditableInterviewQuestion[]) => void;
  onRegenerateCategory: (category: QuestionCategory) => Promise<void>;
  isRegeneratingCategory: boolean;
}

const CATEGORIES: { id: QuestionCategory; label: string }[] = [
  { id: "technical", label: "Technical" },
  { id: "behavioural", label: "Behavioural" },
  { id: "system-design", label: "System Design" },
  { id: "company-fit", label: "Company Fit" },
];

export function QuestionBank({
  questions,
  requirements,
  onChange,
  onRegenerateCategory,
  isRegeneratingCategory,
}: QuestionBankProps) {
  const [activeCategory, setActiveCategory] = useState<QuestionCategory>("technical");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  // Filter questions for active tab
  const activeQuestions = questions.filter((q) => q.category === activeCategory);

  // Compute next sequential question ID
  const computeNextQuestionId = (): string => {
    let maxId = 0;
    for (const q of questions) {
      const match = q.id.match(/^q(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
    }
    return `q${maxId + 1}`;
  };

  const handleUpdateQuestion = (updated: EditableInterviewQuestion) => {
    const nextList = questions.map((q) => (q.id === updated.id ? updated : q));
    onChange(nextList);
  };

  const handleDeleteQuestion = (id: string) => {
    const nextList = questions.filter((q) => q.id !== id);
    onChange(nextList);
  };

  const handleAddQuestion = (newQ: EditableInterviewQuestion) => {
    onChange([...questions, newQ]);
    setShowAddModal(false);
  };

  const handleMoveUp = (indexInCategory: number) => {
    if (indexInCategory === 0) return;
    const currentQ = activeQuestions[indexInCategory];
    const prevQ = activeQuestions[indexInCategory - 1];

    const curGlobalIdx = questions.findIndex((q) => q.id === currentQ.id);
    const prevGlobalIdx = questions.findIndex((q) => q.id === prevQ.id);

    const nextList = [...questions];
    nextList[curGlobalIdx] = prevQ;
    nextList[prevGlobalIdx] = currentQ;

    onChange(nextList);
  };

  const handleMoveDown = (indexInCategory: number) => {
    if (indexInCategory >= activeQuestions.length - 1) return;
    const currentQ = activeQuestions[indexInCategory];
    const nextQ = activeQuestions[indexInCategory + 1];

    const curGlobalIdx = questions.findIndex((q) => q.id === currentQ.id);
    const nextGlobalIdx = questions.findIndex((q) => q.id === nextQ.id);

    const nextList = [...questions];
    nextList[curGlobalIdx] = nextQ;
    nextList[nextGlobalIdx] = currentQ;

    onChange(nextList);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Interview Question Bank ({questions.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organized by category. Reorder questions or move between categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Add Question
          </button>

          <button
            type="button"
            onClick={() => setShowRegenConfirm(true)}
            disabled={isRegeneratingCategory}
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {isRegeneratingCategory ? (
              <>
                <div className="w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                <span>Regenerating {activeCategory}...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Regenerate Category</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {CATEGORIES.map((cat) => {
          const count = questions.filter((q) => q.category === cat.id).length;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-2 ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? "bg-slate-700 text-slate-200 dark:bg-slate-200 dark:text-slate-800"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Question Cards List */}
      <div className="space-y-4">
        {activeQuestions.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No questions in this category yet.
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Add a question now
            </button>
          </div>
        ) : (
          activeQuestions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              totalInCategory={activeQuestions.length}
              allRequirements={requirements}
              onChange={handleUpdateQuestion}
              onDelete={handleDeleteQuestion}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))
        )}
      </div>

      {/* Add Question Modal */}
      <QuestionEditor
        isOpen={showAddModal}
        defaultCategory={activeCategory}
        allRequirements={requirements}
        nextQuestionId={computeNextQuestionId()}
        onSave={handleAddQuestion}
        onCancel={() => setShowAddModal(false)}
      />

      {/* Regenerate Category Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRegenConfirm}
        title={`Regenerate ${activeCategory} Questions`}
        message="Generated unedited, unpinned questions in this category will be replaced with fresh AI questions. Your custom questions, edited questions, and pinned questions will be strictly kept. Other categories will not be changed. Daily schedule will be recalculated."
        confirmText="Regenerate"
        variant="warning"
        onConfirm={() => {
          setShowRegenConfirm(false);
          onRegenerateCategory(activeCategory);
        }}
        onCancel={() => setShowRegenConfirm(false)}
      />
    </div>
  );
}
