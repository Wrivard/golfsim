import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { databaseConnection } from "./connection";

const { Pool } = pg;

export const pool = new Pool({ connectionString: databaseConnection(), max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 });
export const db = drizzle(pool, { schema });

export * from "./schema";
