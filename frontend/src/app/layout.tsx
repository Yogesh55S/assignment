import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../components/ToastProvider";

export const metadata: Metadata = {
  title: "AI Interview Prep Kit",
  description: "Turn job descriptions and company URLs into targeted, structured interview preparation kits.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
