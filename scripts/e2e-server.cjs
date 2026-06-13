/**
 * E2E server launcher — feat-* e2e harness.
 *
 * Two CI-runner problems this solves, in order:
 *
 * 1. Env propagation: Playwright's nested-shell spawn doesn't reliably pass
 *    webServer.env (or an inlined `VAR=x node`) into the standalone server.
 *    Fix: SPAWN `node server.js` with an explicit env object carrying the
 *    absolute e2e DATABASE_FILE — exactly what works by hand.
 *
 * 2. Seed/serve race: Playwright starts the webServer BEFORE globalSetup. If
 *    globalSetup rm+reseeds e2e.db after the server opened it, the server's fd
 *    points at the deleted (empty) inode while the data lands in a new file —
 *    every /q/* 404s. Fix: SEED HERE, before the server starts, so the server
 *    only ever opens a fully-seeded db. globalSetup no longer touches the db.
 */
const { spawn, execSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const repoRoot = path.resolve(__dirname, "..");
const standalone = path.join(repoRoot, ".next", "standalone");
const e2eDb = path.join(repoRoot, "data", "e2e.db");
const salt = process.env.DEVICE_HASH_SALT || "e2e-salt";

// Fresh seed BEFORE the server opens the db (blocking — health check waits).
for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(`${e2eDb}${suffix}`, { force: true });
execSync("npx tsx scripts/seed.ts", {
  cwd: repoRoot,
  stdio: "inherit",
  env: { ...process.env, DATABASE_FILE: e2eDb, DEVICE_HASH_SALT: salt },
});

fs.cpSync(path.join(repoRoot, ".next", "static"), path.join(standalone, ".next", "static"), {
  recursive: true,
});
const pub = path.join(repoRoot, "public");
if (fs.existsSync(pub)) {
  fs.mkdirSync(path.join(standalone, "public"), { recursive: true });
  fs.cpSync(pub, path.join(standalone, "public"), { recursive: true });
}
const drizzleSrc = path.join(repoRoot, "drizzle");
if (fs.existsSync(drizzleSrc)) {
  fs.cpSync(drizzleSrc, path.join(standalone, "drizzle"), { recursive: true });
}

const child = spawn("node", ["server.js"], {
  cwd: standalone,
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_FILE: path.join(repoRoot, "data", "e2e.db"),
    DEVICE_HASH_SALT: process.env.DEVICE_HASH_SALT || "e2e-salt",
    PORT: process.env.PORT || "4123",
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
  },
});

child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
