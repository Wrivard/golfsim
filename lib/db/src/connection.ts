function postgresUrl(value: string): URL {
  try {
    const url = new URL(value);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.hash) {
      throw new Error();
    }
    return url;
  } catch {
    // URL parsing errors can contain the password-bearing input.
    throw new Error("A valid PostgreSQL connection URL is required.");
  }
}

function supabaseReference(url: URL): string | undefined {
  const direct = /^db\.([a-z0-9-]+)\.supabase\.co$/.exec(url.hostname);
  if (direct) return direct[1];
  if (url.hostname.endsWith(".pooler.supabase.com")) {
    const reference = /\.([a-z0-9-]+)$/.exec(decodeURIComponent(url.username));
    if (!reference) throw new Error("Copy the complete Supabase pooler username from Connect.");
    return reference[1];
  }
  return undefined;
}

/** Pooler hosts are shared by unrelated Supabase projects; compare project refs. */
export function databaseIdentity(value: string): string {
  const url = postgresUrl(value);
  const reference = supabaseReference(url);
  if (reference) return `supabase:${reference}`;
  // Keep the conservative branch-level isolation used for Neon.
  return `postgres:${url.hostname.replace("-pooler.", ".")}`;
}

function supabaseConnection(value: string, env: NodeJS.ProcessEnv): string {
  const url = postgresUrl(value);
  if (!supabaseReference(url)) {
    throw new Error("SUPABASE_DATABASE_URL must be a Supabase PostgreSQL connection.");
  }
  if (env.VERCEL === "1" && (!url.hostname.endsWith(".pooler.supabase.com") || url.port !== "6543")) {
    throw new Error("On Vercel, use Supabase's shared Transaction pooler on port 6543.");
  }
  const mode = url.searchParams.get("sslmode");
  if (mode && !["require", "verify-ca", "verify-full"].includes(mode)) {
    throw new Error("Supabase connections must require encrypted TLS.");
  }
  if (!mode) url.searchParams.set("sslmode", "require");
  return url.toString();
}

/** Adding a secret does not authorize cutover; the provider must be selected. */
export function databaseConnection(env: NodeJS.ProcessEnv = process.env): string {
  const provider = env.DATABASE_PROVIDER || "neon";
  if (!["neon", "supabase"].includes(provider)) throw new Error("Unsupported DATABASE_PROVIDER.");
  const production = provider === "supabase"
    ? env.SUPABASE_DATABASE_URL
    : env.NEON_DATABASE_URL || env.DATABASE_URL;
  const reference = env.SUPABASE_PRODUCTION_PROJECT_REF;
  if (provider === "supabase" && reference && !/^[a-z0-9-]+$/.test(reference)) {
    throw new Error("SUPABASE_PRODUCTION_PROJECT_REF must be the project's public reference.");
  }
  if (provider === "supabase" && production && reference &&
      databaseIdentity(production) !== `supabase:${reference}`) {
    throw new Error("Supabase production connection and project reference do not match.");
  }
  if (env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "development") {
    const preview = env.PREVIEW_DATABASE_URL;
    if (!preview) throw new Error("An isolated PREVIEW_DATABASE_URL is required.");
    const productionIdentity = production
      ? databaseIdentity(production)
      : provider === "supabase" && reference ? `supabase:${reference}` : undefined;
    if (provider === "supabase" && !productionIdentity) {
      throw new Error("Preview requires SUPABASE_PRODUCTION_PROJECT_REF to verify isolation.");
    }
    if (productionIdentity === databaseIdentity(preview)) {
      throw new Error("Preview and production must use different database branches/projects.");
    }
    return provider === "supabase" ? supabaseConnection(preview, env) : preview;
  }
  if (!production) {
    throw new Error(provider === "supabase"
      ? "SUPABASE_DATABASE_URL is required; no fallback to Neon is permitted."
      : "NEON_DATABASE_URL or DATABASE_URL is required.");
  }
  return provider === "supabase" ? supabaseConnection(production, env) : production;
}
