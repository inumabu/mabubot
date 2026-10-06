/** 🗃️ Repository：Streakの永続化を担当します。 */

import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../../../infrastructure/database/sqlite.js";
import { titles } from "../title/title.catalog.js";

interface CheckinRow {
  total_xp: number;
  streak_count: number;
  last_checkin: string | null;
}

export interface CheckinResult {
  changed: boolean;
  streakCount: number;
  balance: number;
}

export class StreakRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}

  checkIn(guildId: string, userId: string, today: string): CheckinResult {
    const database = this.database;
    database.exec("BEGIN IMMEDIATE");
    try {
      database.prepare(
        "INSERT OR IGNORE INTO user_profiles (guild_id, user_id, created_at) VALUES (?, ?, ?)",
      ).run(guildId, userId, new Date().toISOString());
      database.prepare(
        "INSERT OR IGNORE INTO user_titles (guild_id, user_id, title_id, earned_at) VALUES (?, ?, 'newcomer', ?)",
      ).run(guildId, userId, new Date().toISOString());

      const profile = database.prepare(
        "SELECT total_xp, streak_count, last_checkin FROM user_profiles WHERE guild_id = ? AND user_id = ?",
      ).get(guildId, userId) as unknown as CheckinRow;
      const balanceRow = database.prepare(
        "SELECT balance FROM point_balances WHERE guild_id = ? AND user_id = ?",
      ).get(guildId, userId) as { balance: number } | undefined;
      const balance = balanceRow?.balance ?? 0;

      if (profile.last_checkin === today) {
        database.exec("COMMIT");
        return { changed: false, streakCount: profile.streak_count, balance };
      }

      const yesterday = new Date(`${today}T00:00:00.000Z`);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const streakCount = profile.last_checkin === yesterday.toISOString().slice(0, 10)
        ? profile.streak_count + 1
        : 1;
      const totalXp = profile.total_xp + 25;
      const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;

      database.prepare(
        `UPDATE user_profiles SET streak_count = ?, last_checkin = ?, total_xp = ?
         WHERE guild_id = ? AND user_id = ?`,
      ).run(streakCount, today, totalXp, guildId, userId);
      database.prepare(
        "INSERT OR IGNORE INTO point_balances (guild_id, user_id, balance) VALUES (?, ?, 0)",
      ).run(guildId, userId);
      database.prepare(
        "UPDATE point_balances SET balance = balance + 5 WHERE guild_id = ? AND user_id = ?",
      ).run(guildId, userId);
      database.prepare(
        `INSERT INTO point_transactions (id, guild_id, user_id, amount, reason, created_at)
         VALUES (?, ?, ?, 5, 'streak_checkin', ?)`,
      ).run(randomUUID(), guildId, userId, new Date().toISOString());

      for (const title of titles) {
        if (level >= title.unlockLevel) {
          database.prepare(
            "INSERT OR IGNORE INTO user_titles (guild_id, user_id, title_id, earned_at) VALUES (?, ?, ?, ?)",
          ).run(guildId, userId, title.id, new Date().toISOString());
        }
      }

      database.exec("COMMIT");
      return { changed: true, streakCount, balance: balance + 5 };
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }
}