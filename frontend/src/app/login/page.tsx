"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../components/Header";
import { AuthForm } from "../../components/AuthForm";
import { apiRequest, ApiException } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // Login successful, cookie set via HTTP-only Set-Cookie header
      router.push("/dashboard");
    } catch (err: any) {
      if (err instanceof ApiException) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Unable to connect to authentication service.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <AuthForm
          mode="login"
          onSubmit={handleLogin}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onClearError={() => setErrorMessage(undefined)}
        />
      </main>
    </div>
  );
}
