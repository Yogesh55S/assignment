/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@interview-prep/shared"],
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Map Vercel's API_URL (server-side) → NEXT_PUBLIC_API_URL (browser-accessible)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "",
  },
};

export default nextConfig;
