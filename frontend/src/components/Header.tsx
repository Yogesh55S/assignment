"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  userEmail?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userEmail: propEmail, onLogout: propLogout }) => {
  const { status, user, logout } = useAuth();

  const isAuth = status === "authenticated";
  const isLoading = status === "loading";
  const emailToDisplay = propEmail || user?.email;

  const handleLogout = () => {
    if (propLogout) {
      propLogout();
    } else {
      logout();
    }
  };

  // Determine logo href based on auth status
  const logoHref = isAuth ? "/dashboard" : "/";

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl 2xl:max-w-[1800px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
        {isLoading ? (
          <div className="flex items-center space-x-2 shrink-0 cursor-default opacity-80">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
              AI
            </span>
            <span className="font-semibold text-slate-900 tracking-tight text-xs sm:text-base truncate max-w-[110px] min-[375px]:max-w-none">
              Interview Prep Kit
            </span>
          </div>
        ) : (
          <Link href={logoHref} className="flex items-center space-x-2 shrink-0">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
              AI
            </span>
            <span className="font-semibold text-slate-900 tracking-tight text-xs sm:text-base truncate max-w-[110px] min-[375px]:max-w-none">
              Interview Prep Kit
            </span>
          </Link>
        )}

        <nav aria-label="Main Navigation" className="flex items-center space-x-2 sm:space-x-4 shrink-0 min-h-[36px]">
          {isLoading ? (
            // Neutral accessible skeleton placeholder during loading - eliminates navbar flicker
            <div className="flex items-center space-x-2" aria-live="polite" aria-busy="true">
              <div className="w-24 sm:w-32 h-8 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" aria-hidden="true" />
            </div>
          ) : isAuth ? (
            // Authenticated navigation
            <div className="flex items-center space-x-2 sm:space-x-4">
              {emailToDisplay && (
                <span className="text-xs sm:text-sm font-medium text-slate-600 hidden md:inline-block truncate max-w-[150px] lg:max-w-none">
                  {emailToDisplay}
                </span>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 px-2.5 sm:px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 transition"
              >
                Log out
              </button>
            </div>
          ) : (
            // Unauthenticated navigation
            <div className="flex items-center space-x-1.5 sm:space-x-3">
              <Link
                href="/login"
                className="text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 px-2.5 sm:px-3 py-1.5 rounded-md transition"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 sm:px-4 py-1.5 rounded-md shadow-sm transition whitespace-nowrap"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
