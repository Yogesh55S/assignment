"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "../../../components/Header";
import { GenerationStepper, GENERATION_STEPS } from "../../../components/GenerationStepper";
import { ErrorAlert } from "../../../components/ErrorAlert";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/ToastProvider";
import {
  createKit,
  getKitStatus,
  ApiException,
} from "../../../lib/api";
import { mapError } from "../../../lib/errorMapper";

export default function NewKitPage() {
  const router = useRouter();
  const { status: authStatus } = useAuth();
  const { showToast } = useToast();

  // Form inputs
  const [jd, setJd] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [days, setDays] = useState(5);

  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageMessage, setStageMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  // Advance stepper periodically during generation to provide engaging feedback
  useEffect(() => {
    if (!isSubmitting) {
      setCurrentStageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        // Stop advancing at validating_kit until finished
        if (prev < GENERATION_STEPS.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client validation
    const trimmedJd = jd.trim();
    if (!trimmedJd) {
      const msg = "Please paste a job description.";
      setError(msg);
      showToast(msg, "error");
      return;
    }
    if (trimmedJd.length > 50000) {
      const msg = "Job description exceeds the 50,000 character limit.";
      setError(msg);
      showToast(msg, "error");
      return;
    }

    const trimmedUrl = companyUrl.trim();
    if (!trimmedUrl) {
      const msg = mapError("INVALID_COMPANY_URL").message;
      setError(msg);
      showToast(msg, "error");
      return;
    }

    if (days < 1 || days > 60 || !Number.isInteger(days)) {
      const msg = "Preparation days must be an integer between 1 and 60.";
      setError(msg);
      showToast(msg, "error");
      return;
    }

    setIsSubmitting(true);
    setCurrentStageIndex(0);
    setStageMessage("Initiating pipeline...");

    try {
      const result = await createKit({
        jd: trimmedJd,
        company_url: trimmedUrl,
        days,
      });

      // HTTP 201 or 200 (reused ready kit)
      if (result.kit?._id) {
        setCurrentStageIndex(GENERATION_STEPS.length - 1);
        showToast("Kit generated successfully!", "success");
        router.push(`/kits/${result.kit._id}`);
        return;
      }

      // HTTP 202: Kit already generating in background
      if (result.kitId) {
        setStageMessage("Kit is currently generating. Checking status...");
        // Poll status every 2.5s
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await getKitStatus(result.kitId!);
            if (statusRes.status === "ready") {
              clearInterval(pollInterval);
              showToast("Kit generated successfully!", "success");
              router.push(`/kits/${result.kitId}`);
            } else if (statusRes.status === "failed") {
              clearInterval(pollInterval);
              setIsSubmitting(false);
              const mapped = mapError(statusRes.error?.code, statusRes.error?.message);
              setError(mapped.message);
              showToast(mapped.message, "error");
            }
          } catch {
            // Keep polling
          }
        }, 2500);
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof ApiException) {
        const mapped = mapError(err.code, err.message);
        setError(mapped.message);
        showToast(mapped.message, "error");
      } else {
        const mapped = mapError("NETWORK_ERROR");
        setError(mapped.message);
        showToast(mapped.message, "error");
      }
    }
  };

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" aria-label="Loading authentication..." />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header />

      <main className="flex-1 max-w-3xl 2xl:max-w-5xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <Link
            href="/dashboard"
            className="text-xs sm:text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1 mb-2"
          >
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Create Interview Prep Kit</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Provide a target company website URL and job description to generate your customized kit.
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {isSubmitting ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm text-center">
            <h2 className="text-lg font-bold mb-2">Generating Your Kit</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">{stageMessage}</p>
            <GenerationStepper currentStageIndex={currentStageIndex} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
            <div>
              <label htmlFor="companyUrl" className="block text-xs sm:text-sm font-semibold mb-1">
                Company Website URL <span className="text-red-500">*</span>
              </label>
              <input
                id="companyUrl"
                type="url"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                placeholder="https://example.com"
                required
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="jd" className="block text-xs sm:text-sm font-semibold mb-1">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="jd"
                rows={8}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the full job posting text here..."
                required
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs"
              />
            </div>

            <div>
              <label htmlFor="days" className="block text-xs sm:text-sm font-semibold mb-1">
                Preparation Timeline (Days) <span className="text-red-500">*</span>
              </label>
              <input
                id="days"
                type="number"
                min={1}
                max={60}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10) || 1)}
                required
                className="w-24 px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm transition-colors"
              >
                Generate Interview Prep Kit
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
