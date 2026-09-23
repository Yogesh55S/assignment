"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "../../../components/Header";
import { LoadingState } from "../../../components/LoadingState";
import { ErrorAlert } from "../../../components/ErrorAlert";
import { KitHeader } from "../../../components/KitHeader";
import { ResearchWarnings } from "../../../components/ResearchWarnings";
import { CompanyBriefEditor } from "../../../components/CompanyBriefEditor";
import { RoleBreakdown } from "../../../components/RoleBreakdown";
import { QuestionBank } from "../../../components/QuestionBank";
import { FlashcardList } from "../../../components/FlashcardList";
import { StudySchedule } from "../../../components/StudySchedule";
import type { SaveState } from "../../../components/SaveStatus";
import {
  getCurrentUser,
  getKit,
  updateKit,
  deleteKit,
  regenerateKitSection,
  type UserSession,
  type KitDetailResponse,
  ApiException,
} from "../../../lib/api";
import type {
  EditableInterviewPrepKit,
  EditableCompanyBrief,
  EditableInterviewQuestion,
  EditableFlashcard,
} from "@interview-prep/shared/types/editableKit";
import type { QuestionCategory } from "@interview-prep/shared/types/kit";

export default function KitBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id as string;

  const [user, setUser] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Server state & local draft state
  const [kitData, setKitData] = useState<KitDetailResponse["kit"] | null>(null);
  const [draft, setDraft] = useState<EditableInterviewPrepKit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Autosave and concurrency state
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null); // "brief" | category | "schedule"

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestDraftRef = useRef<EditableInterviewPrepKit | null>(null);
  latestDraftRef.current = draft;

  // 1. Initial Load & Auth Check
  const loadKitData = useCallback(async () => {
    try {
      const auth = await getCurrentUser();
      setUser(auth.user);
      setAuthLoading(false);

      const response = await getKit(kitId);
      setKitData(response.kit);
      setDraft(JSON.parse(JSON.stringify(response.kit.kit)));
      setLastSavedAt(response.kit.updatedAt);
      setSaveState("saved");
      setError(null);
    } catch (err: unknown) {
      if (err instanceof ApiException && err.status === 401) {
        router.push("/login");
        return;
      }
      setError("Failed to load interview kit. The kit may not exist or access is denied.");
    } finally {
      setIsLoading(false);
    }
  }, [kitId, router]);

  useEffect(() => {
    loadKitData();
  }, [loadKitData]);

  // 2. Perform Save API call
  const performSave = useCallback(
    async (draftToSave: EditableInterviewPrepKit) => {
      if (!kitData || isSaving) return;

      setIsSaving(true);
      setSaveState("saving");

      try {
        const response = await updateKit(kitId, draftToSave, kitData.updatedAt);
        setKitData(response.kit);
        setLastSavedAt(response.kit.updatedAt);
        setSaveState("saved");
      } catch (err: unknown) {
        if (err instanceof ApiException && err.status === 409) {
          setSaveState("conflict");
        } else {
          setSaveState("error");
        }
      } finally {
        setIsSaving(false);
      }
    },
    [kitId, kitData, isSaving]
  );

  // 3. Mark draft dirty and schedule debounced save (800ms)
  const scheduleDebouncedSave = useCallback(
    (newDraft: EditableInterviewPrepKit) => {
      setDraft(newDraft);
      setSaveState("dirty");

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        performSave(newDraft);
      }, 800);
    },
    [performSave]
  );

  // Explicit save action
  const handleExplicitSave = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    if (draft) {
      performSave(draft);
    }
  };

  // 4. Warn before leaving if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveState === "dirty") {
        e.preventDefault();
        e.returnValue = "You have unsaved changes that will be lost.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveState]);

  // Section Updates
  const handleBriefChange = (updatedBrief: EditableCompanyBrief) => {
    if (!draft) return;
    scheduleDebouncedSave({
      ...draft,
      company_brief: updatedBrief,
    });
  };

  const handleQuestionsChange = (updatedQuestions: EditableInterviewQuestion[]) => {
    if (!draft) return;
    scheduleDebouncedSave({
      ...draft,
      questions: updatedQuestions,
    });
  };

  const handleFlashcardsChange = (updatedFlashcards: EditableFlashcard[]) => {
    if (!draft) return;
    scheduleDebouncedSave({
      ...draft,
      flashcards: updatedFlashcards,
    });
  };

  // Regeneration handlers
  const handleRegenerateBrief = async (replaceEdited = false) => {
    if (!kitData) return;
    setIsRegenerating("brief");
    try {
      const res = await regenerateKitSection(
        kitId,
        {
          section: "company_brief",
          replaceEdited,
        },
        kitData.updatedAt
      );

      setKitData(res.kit);
      setDraft(JSON.parse(JSON.stringify(res.kit.kit)));
      setLastSavedAt(res.kit.updatedAt);
      setSaveState("saved");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to regenerate brief.";
      setError(msg);
    } finally {
      setIsRegenerating(null);
    }
  };

  const handleRegenerateCategory = async (category: QuestionCategory) => {
    if (!kitData) return;
    setIsRegenerating(category);
    try {
      const res = await regenerateKitSection(
        kitId,
        {
          section: "questions",
          category,
        },
        kitData.updatedAt
      );

      setKitData(res.kit);
      setDraft(JSON.parse(JSON.stringify(res.kit.kit)));
      setLastSavedAt(res.kit.updatedAt);
      setSaveState("saved");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to regenerate category questions.";
      setError(msg);
    } finally {
      setIsRegenerating(null);
    }
  };

  const handleRegenerateSchedule = async () => {
    if (!kitData) return;

    // If there are unsaved questions, save them first
    if (saveState === "dirty" && draft) {
      await performSave(draft);
    }

    setIsRegenerating("schedule");
    try {
      const res = await regenerateKitSection(
        kitId,
        {
          section: "schedule",
        },
        kitData.updatedAt
      );

      setKitData(res.kit);
      setDraft(JSON.parse(JSON.stringify(res.kit.kit)));
      setLastSavedAt(res.kit.updatedAt);
      setSaveState("saved");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to regenerate schedule.";
      setError(msg);
    } finally {
      setIsRegenerating(null);
    }
  };

  const handleDeleteKit = async () => {
    try {
      await deleteKit(kitId);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete kit.";
      setError(msg);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <LoadingState message="Loading kit builder..." />
        </main>
      </div>
    );
  }

  if (error && !draft) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Header userEmail={user?.email} />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
          <ErrorAlert message={error} />
        </main>
      </div>
    );
  }

  if (!draft) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      <Header userEmail={user?.email} />

      <main className="flex-1 max-w-7xl 2xl:max-w-[1800px] w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Kit Header with save status & controls */}
        <KitHeader
          kitId={kitId}
          role={draft.role.title}
          company={draft.source.company}
          daysAvailable={draft.schedule.days_available}
          saveState={saveState}
          lastSavedAt={lastSavedAt}
          onSave={handleExplicitSave}
          onDelete={handleDeleteKit}
          onRefresh={loadKitData}
          isSaving={isSaving}
        />

        {error && (
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        )}

        {/* Research Warnings Section */}
        {kitData?.warnings && kitData.warnings.length > 0 && (
          <ResearchWarnings warnings={kitData.warnings} />
        )}

        {/* Section 1: Company Brief */}
        <CompanyBriefEditor
          brief={draft.company_brief}
          onChange={handleBriefChange}
          onRegenerate={handleRegenerateBrief}
          isRegenerating={isRegenerating === "brief"}
        />

        {/* Section 2: Role Breakdown */}
        <RoleBreakdown
          role={draft.role}
          location={draft.source.location}
        />

        {/* Section 3: Question Bank */}
        <QuestionBank
          questions={draft.questions}
          requirements={draft.role.requirements}
          onChange={handleQuestionsChange}
          onRegenerateCategory={handleRegenerateCategory}
          isRegeneratingCategory={
            isRegenerating === "technical" ||
            isRegenerating === "behavioural" ||
            isRegenerating === "system-design" ||
            isRegenerating === "company-fit"
          }
        />

        {/* Section 4: Flashcards */}
        <FlashcardList
          flashcards={draft.flashcards}
          requirements={draft.role.requirements}
          onChange={handleFlashcardsChange}
        />

        {/* Section 5: Study Schedule */}
        <StudySchedule
          schedule={draft.schedule}
          questions={draft.questions}
          onRegenerateSchedule={handleRegenerateSchedule}
          isRegeneratingSchedule={isRegenerating === "schedule"}
          hasUnsavedChanges={saveState === "dirty"}
        />
      </main>
    </div>
  );
}
