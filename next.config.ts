import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  output: "standalone",
  serverExternalPackages: ["better-sqlite3", "geoip-lite"],
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/better-sqlite3/**/*",
      "./node_modules/geoip-lite/data/**",
    ],
    "/q/**/*": ["./node_modules/geoip-lite/data/**"],
  },
};

export default nextConfig;
