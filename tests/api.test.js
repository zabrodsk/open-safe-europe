import test from "node:test";
import assert from "node:assert/strict";
import { onRequest } from "../functions/api/[[path]].js";
import { defaults } from "../src/agreement.js";
const call = (path, body) =>
  onRequest({
    request: new Request(`https://example.test/api/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
test("API never assumes commercial terms", async () => {
  const r = await call("draft", { data: { company: "Example" } });
  assert.equal(r.status, 422);
  assert.ok((await r.json()).fields.includes("investment"));
});
test("API rejects invalid amounts and malformed types", async () => {
  assert.equal(
    (await call("draft", { data: { ...defaults(), cap: 1 } })).status,
    422,
  );
  assert.equal(
    (
      await call("draft", {
        data: { ...defaults(), company: { name: "Example" } },
      })
    ).status,
    400,
  );
  assert.equal(
    (await call("draft", { data: { ...defaults(), currency: "bad" } })).status,
    422,
  );
});
test("API keeps missing details visible and reports them", async () => {
  const r = await call("draft", { data: defaults() });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.ok(d.text.includes("[COMPANY NAME]"));
  assert.ok(d.warnings.company);
  assert.equal(d.indicativeOwnership, 5);
});
test("API custom templates and edits preserve source status", async () => {
  const data = { ...defaults(), company: "Test startup" };
  const draft = await (
    await call("draft", { data, template: "Company {{company}}. {{unknown}}" })
  ).json();
  assert.equal(draft.text, "Company Test startup. {{unknown}}");
  assert.match(draft.source, /User-supplied/);
  const r = await call("export", {
    data,
    text: "Approved edit",
    format: "txt",
  });
  assert.match(await r.text(), /User-edited draft[\s\S]*Approved edit/);
});
test("API limits request size", async () => {
  assert.equal(
    (await call("draft", { data: defaults(), extra: "a".repeat(270000) }))
      .status,
    413,
  );
});
test("API rejects malformed JSON", async () => {
  const r = await onRequest({
    request: new Request("https://example.test/api/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{oops",
    }),
  });
  assert.equal(r.status, 400);
});
