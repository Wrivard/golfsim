// Scheduled caller only. Calendar credentials and database access stay in Vercel.
export async function runCalendarTick(env, fetchImpl = fetch) {
  if (env.SCHEDULER_ENABLED !== "true") return { disabled: true };
  let origin;
  try {
    origin = new URL(env.SITE_ORIGIN);
  } catch {
    throw new Error("Scheduler requires an HTTPS site origin.");
  }
  if (origin.protocol !== "https:" || origin.username || origin.password ||
      origin.pathname !== "/" || origin.search || origin.hash) {
    throw new Error("Scheduler requires an HTTPS site origin without a path or credentials.");
  }
  if (typeof env.CRON_SECRET !== "string" || env.CRON_SECRET.length < 32 ||
      /[\r\n]/.test(env.CRON_SECRET)) {
    throw new Error("Scheduler requires a valid server-side job secret.");
  }

  let response;
  try {
    response = await fetchImpl(new URL("/api/jobs/calendar", origin).href, {
      method: "GET",
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      // Never forward the secret to a redirected hostname.
      redirect: "manual",
      signal: AbortSignal.timeout(310_000),
    });
  } catch {
    // Do not log request options or raw provider errors containing credentials.
    throw new Error("Calendar job could not be reached.");
  }
  if (response.status !== 200) {
    throw new Error(`Calendar job failed with HTTP ${response.status}.`);
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Calendar job returned an invalid response.");
  }
  if (result?.ok !== true || result.disabled === true) {
    throw new Error("Calendar job did not confirm active maintenance.");
  }
  // A skipped tick means the server's shared lease is already held by another sync.
  return { ok: true, skipped: result.skipped === true };
}

export default {
  async scheduled(_event, env) {
    await runCalendarTick(env);
  },
};
