"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "../../../../components/Header";
import { LoadingState } from "../../../../components/LoadingState";
import { ErrorAlert } from "../../../../components/ErrorAlert";
import { PracticeSession } from "../../../../components/PracticeSession";
import {
  getCurrentUser,
  getKit,
  getPracticeProgress,
  savePracticeResult,
  type UserSession,
  type KitDetailResponse,
  type PracticeProgressResponse,
  ApiException,
} from "../../../../lib/api";

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id as string;

  const [user, setUser] = useState<UserSession | null>(null);
  const [kitData, setKitData] = useState<KitDetailResponse["kit"] | null>(null);
  const [practiceData, setPracticeData] = useState<PracticeProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const auth = await getCurrentUser();
      setUser(auth.user);

      const [kitRes, practiceRes] = await Promise.all([
        getKit(kitId),
        getPracticeProgress(kitId),
      ]);

      setKitData(kitRes.kit);
      setPracticeData(practiceRes);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof ApiException && err.status === 401) {
        router.push("/login");
        return;
      }
      setError("Failed to load flashcard practice session.");
    } finally {
      setIsLoading(false);
    }
  }, [kitId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveResult = async (flashcardId: string, confidence: 1 | 2 | 3) => {
    await savePracticeResult(kitId, {
      flashcardId,
      confidence,
      covered: true,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <LoadingState message="Preparing practice session..." />
        </main>
      </div>
    );
  }

  if (error || !kitData || !practiceData) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Header userEmail={user?.email} />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12">
          <ErrorAlert message={error || "Unable to load practice session."} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      <Header userEmail={user?.email} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <PracticeSession
          kitId={kitId}
          role={kitData.kit.role.title}
          company={kitData.kit.source.company}
          flashcards={kitData.kit.flashcards}
          initialProgress={practiceData.progress}
          initialSummary={practiceData.summary}
          onSaveResult={handleSaveResult}
        />
      </main>
    </div>
  );
}
