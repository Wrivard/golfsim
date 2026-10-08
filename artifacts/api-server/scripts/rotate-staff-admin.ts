/**
 * Explicit, operator-run credential rotation. Never runs during startup.
 * Reads the password from Secrets; emits only verification booleans.
 */
import bcrypt from "bcrypt";
import { pool } from "@workspace/db";

const username = "admingolfsimsorel";
const password = process.env.STAFF_ADMIN_PASSWORD;
const verifyOnly = process.argv.includes("--verify-only");
let committed = false;

async function rotate() {
  if (!password || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("A valid secure password is required.");
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query("SELECT id, username, role FROM admin_users FOR UPDATE");
    if (existing.rows.length !== 1 || existing.rows[0].role !== "admin") {
      throw new Error("The single-administrator safeguard failed.");
    }
    const original = existing.rows[0];
    const hash = await bcrypt.hash(password, 12);
    const result = await client.query(
      "UPDATE admin_users SET username = $1, password_hash = $2 WHERE id = $3 RETURNING id, username, role, password_hash",
      [username, hash, original.id],
    );
    const updated = result.rows[0];
    if (
      result.rowCount !== 1 || updated.id !== original.id ||
      updated.role !== original.role || updated.username !== username ||
      !(await bcrypt.compare(password, updated.password_hash))
    ) throw new Error("Credential update verification failed.");
    const obsolete = original.username === username ? 0 :
      (await client.query("SELECT count(*)::int AS total FROM admin_users WHERE username = $1", [original.username])).rows[0].total;
    if (obsolete !== 0) throw new Error("The previous identifier is still active.");
    await client.query("COMMIT");
    committed = true;
    console.log(JSON.stringify({credentialsUpdated:true,identityPreserved:true,rolePreserved:true,oldIdentifierRemoved:true,passwordHashVerified:true}));
  } catch {
    await client.query("ROLLBACK");
    throw new Error("Credential rotation could not be completed safely.");
  } finally {
    client.release();
  }
}

async function verifyLogin() {
  if (!password) throw new Error("The secure password is missing.");
  const base = "http://127.0.0.1:80/api/auth";
  const login = await fetch(base+"/login", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({username,password}),
  });
  const result = await login.json();
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  if (!login.ok || !result.ok || result.admin?.username !== username || !cookie) {
    throw new Error("The new login could not be verified.");
  }
  try {
    const response = await fetch(base+"/session", {headers:{Cookie:cookie}});
    const session = await response.json();
    if (!response.ok || !session.authenticated || session.admin?.username !== username || session.admin?.role !== "admin") {
      throw new Error("The authenticated session could not be verified.");
    }
    console.log(JSON.stringify({loginVerified:true,authenticatedSessionVerified:true,adminRoleVerified:true}));
  } finally {
    const logout = await fetch(base+"/logout", {
      method:"POST",headers:{Cookie:cookie,"Content-Type":"application/json"},body:"{}",
    });
    if (!logout.ok) throw new Error("Verification session cleanup failed.");
  }
}

try {
  if (verifyOnly) await verifyLogin(); else await rotate();
} catch {
  console.error(JSON.stringify({success:false,credentialsCommitted:committed,message:"The credential operation failed. No password or connection details were logged."}));
  process.exitCode = 1;
} finally {
  await pool.end();
}
