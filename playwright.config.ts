import { defineConfig, devices } from "@playwright/test";

/**
 * Mobile-first: the iPhone-width project runs every spec; desktop runs them
 * too (CODING_GUIDELINES: build at 375px, then scale up).
 * In CI the app is pre-built; webServer starts the production server.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["junit", { outputFile: "test-results/junit.xml" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_FILE: process.env.CI
        ? "./data/e2e.db"
        : (process.env.DATABASE_FILE ?? "./data/stateofus.db"),
    },
  },
});
