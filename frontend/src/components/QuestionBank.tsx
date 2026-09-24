"use client";

import React, { useState } from "react";
import type { EditableInterviewQuestion } from "@interview-prep/shared/types/editableKit";
import type { QuestionCategory, Requirement } from "@interview-prep/shared/types/kit";
import { QuestionCard } from "./QuestionCard";
import { QuestionEditor } from "./QuestionEditor";
import { RegenerateCategoryModal } from "./RegenerateCategoryModal";

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

  // Calculate protected vs replaceable question counts
  const preservedCount = activeQuestions.filter((q) => {
    if (!q._meta) return false;
    return q._meta.origin === "user" || q._meta.edited === true || q._meta.pinned === true;
  }).length;
  const replaceableCount = activeQuestions.length - preservedCount;

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
      {/* Header with section title & category tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Interview Question Bank
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Structured questions categorized by domain and technical skills.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-semibold rounded-lg border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Question
          </button>

          <button
            type="button"
            onClick={() => setShowRegenConfirm(true)}
            disabled={isRegeneratingCategory}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Regenerate Category
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar gap-1">
        {CATEGORIES.map((cat) => {
          const count = questions.filter((q) => q.category === cat.id).length;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
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
      <RegenerateCategoryModal
        isOpen={showRegenConfirm}
        category={activeCategory}
        replaceableCount={replaceableCount}
        preservedCount={preservedCount}
        onConfirm={() => {
          setShowRegenConfirm(false);
          onRegenerateCategory(activeCategory);
        }}
        onCancel={() => setShowRegenConfirm(false)}
        isRegenerating={isRegeneratingCategory}
      />
    </div>
  );
}
