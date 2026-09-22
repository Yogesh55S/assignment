"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { EditableFlashcard } from "@interview-prep/shared/types/editableKit";
import type {
  FlashcardProgressItem,
  PracticeProgressSummary,
} from "@interview-prep/shared/types/editableKit";
import Link from "next/link";

interface PracticeSessionProps {
  kitId: string;
  role: string;
  company: string;
  flashcards: EditableFlashcard[];
  initialProgress: FlashcardProgressItem[];
  initialSummary: PracticeProgressSummary;
  onSaveResult: (flashcardId: string, confidence: 1 | 2 | 3) => Promise<void>;
}

export function PracticeSession({
  kitId,
  role,
  company,
  flashcards,
  initialProgress,
  initialSummary,
  onSaveResult,
}: PracticeSessionProps) {
  const [progressMap, setProgressMap] = useState<Map<string, FlashcardProgressItem>>(() => {
    const map = new Map<string, FlashcardProgressItem>();
    for (const p of initialProgress) {
      map.set(p.flashcardId, p);
    }
    return map;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sort flashcards:
  // 1. Uncovered cards first
  // 2. Lower confidence first (1 -> 2 -> 3)
  // 3. Older lastSeenAt first
  // 4. Stable card ID tiebreaker
  const orderedCards = useMemo(() => {
    return [...flashcards].sort((a, b) => {
      const progA = progressMap.get(a.id);
      const progB = progressMap.get(b.id);

      const coveredA = progA?.covered ? 1 : 0;
      const coveredB = progB?.covered ? 1 : 0;
      if (coveredA !== coveredB) {
        return coveredA - coveredB; // uncovered (0) before covered (1)
      }

      const confA = progA?.confidence ?? 0;
      const confB = progB?.confidence ?? 0;
      if (confA !== confB) {
        return confA - confB; // lower confidence first
      }

      const timeA = progA?.lastSeenAt ? new Date(progA.lastSeenAt).getTime() : 0;
      const timeB = progB?.lastSeenAt ? new Date(progB.lastSeenAt).getTime() : 0;
      if (timeA !== timeB) {
        return timeA - timeB; // older first
      }

      return a.id.localeCompare(b.id);
    });
  }, [flashcards, progressMap]);

  const currentCard = orderedCards[currentIndex];

  const handleReveal = useCallback(() => {
    setIsRevealed(true);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < orderedCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsRevealed(false);
      setSubmitError(null);
    }
  }, [currentIndex, orderedCards.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsRevealed(false);
      setSubmitError(null);
    }
  }, [currentIndex]);

  const handleRateConfidence = useCallback(
    async (confidence: 1 | 2 | 3) => {
      if (!currentCard || isSubmitting) return;

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        await onSaveResult(currentCard.id, confidence);

        // Update local progress map
        setProgressMap((prev) => {
          const next = new Map(prev);
          next.set(currentCard.id, {
            flashcardId: currentCard.id,
            confidence,
            covered: true,
            lastSeenAt: new Date().toISOString(),
          });
          return next;
        });

        // Automatically advance to next card if available
        if (currentIndex < orderedCards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setIsRevealed(false);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to record confidence rating.";
        setSubmitError(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentCard, isSubmitting, onSaveResult, currentIndex, orderedCards.length]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (!isRevealed) {
          handleReveal();
        }
      } else if (e.key === "1" && isRevealed) {
        e.preventDefault();
        handleRateConfidence(1);
      } else if (e.key === "2" && isRevealed) {
        e.preventDefault();
        handleRateConfidence(2);
      } else if (e.key === "3" && isRevealed) {
        e.preventDefault();
        handleRateConfidence(3);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRevealed, handleReveal, handleRateConfidence, handleNext, handlePrevious]);

  // Compute live summary stats
  const coveredCount = Array.from(progressMap.values()).filter((p) => p.covered).length;
  const totalCount = flashcards.length;
  const progressPercent = totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 0;

  if (flashcards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          No Flashcards in this Kit
        </h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Add flashcards in the kit builder to practice active recall.
        </p>
        <Link
          href={`/kits/${kitId}`}
          className="inline-block px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
        >
          Return to Kit Builder
        </Link>
      </div>
    );
  }

  const currentProg = currentCard ? progressMap.get(currentCard.id) : undefined;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Navigation & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <Link
            href={`/kits/${kitId}`}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1 mb-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Kit Builder
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Flashcard Practice: {role}
          </h1>
          <p className="text-xs text-slate-500">{company}</p>
        </div>

        {/* Progress bar and counter */}
        <div className="space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>
              {coveredCount} / {totalCount} Covered
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Flashcard Viewer */}
      <div className="relative min-h-[320px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm flex flex-col justify-between space-y-6">
        {/* Card Header: Card Index & Previous Confidence */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono font-medium">
            Card {currentIndex + 1} of {orderedCards.length} ({currentCard.id})
          </span>

          {currentProg ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              <span>Confidence:</span>
              <strong
                className={
                  currentProg.confidence === 3
                    ? "text-emerald-600"
                    : currentProg.confidence === 2
                    ? "text-amber-600"
                    : "text-red-500"
                }
              >
                {currentProg.confidence === 3
                  ? "High"
                  : currentProg.confidence === 2
                  ? "Medium"
                  : "Low"}
              </strong>
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
              Uncovered
            </span>
          )}
        </div>

        {/* Card Body: Front & Back */}
        <div className="space-y-6 my-auto text-center">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Question / Prompt
            </span>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed max-w-xl mx-auto">
              {currentCard.front}
            </p>
          </div>

          {isRevealed ? (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
                Target Answer & Key Concepts
              </span>
              <p className="text-base sm:text-lg text-slate-800 dark:text-slate-200 font-mono leading-relaxed max-w-xl mx-auto bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
                {currentCard.back}
              </p>
            </div>
          ) : (
            <div className="pt-4">
              <button
                type="button"
                onClick={handleReveal}
                className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Reveal Answer <span className="text-xs opacity-75 ml-1">[Space]</span>
              </button>
            </div>
          )}
        </div>

        {/* Card Footer: Rating Buttons (Visible when revealed) */}
        {isRevealed && (
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
            <span className="block text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
              Rate your recall confidence:
            </span>

            {submitError && (
              <div className="text-xs text-center text-red-600 bg-red-50 dark:bg-red-950/40 p-2 rounded max-w-md mx-auto">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => handleRateConfidence(1)}
                disabled={isSubmitting}
                className="px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/80 font-medium text-xs transition-colors flex flex-col items-center gap-0.5"
              >
                <span className="font-bold">Low</span>
                <span className="text-[10px] opacity-75">Review soon [1]</span>
              </button>

              <button
                type="button"
                onClick={() => handleRateConfidence(2)}
                disabled={isSubmitting}
                className="px-3 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/80 font-medium text-xs transition-colors flex flex-col items-center gap-0.5"
              >
                <span className="font-bold">Medium</span>
                <span className="text-[10px] opacity-75">Good recall [2]</span>
              </button>

              <button
                type="button"
                onClick={() => handleRateConfidence(3)}
                disabled={isSubmitting}
                className="px-3 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 font-medium text-xs transition-colors flex flex-col items-center gap-0.5"
              >
                <span className="font-bold">High</span>
                <span className="text-[10px] opacity-75">Mastered [3]</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls: Previous / Next & Reset */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Previous [←]
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentIndex(0);
            setIsRevealed(false);
          }}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
        >
          Restart session
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex === orderedCards.length - 1}
          className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5"
        >
          Next [→]
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
