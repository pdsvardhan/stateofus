import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * Mobile-first: the iPhone-width project runs every spec; desktop runs them
 * too (CODING_GUIDELINES: build at 375px, then scale up).
 *
 * CI runs the production standalone server on a dedicated port (the Gitea
 * runner uses host networking — :3000 belongs to another service there) with
 * a freshly seeded throwaway DB (global-setup). Locally we reuse `npm run dev`.
 */
const PORT = Number(process.env.PW_PORT ?? (process.env.CI ? 4123 : 3000));
const BASE = `http://127.0.0.1:${PORT}`;
// ABSOLUTE path: the standalone server chdirs into .next/standalone, so a
// relative DATABASE_FILE would silently point at a fresh empty db (404s).
const E2E_DB = path.resolve(__dirname, "data", "e2e.db");

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  globalSetup: "./tests/e2e/global-setup.ts",
  reporter: process.env.CI
    ? [["list"], ["junit", { outputFile: "test-results/junit.xml" }]]
    : "list",
  use: {
    baseURL: BASE,
    trace: "retain-on-failure",
  },
  projects: [
    // Pixel 5: chromium-based mobile emulation (393px) — webkit isn't
    // installed on the runner; thumb-reach assertions hold the same.
    { name: "mobile", use: { ...devices["Pixel 5"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: process.env.CI
      ? // standalone build: static + public must sit inside the standalone dir
        "sh -c 'cp -r .next/static .next/standalone/.next/ && mkdir -p .next/standalone/public && cp -r public/. .next/standalone/public/ && cp -r drizzle .next/standalone/ 2>/dev/null; node .next/standalone/server.js'"
      : "npm run dev",
    url: `${BASE}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
      DATABASE_FILE: E2E_DB,
      DEVICE_HASH_SALT: process.env.DEVICE_HASH_SALT ?? "e2e-salt",
    },
  },
});
