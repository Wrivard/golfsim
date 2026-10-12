import session from "express-session";
import { createHash } from "node:crypto";
import type { SqlClient } from "./sql";

export class PostgresSessionStore extends session.Store {
  constructor(private readonly sql: SqlClient) { super(); }
  private key(id: string) { return createHash("sha256").update(id).digest("hex"); }
  private expiry(data: session.SessionData) {
    return data.cookie?.expires ? new Date(data.cookie.expires) : new Date(Date.now() + 86400000);
  }
  get(id: string, callback: (err: unknown, data?: session.SessionData | null) => void) {
    this.sql.query("SELECT data FROM gsim_sessions WHERE id = $1 AND expires_at > now()", [this.key(id)])
      .then(({ rows }) => callback(null, rows[0]?.data || null), callback);
  }
  set(id: string, data: session.SessionData, callback?: (err?: unknown) => void) {
    this.sql.query("INSERT INTO gsim_sessions (id, data, expires_at) VALUES ($1, $2::jsonb, $3) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at",
      [this.key(id), JSON.stringify(data), this.expiry(data)])
      .then(() => callback?.(), err => callback?.(err));
  }
  touch(id: string, data: session.SessionData, callback?: (err?: unknown) => void) {
    this.sql.query("UPDATE gsim_sessions SET expires_at = $2 WHERE id = $1", [this.key(id), this.expiry(data)])
      .then(() => callback?.(), err => callback?.(err));
  }
  destroy(id: string, callback?: (err?: unknown) => void) {
    this.sql.query("DELETE FROM gsim_sessions WHERE id = $1", [this.key(id)])
      .then(() => callback?.(), err => callback?.(err));
  }
}
