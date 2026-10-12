import { initializedApp } from "./bootstrap";
import { logger } from "./lib/logger";
import { createServer } from "node:http";

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

const httpServer = createServer(await initializedApp());

httpServer.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "Server listening");
});
httpServer.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});
