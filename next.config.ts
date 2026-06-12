import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/better-sqlite3/**/*"],
  },
};

export default nextConfig;
