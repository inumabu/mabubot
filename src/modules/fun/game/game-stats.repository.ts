/** 🗃️ Repository：ゲーム統計の永続化を担当します。 */

import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../../../infrastructure/database/sqlite.js";

export interface GameStats {
  game: string;
  plays: number;
  wins: number;
  score: number;
}
export interface GameLeaderboardEntry {
  userId: string;
  wins: number;
  plays: number;
  score: number;
}

export class GameStatsRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}
  record(guildId: string, userId: string, game: string, options: { win?: boolean; score?: number } = {}): void {
    this.database.prepare(
      `INSERT INTO game_stats (guild_id, user_id, game, plays, wins, score, updated_at)
       VALUES (?, ?, ?, 1, ?, ?, ?)
       ON CONFLICT (guild_id, user_id, game) DO UPDATE SET
         plays = plays + 1,
         wins = wins + excluded.wins,
         score = score + excluded.score,
         updated_at = excluded.updated_at`,
    ).run(guildId, userId, game, options.win ? 1 : 0, options.score ?? 0, new Date().toISOString());
  }
  getUserStats(guildId: string, userId: string): GameStats[] {
    const rows = this.database.prepare(
      "SELECT game, plays, wins, score FROM game_stats WHERE guild_id = ? AND user_id = ? ORDER BY score DESC, game ASC",
    ).all(guildId, userId) as unknown as GameStats[];
    return rows.map(({ game, plays, wins, score }) => ({ game, plays, wins, score }));
  }
  getWinsLeaderboard(guildId: string, game = "all", limit = 10): GameLeaderboardEntry[] {
    const safeLimit = Math.min(10, Math.max(3, Math.floor(limit)));
    const rows = game === "all"
      ? this.database.prepare(
        `SELECT user_id, SUM(wins) AS wins, SUM(plays) AS plays, SUM(score) AS score
         FROM game_stats WHERE guild_id = ? GROUP BY user_id
         HAVING SUM(wins) > 0 ORDER BY wins DESC, score DESC, user_id ASC LIMIT ?`,
      ).all(guildId, safeLimit)
      : this.database.prepare(
        `SELECT user_id, wins, plays, score FROM game_stats
         WHERE guild_id = ? AND game = ? AND wins > 0
         ORDER BY wins DESC, score DESC, user_id ASC LIMIT ?`,
      ).all(guildId, game, safeLimit);
    return (rows as unknown as { user_id: string; wins: number; plays: number; score: number }[])
      .map(({ user_id, wins, plays, score }) => ({ userId: user_id, wins, plays, score }));
  }
}
