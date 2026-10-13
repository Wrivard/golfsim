import { defineConfig } from "drizzle-kit";
import path from "path";
import { databasePoolConfiguration } from "./src/connection";

const { connectionString, ssl } = databasePoolConfiguration();

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
    ...(ssl ? { ssl } : {}),
  },
});
