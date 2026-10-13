import test from "node:test";
import assert from "node:assert/strict";
import { staffLogin } from "./staff-login";

const credentials = { username: "fixture", password: "fixture" };
test("login client safely handles status, non-JSON, empty, malformed and network responses", async () => {
  for (const status of [200, 500, 502, 503]) {
    for (const text of ["", "<html>private error</html>", "A server error has occurred"]) {
      await assert.rejects(staffLogin(credentials, async () => new Response(text, {status})), /Service temporairement indisponible/);
    }
  }
  for (const value of [null, {}, {ok:false}, {ok:"true"}]) {
    await assert.rejects(staffLogin(credentials, async () => Response.json(value)), /Service temporairement indisponible/);
  }
  await assert.rejects(staffLogin(credentials, async () => {throw new Error("internal detail");}), /Vérifiez votre connexion Internet/);
  await assert.rejects(staffLogin(credentials, async () => new Response("",{status:401})), /Identifiants invalides/);
  await assert.rejects(staffLogin(credentials, async () => new Response("",{status:429})), /15 minutes/);
  await assert.rejects(staffLogin(credentials, async () => new Response("",{status:403})), /adresse officielle/);
});
test("login client sends credentials to the same origin and accepts confirmed success", async () => {
  const result = await staffLogin(credentials, async (url, init) => {
    assert.equal(url, "/api/auth/login");
    assert.equal(init?.credentials, "same-origin");
    assert.deepEqual(JSON.parse(String(init?.body)), credentials);
    return Response.json({ok:true});
  });
  assert.deepEqual(result, {ok:true});
});
