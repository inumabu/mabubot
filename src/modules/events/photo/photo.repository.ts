/** 🗃️ Repository：写真の永続化を担当します。 */

import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../../../infrastructure/database/sqlite.js";

export interface PhotoRecord {
  id: string;
  userId: string;
  imageUrl: string;
  imageKey: string | null;
  caption: string | null;
  createdAt: string;
}

export class PhotoRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}

  create(guildId: string, userId: string, imageKey: string, caption?: string): PhotoRecord {
    const record = {
      id: randomUUID(),
      userId,
      imageUrl: "",
      imageKey,
      caption: caption ?? null,
      createdAt: new Date().toISOString(),
    };
    this.database.prepare(
      `INSERT INTO photo_posts (id, guild_id, user_id, image_url, image_key, caption, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
     ).run(record.id, guildId, userId, "", imageKey, record.caption, record.createdAt);
    return record;
  }

  listRecent(guildId: string, since: string): PhotoRecord[] {
    const rows = this.database.prepare(
      `SELECT id, user_id, image_url, image_key, caption, created_at FROM photo_posts
       WHERE guild_id = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 30`,
    ).all(guildId, since) as unknown as {
      id: string;
      user_id: string;
      image_url: string;
      image_key: string | null;
      caption: string | null;
      created_at: string;
    }[];
    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      imageUrl: row.image_url,
      imageKey: row.image_key,
      caption: row.caption,
      createdAt: row.created_at,
    }));
  }
}