import type { Request, Response, NextFunction } from "express";
import { isIP } from "node:net";
import { trustedProductionOrigins } from "./runtime/request-origin";

export interface TurnstileSettings {
  siteKey: string;
  secret: string;
  testMode: boolean;
  hostnames: Set<string>;
}
export function turnstileSettings(env = process.env): TurnstileSettings {
  const testMode = env.VERCEL === "1" ? ["preview", "development"].includes(env.VERCEL_ENV || "") : env.NODE_ENV !== "production";
  if (testMode) return {
    siteKey: "1x00000000000000000000AA", secret: "1x0000000000000000000000000000000AA",
    testMode: true, hostnames: new Set(),
  };
  if (!env.TURNSTILE_SITE_KEY || !env.TURNSTILE_SECRET_KEY ||
      /^[123]x0+/.test(env.TURNSTILE_SITE_KEY) || /^[123]x0+/.test(env.TURNSTILE_SECRET_KEY)) {
    throw new Error("Turnstile production configuration is required");
  }
  const hosts = (env.TURNSTILE_ALLOWED_HOSTNAMES || "").split(",").map(h => h.trim().toLowerCase()).filter(Boolean);
  if (env.SITE_URL) hosts.push(...[...trustedProductionOrigins(env.SITE_URL)].map(origin => new URL(origin).hostname));
  if (!hosts.length || hosts.some(h => h.includes("*") || /[:/\\\s]/.test(h))) throw new Error("Turnstile hostname allowlist is required");
  return { siteKey: env.TURNSTILE_SITE_KEY, secret: env.TURNSTILE_SECRET_KEY, testMode: false, hostnames: new Set(hosts) };
}

export async function verifyTurnstile(
  token: unknown, ip: string, binding: string, config: TurnstileSettings, fetcher: typeof fetch = fetch,
): Promise<"valid" | "invalid" | "unavailable"> {
  if (typeof token !== "string" || !token.length || token.length > 2048) return "invalid";
  const body = new URLSearchParams({ secret: config.secret, response: token });
  if (isIP(ip)) body.set("remoteip", ip);
  try {
    const response = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body, signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return "unavailable";
    const result = await response.json() as { success?: boolean; hostname?: string; action?: string; cdata?: string; "error-codes"?: string[] };
    if (result?.success !== true) {
      return result?.["error-codes"]?.some(code => ["internal-error", "invalid-input-secret", "missing-input-secret"].includes(code))
        ? "unavailable" : "invalid";
    }
    if (!config.testMode && (result.action !== "booking" || result.cdata !== binding ||
        typeof result.hostname !== "string" || !config.hostnames.has(result.hostname.toLowerCase()))) return "invalid";
    return "valid";
  } catch { return "unavailable"; }
}

export async function validateTurnstile(req: Request, res: Response, next: NextFunction): Promise<void> {
  let config: TurnstileSettings;
  try { config = turnstileSettings(); }
  catch {
    res.status(503).json({ ok: false, code: "TURNSTILE_CONFIGURATION", message: "La vérification anti-robot est indisponible. Veuillez contacter le responsable." });
    return;
  }
  const result = await verifyTurnstile(req.body?.turnstileToken, req.ip || "", req.get("X-Booking-Token")?.split(".").at(-1) || "", config);
  if (result !== "valid") {
    res.status(result === "invalid" ? 403 : 503).json({
      ok: false, code: result === "invalid" ? "TURNSTILE_INVALID" : "TURNSTILE_UNAVAILABLE",
      message: result === "invalid" ? "La vérification anti-robot a expiré ou échoué. Veuillez la refaire."
        : "Le service de vérification est temporairement indisponible. Aucune réservation n’a été créée. Veuillez réessayer.",
    });
    return;
  }
  next();
}
