// Single database client for the app.
//
// Postgres via postgres-js — required for Vercel's serverless runtime, which
// has no persistent local filesystem for SQLite. Set DATABASE_URL for both
// local development and production (e.g. a Neon connection string).

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local (see .env.example).");
}

const client = postgres(process.env.DATABASE_URL, { max: 1 });

export const db = drizzle(client, { schema });
