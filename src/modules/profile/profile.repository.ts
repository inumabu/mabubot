/** 🗃️ Repository：プロフィール・レベル・称号情報の永続化を担当します。 */

import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../../infrastructure/database/sqlite.js";
import { titles, type TitleId } from "./title/title.catalog.js";

export interface UserProfile {
  guildId: string;
  userId: string;
  totalXp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  equippedTitle: string;
  birthday: string | null;
  streakCount: number;
  lastCheckin: string | null;
}
export type ProfileLeaderboardMetric = "xp" | "streak";
export interface ProfileLeaderboardEntry {
  userId: string;
  value: number;
}

interface ProfileRow {
  guild_id: string;
  user_id: string;
  total_xp: number;
  equipped_title: string;
  birthday: string | null;
  streak_count: number;
  last_checkin: string | null;
}

export class ProfileRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}

  getProfile(guildId: string, userId: string): UserProfile {
    this.ensureProfile(guildId, userId);
    const row = this.database.prepare(
      "SELECT * FROM user_profiles WHERE guild_id = ? AND user_id = ?",
    ).get(guildId, userId) as unknown as ProfileRow;
    return this.mapProfile(row);
  }
  getLeaderboard(guildId: string, metric: ProfileLeaderboardMetric, limit = 10): ProfileLeaderboardEntry[] {
    const safeLimit = Math.min(10, Math.max(3, Math.floor(limit)));
    const column = metric === "xp" ? "total_xp" : "streak_count";
    const rows = this.database.prepare(
      `SELECT user_id, ${column} AS value FROM user_profiles
       WHERE guild_id = ? AND ${column} > 0
       ORDER BY ${column} DESC, user_id ASC LIMIT ?`,
    ).all(guildId, safeLimit) as unknown as { user_id: string; value: number }[];
    return rows.map(({ user_id, value }) => ({ userId: user_id, value }));
  }

  addXp(guildId: string, userId: string, amount: number): UserProfile {
    if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("XP amount must be a positive integer");
    this.ensureProfile(guildId, userId);
    this.database.prepare(
      "UPDATE user_profiles SET total_xp = total_xp + ? WHERE guild_id = ? AND user_id = ?",
    ).run(amount, guildId, userId);
    const profile = this.getProfile(guildId, userId);
    for (const title of titles) {
      if (profile.level >= title.unlockLevel) this.grantTitle(guildId, userId, title.id);
    }
    return profile;
  }

  setBirthday(guildId: string, userId: string, monthDay: string | null): void {
    this.ensureProfile(guildId, userId);
    this.database.prepare(
      "UPDATE user_profiles SET birthday = ? WHERE guild_id = ? AND user_id = ?",
    ).run(monthDay, guildId, userId);
  }

  listBirthdays(monthDay: string): { guildId: string; userId: string }[] {
    const rows = this.database.prepare(
      "SELECT guild_id, user_id FROM user_profiles WHERE birthday = ?",
    ).all(monthDay) as unknown as { guild_id: string; user_id: string }[];
    return rows.map(({ guild_id, user_id }) => ({ guildId: guild_id, userId: user_id }));
  }

  wasBirthdayAnnounced(guildId: string, date: string, userId: string): boolean {
    return Boolean(this.database.prepare(
      "SELECT 1 FROM birthday_announcements WHERE guild_id = ? AND birthday_date = ? AND user_id = ?",
    ).get(guildId, date, userId));
  }

  markBirthdayAnnounced(guildId: string, date: string, userId: string): void {
    this.database.prepare(
      "INSERT OR IGNORE INTO birthday_announcements (guild_id, birthday_date, user_id) VALUES (?, ?, ?)",
    ).run(guildId, date, userId);
  }

  grantTitle(guildId: string, userId: string, titleId: TitleId): void {
    this.ensureProfile(guildId, userId);
    this.database.prepare(
      "INSERT OR IGNORE INTO user_titles (guild_id, user_id, title_id, earned_at) VALUES (?, ?, ?, ?)",
    ).run(guildId, userId, titleId, new Date().toISOString());
  }

  listTitles(guildId: string, userId: string): string[] {
    this.ensureProfile(guildId, userId);
    const rows = this.database.prepare(
      "SELECT title_id FROM user_titles WHERE guild_id = ? AND user_id = ? ORDER BY earned_at",
    ).all(guildId, userId) as unknown as { title_id: string }[];
    return rows.map(({ title_id }) => title_id);
  }

  equipTitle(guildId: string, userId: string, titleId: string): boolean {
    this.ensureProfile(guildId, userId);
    const owned = this.database.prepare(
      "SELECT 1 FROM user_titles WHERE guild_id = ? AND user_id = ? AND title_id = ?",
    ).get(guildId, userId, titleId);
    if (!owned) return false;
    this.database.prepare(
      "UPDATE user_profiles SET equipped_title = ? WHERE guild_id = ? AND user_id = ?",
    ).run(titleId, guildId, userId);
    return true;
  }

  private ensureProfile(guildId: string, userId: string): void {
    this.database.prepare(
      "INSERT OR IGNORE INTO user_profiles (guild_id, user_id, created_at) VALUES (?, ?, ?)",
    ).run(guildId, userId, new Date().toISOString());
    this.database.prepare(
      "INSERT OR IGNORE INTO user_titles (guild_id, user_id, title_id, earned_at) VALUES (?, ?, 'newcomer', ?)",
    ).run(guildId, userId, new Date().toISOString());
  }

  private mapProfile(row: ProfileRow): UserProfile {
    const level = Math.floor(Math.sqrt(row.total_xp / 100)) + 1;
    const currentLevelBase = (level - 1) ** 2 * 100;
    return {
      guildId: row.guild_id,
      userId: row.user_id,
      totalXp: row.total_xp,
      level,
      currentLevelXp: row.total_xp - currentLevelBase,
      nextLevelXp: level ** 2 * 100 - currentLevelBase,
      equippedTitle: row.equipped_title,
      birthday: row.birthday,
      streakCount: row.streak_count,
      lastCheckin: row.last_checkin,
    };
  }
}
