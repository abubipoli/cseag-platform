// Run pending SQL migrations against the local SQLite database.
// Usage: npx tsx src/db/migrate.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";

const DB_PATH = process.env.SQLITE_PATH || path.join(process.cwd(), "data", "cseag.db");
const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
console.log("Migrations applied to", DB_PATH);
sqlite.close();
