import type { Express } from "express";
import { timingSafeEqual } from "node:crypto";
import { externalCalendarAllowed, previewRuntime, publicOrigin, durableRuntime } from "./runtime/config";
import { readState, writeState, withLease } from "./runtime/state";
import { runtimeSql } from "./runtime/sql";
import { getCalendarWatch, getWatchToken, setupCalendarWatch, syncCalendarToDatabase } from "./googleCalendar";

export function secretMatches(value: string | undefined, expected: string | undefined): boolean {
  if (!value || !expected) return false;
  const a = Buffer.from(value), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function watchOrigin() {
  if (previewRuntime()) {
    const uri = process.env.PREVIEW_GOOGLE_REDIRECT_URI;
    if (!uri) throw new Error("Isolated preview origin is required.");
    return new URL(uri).origin;
  }
  const origin = publicOrigin();
  if (origin) return origin;
  // Never derive a production callback from a Replit development hostname.
  return process.env.REPLIT_DEPLOYMENT_URL?.replace(/\/$/, "");
}

export async function runCalendarMaintenance() {
  if (!externalCalendarAllowed()) throw new Error("Calendar synchronization disabled.");
  return withLease("calendar-sync", async () => {
    const origin = watchOrigin();
    if (!origin && durableRuntime()) throw new Error("Public calendar origin is required.");
    if (durableRuntime()) {
      const owner = await readState<{ origin: string }>("calendar-sync-owner");
      if (owner?.origin !== origin) throw new Error("This deployment is not the approved Calendar synchronization owner.");
    }
    if (origin) {
      if (!await setupCalendarWatch(`${origin}/api/calendar/webhook`)) throw new Error("Calendar watch could not be renewed.");
    } else {
      console.warn("[Calendar] SITE_URL not set: push watch disabled; long-running polling only.");
    }
    const result = await syncCalendarToDatabase();
    await writeState("calendar-last-sync", { at: new Date().toISOString(), ...result });
    return result;
  });
}

async function cleanupRuntime() {
  if (!durableRuntime()) return;
  await runtimeSql.query("DELETE FROM gsim_sessions WHERE expires_at <= now()");
  await runtimeSql.query("DELETE FROM gsim_rate_limits WHERE expires_at <= now()");
}

export function registerCalendarJobs(app: Express) {
  app.get("/api/jobs/calendar", async (req, res) => {
    if (!secretMatches(req.get("authorization"), process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : undefined)) {
      return res.status(401).json({ ok: false });
    }
    try {
      await cleanupRuntime();
      if (!externalCalendarAllowed()) return res.json({ ok: true, disabled: true });
      const result = await runCalendarMaintenance();
      if (result?.errors) return res.status(503).json({ ok: false, message: "Calendar reconciliation had errors." });
      return res.json({ ok: true, skipped: result === null, result });
    } catch {
      return res.status(503).json({ ok: false, message: "Calendar maintenance failed; retry/alert required." });
    }
  });
  app.post("/api/calendar/webhook", async (req, res) => {
    if (!externalCalendarAllowed()) return res.status(503).end();
    try {
      if (!secretMatches(req.get("x-goog-channel-token"), getWatchToken())) return res.status(403).end();
      // Google can send the initial handshake before the watch response is persisted.
      if (req.get("x-goog-resource-state") === "sync") return res.status(200).end();
      const watch = await getCalendarWatch();
      if (!watch || req.get("x-goog-channel-id") !== watch.id ||
        req.get("x-goog-resource-id") !== watch.resourceId ||
        watch.expires <= Date.now()) {
        return res.status(403).end();
      }
      const previous = await readState<{ at: string }>("calendar-last-sync");
      if (previous && Date.now() - new Date(previous.at).getTime() < 5000) return res.status(200).end();
      // Complete/await before responding: functions may freeze after res.end().
      const result = await runCalendarMaintenance();
      return res.status(result?.errors ? 503 : 200).end();
    } catch { return res.status(503).end(); }
  });
  // Long-running Replit compatibility only. Vercel uses an authenticated external scheduler.
  if (process.env.VERCEL !== "1" && process.env.NODE_ENV === "production" && externalCalendarAllowed()) {
    const run = () => runCalendarMaintenance().catch(() => console.error("[Calendar] Background reconciliation failed."));
    setTimeout(run, 30000).unref();
    setInterval(run, 300000).unref();
  }
}
