// Single database client for the app.
//
// Local development uses SQLite (zero-config, file-based) via better-sqlite3.
// Production should set DATABASE_URL to a Postgres connection string and
// swap the two lines marked below — the schema in schema.ts uses column
// types chosen to be portable between the two, so no schema rewrite is
// needed, only the driver.

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "node:path";

const DB_PATH = process.env.SQLITE_PATH || path.join(process.cwd(), "data", "cseag.db");

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// --- To move to PostgreSQL for production, replace the block above with: ---
// import postgres from "postgres";
// import { drizzle } from "drizzle-orm/postgres-js";
// const client = postgres(process.env.DATABASE_URL!);
// export const db = drizzle(client, { schema });
