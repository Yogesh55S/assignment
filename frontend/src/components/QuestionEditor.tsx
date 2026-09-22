"use client";

import React, { useState } from "react";
import type { EditableInterviewQuestion } from "@interview-prep/shared/types/editableKit";
import type { QuestionCategory, Requirement } from "@interview-prep/shared/types/kit";

interface QuestionEditorProps {
  isOpen: boolean;
  defaultCategory: QuestionCategory;
  allRequirements: Requirement[];
  nextQuestionId: string;
  onSave: (newQuestion: EditableInterviewQuestion) => void;
  onCancel: () => void;
}

const CATEGORIES: QuestionCategory[] = [
  "technical",
  "behavioural",
  "system-design",
  "company-fit",
];

export function QuestionEditor({
  isOpen,
  defaultCategory,
  allRequirements,
  nextQuestionId,
  onSave,
  onCancel,
}: QuestionEditorProps) {
  const [prompt, setPrompt] = useState("");
  const [answerOutline, setAnswerOutline] = useState("");
  const [category, setCategory] = useState<QuestionCategory>(defaultCategory);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(2);
  const [selectedReqIds, setSelectedReqIds] = useState<string[]>(
    allRequirements.length > 0 ? [allRequirements[0].id] : []
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleReq = (rId: string) => {
    setSelectedReqIds((prev) =>
      prev.includes(rId) ? prev.filter((id) => id !== rId) : [...prev, rId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError("Please provide a question prompt.");
      return;
    }
    if (!answerOutline.trim()) {
      setError("Please provide an answer outline.");
      return;
    }
    if (selectedReqIds.length === 0) {
      setError("Please select at least one linked requirement.");
      return;
    }

    const newQ: EditableInterviewQuestion = {
      id: nextQuestionId,
      requirement_ids: selectedReqIds,
      category,
      prompt: prompt.trim(),
      answer_outline: answerOutline.trim(),
      difficulty,
      _meta: {
        origin: "user",
        edited: true,
        pinned: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    onSave(newQ);
    // Reset form
    setPrompt("");
    setAnswerOutline("");
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-question-title"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3
            id="add-question-title"
            className="text-lg font-bold text-slate-900 dark:text-white"
          >
            Add Custom Interview Question ({nextQuestionId})
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 p-2.5 rounded border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as QuestionCategory)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value, 10) as 1 | 2 | 3)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Level 1 - Foundational (10 min)</option>
                <option value={2}>Level 2 - Applied (15 min)</option>
                <option value={3}>Level 3 - Advanced (20 min)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Question Prompt
            </label>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. How would you design a distributed caching layer?"
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Answer Outline & Key Concepts
            </label>
            <textarea
              rows={4}
              value={answerOutline}
              onChange={(e) => setAnswerOutline(e.target.value)}
              placeholder="Key concepts, architecture choices, trade-offs, and examples expected..."
              className="w-full text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Link to Competencies (Select at least one)
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-950/40">
              {allRequirements.map((req) => {
                const checked = selectedReqIds.includes(req.id);
                return (
                  <label
                    key={req.id}
                    className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 p-1.5 rounded transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleReq(req.id)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <strong className="font-mono text-blue-600 dark:text-blue-400">[{req.id}]</strong>{" "}
                      ({req.priority}): {req.text}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Add Question
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
