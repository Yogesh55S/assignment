import React from "react";
import Link from "next/link";
import { Header } from "../components/Header";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mb-6">
          Engineering Assessment Baseline &bull; Phase 1 Foundation
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
          AI Interview Prep Kit
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
          Turn any job description and company URL into a comprehensive, structured interview preparation kit with tailored questions, flashcards, and a day-by-day study schedule.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg border border-slate-300 transition"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 bg-white rounded-xl border border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">
              1
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Company & Role Intel</h3>
            <p className="text-sm text-slate-500">
              Automated research and requirement extraction categorized by technical, behavioral, and domain skills.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">
              2
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Targeted Questions</h3>
            <p className="text-sm text-slate-500">
              Generated questions with answer outlines and active recall flashcards linked to job requirements.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">
              3
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Study Schedule</h3>
            <p className="text-sm text-slate-500">
              Deterministic day-by-day study allocation customized to your days remaining before interview.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 bg-white">
        AI Interview Prep Kit &bull; Full-Stack Foundation Scaffold
      </footer>
    </div>
  );
}
