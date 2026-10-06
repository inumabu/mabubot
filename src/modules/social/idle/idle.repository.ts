/** 🗃️ Repository：放置ステータスの永続化を担当します。 */

import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../../../infrastructure/database/sqlite.js";

export type IdleActivity = "games" | "chat" | "vc";

export interface IdleMember {
  userId: string;
  activity: IdleActivity;
}

export class IdleRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}

  listByGuild(guildId: string): IdleMember[] {
    const rows = this.database
      .prepare("SELECT user_id, activity FROM idle_members WHERE guild_id = ?")
      .all(guildId) as { user_id: string; activity: IdleActivity }[];
    return rows.map(({ user_id, activity }) => ({ userId: user_id, activity }));
  }

  setActivity(guildId: string, userId: string, activity: IdleActivity): void {
    this.database
      .prepare(
        `INSERT INTO idle_members (guild_id, user_id, activity, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (guild_id, user_id) DO UPDATE SET
           activity = excluded.activity,
           updated_at = excluded.updated_at`,
      )
      .run(guildId, userId, activity, new Date().toISOString());
  }

  clearActivity(guildId: string, userId: string): void {
    this.database
      .prepare("DELETE FROM idle_members WHERE guild_id = ? AND user_id = ?")
      .run(guildId, userId);
  }
}