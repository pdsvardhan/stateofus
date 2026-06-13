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
    // scripts/e2e-server.cjs sets DATABASE_FILE in-process before starting the
    // standalone server. Playwright's nested-shell spawn on the Gitea runner
    // does NOT reliably propagate webServer.env or an inlined `VAR=x node` into
    // the server process (it fell back to the empty default db — /q/* 404'd
    // while /api/health passed on SELECT 1). The wrapper removes the shell.
    command: process.env.CI ? `node scripts/e2e-server.cjs` : "npm run dev",
    url: `${BASE}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT: String(PORT),
      DEVICE_HASH_SALT: process.env.DEVICE_HASH_SALT ?? "e2e-salt",
    },
  },
});
