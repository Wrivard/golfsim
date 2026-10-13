import type { IncomingMessage, ServerResponse } from "node:http";
import { privatePath } from "../artifacts/api-server/src/runtime/private-paths.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (privatePath(req.url || "/")) {
    res.statusCode = 404;
    res.setHeader("Cache-Control", "no-store");
    res.end();
    return;
  }
  try {
    const { initializedApp } = await import("../artifacts/api-server/dist/bootstrap.mjs");
    const app = await initializedApp();
    await new Promise<void>((resolve, reject) => {
      res.once("finish", resolve);
      res.once("close", resolve);
      try { app(req, res); } catch (error) { reject(error); }
    });
  } catch {
    console.error("[Runtime] Initialization failed; check deployment settings, database connectivity and runtime migration.");
    if (res.headersSent) return;
    // Configuration failure is explicit, but never expose database/secrets/errors.
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({ ok: false, message: "Service indisponible. Veuillez contacter le responsable." }));
  }
}
