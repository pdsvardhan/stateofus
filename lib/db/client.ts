/**
 * SQLite client — single connection, WAL mode, FK on.
 *
 * DATABASE_FILE defaults to ./data/stateofus.db for local dev; the container
 * sets /data/stateofus.db (volume owned by uid 1000). Never open a second
 * connection — better-sqlite3 is synchronous and this module is the singleton.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import * as schema from "./schema";

const file = process.env.DATABASE_FILE ?? "./data/stateofus.db";
mkdirSync(dirname(file), { recursive: true });

export const rawDb = new Database(file);
rawDb.pragma("journal_mode = WAL");
rawDb.pragma("foreign_keys = ON");
rawDb.pragma("busy_timeout = 5000");

export const db = drizzle(rawDb, { schema });

// Migrate on first open at RUNTIME only. `next build` collects page data by
// importing every route module — which imports this file — but the build must
// never touch a database (the Gitea runner reuses its workspace, so a leftover
// data/stateofus.db would make CREATE TABLE re-run and fail the build). The
// container + seed + tests all run at runtime, where migration is wanted.
// The try/catch tolerates a db already at head from a prior boot or push.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const migrationsFolder = join(process.cwd(), "drizzle");
if (!isBuildPhase && existsSync(migrationsFolder)) {
  try {
    migrate(db, { migrationsFolder });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/already exists/.test(msg)) throw err;
  }
}
