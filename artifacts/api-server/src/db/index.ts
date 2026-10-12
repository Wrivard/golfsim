import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "@workspace/db/schema";
import ws from "ws";
import { databaseConnection } from "@workspace/db/connection";

neonConfig.webSocketConstructor = ws;

export const pool = new Pool({ connectionString: databaseConnection(), max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 });
export const db = drizzle(pool, { schema });
