import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a standalone build for Docker deployment (Railway, etc.)
  output: "standalone",
};

export default nextConfig;
