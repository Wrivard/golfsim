import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import bcrypt from "bcrypt";
import { trustedProductionOrigins } from "./runtime/request-origin";

test("only the two exact HTTPS Golf SIM production origins are aliases", () => {
  for (const canonical of ["https://golfsimsorel.ca","https://www.golfsimsorel.ca"]) {
    const allowed = trustedProductionOrigins(canonical);
    assert.equal(allowed.size,2);
    assert.equal(allowed.has("https://golfsimsorel.ca"),true);
    assert.equal(allowed.has("https://www.golfsimsorel.ca"),true);
    for (const foreign of ["http://golfsimsorel.ca","https://evil.golfsimsorel.ca","https://golfsimsorel.ca.evil.invalid","https://other.invalid"]) assert.equal(allowed.has(foreign),false);
  }
  assert.deepEqual([...trustedProductionOrigins("https://preview.example.invalid")],["https://preview.example.invalid"]);
});

test("real production bootstrap and staff routes authenticate, persist, reject and logout with isolated SQL", async () => {
  // This file runs in its own test process. Never inherit a real connection.
  Object.assign(process.env, {
    VERCEL: "1", VERCEL_ENV: "production", NODE_ENV: "production",
    SITE_URL: "https://golfsimsorel.ca", DATABASE_PROVIDER: "neon",
    NEON_DATABASE_URL: "postgresql://fixture:fixture@127.0.0.1:1/fixture",
    SESSION_SECRET: "isolated-session-fixture-never-production",
    CRON_SECRET: "isolated-cron-fixture-never-production",
    CALENDAR_ENABLED: "false", CONTACT_EMAIL_ENABLED: "false",
  });
  const { runtimeSql } = await import("./runtime/sql");
  const records = new Map<string, {data: unknown; expires: Date}>();
  runtimeSql.query = async (text, values = []) => {
    const key = String(values[0]);
    if (text.includes("to_regclass")) return {rows:[{sessions:true,limits:true,leases:true,state:true}]};
    if (text.includes("gsim_rate_limits")) return {rows:[{hits:1}]};
    if (text.startsWith("SELECT data FROM gsim_sessions")) {
      const row = records.get(key);
      return {rows:row && +row.expires > Date.now() ? [{data:row.data}] : []};
    }
    if (text.startsWith("INSERT INTO gsim_sessions")) records.set(key, {data:JSON.parse(String(values[1])), expires:new Date(String(values[2]))});
    else if (text.startsWith("DELETE FROM gsim_sessions")) records.delete(key);
    else if (text.startsWith("UPDATE gsim_sessions")) {
      const row = records.get(key); if (row) row.expires = new Date(String(values[1]));
    } else throw new Error("Unexpected SQL in isolated test");
    return {rows:[],rowCount:1};
  };
  const { storage } = await import("./storage");
  const admin = {id:"fixture-admin",username:"fixture",passwordHash:await bcrypt.hash("fixture-password",4),role:"admin",createdAt:new Date()};
  storage.getAdminByUsername = async name => name === admin.username ? admin : undefined;
  storage.getAdminById = async id => id === admin.id ? admin : undefined;
  const { initializedApp } = await import("./bootstrap");
  const server = createServer(await initializedApp());
  await new Promise<void>(resolve => server.listen(0,"127.0.0.1",resolve));
  const base = `http://127.0.0.1:${(server.address() as {port:number}).port}`;
  const headers = {"Content-Type":"application/json",Origin:"https://www.golfsimsorel.ca","X-Forwarded-Proto":"https"};
  try {
    const login = (password: string) => fetch(base+"/api/auth/login",{method:"POST",headers,body:JSON.stringify({username:"fixture",password})});
    assert.equal((await login("wrong")).status,401);
    const response = await login("fixture-password");
    assert.equal(response.status,200);
    assert.equal((await response.json() as {ok:boolean}).ok,true);
    const setCookie = response.headers.get("set-cookie")!;
    assert.match(setCookie,/HttpOnly/); assert.match(setCookie,/Secure/);
    const cookie = setCookie.split(";")[0];
    for (let i=0;i<2;i++) {
      const reload = await fetch(base+"/api/auth/session",{headers:{...headers,cookie}});
      assert.equal((await reload.json() as {authenticated:boolean}).authenticated,true);
    }
    const rejected = await fetch(base+"/api/auth/login",{method:"POST",headers:{...headers,Origin:"https://other.invalid"},body:"{}"});
    assert.equal(rejected.status,403);
    assert.equal((await fetch(base+"/api/auth/logout",{method:"POST",headers:{...headers,cookie}})).status,200);
    assert.equal((await (await fetch(base+"/api/auth/session",{headers:{...headers,cookie}})).json() as {authenticated:boolean}).authenticated,false);
  } finally { await new Promise<void>(resolve => server.close(()=>resolve())); }
});
