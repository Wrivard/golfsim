import { pool } from "../db";

export interface SqlClient {
  query(text: string, values?: unknown[]): Promise<{ rows: any[]; rowCount?: number | null }>;
}
export const runtimeSql: SqlClient = {
  query: (text, values = []) => pool.query(text, values),
};

// Infrastructure is provisioned explicitly; never CREATE tables during requests.
export async function checkRuntimeSchema() {
  const { rows } = await runtimeSql.query(
    "SELECT to_regclass('public.gsim_sessions') AS sessions, to_regclass('public.gsim_rate_limits') AS limits, to_regclass('public.gsim_job_leases') AS leases, to_regclass('public.gsim_runtime_state') AS state",
  );
  if (!rows[0]?.sessions || !rows[0]?.limits || !rows[0]?.leases || !rows[0]?.state) {
    throw new Error("Runtime infrastructure migration must be reviewed and applied before enabling PostgreSQL runtime storage.");
  }
}
