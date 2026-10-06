/** ⚙️ Service：AI応答と会話履歴の業務ルールを担当します。 */

import { createChatCompletion } from "../../../infrastructure/ai/ai-client.js";
import { AiRepository } from "./ai.repository.js";

const repository = new AiRepository();

export async function askMabuAi(
  guildId: string,
  userId: string,
  question: string,
  guildName: string,
): Promise<string> {
  const history = repository.listRecent(guildId, userId);
  const answer = await createChatCompletion([
    {
      role: "system",
      content: [
        "あなたはDiscordサーバー「まぶ鯖」の専属AI、まぶBotです。",
        "親しみやすい日本語で、短く具体的に答えてください。",
        "サーバー固有の事実を知らない場合は、推測せず運営へ確認するよう案内してください。",
        `現在のサーバー名: ${guildName}`,
      ].join("\n"),
    },
    ...history,
    { role: "user", content: question },
  ]);
  repository.append(guildId, userId, [
    { role: "user", content: question },
    { role: "assistant", content: answer },
  ]);
  return answer;
}