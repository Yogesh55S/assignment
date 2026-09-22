"use client";

import React, { useState } from "react";
import type { EditableFlashcard } from "@interview-prep/shared/types/editableKit";
import type { Requirement } from "@interview-prep/shared/types/kit";
import { ConfirmDialog } from "./ConfirmDialog";

interface FlashcardListProps {
  flashcards: EditableFlashcard[];
  requirements: Requirement[];
  onChange: (updatedFlashcards: EditableFlashcard[]) => void;
}

export function FlashcardList({
  flashcards,
  requirements,
  onChange,
}: FlashcardListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newReqIds, setNewReqIds] = useState<string[]>(
    requirements.length > 0 ? [requirements[0].id] : []
  );
  const [addError, setAddError] = useState<string | null>(null);

  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  // Compute next sequential flashcard ID
  const computeNextFlashcardId = (): string => {
    let maxId = 0;
    for (const f of flashcards) {
      const match = f.id.match(/^f(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
    }
    return `f${maxId + 1}`;
  };

  const handleCardFrontChange = (id: string, front: string) => {
    const nextList = flashcards.map((f) =>
      f.id === id
        ? {
            ...f,
            front,
            _meta: {
              origin: f._meta?.origin || "generated",
              edited: true,
              updatedAt: new Date().toISOString(),
            },
          }
        : f
    );
    onChange(nextList);
  };

  const handleCardBackChange = (id: string, back: string) => {
    const nextList = flashcards.map((f) =>
      f.id === id
        ? {
            ...f,
            back,
            _meta: {
              origin: f._meta?.origin || "generated",
              edited: true,
              updatedAt: new Date().toISOString(),
            },
          }
        : f
    );
    onChange(nextList);
  };

  const handleDeleteCard = (id: string) => {
    const nextList = flashcards.filter((f) => f.id !== id);
    onChange(nextList);
    setCardToDelete(null);
  };

  const handleCreateFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim()) {
      setAddError("Front prompt is required.");
      return;
    }
    if (!newBack.trim()) {
      setAddError("Back answer is required.");
      return;
    }
    if (newReqIds.length === 0) {
      setAddError("Please select at least one linked requirement.");
      return;
    }

    const newId = computeNextFlashcardId();
    const newCard: EditableFlashcard = {
      id: newId,
      front: newFront.trim(),
      back: newBack.trim(),
      requirement_ids: newReqIds,
      _meta: {
        origin: "user",
        edited: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    onChange([...flashcards, newCard]);
    setNewFront("");
    setNewBack("");
    setShowAddForm(false);
    setAddError(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Active-Recall Flashcards ({flashcards.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key concepts and definitions for quick revision in Practice Mode.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          {showAddForm ? "Close Form" : "Add Flashcard"}
        </button>
      </div>

      {/* Add Flashcard Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateFlashcard}
          className="bg-slate-50 dark:bg-slate-950/60 border border-blue-200 dark:border-blue-900/50 rounded-xl p-5 space-y-4 animate-in fade-in duration-150"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Add New Flashcard ({computeNextFlashcardId()})
          </h3>

          {addError && (
            <div className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-900">
              {addError}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Front (Question or Prompt)
              </label>
              <textarea
                rows={2}
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                placeholder="e.g. What is the difference between TCP and UDP?"
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Back (Key Concept / Definition)
              </label>
              <textarea
                rows={3}
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                placeholder="Target answer and concise explanation..."
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Linked Requirement
              </span>
              <div className="flex flex-wrap gap-2">
                {requirements.map((req) => (
                  <label
                    key={req.id}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono cursor-pointer border transition-colors ${
                      newReqIds.includes(req.id)
                        ? "bg-blue-600 text-white border-blue-600 font-semibold"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={newReqIds.includes(req.id)}
                      onChange={() => {
                        setNewReqIds((prev) =>
                          prev.includes(req.id)
                            ? prev.filter((id) => id !== req.id)
                            : [...prev, req.id]
                        );
                      }}
                    />
                    {req.id} ({req.priority})
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Save Flashcard
            </button>
          </div>
        </form>
      )}

      {/* Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flashcards.length === 0 ? (
          <div className="col-span-2 text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No flashcards available in this kit.
            </p>
          </div>
        ) : (
          flashcards.map((card) => {
            const isUser = card._meta?.origin === "user";
            const isEdited = card._meta?.edited === true;

            return (
              <div
                key={card.id}
                className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {card.id}
                    </span>
                    {isUser ? (
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Your Card
                      </span>
                    ) : isEdited ? (
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                        Edited
                      </span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCardToDelete(card.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    title="Delete card"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Front
                  </label>
                  <textarea
                    rows={2}
                    value={card.front}
                    onChange={(e) => handleCardFrontChange(card.id, e.target.value)}
                    className="w-full text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Back
                  </label>
                  <textarea
                    rows={3}
                    value={card.back}
                    onChange={(e) => handleCardBackChange(card.id, e.target.value)}
                    className="w-full text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {card.requirement_ids && card.requirement_ids.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {card.requirement_ids.map((rId) => (
                      <span
                        key={rId}
                        className="text-[10px] font-mono bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded"
                      >
                        {rId}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={!!cardToDelete}
        title="Delete Flashcard"
        message={`Are you sure you want to delete flashcard ${cardToDelete}?`}
        confirmText="Delete"
        variant="danger"
        onConfirm={() => cardToDelete && handleDeleteCard(cardToDelete)}
        onCancel={() => setCardToDelete(null)}
      />
    </div>
  );
}
