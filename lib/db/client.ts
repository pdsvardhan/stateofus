/**
 * SQLite client — single connection, WAL mode, FK on.
 *
 * DATABASE_FILE defaults to ./data/stateofus.db for local dev; the container
 * sets /data/stateofus.db (volume owned by uid 1000). Never open a second
 * connection — better-sqlite3 is synchronous and this module is the singleton.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema";

const file = process.env.DATABASE_FILE ?? "./data/stateofus.db";
mkdirSync(dirname(file), { recursive: true });

export const rawDb = new Database(file);
rawDb.pragma("journal_mode = WAL");
rawDb.pragma("foreign_keys = ON");
rawDb.pragma("busy_timeout = 5000");

export const db = drizzle(rawDb, { schema });
