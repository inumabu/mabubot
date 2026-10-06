/** 🗃️ Repository：Command Analyticsの永続化を担当します。 */

import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../../infrastructure/database/sqlite.js";

export interface CommandUsageSummary { commandName: string; uses: number; failures: number; averageLatencyMs: number; }
export class AnalyticsRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}
  record(guildId: string | null, userId: string, commandName: string, success: boolean, latencyMs: number): void {
    this.database.prepare("INSERT INTO command_usage (id,guild_id,user_id,command_name,success,latency_ms,created_at) VALUES (?,?,?,?,?,?,?)")
      .run(randomUUID(), guildId, userId, commandName, success ? 1 : 0, Math.max(0, Math.round(latencyMs)), new Date().toISOString());
  }
  summary(guildId: string, since?: string, limit = 20): CommandUsageSummary[] {
    const from = since ?? new Date(Date.now() - 30 * 86400000).toISOString();
    const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
    const rows = this.database.prepare(`SELECT command_name, COUNT(*) AS uses, SUM(CASE WHEN success=0 THEN 1 ELSE 0 END) AS failures, AVG(latency_ms) AS average_latency_ms FROM command_usage WHERE guild_id=? AND created_at>=? GROUP BY command_name ORDER BY uses DESC, command_name ASC LIMIT ?`).all(guildId, from, safeLimit) as unknown as { command_name:string; uses:number; failures:number; average_latency_ms:number }[];
    return rows.map((row) => ({ commandName: row.command_name, uses: row.uses, failures: row.failures, averageLatencyMs: Math.round(row.average_latency_ms) }));
  }
  total(guildId: string, since?: string): number { const from = since ?? new Date(Date.now() - 30 * 86400000).toISOString(); const row = this.database.prepare("SELECT COUNT(*) AS count FROM command_usage WHERE guild_id=? AND created_at>=?").get(guildId, from) as { count:number }; return row.count; }
}
