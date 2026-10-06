/** 🗃️ Repository：Thanksの永続化を担当します。 */

import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../../../infrastructure/database/sqlite.js";

export interface ThanksRecord {
  senderId: string;
  recipientId: string;
  message: string | null;
  createdAt: string;
}

export class ThanksRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}

  create(guildId: string, senderId: string, recipientId: string, message?: string): ThanksRecord {
    const createdAt = new Date().toISOString();
    this.database.prepare(
      `INSERT INTO thanks_records (id, guild_id, sender_id, recipient_id, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(randomUUID(), guildId, senderId, recipientId, message ?? null, createdAt);
    return { senderId, recipientId, message: message ?? null, createdAt };
  }

  countReceived(guildId: string, userId: string): number {
    const result = this.database.prepare(
      "SELECT COUNT(*) AS count FROM thanks_records WHERE guild_id = ? AND recipient_id = ?",
    ).get(guildId, userId) as { count: number };
    return result.count;
  }

  countSince(guildId: string, since: string): number {
    const result = this.database.prepare(
      "SELECT COUNT(*) AS count FROM thanks_records WHERE guild_id = ? AND created_at >= ?",
    ).get(guildId, since) as { count: number };
    return result.count;
  }
}