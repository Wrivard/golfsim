// These two production hosts belong to this site; Vercel redirects apex to www.
// Do not derive trusted origins from request headers or arbitrary www variants.
export function trustedProductionOrigins(canonical: string): Set<string> {
  const origins = new Set([canonical]);
  if (canonical === "https://golfsimsorel.ca" || canonical === "https://www.golfsimsorel.ca") {
    origins.add("https://golfsimsorel.ca");
    origins.add("https://www.golfsimsorel.ca");
  }
  return origins;
}
