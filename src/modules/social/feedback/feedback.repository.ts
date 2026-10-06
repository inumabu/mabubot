/** 🗃️ Repository：フィードバックの永続化を担当します。 */

import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../../../infrastructure/database/sqlite.js";

export class FeedbackRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}

  create(guildId: string, category: string, message: string): string {
    const id = randomUUID();
    this.database.prepare(
      "INSERT INTO feedback_entries (id, guild_id, category, message, created_at) VALUES (?, ?, ?, ?, ?)",
    ).run(id, guildId, category, message, new Date().toISOString());
    return id;
  }
}