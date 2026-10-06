/** 🗃️ Repository：イベントの永続化を担当します。 */

import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../../../infrastructure/database/sqlite.js";

export interface EventRecord {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string | null;
  ownerId: string;
  name: string;
  startsAt: string;
  description: string | null;
  status: "open" | "cancelled";
  memberIds: string[];
}

interface EventRow {
  id: string;
  guild_id: string;
  channel_id: string;
  message_id: string | null;
  owner_id: string;
  name: string;
  starts_at: string;
  description: string | null;
  status: "open" | "cancelled";
}

// 🔗 参加・離脱・取消の結果をServiceとCommand間で共有する分岐契約です。
export type EventActionResult = "updated" | "already-joined" | "not-joined" | "cancelled" | "missing" | "not-owner";

export class EventRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}

  create(input: {
    guildId: string;
    channelId: string;
    ownerId: string;
    name: string;
    startsAt: string;
    description?: string;
  }): EventRecord {
    const id = randomUUID();
    const database = this.database;
    database.prepare(
      `INSERT INTO events (id, guild_id, channel_id, owner_id, name, starts_at, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.guildId,
      input.channelId,
      input.ownerId,
      input.name,
      input.startsAt,
      input.description ?? null,
      new Date().toISOString(),
    );
    database.prepare("INSERT INTO event_members (event_id, user_id, joined_at) VALUES (?, ?, ?)")
      .run(id, input.ownerId, new Date().toISOString());
    return this.findById(id)!;
  }

  setMessageId(id: string, messageId: string): void {
    this.database.prepare("UPDATE events SET message_id = ? WHERE id = ?").run(messageId, id);
  }

  findById(id: string): EventRecord | undefined {
    const row = this.database.prepare("SELECT * FROM events WHERE id = ?").get(id) as EventRow | undefined;
    return row ? this.mapEvent(row) : undefined;
  }

  listOpen(guildId: string): EventRecord[] {
    const rows = this.database
      .prepare("SELECT * FROM events WHERE guild_id = ? AND status = 'open' AND starts_at > ? ORDER BY starts_at LIMIT 15")
      .all(guildId, new Date().toISOString()) as unknown as EventRow[];
    return rows.map((row) => this.mapEvent(row));
  }

  countCreatedSince(guildId: string, since: string): number {
    const row = this.database.prepare(
      "SELECT COUNT(*) AS count FROM events WHERE guild_id = ? AND created_at >= ?",
    ).get(guildId, since) as { count: number };
    return row.count;
  }

  listDueReminders(from: string, until: string): EventRecord[] {
    const rows = this.database.prepare(
      `SELECT events.* FROM events
       LEFT JOIN event_reminders ON event_reminders.event_id = events.id
       WHERE events.status = 'open' AND events.message_id IS NOT NULL
         AND events.starts_at > ? AND events.starts_at <= ? AND event_reminders.event_id IS NULL
       ORDER BY events.starts_at`,
    ).all(from, until) as unknown as EventRow[];
    return rows.map((row) => this.mapEvent(row));
  }

  markReminderSent(eventId: string): void {
    this.database.prepare("INSERT OR IGNORE INTO event_reminders (event_id, sent_at) VALUES (?, ?)")
      .run(eventId, new Date().toISOString());
  }

  join(id: string, userId: string): EventActionResult {
    const database = this.database;
    const event = database.prepare("SELECT status FROM events WHERE id = ?").get(id) as { status: string } | undefined;
    if (!event) return "missing";
    if (event.status !== "open") return "cancelled";
    const result = database.prepare(
      "INSERT OR IGNORE INTO event_members (event_id, user_id, joined_at) VALUES (?, ?, ?)",
    ).run(id, userId, new Date().toISOString());
    return result.changes ? "updated" : "already-joined";
  }

  leave(id: string, userId: string): EventActionResult {
    const event = this.database.prepare("SELECT status FROM events WHERE id = ?").get(id) as { status: string } | undefined;
    if (!event) return "missing";
    if (event.status !== "open") return "cancelled";
    const result = this.database.prepare("DELETE FROM event_members WHERE event_id = ? AND user_id = ?")
      .run(id, userId);
    return result.changes ? "updated" : "not-joined";
  }

  cancel(id: string, ownerId: string): EventActionResult {
    const event = this.database.prepare("SELECT owner_id, status FROM events WHERE id = ?")
      .get(id) as { owner_id: string; status: string } | undefined;
    if (!event) return "missing";
    if (event.owner_id !== ownerId) return "not-owner";
    if (event.status !== "open") return "cancelled";
    this.database.prepare("UPDATE events SET status = 'cancelled' WHERE id = ?").run(id);
    return "cancelled";
  }

  private mapEvent(row: EventRow): EventRecord {
    const memberRows = this.database.prepare(
      "SELECT user_id FROM event_members WHERE event_id = ? ORDER BY joined_at",
    ).all(row.id) as { user_id: string }[];
    return {
      id: row.id,
      guildId: row.guild_id,
      channelId: row.channel_id,
      messageId: row.message_id,
      ownerId: row.owner_id,
      name: row.name,
      startsAt: row.starts_at,
      description: row.description,
      status: row.status,
      memberIds: memberRows.map(({ user_id }) => user_id),
    };
  }
}