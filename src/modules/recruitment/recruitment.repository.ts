/** 🗃️ Repository：募集投稿と参加者の永続化を担当します。 */

import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../../infrastructure/database/sqlite.js";

export type RecruitmentKind = "lfg" | "vc";
export type RecruitmentActivity = "chat" | "gaming";

export interface RecruitmentPost {
  id: string;
  kind: RecruitmentKind;
  guildId: string;
  channelId: string;
  voiceChannelId: string | null;
  messageId: string | null;
  ownerId: string;
  activity: string;
  capacity: number;
  startTime: string | null;
  note: string | null;
  status: "open" | "closed";
  memberIds: string[];
}

interface RecruitmentRow {
  id: string;
  kind: RecruitmentKind;
  guild_id: string;
  channel_id: string;
  voice_channel_id: string | null;
  message_id: string | null;
  owner_id: string;
  activity: string;
  capacity: number;
  start_time: string | null;
  note: string | null;
  status: "open" | "closed";
}

export type MembershipResult =
  | "joined"
  | "already-joined"
  | "not-joined"
  | "full"
  | "closed"
  | "closed-by-owner"
  | "missing"
  | "owner"
  | "not-owner";

export class RecruitmentRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}

  create(input: {
    kind: RecruitmentKind;
    guildId: string;
    channelId: string;
    voiceChannelId?: string;
    ownerId: string;
    activity: string;
    capacity: number;
    startTime?: string;
    note?: string;
  }): RecruitmentPost {
    const id = randomUUID();
    const database = this.database;
    database.prepare(
      `INSERT INTO recruitments
        (id, kind, guild_id, channel_id, voice_channel_id, owner_id, activity, capacity, start_time, note, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.kind,
      input.guildId,
      input.channelId,
      input.voiceChannelId ?? null,
      input.ownerId,
      input.activity,
      input.capacity,
      input.startTime ?? null,
      input.note ?? null,
      new Date().toISOString(),
    );
    database.prepare(
      "INSERT INTO recruitment_members (recruitment_id, user_id, joined_at) VALUES (?, ?, ?)",
    ).run(id, input.ownerId, new Date().toISOString());
    return this.findById(id)!;
  }

  setMessageId(id: string, messageId: string): void {
    this.database.prepare("UPDATE recruitments SET message_id = ? WHERE id = ?").run(messageId, id);
  }

  findById(id: string): RecruitmentPost | undefined {
    const row = this.database
      .prepare("SELECT * FROM recruitments WHERE id = ?")
      .get(id) as RecruitmentRow | undefined;
    return row ? this.mapPost(row) : undefined;
  }

  listOpen(guildId: string, kind: RecruitmentKind): RecruitmentPost[] {
    const rows = this.database
      .prepare("SELECT * FROM recruitments WHERE guild_id = ? AND kind = ? AND status = 'open' ORDER BY created_at DESC LIMIT 50")
      .all(guildId, kind) as unknown as RecruitmentRow[];
    return rows.map((row) => this.mapPost(row));
  }

  countCreatedSince(guildId: string, kind: RecruitmentKind, since: string): number {
    const row = this.database.prepare(
      "SELECT COUNT(*) AS count FROM recruitments WHERE guild_id = ? AND kind = ? AND created_at >= ?",
    ).get(guildId, kind, since) as { count: number };
    return row.count;
  }

  countOpen(guildId: string, kind: RecruitmentKind): number {
    const row = this.database.prepare(
      "SELECT COUNT(*) AS count FROM recruitments WHERE guild_id = ? AND kind = ? AND status = 'open'",
    ).get(guildId, kind) as { count: number };
    return row.count;
  }

  join(id: string, userId: string): MembershipResult {
    const database = this.database;
    database.exec("BEGIN IMMEDIATE");
    try {
      const post = database.prepare("SELECT * FROM recruitments WHERE id = ?").get(id) as RecruitmentRow | undefined;
      if (!post) return this.finish(database, "missing");
      if (post.status !== "open") return this.finish(database, "closed");
      const existing = database.prepare(
        "SELECT 1 FROM recruitment_members WHERE recruitment_id = ? AND user_id = ?",
      ).get(id, userId);
      if (existing) return this.finish(database, "already-joined");
      const { count } = database.prepare(
        "SELECT COUNT(*) AS count FROM recruitment_members WHERE recruitment_id = ?",
      ).get(id) as { count: number };
      if (count >= post.capacity) return this.finish(database, "full");
      database.prepare(
        "INSERT INTO recruitment_members (recruitment_id, user_id, joined_at) VALUES (?, ?, ?)",
      ).run(id, userId, new Date().toISOString());
      return this.finish(database, "joined");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }

  leave(id: string, userId: string): MembershipResult {
    const post = this.database.prepare("SELECT owner_id, status FROM recruitments WHERE id = ?")
      .get(id) as { owner_id: string; status: "open" | "closed" } | undefined;
    if (!post) return "missing";
    if (post.status !== "open") return "closed";
    if (post.owner_id === userId) return "owner";
    const result = this.database
      .prepare("DELETE FROM recruitment_members WHERE recruitment_id = ? AND user_id = ?")
      .run(id, userId);
    return result.changes ? "joined" : "not-joined";
  }

  close(id: string, userId: string): MembershipResult {
    const post = this.database.prepare("SELECT owner_id, status FROM recruitments WHERE id = ?")
      .get(id) as { owner_id: string; status: "open" | "closed" } | undefined;
    if (!post) return "missing";
    if (post.owner_id !== userId) return "not-owner";
    if (post.status !== "open") return "closed";
    this.database.prepare("UPDATE recruitments SET status = 'closed' WHERE id = ?").run(id);
    return "closed-by-owner";
  }

  private mapPost(row: RecruitmentRow): RecruitmentPost {
    const memberRows = this.database
      .prepare("SELECT user_id FROM recruitment_members WHERE recruitment_id = ? ORDER BY joined_at")
      .all(row.id) as { user_id: string }[];
    return {
      id: row.id,
      kind: row.kind,
      guildId: row.guild_id,
      channelId: row.channel_id,
      voiceChannelId: row.voice_channel_id,
      messageId: row.message_id,
      ownerId: row.owner_id,
      activity: row.activity,
      capacity: row.capacity,
      startTime: row.start_time,
      note: row.note,
      status: row.status,
      memberIds: memberRows.map(({ user_id }) => user_id),
    };
  }

  private finish(database: ReturnType<typeof getDatabase>, result: MembershipResult): MembershipResult {
    database.exec("COMMIT");
    return result;
  }
}