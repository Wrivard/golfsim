import { pool } from "@workspace/db";
import { logger } from "../lib/logger";

// A single ordinary PostgreSQL pool supports both Neon and Supabase.
// Parameterized queries remain unnamed: no session-bound prepared statements.
pool.on("error", () => {
  logger.warn("An idle database connection failed; the pool will replace it.");
});

export { db, pool } from "@workspace/db";
