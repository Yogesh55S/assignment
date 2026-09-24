"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "./Header";
import { ErrorAlert } from "./ErrorAlert";
import { retryKit, ApiException } from "../lib/api";
import { mapError } from "../lib/errorMapper";

interface FailedKitViewProps {
  kitId: string;
  errorCode?: string;
  errorMessage?: string;
  onSuccessRetry?: () => void;
}

export const FailedKitView: React.FC<FailedKitViewProps> = ({
  kitId,
  errorCode = "GENERATION_FAILED",
  errorMessage = "Kit generation encountered an error.",
  onSuccessRetry,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapped = mapError(errorCode, errorMessage);

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);

    try {
      await retryKit(kitId);
      if (onSuccessRetry) {
        onSuccessRetry();
      } else {
        window.location.reload();
      }
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(mapError(err.code, err.message).message);
      } else {
        setError(mapError("NETWORK_ERROR").message);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-6 shadow-xs">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 uppercase tracking-wider mb-4">
          Kit Generation Failed
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          Unable to complete interview kit generation
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mb-8 leading-relaxed">
          {mapped.message}
        </p>

        {error && (
          <div className="w-full mb-6 text-left">
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          {mapped.retryable && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isRetrying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Retrying generation...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry Generation
                </>
              )}
            </button>
          )}

          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm rounded-lg transition-colors text-center"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
};
