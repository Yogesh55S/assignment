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
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="w-full max-w-md mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          {isLogin ? "Welcome back" : "Create an account"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
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
            className="block text-xs sm:text-sm font-medium text-slate-700 mb-1"
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
            className="block text-xs sm:text-sm font-medium text-slate-700 mb-1"
          >
            Password {mode === "register" && <span className="text-xs text-slate-500">(min 8 characters)</span>}
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none transition rounded"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.04 10.04 0 014.122-.963c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21f-18-18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
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

      <div className="mt-6 text-center text-xs sm:text-sm text-slate-600">
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
