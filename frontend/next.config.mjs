/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@interview-prep/shared"],
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
