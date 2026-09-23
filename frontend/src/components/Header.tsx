import React from "react";
import Link from "next/link";

interface HeaderProps {
  userEmail?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userEmail, onLogout }) => {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl 2xl:max-w-[1800px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 shrink-0">
          <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
            AI
          </span>
          <span className="font-semibold text-slate-900 tracking-tight text-xs sm:text-base truncate max-w-[110px] min-[375px]:max-w-none">
            Interview Prep Kit
          </span>
        </Link>

        <nav className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          {userEmail ? (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm font-medium text-slate-600 hidden md:inline-block truncate max-w-[150px] lg:max-w-none">
                {userEmail}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 px-2.5 sm:px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 transition"
              >
                Log out
              </button>
            </div>
          ) : (
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
