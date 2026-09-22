"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../components/Header";
import { AuthForm } from "../../components/AuthForm";
import { apiRequest, ApiException } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleRegister = async (email: string, password: string) => {
    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // Registered and authenticated successfully
      router.push("/dashboard");
    } catch (err: any) {
      if (err instanceof ApiException) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Unable to connect to registration service.");
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
