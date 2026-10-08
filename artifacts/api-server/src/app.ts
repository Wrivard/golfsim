import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import session from "express-session";
import { securityHeaders, validateContentType } from "./middleware/security";

const app: Express = express();

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
app.use(cors());
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
