import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "@workspace/db/schema";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("NEON_DATABASE_URL or DATABASE_URL environment variable is required");
}

const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
