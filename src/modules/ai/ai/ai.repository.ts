/** 🗃️ Repository：AI会話履歴の永続化と直近履歴の整形を担当します。 */

import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../../../infrastructure/database/sqlite.js";

export type AiRole = "user" | "assistant";

export interface AiMessage {
  role: AiRole;
  content: string;
}

export class AiRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}

  listRecent(guildId: string, userId: string): AiMessage[] {
    const rows = this.database.prepare(
      `SELECT role, content FROM ai_conversations WHERE guild_id = ? AND user_id = ?
       ORDER BY created_at DESC LIMIT 10`,
    ).all(guildId, userId) as unknown as AiMessage[];
    return rows.reverse();
  }

  append(guildId: string, userId: string, messages: AiMessage[]): void {
    const insert = this.database.prepare(
      "INSERT INTO ai_conversations (id, guild_id, user_id, role, content, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const latest = this.database.prepare(
      "SELECT MAX(created_at) AS created_at FROM ai_conversations WHERE guild_id = ? AND user_id = ?",
    ).get(guildId, userId) as { created_at: string | null };
    let timestamp = Math.max(Date.now(), latest.created_at ? Date.parse(latest.created_at) + 1 : Date.now());
    for (const [index, message] of messages.entries()) {
      insert.run(
        randomUUID(),
        guildId,
        userId,
        message.role,
        message.content,
        new Date(timestamp + index).toISOString(),
      );
    }
    this.database.prepare(
      `DELETE FROM ai_conversations WHERE guild_id = ? AND user_id = ?
       AND id NOT IN (
         SELECT id FROM ai_conversations WHERE guild_id = ? AND user_id = ?
         ORDER BY created_at DESC, id DESC LIMIT 10
       )`,
    ).run(guildId, userId, guildId, userId);
  }
}