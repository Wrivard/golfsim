/** Manual, authorized one-time copy. Never imported by the application. */
import { spawn } from "node:child_process";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { databaseIdentity, databasePoolConfiguration } from "../src/connection";
import { supabaseRootCA } from "../src/supabase-ca";

const CORE = ["bookings", "admin_users", "calendar_settings", "oauth_tokens", "operating_schedule"];
const RUNTIME = ["gsim_sessions", "gsim_rate_limits", "gsim_job_leases", "gsim_runtime_state"];
const ALL = [...CORE, ...RUNTIME];
const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const MAGIC = Buffer.from("GSIMDB01");
const KEY_INFO = "golfsim-neon-backup/v1";

class SafeError extends Error {}
function check(condition: unknown, code: string): asserts condition {
  if (!condition) throw new SafeError(code);
}
function argument(name: string): string {
  const value = process.argv.find(a => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
  check(value, `MISSING_${name.toUpperCase().replaceAll("-", "_")}`);
  return value;
}
function table(name: string): string {
  check(ALL.includes(name), "UNEXPECTED_TABLE");
  return `"public"."${name}"`;
}
function toolEnv(uri: URL, ca: string): NodeJS.ProcessEnv {
  return {
    PATH: process.env.PATH, HOME: process.env.HOME, LANG: "C.UTF-8",
    PGHOST: uri.hostname, PGPORT: uri.port || "5432",
    PGDATABASE: decodeURIComponent(uri.pathname.slice(1)),
    PGUSER: decodeURIComponent(uri.username), PGPASSWORD: decodeURIComponent(uri.password),
    PGPASSFILE: "/dev/null", PGSSLMODE: "verify-full", PGSSLROOTCERT: ca,
    PGCONNECT_TIMEOUT: "10", PGAPPNAME: "golfsim-authorized-private-copy",
    ...(uri.searchParams.has("options") ? { PGOPTIONS: uri.searchParams.get("options")! } : {}),
    ...(uri.searchParams.has("channel_binding")
      ? { PGCHANNELBINDING: uri.searchParams.get("channel_binding")! } : {}),
  };
}
/** Credentials are child environment only. Never print raw stderr or SQL. */
async function tool(command: string, args: string[], env: NodeJS.ProcessEnv, input?: Buffer): Promise<Buffer> {
  return new Promise((accept, reject) => {
    const child = spawn(command, args, { env, stdio: ["pipe", "pipe", "pipe"], timeout: 120_000 });
    const output: Buffer[] = [];
    let bytes = 0;
    child.stdout.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > 32 * 1024 * 1024) {
        child.kill("SIGTERM");
        reject(new SafeError("PRIVATE_OUTPUT_LIMIT"));
      } else output.push(chunk);
    });
    child.stderr.resume();
    child.stdin.on("error", () => {});
    child.on("error", () => reject(new SafeError(`${command.toUpperCase()}_START_FAILED`)));
    child.on("close", code => code === 0 ? accept(Buffer.concat(output))
      : reject(new SafeError(`${command.toUpperCase()}_FAILED`)));
    child.stdin.end(input);
  });
}
type Fingerprint = { count: number; digest: string };
async function fingerprint(client: pg.Client, name: string): Promise<Fingerprint> {
  const result = await client.query(`
    SELECT count(*)::int AS count, encode(sha256(convert_to(
      coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.id)::text, '[]'), 'UTF8'
    )), 'hex') AS digest FROM ${table(name)} t`);
  return result.rows[0];
}
function innerTransaction(sql: string): string {
  check((sql.match(/^BEGIN;$/gm) || []).length === 1, "MIGRATION_TRANSACTION_CHANGED");
  check((sql.match(/^COMMIT;$/gm) || []).length === 1, "MIGRATION_TRANSACTION_CHANGED");
  return sql.replace(/^BEGIN;$/m, "").replace(/^COMMIT;$/m, "");
}
function verifyDataSql(expected: Map<string, Fingerprint>): string {
  return CORE.map(name => {
    const data = expected.get(name)!;
    check(/^[a-f0-9]{64}$/.test(data.digest), "INVALID_DIGEST");
    return `DO $verify$ DECLARE n bigint; digest text; BEGIN
      SELECT count(*), encode(sha256(convert_to(
        coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.id)::text, '[]'), 'UTF8'
      )), 'hex') INTO n, digest FROM ${table(name)} t;
      IF n <> ${data.count} OR digest <> '${data.digest}' THEN
        RAISE EXCEPTION 'Copy integrity verification failed';
      END IF; END $verify$;`;
  }).join("\n");
}
const verifyPrivacySql = `DO $privacy$ DECLARE name text; api_role text; BEGIN
  FOREACH name IN ARRAY ARRAY[${ALL.map(t => `'${t}'`).join(",")}] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname=name AND c.relrowsecurity)
      THEN RAISE EXCEPTION 'Missing row-level protection'; END IF;
    FOREACH api_role IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
      IF has_table_privilege(api_role, format('public.%I', name),
        'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
        THEN RAISE EXCEPTION 'Unexpected API privileges'; END IF;
    END LOOP;
    IF EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=name)
      THEN RAISE EXCEPTION 'Unexpected public policies'; END IF;
  END LOOP; END $privacy$;`;

async function main(): Promise<void> {
  check(process.argv.includes("--execute"), "EXPLICIT_EXECUTION_REQUIRED");
  check(process.argv.includes("--confirmed-data-api-disabled"), "DATA_API_CONFIRMATION_REQUIRED");
  const ref = argument("target-project-ref"), host = argument("pooler-host");
  check(/^[a-z0-9]+$/.test(ref), "INVALID_PROJECT_REFERENCE");
  check(/^[a-z0-9-]+\.pooler\.supabase\.com$/.test(host), "INVALID_SHARED_POOLER_HOST");
  check(process.env.NEON_DATABASE_URL, "NEON_SECRET_MISSING");
  check(process.env.SUPABASE_DATABASE_URL, "SUPABASE_SECRET_MISSING");
  check(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32, "STRONG_BACKUP_KEY_REQUIRED");
  const sourceUri = new URL(process.env.NEON_DATABASE_URL), targetUri = new URL(process.env.SUPABASE_DATABASE_URL);
  check(sourceUri.hostname.endsWith(".neon.tech"), "UNEXPECTED_NEON_SOURCE");
  check(databaseIdentity(targetUri.toString()) === `supabase:${ref}`, "SUPABASE_TARGET_MISMATCH");
  check(["postgres", `postgres.${ref}`].includes(decodeURIComponent(targetUri.username)), "TARGET_OWNER_REQUIRED");
  // Normalize only the confirmed public endpoint; do not change saved secrets.
  targetUri.hostname = host;
  targetUri.username = `postgres.${ref}`;
  targetUri.port = "5432"; // Session pooler for restore tools.
  sourceUri.searchParams.set("sslmode", "verify-full");
  const env = { ...process.env, VERCEL: undefined, VERCEL_ENV: undefined };
  const source = new pg.Client({
    ...databasePoolConfiguration({ ...env, DATABASE_PROVIDER: "neon", NEON_DATABASE_URL: sourceUri.toString() }),
    connectionTimeoutMillis: 10_000,
  });
  const target = new pg.Client({
    ...databasePoolConfiguration({ ...env, DATABASE_PROVIDER: "supabase",
      SUPABASE_DATABASE_URL: targetUri.toString(), SUPABASE_PRODUCTION_PROJECT_REF: ref }),
    connectionTimeoutMillis: 10_000,
  });
  let committed = false, backupPath: string | undefined;
  try {
    await source.connect();
    await target.connect();
    await source.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await source.query("SET LOCAL timezone='UTC'");
    await target.query("BEGIN READ ONLY");
    const state = await target.query(
      "SELECT current_user AS role, (SELECT count(*) FROM pg_tables WHERE schemaname='public')::int AS tables"
    );
    check(state.rows[0].role === "postgres" && state.rows[0].tables === 0, "TARGET_MUST_BE_EMPTY");
    const roles = await target.query(
      "SELECT count(*)::int AS count FROM pg_roles WHERE rolname=ANY($1::text[])",
      [["anon", "authenticated", "service_role"]]
    );
    check(roles.rows[0].count === 3, "EXPECTED_SUPABASE_ROLES_MISSING");
    await target.query("ROLLBACK");
    const expected = new Map<string, Fingerprint>();
    for (const name of CORE) expected.set(name, await fingerprint(source, name));
    const demo = await source.query(
      "SELECT count(*)::int AS count FROM public.bookings WHERE date >= $1::timestamp AND date < $2::timestamp",
      ["2026-10-14", "2026-10-15"]
    );
    const snapshot = await source.query("SELECT pg_export_snapshot() AS id");
    const privateDir = resolve(ROOT, ".local/outputs/database-backups");
    await mkdir(privateDir, { recursive: true, mode: 0o700 });
    const caFile = resolve(privateDir, "supabase-public-root.crt");
    await writeFile(caFile, supabaseRootCA, { mode: 0o600 });
    const sourceEnv = toolEnv(sourceUri, "/etc/ssl/certs/ca-certificates.crt");
    const targetEnv = toolEnv(targetUri, caFile);
    const archive = await tool("pg_dump", [
      "--format=custom", "--inserts", "--column-inserts", "--no-owner", "--no-acl",
      "--strict-names", "--lock-wait-timeout=10s", `--snapshot=${snapshot.rows[0].id}`,
      ...CORE.flatMap(name => ["--table", `public.${name}`]),
    ], sourceEnv);
    const salt = randomBytes(32), iv = randomBytes(12);
    const key = Buffer.from(hkdfSync("sha256", process.env.SESSION_SECRET, salt, KEY_INFO, 32));
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    cipher.setAAD(MAGIC);
    const encrypted = Buffer.concat([cipher.update(archive), cipher.final()]);
    const backup = Buffer.concat([MAGIC, salt, iv, cipher.getAuthTag(), encrypted]);
    backupPath = resolve(privateDir, `neon-${new Date().toISOString().replaceAll(":", "-")}.dump.enc`);
    await writeFile(backupPath, backup, { mode: 0o600, flag: "wx" });
    const disk = await readFile(backupPath);
    check(disk.subarray(0, 8).equals(MAGIC), "INVALID_BACKUP_HEADER");
    const recoveryKey = Buffer.from(hkdfSync("sha256", process.env.SESSION_SECRET, disk.subarray(8, 40), KEY_INFO, 32));
    const decipher = createDecipheriv("aes-256-gcm", recoveryKey, disk.subarray(40, 52));
    decipher.setAAD(MAGIC);
    decipher.setAuthTag(disk.subarray(52, 68));
    const recovered = Buffer.concat([decipher.update(disk.subarray(68)), decipher.final()]);
    check(recovered.equals(archive), "BACKUP_VERIFICATION_FAILED");
    key.fill(0);
    recoveryKey.fill(0);
    const schemaSql = await tool("pg_restore", ["--schema-only", "--no-owner", "--no-acl", "--file=-"], sourceEnv, archive);
    const dataSql = await tool("pg_restore", ["--data-only", "--no-owner", "--no-acl", "--file=-"], sourceEnv, archive);
    const runtimeSql = innerTransaction(await readFile(resolve(ROOT, "docs/migrations/001-vercel-runtime.sql"), "utf8"));
    const privacySql = innerTransaction(await readFile(resolve(ROOT, "docs/migrations/002-supabase-private-tables.sql"), "utf8"));
    const guard = `SET timezone='UTC';
      SELECT pg_advisory_xact_lock(74219, 1001);
      DO $guard$ BEGIN
        IF current_user <> 'postgres' OR EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public')
          THEN RAISE EXCEPTION 'Destination must still be empty'; END IF;
      END $guard$;`;
    const script = Buffer.concat([
      Buffer.from(guard), schemaSql,
      Buffer.from("\nSET search_path=public,pg_catalog;\n" + runtimeSql + "\n" + privacySql + "\n"),
      dataSql, Buffer.from("\nSET timezone='UTC';\n" + verifyDataSql(expected) + verifyPrivacySql),
    ]);
    // psql handles \restrict metacommands; never modify SQL containing customer text.
    await tool("psql", ["--no-psqlrc", "--quiet", "--set=ON_ERROR_STOP=1", "--single-transaction", "--file=-"],
      targetEnv, script);
    committed = true;
    await target.query("BEGIN READ ONLY");
    await target.query("SET LOCAL timezone='UTC'");
    const matches: { table: string; count: number; exactMatch: boolean }[] = [];
    for (const name of CORE) {
      const actual = await fingerprint(target, name), before = expected.get(name)!;
      check(actual.count === before.count && actual.digest === before.digest, "POST_COMMIT_DATA_MISMATCH");
      matches.push({ table: name, count: actual.count, exactMatch: true });
    }
    await target.query(verifyPrivacySql);
    for (const name of RUNTIME) {
      const count = await target.query(`SELECT count(*)::int AS count FROM ${table(name)}`);
      check(count.rows[0].count === 0, "RUNTIME_TABLE_NOT_EMPTY");
    }
    await target.query("ROLLBACK");
    await source.query("ROLLBACK");
    const report = {
      status: "COPIED_AND_VERIFIED", copied: matches,
      demoBookingsOctober14: demo.rows[0].count, runtimeTablesEmpty: true,
      rlsEnabledAllNineTables: true, publicApiRolesDenied: true,
      encryptedBackupVerified: true, backupPath: backupPath.slice(ROOT.length),
      backupKeySource: "original SESSION_SECRET", dataApiDisabledConfirmedByOwner: true,
      sourceReadOnly: true, providerNotChanged: true, noDeploymentStarted: true,
    };
    await writeFile(resolve(privateDir, "last-copy-report.json"), JSON.stringify(report, null, 2), { mode: 0o600 });
    console.log(JSON.stringify(report));
  } catch (error) {
    console.error(JSON.stringify({
      status: "FAILED", safeCode: error instanceof SafeError ? error.message : "PRIVATE_MIGRATION_FAILED",
      destinationCommitted: committed, backupCreated: Boolean(backupPath), sourceUnchanged: true,
      rawErrorsSuppressed: true, providerNotChanged: true, noDeploymentStarted: true,
    }));
    process.exitCode = 1;
  } finally {
    await source.query("ROLLBACK").catch(() => {});
    await target.query("ROLLBACK").catch(() => {});
    await Promise.all([source.end().catch(() => {}), target.end().catch(() => {})]);
  }
}
void main().catch(error => {
  console.error(JSON.stringify({
    status: "STOPPED_BEFORE_EXECUTION",
    safeCode: error instanceof SafeError ? error.message : "PRIVATE_DETAILS_SUPPRESSED",
  }));
  process.exitCode = 1;
});
