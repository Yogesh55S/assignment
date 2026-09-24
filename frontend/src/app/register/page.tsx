"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../components/Header";
import { AuthForm } from "../../components/AuthForm";
import { useAuth } from "../../context/AuthContext";
import { apiRequest, ApiException } from "../../lib/api";
import { mapError } from "../../lib/errorMapper";

export default function RegisterPage() {
  const router = useRouter();
  const { status, refreshAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const handleRegister = async (email: string, password: string) => {
    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      await refreshAuth();
      router.replace("/dashboard");
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        const mapped = mapError(err.code, err.message);
        setErrorMessage(mapped.message);
      } else {
        setErrorMessage(mapError("NETWORK_ERROR").message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <AuthForm
          mode="register"
          onSubmit={handleRegister}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onClearError={() => setErrorMessage(undefined)}
        />
      </main>
    </div>
  );
}
