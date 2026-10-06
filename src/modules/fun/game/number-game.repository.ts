/** 🗃️ Repository：数当てゲーム状態の永続化を担当します。 */

import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../../../infrastructure/database/sqlite.js";

export interface NumberGameSession {
  target: number;
  attempts: number;
  expiresAt: string;
}

export class NumberGameRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}

  find(guildId: string, userId: string): NumberGameSession | undefined {
    const row = this.database.prepare(
      "SELECT target, attempts, expires_at FROM number_game_sessions WHERE guild_id = ? AND user_id = ?",
    ).get(guildId, userId) as unknown as {
      target: number;
      attempts: number;
      expires_at: string;
    } | undefined;
    return row ? { target: row.target, attempts: row.attempts, expiresAt: row.expires_at } : undefined;
  }

  start(guildId: string, userId: string, target: number, expiresAt: string): NumberGameSession {
    this.database.prepare(
      `INSERT INTO number_game_sessions (guild_id, user_id, target, attempts, expires_at)
       VALUES (?, ?, ?, 0, ?)
       ON CONFLICT (guild_id, user_id) DO UPDATE SET
         target = excluded.target,
         attempts = 0,
         expires_at = excluded.expires_at`,
    ).run(guildId, userId, target, expiresAt);
    return { target, attempts: 0, expiresAt };
  }

  setAttempts(guildId: string, userId: string, attempts: number): void {
    this.database.prepare(
      "UPDATE number_game_sessions SET attempts = ? WHERE guild_id = ? AND user_id = ?",
    ).run(attempts, guildId, userId);
  }

  delete(guildId: string, userId: string): void {
    this.database.prepare(
      "DELETE FROM number_game_sessions WHERE guild_id = ? AND user_id = ?",
    ).run(guildId, userId);
  }
}