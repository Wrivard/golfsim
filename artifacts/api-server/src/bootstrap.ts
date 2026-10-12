import { createServer } from "node:http";
import app from "./app";
import { registerSeoRoutes } from "@workspace/golf-seo";
import { registerRoutes } from "./routes/routes";
import { errorHandler } from "./middleware/security";
import { checkRuntimeSchema } from "./runtime/sql";
import { durableRuntime, publicOrigin, externalCalendarAllowed } from "./runtime/config";

let initialization: Promise<typeof app> | undefined;
export function initializedApp() {
  return initialization ||= (async () => {
    publicOrigin();
    if (process.env.VERCEL === "1") {
      if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error("A strong SESSION_SECRET is required.");
      if (!process.env.CRON_SECRET || process.env.CRON_SECRET.length < 32) throw new Error("A strong CRON_SECRET is required.");
      if (externalCalendarAllowed() && (!process.env.CALENDAR_WEBHOOK_SECRET || process.env.CALENDAR_WEBHOOK_SECRET.length < 32)) {
        throw new Error("A strong CALENDAR_WEBHOOK_SECRET is required when Calendar is enabled.");
      }
    }
    if (durableRuntime()) await checkRuntimeSchema();
    registerSeoRoutes(app);
    await registerRoutes(createServer(app), app);
    app.use(errorHandler);
    return app;
  })().catch(error => { initialization = undefined; throw error; });
}
