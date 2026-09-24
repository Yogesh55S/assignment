"use client";

import React from "react";
import Link from "next/link";
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { status } = useAuth();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 py-8 sm:py-16 text-center max-w-4xl 2xl:max-w-6xl mx-auto w-full">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mb-6 max-w-full text-center">
          Engineering Assessment Baseline &bull; Full-Stack AI Platform
        </div>

        <h1 className="text-3xl min-[375px]:text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-4 sm:mb-6">
          AI Interview Prep Kit
        </h1>

        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mb-8 sm:mb-10 leading-relaxed px-2">
          Turn any job description and company URL into a comprehensive, structured interview preparation kit with tailored questions, flashcards, and a day-by-day study schedule.
        </p>

        <div className="flex flex-col min-[425px]:flex-row items-center gap-3 sm:gap-4 w-full min-[425px]:w-auto px-4">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="w-full min-[425px]:w-auto px-6 sm:px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm sm:text-base rounded-lg shadow-sm hover:shadow transition text-center"
            >
              Go to Dashboard &rarr;
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="w-full min-[425px]:w-auto px-6 sm:px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm sm:text-base rounded-lg shadow-sm hover:shadow transition text-center"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="w-full min-[425px]:w-auto px-6 sm:px-8 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm sm:text-base rounded-lg border border-slate-300 transition text-center"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-left w-full px-2 sm:px-0">
          <div className="p-5 sm:p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-3 sm:mb-4">
              1
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Company & Role Intel</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-normal">
              Automated research and requirement extraction categorized by technical, behavioral, and domain skills.
            </p>
          </div>

          <div className="p-5 sm:p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-3 sm:mb-4">
              2
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Targeted Questions</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-normal">
              Generated questions with answer outlines and active recall flashcards linked to job requirements.
            </p>
          </div>

          <div className="p-5 sm:p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-3 sm:mb-4">
              3
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Study Schedule</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-normal">
              Deterministic day-by-day study allocation customized to your days remaining before interview.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 bg-white">
        AI Interview Prep Kit &bull; Production Platform
      </footer>
    </div>
  );
}
