import { sql } from "drizzle-orm";
import { users } from "@/db/schema";

// Case-insensitive, whitespace-tolerant match on users.email. Phones and
// migrated records mix capitalisation, and a plain eq() silently found no
// account (so no reset email and no log entry) whenever the case differed.
export const emailMatches = (email: string) => sql`lower(${users.email}) = ${email.trim().toLowerCase()}`;
