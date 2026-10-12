export const durableRuntime = () => process.env.VERCEL === "1" || process.env.RUNTIME_STORAGE === "postgres";
export const previewRuntime = () => ["preview", "development"].includes(process.env.VERCEL_ENV || "");

export function publicOrigin(): string | undefined {
  const value = process.env.SITE_URL;
  if (!value) {
    if (process.env.VERCEL === "1") throw new Error("SITE_URL is required on Vercel.");
    return undefined;
  }
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("SITE_URL must be an HTTPS origin with no path or credentials.");
  }
  return url.origin;
}

export function externalCalendarAllowed(): boolean {
  if (previewRuntime()) return process.env.PREVIEW_CALENDAR_ENABLED === "true" && !!process.env.PREVIEW_CALENDAR_ID;
  if (process.env.VERCEL === "1") return process.env.CALENDAR_ENABLED === "true";
  return process.env.CALENDAR_ENABLED !== "false";
}
