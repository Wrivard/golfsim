import { defineConfig } from "drizzle-kit";
import path from "path";
import { databaseConnection } from "./src/connection";

const connectionString = databaseConnection();

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
