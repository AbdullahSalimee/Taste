import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org" }],
  },
  // Disable turbopack to fix Turbopack panic on Windows
  // Use webpack instead for stability
  experimental: {
    // Turbopack panics on Windows with complex CSS - use webpack
  },
};

export default nextConfig;
