/** Preview deployments must never inherit the production database implicitly. */
export function databaseConnection(env: NodeJS.ProcessEnv = process.env): string {
  const production = env.NEON_DATABASE_URL || env.DATABASE_URL;
  if (env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "development") {
    const preview = env.PREVIEW_DATABASE_URL;
    if (!preview) throw new Error("An isolated PREVIEW_DATABASE_URL is required.");
    if (production) {
      const host = (url: string) => new URL(url).hostname.replace("-pooler.", ".");
      if (host(preview) === host(production)) {
        throw new Error("Preview and production must use different database hosts/branches.");
      }
    }
    return preview;
  }
  if (!production) throw new Error("NEON_DATABASE_URL or DATABASE_URL is required.");
  return production;
}
