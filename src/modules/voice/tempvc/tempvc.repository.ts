/** 🗃️ Repository：一時VCの永続化を担当します。 */

import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../../../infrastructure/database/sqlite.js";

export interface TempVoiceRecord {
  channelId: string;
  guildId: string;
  ownerId: string;
}

export class TempVoiceRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}

  create(channelId: string, guildId: string, ownerId: string): void {
    this.database.prepare(
      "INSERT INTO temp_voice_channels (channel_id, guild_id, owner_id, created_at) VALUES (?, ?, ?, ?)",
    ).run(channelId, guildId, ownerId, new Date().toISOString());
  }

  find(channelId: string): TempVoiceRecord | undefined {
    const row = this.database.prepare(
      "SELECT channel_id, guild_id, owner_id FROM temp_voice_channels WHERE channel_id = ?",
    ).get(channelId) as unknown as { channel_id: string; guild_id: string; owner_id: string } | undefined;
    return row ? { channelId: row.channel_id, guildId: row.guild_id, ownerId: row.owner_id } : undefined;
  }

  list(): TempVoiceRecord[] {
    const rows = this.database.prepare(
      "SELECT channel_id, guild_id, owner_id FROM temp_voice_channels",
    ).all() as unknown as { channel_id: string; guild_id: string; owner_id: string }[];
    return rows.map((row) => ({ channelId: row.channel_id, guildId: row.guild_id, ownerId: row.owner_id }));
  }

  remove(channelId: string): void {
    this.database.prepare("DELETE FROM temp_voice_channels WHERE channel_id = ?").run(channelId);
  }
}