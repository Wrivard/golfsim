import app from "./app";
import { logger } from "./lib/logger";
import { createServer } from "node:http";
import { registerRoutes } from "./routes/routes";
import { registerSeoRoutes } from "@workspace/golf-seo";
import { errorHandler } from "./middleware/security";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);
registerSeoRoutes(app);
await registerRoutes(httpServer, app);
app.use(errorHandler);

httpServer.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "Server listening");
});
httpServer.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});
