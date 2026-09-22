"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ErrorAlert } from "./ErrorAlert";

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  errorMessage?: string;
  onClearError?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onSubmit,
  isLoading,
  errorMessage,
  onClearError,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Client-side validation
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setValidationError("Please enter a valid email address.");
      return;
    }

    if (mode === "register" && password.length < 8) {
      setValidationError("Password must be at least 8 characters long.");
      return;
    }

    if (mode === "login" && !password) {
      setValidationError("Password is required.");
      return;
    }

    try {
      await onSubmit(trimmedEmail, password);
    } catch (err: any) {
      // Error handling passed to parent
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          {isLogin ? "Welcome back" : "Create an account"}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {isLogin
            ? "Log in to access your interview preparation kits"
            : "Get started with your automated interview prep"}
        </p>
      </div>

      {(errorMessage || validationError) && (
        <div className="mb-4">
          <ErrorAlert
            message={errorMessage || validationError || ""}
            onDismiss={() => {
              setValidationError(null);
              onClearError?.();
            }}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
            placeholder="person@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Password {mode === "register" && <span className="text-xs text-slate-500">(min 8 characters)</span>}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center space-x-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{isLogin ? "Signing in..." : "Creating account..."}</span>
            </span>
          ) : (
            <span>{isLogin ? "Sign In" : "Sign Up"}</span>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600">
        {isLogin ? (
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Create an account
            </Link>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};
