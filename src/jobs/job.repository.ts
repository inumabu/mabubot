/** 🗃️ JobRepository：定期実行の実行記録を永続化します。 */

import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../infrastructure/database/sqlite.js";

export class JobRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}

  hasRun(jobName: string, date: string): boolean {
    return Boolean(this.database.prepare(
      "SELECT 1 FROM daily_job_runs WHERE job_name = ? AND run_date = ?",
    ).get(jobName, date));
  }

  markRun(jobName: string, date: string): void {
    this.database.prepare(
      "INSERT OR IGNORE INTO daily_job_runs (job_name, run_date, completed_at) VALUES (?, ?, ?)",
    ).run(jobName, date, new Date().toISOString());
  }
}