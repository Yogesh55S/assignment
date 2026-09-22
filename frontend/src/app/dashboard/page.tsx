"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "../../components/Header";
import { LoadingState } from "../../components/LoadingState";
import { EmptyState } from "../../components/EmptyState";
import { ErrorAlert } from "../../components/ErrorAlert";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import {
  getCurrentUser,
  listKits,
  deleteKit,
  type UserSession,
  type KitSummaryItem,
  ApiException,
} from "../../lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [kits, setKits] = useState<KitSummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kitToDelete, setKitToDelete] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const authData = await getCurrentUser();
        if (!isMounted) return;
        setUser(authData.user);

        const kitsData = await listKits();
        if (!isMounted) return;
        setKits(kitsData.kits || []);
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof ApiException && err.status === 401) {
          router.push("/login");
          return;
        }
        setError("Failed to load interview kits.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      const { apiRequest } = await import("../../lib/api");
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  const handleDeleteKit = async (id: string) => {
    try {
      await deleteKit(id);
      setKits((prev) => prev.filter((k) => k._id !== id));
      setKitToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete kit.";
      setError(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <LoadingState message="Loading your interview prep dashboard..." />
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header userEmail={user.email} onLogout={handleLogout} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-8 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Welcome back, <span className="font-medium text-slate-800 dark:text-slate-200">{user.email}</span>
            </p>
          </div>

          <div>
            <Link
              href="/kits/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Create New Kit
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* Kits Grid or Empty State */}
        {kits.length === 0 ? (
          <div className="max-w-2xl mx-auto my-12">
            <EmptyState
              title="No interview prep kits yet"
              description="Enter a target job description, company URL, and your timeline to generate tailored questions, active-recall flashcards, and an optimized daily schedule."
            />
            <div className="text-center mt-6">
              <Link
                href="/kits/new"
                className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
              >
                Create your first kit
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kits.map((item) => {
              const kit = item.kit;
              const roleTitle = kit?.role?.title || "Target Role";
              const companyName = kit?.source?.company || "Target Company";
              const daysAvailable = kit?.schedule?.days_available || 5;
              const status = item.generationStatus;

              return (
                <div
                  key={item._id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full capitalize ${
                          status === "ready"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : status === "generating"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 animate-pulse"
                            : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                        }`}
                      >
                        {status}
                      </span>
                      <span className="text-slate-400">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                      {roleTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Company: <strong className="text-slate-700 dark:text-slate-300">{companyName}</strong>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Timeline: <strong className="text-slate-700 dark:text-slate-300">{daysAvailable} days</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      href={`/kits/${item._id}`}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1"
                    >
                      Open Kit Builder
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setKitToDelete(item._id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                      title="Delete kit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={!!kitToDelete}
        title="Delete Kit"
        message="Are you sure you want to delete this kit? This action cannot be undone."
        confirmText="Delete permanently"
        variant="danger"
        onConfirm={() => kitToDelete && handleDeleteKit(kitToDelete)}
        onCancel={() => setKitToDelete(null)}
      />
    </div>
  );
}
