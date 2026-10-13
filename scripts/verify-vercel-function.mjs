import { createRequire } from "node:module";
import { realpath, mkdir, writeFile, lstat, readlink, symlink } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const [workPath, output] = process.argv.slice(2);
if (!workPath || !output) throw new Error("Expected source and output directories.");
const localRequire = createRequire(import.meta.url);
const require = createRequire(await realpath(localRequire.resolve("@vercel/node/package.json")));
const { build } = require("@vercel/node");
const { FileFsRef } = require("@vercel/build-utils");
const result = await build({
  files: { "api/index.ts": new FileFsRef({ fsPath: path.join(workPath, "api/index.ts") }) },
  entrypoint: "api/index.ts", workPath, config: { nodeVersion: "22.x" }, meta: { isDev: false },
});
const lambda = result.output;
if (!lambda.files || !lambda.handler) throw new Error("No executable function output.");
for (const [name, file] of Object.entries(lambda.files)) {
  const dest = path.join(output, name);
  await mkdir(path.dirname(dest), { recursive: true });
  if (file.fsPath) {
    const info = await lstat(file.fsPath);
    if (info.isSymbolicLink()) {
      await symlink(await readlink(file.fsPath), dest);
      continue;
    }
    if (info.isDirectory()) {
      await mkdir(dest, { recursive: true });
      continue;
    }
  }
  await pipeline(file.toStream(), createWriteStream(dest));
}
for (const required of ["artifacts/api-server/dist/bootstrap.mjs"]) {
  if (!lambda.files[required]) throw new Error(`Missing runtime file: ${required}`);
}
// Loading the packaged bootstrap resolves traced dependencies, including bcrypt
// and googleapis, without invoking initialization or opening a database connection.
execFileSync(process.execPath, ["--input-type=module", "-e", `
  await import(${JSON.stringify(path.join(output, "artifacts/api-server/dist/bootstrap.mjs"))});
  console.log("PASS: packaged bootstrap imports with traced dependencies");
`], {
  // Constructor-only fixture. No initialization/query; never points at a live service.
  env: {
    PATH: process.env.PATH, NODE_ENV: "production",
    DATABASE_URL: "postgresql://test:test@127.0.0.1:1/test",
    SESSION_SECRET: "isolated-test-fixture-not-a-real-secret",
  },
  stdio: "inherit", timeout: 30000,
});
await writeFile(path.join(output, "smoke.cjs"), `
const assert = require("node:assert/strict");
const {createServer} = require("node:http");
const handler = require("./api/index.js").default;
const server = createServer(handler);
server.listen(0, "127.0.0.1", async () => {
  try {
    const base = "http://127.0.0.1:" + server.address().port;
    const hidden = await fetch(base + "/.env");
    assert.equal(hidden.status, 404);
    const failed = await fetch(base + "/api/health");
    assert.equal(failed.status, 503);
    assert.equal(failed.headers.get("cache-control"), "no-store");
    assert.deepEqual(await failed.json(), {ok:false,message:"Service indisponible. Veuillez contacter le responsable."});
    console.log("PASS: packaged adapter protects private paths and safely reports missing configuration");
  } catch(error) { console.error(error); process.exitCode = 1; }
  finally { server.close(); }
});
`);
execFileSync(process.execPath, [path.join(output, "smoke.cjs")], {
  env: { PATH: process.env.PATH, NODE_ENV: "production", VERCEL: "1" },
  stdio: "inherit", timeout: 30000,
});
// After checking the real packaged imports, substitute only the temporary
// bootstrap to exercise HTTP dispatch without a real database or Google account.
await writeFile(path.join(output, "artifacts/api-server/dist/bootstrap.mjs"), `
export async function initializedApp() {
  return (req, res) => {
    if (req.url === "/throw") throw new Error("private fixture detail");
    res.end("fixture response");
  };
}
`);
await writeFile(path.join(output, "dispatch.cjs"), `
const assert = require("node:assert/strict");
const {createServer} = require("node:http");
const handler = require("./api/index.js").default;
const server = createServer(handler);
server.listen(0, "127.0.0.1", async () => {
  try {
    const base = "http://127.0.0.1:" + server.address().port;
    const ok = await fetch(base + "/ok");
    assert.equal(ok.status, 200);
    assert.equal(await ok.text(), "fixture response");
    const failed = await fetch(base + "/throw");
    assert.equal(failed.status, 503);
    assert.equal((await failed.text()).includes("private fixture detail"), false);
    console.log("PASS: packaged adapter dispatches HTTP and catches synchronous handler failures");
  } catch(error) { console.error(error); process.exitCode = 1; }
  finally { server.close(); }
});
`);
execFileSync(process.execPath, [path.join(output, "dispatch.cjs")], {
  env: { PATH: process.env.PATH }, stdio: "inherit", timeout: 30000,
});
console.log(`PASS: Vercel function ${lambda.handler}, ${Object.keys(lambda.files).length} traced files`);
