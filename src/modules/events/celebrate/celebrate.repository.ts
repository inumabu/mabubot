/** 🗃️ Repository：記念日の永続化を担当します。 */

import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../../../infrastructure/database/sqlite.js";

export interface Celebration {
  id: string;
  ownerId: string;
  title: string;
  startsAt: string;
  description: string | null;
}

export class CelebrateRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}

  create(input: {
    guildId: string;
    ownerId: string;
    title: string;
    startsAt: string;
    description?: string;
  }): Celebration {
    const id = randomUUID();
    this.database.prepare(
      `INSERT INTO celebrations (id, guild_id, owner_id, title, starts_at, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.guildId,
      input.ownerId,
      input.title,
      input.startsAt,
      input.description ?? null,
      new Date().toISOString(),
    );
    return {
      id,
      ownerId: input.ownerId,
      title: input.title,
      startsAt: input.startsAt,
      description: input.description ?? null,
    };
  }

  list(guildId: string): Celebration[] {
    const rows = this.database.prepare(
      "SELECT id, owner_id, title, starts_at, description FROM celebrations WHERE guild_id = ? AND starts_at >= ? ORDER BY starts_at LIMIT 12",
    ).all(guildId, new Date().toISOString()) as unknown as {
      id: string;
      owner_id: string;
      title: string;
      starts_at: string;
      description: string | null;
    }[];
    return rows.map((row) => ({
      id: row.id,
      ownerId: row.owner_id,
      title: row.title,
      startsAt: row.starts_at,
      description: row.description,
    }));
  }
}