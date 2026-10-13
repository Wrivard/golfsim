import { spawnSync } from "node:child_process";

// Build only the product, not the design sandbox or private staff exports.
const env = { ...process.env, NODE_ENV: "production", BASE_PATH: "/", PORT: "3000" };
if (env.VERCEL && !env.SITE_URL) {
  throw new Error("Set SITE_URL to the HTTPS canonical domain before building on Vercel.");
}
for (const args of [
  ["run", "typecheck:libs"],
  ["--filter", "@workspace/api-server", "run", "typecheck"],
  ["--filter", "@workspace/api-server", "run", "build"],
  ["exec", "tsc", "-p", "api/tsconfig.json"],
  ["--filter", "@workspace/golf-sim", "run", "typecheck"],
  ["--filter", "@workspace/golf-sim", "run", "build"],
]) {
  const result = spawnSync("pnpm", args, { env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
