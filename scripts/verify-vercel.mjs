// Reproduce both production compilation phases without deployment or live credentials.
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

if (process.versions.node.split(".")[0] !== "22") throw new Error("Run this check with Node 22, as on Vercel.");
const root = process.cwd();
const temp = await mkdtemp(path.join(tmpdir(), "golf-vercel-"));
const work = path.join(temp, "source");
const output = path.join(temp, "function");
const env = {
  PATH: process.env.PATH, HOME: process.env.HOME,
  CI: "1", VERCEL: "1", VERCEL_ENV: "production",
  SITE_URL: "https://www.golfsimsorel.ca",
};
function run(command, args, cwd = work) {
  execFileSync(command, args, { cwd, env, stdio: "inherit" });
}
try {
  const paths = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root }).toString().split("\0").filter(Boolean);
  for (const file of new Set(paths)) {
    // Mirror deployment exclusions; never copy credentials or private exports.
    if (/^(\.git|\.agents|\.local|\.cache|generated-artifacts)(\/|$)/.test(file) ||
        /(^|\/)(node_modules|dist)(\/|$)/.test(file) ||
        /(^|\/)\.env($|\.)|tsbuildinfo$|\.test\.(ts|mjs)$/.test(file) ||
        /^(artifacts\/mockup-sandbox|ops\/calendar-scheduler)\//.test(file)) continue;
    const dest = path.join(work, file);
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(path.join(root, file), dest);
  }
  run("pnpm", ["install", "--frozen-lockfile", "--prod=false"]);
  run("pnpm", ["run", "build:vercel"]);
  // Isolate SDK execution too: no database, email, OAuth, or platform credentials.
  run(process.execPath, [path.join(root, "scripts/verify-vercel-function.mjs"), work, output]);
  console.log("PASS: clean product build + Vercel Node function packaging + isolated runtime checks.");
} finally {
  await rm(temp, { recursive: true, force: true });
}
