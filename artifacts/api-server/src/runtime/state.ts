import { randomUUID } from "node:crypto";
import { runtimeSql } from "./sql";
import { durableRuntime } from "./config";

const local = new Map<string, unknown>();
const localLeases = new Set<string>();
export async function readState<T>(key: string): Promise<T | null> {
  if (!durableRuntime()) return (local.get(key) as T) || null;
  const { rows } = await runtimeSql.query("SELECT value FROM gsim_runtime_state WHERE key = $1", [key]);
  return rows[0]?.value || null;
}
export async function writeState(key: string, value: unknown) {
  if (!durableRuntime()) { local.set(key, value); return; }
  await runtimeSql.query("INSERT INTO gsim_runtime_state (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()", [key, JSON.stringify(value)]);
}
export async function withLease<T>(name: string, action: () => Promise<T>): Promise<T | null> {
  const owner = randomUUID();
  if (!durableRuntime()) {
    if (localLeases.has(name)) return null;
    localLeases.add(name);
  } else {
    const { rows } = await runtimeSql.query(
      "INSERT INTO gsim_job_leases (name, owner, expires_at) VALUES ($1, $2, now() + interval '330 seconds') ON CONFLICT (name) DO UPDATE SET owner = EXCLUDED.owner, expires_at = EXCLUDED.expires_at WHERE gsim_job_leases.expires_at <= now() RETURNING owner",
      [name, owner]);
    if (!rows.length) return null;
  }
  try { return await action(); }
  finally {
    if (durableRuntime()) {
      await runtimeSql.query("DELETE FROM gsim_job_leases WHERE name = $1 AND owner = $2", [name, owner]);
    } else localLeases.delete(name);
  }
}
