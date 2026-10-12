import express, { type Express } from "express";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import session from "express-session";
import { securityHeaders, validateContentType } from "./middleware/security";
import { durableRuntime, previewRuntime, publicOrigin } from "./runtime/config";
import { PostgresSessionStore } from "./runtime/session-store";
import { runtimeSql } from "./runtime/sql";
import { privatePath } from "./runtime/private-paths";

const app: Express = express();
app.use((req, res, next) => privatePath(req.originalUrl) ? res.status(404).end() : next());

if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
  const origin = req.get("origin");
  if (origin && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.path !== "/api/calendar/webhook") {
    const expected = new Set<string>();
    if (previewRuntime()) {
      for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) if (host) expected.add(`https://${host}`);
      if (process.env.PREVIEW_GOOGLE_REDIRECT_URI) expected.add(new URL(process.env.PREVIEW_GOOGLE_REDIRECT_URI).origin);
    } else expected.add(publicOrigin() || `${req.protocol}://${req.get("host")}`);
    if (process.env.NODE_ENV !== "production") {
      expected.add(`https://${req.get("host")}`);
      if (process.env.REPLIT_DEV_DOMAIN) expected.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (!expected.has(origin)) return res.status(403).json({ ok: false, message: "Origine de requête non autorisée." });
  }
  return next();
});
app.use(express.json({
  limit: "1mb",
  verify: (req, _res, buf) => {
    (req as typeof req & { rawBody: unknown }).rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(validateContentType);

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET environment variable is required in production");
}
app.use(session({
  secret: sessionSecret || "dev-only-secret-change-in-production",
  name: "gsim.sid",
  resave: false,
  saveUninitialized: false,
  store: durableRuntime() ? new PostgresSessionStore(runtimeSql) : undefined,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "lax",
    path: "/",
  },
}));

app.use("/api", router);

export default app;
