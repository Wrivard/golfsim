import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { rateLimit, sanitizeEmail } from "./middleware/security";
import { durableRuntime } from "./runtime/config";
import { runtimeSql } from "./runtime/sql";
import { turnstileSettings, validateTurnstile } from "./turnstile";

export const PROOF_WAIT_MS = 2_000;
export const PROOF_TTL_MS = 2 * 60 * 60 * 1000;
const developmentKey = randomBytes(32).toString("hex");
function signingKey() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") throw new Error("Booking protection requires SESSION_SECRET");
  return developmentKey;
}
const address = (req: Request) => req.ip || req.socket.remoteAddress || "unknown";
const signature = (payload: string, ip: string, secret: string) =>
  createHmac("sha256", secret).update(`booking-proof-v1|${ip}|${payload}`).digest("hex");

export function issueBookingProof(ip: string, now = Date.now(), secret = signingKey()) {
  const payload = `${now}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${signature(payload, ip, secret)}`;
}

export function verifyBookingProof(token: unknown, ip: string, now = Date.now(), secret = signingKey()) {
  if (typeof token !== "string" || !/^\d{13}\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(token)) return false;
  const [issued, nonce, mac] = token.split(".");
  const age = now - Number(issued);
  if (age < PROOF_WAIT_MS || age > PROOF_TTL_MS) return false;
  return timingSafeEqual(Buffer.from(mac, "hex"), Buffer.from(signature(`${issued}.${nonce}`, ip, secret), "hex"));
}

export const proofIssueLimit = rateLimit({
  scope: "booking-proof-issue", windowMs: 15 * 60_000, maxRequests: 30,
  message: "Trop de demandes. Veuillez patienter 15 minutes avant de recommencer.",
});
export async function sendBookingProof(req: Request, res: Response): Promise<void> {
  let siteKey: string;
  try { siteKey = turnstileSettings().siteKey; }
  catch {
    res.status(503).json({ ok: false, message: "La vérification anti-robot est indisponible. Veuillez contacter le responsable." });
    return;
  }
  if (durableRuntime()) {
    // Nonces are never reused: discard expired technical counters in bounded
    // batches instead of retaining one row per submission forever.
    await runtimeSql.query("DELETE FROM gsim_rate_limits WHERE key IN (SELECT key FROM gsim_rate_limits WHERE key LIKE 'booking-proof-use:%' AND expires_at <= now() LIMIT 100)");
  }
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok: true, token: issueBookingProof(address(req)), waitMs: PROOF_WAIT_MS, turnstileSiteKey: siteKey });
}
export function validateBookingProtection(req: Request, res: Response, next: NextFunction) {
  // Validate before sanitizing: sanitization intentionally strips non-booking fields.
  const website = req.body?.website;
  if ((website !== undefined && website !== "") ||
      !verifyBookingProof(req.get("X-Booking-Token"), address(req))) {
    res.status(403).json({
      ok: false, code: "BOOKING_PROTECTION_INVALID",
      message: "La vérification a expiré ou échoué. Réessayez dans quelques secondes. Si le problème persiste, actualisez la page.",
    });
    return;
  }
  next();
}
// The existing durable limiter uses atomic PostgreSQL upserts on Vercel.
// A verified token can therefore be used only once, even across serverless instances.
const once = rateLimit({
  scope: "booking-proof-use", windowMs: PROOF_TTL_MS, maxRequests: 1,
  keyGenerator: req => req.get("X-Booking-Token") || "",
  message: "Cette demande a déjà été envoyée. Vérifiez votre confirmation ou contactez-nous avant de recommencer.",
});
const burst = rateLimit({
  scope: "public-booking", windowMs: 15 * 60_000, maxRequests: 8,
  message: "Trop de tentatives de réservation. Veuillez patienter 15 minutes ou nous contacter.",
});
const daily = rateLimit({
  scope: "public-booking-daily", windowMs: 24 * 60 * 60_000, maxRequests: 30,
  message: "La limite de réservations pour cette connexion est atteinte. Veuillez nous contacter.",
});
const emailKey = (req: Request) => sanitizeEmail(req.body?.email) || address(req);
const emailHourly = rateLimit({
  scope: "public-booking-email-hourly", windowMs: 60 * 60_000, maxRequests: 4, keyGenerator: emailKey,
  message: "Trop de demandes pour ce courriel. Veuillez patienter une heure ou nous contacter.",
});
const emailDaily = rateLimit({
  scope: "public-booking-email-daily", windowMs: 24 * 60 * 60_000, maxRequests: 10, keyGenerator: emailKey,
  message: "La limite de demandes pour ce courriel est atteinte. Veuillez nous contacter.",
});
export const publicBookingProtection = [burst, daily, validateBookingProtection, once, emailHourly, emailDaily, validateTurnstile];
export const publicAvailabilityLimit = rateLimit({
  scope: "public-availability-read", windowMs: 60_000, maxRequests: 90,
  message: "Trop de consultations des disponibilités. Veuillez patienter une minute.",
});
