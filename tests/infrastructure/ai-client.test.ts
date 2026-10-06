/** 🧪 テスト：対象機能の外部契約と回帰条件を検証します。 */

import assert from "node:assert/strict";
import { after, test } from "node:test";

process.env.AI_API_KEY = "test-api-key";
process.env.AI_API_BASE_URL = "http://ai.test/v1";
process.env.AI_MODEL = "test-model";
const { createChatCompletion } = await import("../../src/infrastructure/ai/ai-client.js");
const originalFetch = globalThis.fetch;

after(() => {
  globalThis.fetch = originalFetch;
  delete process.env.AI_API_KEY;
  delete process.env.AI_API_BASE_URL;
  delete process.env.AI_MODEL;
});

test("AI client calls the OpenAI-compatible provider", async () => {
  let url = "";
  let request: RequestInit | undefined;
  globalThis.fetch = (async (input, init) => {
    url = String(input);
    request = init;
    return new Response(JSON.stringify({ choices: [{ message: { content: "回答" } }] }), { status: 200 });
  }) as typeof fetch;

  assert.equal(
    await createChatCompletion([{ role: "user", content: "質問" }]),
    "回答",
  );
  assert.equal(url, "http://ai.test/v1/chat/completions");
  assert.equal(new Headers(request?.headers).get("authorization"), "Bearer test-api-key");
  assert.deepEqual(JSON.parse(String(request?.body)), {
    model: "test-model",
    messages: [{ role: "user", content: "質問" }],
    temperature: 0.7,
    max_tokens: 500,
  });
});

test("AI client reports provider errors", async () => {
  globalThis.fetch = (async () => new Response("unavailable", { status: 503 })) as typeof fetch;
  await assert.rejects(
    createChatCompletion([{ role: "user", content: "質問" }]),
    /AI_PROVIDER_ERROR_503/,
  );
});
