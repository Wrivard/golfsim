import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { databasePoolConfiguration } from "./connection";

const { Pool } = pg;

export const pool = new Pool({
  ...databasePoolConfiguration(),
  // Preserve spare connections: Calendar edit callbacks can read credentials
  // while a booking transaction is holding another connection.
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
