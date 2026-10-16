import {test} from "node:test";
import assert from "node:assert/strict";
import {createApp} from "../src/app.js";
import {sampleAnalysis, sampleText} from "../src/example.js";
import {createGeminiAnalyzer, AnalysisError} from "../src/provider.js";
import {validateAnalysis, riskLevelFor} from "../src/contract.js";

async function serve(t, options = {}) {
  const server = createApp({analyze: async () => sampleAnalysis, rateMax: 100, ...options}).listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => {server.closeAllConnections(); server.close();});
  const url = "http://127.0.0.1:" + server.address().port;
  return (body, headers = {}) => fetch(url + "/api/analyze", {method: "POST", headers: {"Content-Type": "application/json", ...headers}, body: JSON.stringify(body)});
}

test("valid response strips unexpected output and computes consistent risk band", async t => {
  const request = await serve(t, {analyze: async () => ({...sampleAnalysis, riskLevel: "Düşük", rawModelOutput: "private"})});
  const response = await request({text: "Mesaj örneği"});
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.riskLevel, "Kritik");
  assert.equal(body.rawModelOutput, undefined);
  assert.equal(response.headers.get("cache-control"), "no-store");
});
for (const text of [undefined, null, 123, "", "    ", "abcd", "x".repeat(5001)]) {
  test("invalid input " + String(text).slice(0, 12), async t => {
    let calls = 0;
    const request = await serve(t, {analyze: async () => {calls++;}});
    assert.equal((await request({text})).status, 400);
    assert.equal(calls, 0);
  });
}
for (const patch of [{reasons: "string"}, {redFlags: {}}, {riskScore: 101}, {confidence: -1}, {summary: ""}, {riskScore: "90"}, {reasons: []}]) {
  test("invalid model contract " + JSON.stringify(patch), async t => {
    const request = await serve(t, {analyze: async () => ({...sampleAnalysis, ...patch})});
    const response = await request({text: "Mesaj örneği"});
    assert.equal(response.status, 502);
    assert.equal((await response.json()).riskScore, undefined);
  });
}
test("rate limit and cross-origin rejection", async t => {
  const request = await serve(t, {rateMax: 1});
  assert.equal((await request({text: "Mesaj örneği"}, {Origin: "https://attacker.example"})).status, 403);
  const response = await request({text: "Mesaj örneği"});
  assert.equal(response.status, 429);
  assert.ok(response.headers.has("retry-after"));
});
test("oversized body rejected without leaking content", async t => {
  const request = await serve(t);
  const response = await request({text: "x".repeat(40000)});
  assert.equal(response.status, 413);
  assert.equal((await response.json()).code, "BODY_TOO_LARGE");
});
test("demo only accepts fixed fixture and never calls provider", async t => {
  const request = await serve(t, {demo: true, analyze: () => {throw Error("never");}});
  assert.equal((await (await request({text: sampleText})).json()).mode, "demo");
  assert.equal((await request({text: "Başka metin"})).status, 400);
});
test("provider errors expose only safe messages", async t => {
  const request = await serve(t, {analyze: () => {throw Error("secret-api-key");}});
  const response = await request({text: "Mesaj örneği"});
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes("secret-api-key"));
});
test("concurrency guard releases slot on failure", async t => {
  let release;
  const waiting = new Promise(resolve => {release = resolve;});
  let entered = 0;
  let allEntered;
  const ready = new Promise(resolve => {allEntered = resolve;});
  const request = await serve(t, {analyze: async () => {if (++entered === 4) allEntered(); await waiting; throw Error("test");}});
  const pending = Array.from({length: 4}, () => request({text: "Mesaj örneği"}));
  await ready;
  const fifth = await request({text: "Mesaj örneği"});
  assert.equal(fifth.status, 503);
  release();
  await Promise.all(pending);
  assert.equal((await request({text: "Mesaj örneği"})).status, 502);
});
test("risk thresholds", () => {
  assert.deepEqual([0,34,35,59,60,79,80,100].map(riskLevelFor), ["Düşük","Düşük","Orta","Orta","Yüksek","Yüksek","Kritik","Kritik"]);
  assert.throws(() => validateAnalysis({...sampleAnalysis, riskScore: NaN}));
});

const envelope = data => ({candidates: [{finishReason: "STOP", content: {parts: [{text: JSON.stringify(data)}]}}]});
test("Gemini transport uses server key, separate instruction and structured JSON", async () => {
  let captured;
  const analyze = createGeminiAnalyzer({apiKey: "test-key", model: "test-model", fetchImpl: async (url, init) => {
    captured = {url, init, body: JSON.parse(init.body)};
    return Response.json(envelope(sampleAnalysis));
  }});
  assert.equal((await analyze("Untrusted instructions")).riskScore, 90);
  assert.ok(!captured.url.includes("test-key"));
  assert.equal(captured.init.headers["x-goog-api-key"], "test-key");
  assert.equal(captured.body.contents[0].parts[0].text, "Untrusted instructions");
  assert.equal(captured.body.generationConfig.responseMimeType, "application/json");
});
for (const [name, fetchImpl, status] of [
  ["http failure", async () => new Response("private provider error", {status: 429}), 502],
  ["invalid json", async () => new Response("not json"), 502],
  ["blocked", async () => Response.json({promptFeedback: {blockReason: "SAFETY"}}), 502],
  ["truncated", async () => Response.json({candidates: [{finishReason: "MAX_TOKENS"}]}), 502],
  ["bad schema", async () => Response.json(envelope({...sampleAnalysis, reasons: "bad"})), 502],
  ["timeout", async () => {throw new DOMException("timeout", "TimeoutError");}, 504]
]) {
  test("provider: " + name, async () => {
    const analyze = createGeminiAnalyzer({apiKey: "test", model: "test", fetchImpl});
    await assert.rejects(analyze("metin"), e => e instanceof AnalysisError && e.status === status);
  });
}
test("missing credentials never makes upstream call", async () => {
  const analyze = createGeminiAnalyzer({fetchImpl: () => {throw Error("never");}});
  await assert.rejects(analyze("metin"), e => e.status === 503);
});
