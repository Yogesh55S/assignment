"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "../../../components/Header";
import { GenerationStepper, GENERATION_STEPS } from "../../../components/GenerationStepper";
import { ErrorAlert } from "../../../components/ErrorAlert";
import {
  getCurrentUser,
  createKit,
  getKitStatus,
  type UserSession,
  ApiException,
} from "../../../lib/api";

export default function NewKitPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
    let isMounted = true;
    async function verifyAuth() {
      try {
        const authData = await getCurrentUser();
        if (isMounted) {
          setUser(authData.user);
          setAuthLoading(false);
        }
      } catch {
        if (isMounted) {
          router.push("/login");
        }
      }
    }
    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, [router]);

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
      setError("Please paste a job description.");
      return;
    }
    if (trimmedJd.length > 50000) {
      setError("Job description exceeds the 50,000 character limit.");
      return;
    }

    const trimmedUrl = companyUrl.trim();
    if (!trimmedUrl) {
      setError("Please enter a target company website URL.");
      return;
    }

    if (days < 1 || days > 60 || !Number.isInteger(days)) {
      setError("Preparation days must be an integer between 1 and 60.");
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
              router.push(`/kits/${result.kitId}`);
            } else if (statusRes.status === "failed") {
              clearInterval(pollInterval);
              setIsSubmitting(false);
              setError(statusRes.error?.message || "Generation encountered an error.");
            }
          } catch {
            // Keep polling
          }
        }, 2500);
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof ApiException) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Kit generation failed. Please check the URL and try again.");
      }
    }
  };

  if (authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header userEmail={user?.email} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1 mb-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Create Interview Prep Kit</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Provide the job posting details and company URL to generate targeted questions, active-recall cards, and a day-by-day plan.
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {isSubmitting ? (
          <GenerationStepper
            currentStageIndex={currentStageIndex}
            stageMessage={stageMessage}
          />
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6"
          >
            {/* Job Description Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="jd-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Job Description <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {jd.length} / 50,000 characters
                </span>
              </div>
              <textarea
                id="jd-input"
                rows={9}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the raw job description text here... (We do not scrape external job board postings)"
                className="w-full text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow leading-relaxed"
                required
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Paste the job description directly. We do not fetch job-board postings.
              </p>
            </div>

            {/* Target Company URL */}
            <div>
              <label
                htmlFor="company-url-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Target Company Website <span className="text-red-500">*</span>
              </label>
              <input
                id="company-url-input"
                type="text"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                placeholder="e.g. https://stripe.com or stripe.com"
                className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                required
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                We safely crawl public about, culture, and career pages to contextualize your questions.
              </p>
            </div>

            {/* Days Available Input */}
            <div>
              <label
                htmlFor="days-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Days Available Until Interview <span className="text-red-500">*</span>
              </label>
              <input
                id="days-input"
                type="number"
                min={1}
                max={60}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10) || 1)}
                className="w-36 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                required
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Choose between 1 and 60 days. Our deterministic scheduler optimizes practice intensity.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                Generate Interview Kit
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
