/** 🤖 AI基盤：OpenAI互換プロバイダーへのリクエストを隔離します。 */

import { env } from "../../env.js";

interface ChatCompletionResponse {
  choices?: { message?: { content?: string | null } }[];
  answer?: string;
}

export async function createChatCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
): Promise<string> {
  if (!env.aiApiKey) throw new Error("AI_NOT_CONFIGURED");
  const response = await fetch(`${env.aiApiBaseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.aiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: env.aiModel, messages, temperature: 0.7, max_tokens: 500 }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`AI_PROVIDER_ERROR_${response.status}`);
  const data = await response.json() as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("AI_EMPTY_RESPONSE");
  return content;
}
