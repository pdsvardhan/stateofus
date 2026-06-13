/**
 * Playwright global setup — seeds a throwaway e2e database so specs run
 * against the real 105-question launch content, never mocks.
 * Path is ABSOLUTE (must match playwright.config.ts E2E_DB — the standalone
 * server chdirs and would otherwise open a different file).
 */
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

const E2E_DB = path.resolve(__dirname, "..", "..", "data", "e2e.db");

export default function globalSetup() {
  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(`${E2E_DB}${suffix}`, { force: true });
  }
  execSync("npx tsx scripts/seed.ts", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_FILE: E2E_DB,
      DEVICE_HASH_SALT: process.env.DEVICE_HASH_SALT ?? "e2e-salt",
    },
  });
}
