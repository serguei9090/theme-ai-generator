import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@theme-ai/core"],
  serverExternalPackages: ["@github/copilot-sdk"],
};

export default nextConfig;
