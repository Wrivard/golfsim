import { AsyncLocalStorage } from "node:async_hooks";
import { pool } from "./db";
import { previewRuntime, externalCalendarAllowed } from "./runtime/config";
import { sql } from "drizzle-orm";
import type { Express } from "express";

const context = new AsyncLocalStorage<{ syncing?: boolean }>();
const LOCK = 73401922;
export const sourceExpression = `
 concat_ws(chr(31), t.provider, lower(t.email),
 CASE WHEN lower(coalesce(c.calendar_id,'primary'))=lower(t.email)
 THEN 'primary' ELSE coalesce(c.calendar_id,'primary') END)`;

export async function activeCalendarSource(): Promise<string> {
  const previewCalendar = previewRuntime() ? process.env.PREVIEW_GOOGLE_CALENDAR_ID : null;
  if (previewRuntime() && !previewCalendar) throw new Error("Preview calendar must be explicitly configured.");
  const { rows } = await pool.query(`SELECT ${sourceExpression} AS source
    FROM oauth_tokens t LEFT JOIN LATERAL
    (SELECT coalesce($2::text,(SELECT calendar_id FROM calendar_settings LIMIT 1)) AS calendar_id) c ON true
    WHERE t.provider=$1 AND t.access_token<>'' AND t.email IS NOT NULL LIMIT 1`,
  [previewRuntime() ? "google-preview" : "google", previewCalendar]);
  if (!rows[0]?.source) throw new Error("Connectez un compte Google et sélectionnez son calendrier.");
  return rows[0].source;
}

export async function sourceReady(): Promise<boolean> {
  if (!externalCalendarAllowed()) return false;
  try {
    const key = await activeCalendarSource();
    const result = await pool.query("SELECT ready FROM gsim_calendar_sources WHERE source_key=$1", [key]);
    return result.rows[0]?.ready === true;
  } catch { return false; }
}

export async function markSourcePending() {
  const key = await activeCalendarSource();
  await pool.query(`INSERT INTO gsim_calendar_sources(source_key,ready) VALUES($1,false)
    ON CONFLICT(source_key) DO UPDATE SET ready=false`, [key]);
}

export async function markSourceReady() {
  const key = await activeCalendarSource();
  await pool.query(`INSERT INTO gsim_calendar_sources(source_key,ready) VALUES($1,true)
    ON CONFLICT(source_key) DO UPDATE SET ready=true`, [key]);
}

export async function bookingSourceFilter() {
  if (!context.getStore()?.syncing && !await sourceReady()) {
    throw new Error("Le calendrier doit être synchronisé avant d’afficher ou réserver ses disponibilités.");
  }
  const key = await activeCalendarSource();
  return sql`EXISTS (SELECT 1 FROM gsim_booking_sources s
    WHERE s.booking_id=bookings.id AND s.source_key=${key})`;
}

export async function tagBooking(tx: any, id: string) {
  const key = await activeCalendarSource();
  await tx.execute(sql`INSERT INTO gsim_calendar_sources(source_key,ready) VALUES(${key},false)
    ON CONFLICT(source_key) DO NOTHING`);
  await tx.execute(sql`INSERT INTO gsim_booking_sources(booking_id,source_key) VALUES(${id},${key})`);
}

// Transaction-scoped advisory locks also work with Supabase transaction pooling.
// Keep the lock for the complete operation, including external Google requests.
export async function withCalendarSource<T>(action: () => Promise<T>, syncing = false, waitMs = 3000): Promise<T> {
  if (context.getStore()) return context.run({ syncing: syncing || context.getStore()?.syncing }, action);
  const deadline = Date.now() + waitMs;
  for (;;) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const lock = await client.query("SELECT pg_try_advisory_xact_lock($1) AS locked", [LOCK]);
      if (lock.rows[0].locked) return await context.run({ syncing }, action);
    } finally {
      try { await client.query("ROLLBACK"); } finally { client.release(); }
    }
    if (Date.now() >= deadline) throw new Error("Calendrier en cours de mise à jour. Réessayez dans un instant.");
    // Release the pool connection before waiting, so the current holder can
    // finish its database work even with the small serverless connection pool.
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Wrap the final async route handler, not response events: a disconnected browser
// must not release the lock while a Google mutation is still running.
export function calendarScopedRoutes(app: Express): Express {
  return new Proxy(app, {
    get(target, prop) {
      const method = Reflect.get(target, prop);
      if (!["get","post","put","patch","delete"].includes(String(prop))) return typeof method === "function" ? method.bind(target) : method;
      return (path: any, ...handlers: any[]) => {
        const scoped = typeof path === "string" &&
          (/^\/api\/(admin|availability|book|debug)/.test(path) || path === "/oauth/google/callback");
        if (scoped && handlers.length) {
          const handler = handlers.pop();
          handlers.push(async (req: any, res: any, next: any) => {
            try { await withCalendarSource(() => handler(req,res,next)); }
            catch { if (!res.headersSent) res.status(503).json({ ok:false, message:"Calendrier indisponible ou en cours de synchronisation. Réessayez ou contactez le responsable." }); }
          });
        }
        return method.call(target, path, ...handlers);
      };
    },
  });
}
