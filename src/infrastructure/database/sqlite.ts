/** 🗃️ SQLite基盤：共有DB接続の生成とスキーマ初期化を担当します。 */

// 🗃️ Node.js 22.16+ の node:sqlite を使用し、CIとローカルの実行条件を揃えます。
import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { dataDirectory } from "../storage/data-directory.js";

const databasePath = join(dataDirectory, "mabubot.sqlite");
let database: DatabaseSync | undefined;

// 🔗 DB接続を共有し、Repository間で同じDB整合性を使えるようにします。
export function getDatabase(): DatabaseSync {
  if (database) return database;

  mkdirSync(dataDirectory, { recursive: true });
  database = new DatabaseSync(databasePath);
  initializeDatabase(database);
  return database;
}

// 🛡️ スキーマを存在確認付きで初期化し、既存データを破壊的に再作成しません。
export function initializeDatabase(database: DatabaseSync): void {
  database.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS idle_members (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      activity TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS recruitments (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      voice_channel_id TEXT,
      message_id TEXT,
      owner_id TEXT NOT NULL,
      activity TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      start_time TEXT,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recruitment_members (
      recruitment_id TEXT NOT NULL REFERENCES recruitments(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      joined_at TEXT NOT NULL,
      PRIMARY KEY (recruitment_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      message_id TEXT,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS event_members (
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      joined_at TEXT NOT NULL,
      PRIMARY KEY (event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      total_xp INTEGER NOT NULL DEFAULT 0,
      equipped_title TEXT NOT NULL DEFAULT 'newcomer',
      birthday TEXT,
      streak_count INTEGER NOT NULL DEFAULT 0,
      last_checkin TEXT,
      created_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS user_titles (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title_id TEXT NOT NULL,
      earned_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, user_id, title_id)
    );

    CREATE TABLE IF NOT EXISTS point_balances (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS point_transactions (
      id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      related_user_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventories (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
      PRIMARY KEY (guild_id, user_id, item_id)
    );

    CREATE TABLE IF NOT EXISTS daily_claims (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      claim_type TEXT NOT NULL,
      claim_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, user_id, claim_type, claim_date)
    );

    CREATE TABLE IF NOT EXISTS thanks_records (
      id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      message TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS photo_posts (
      id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      image_key TEXT,
      caption TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feedback_entries (
      id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS celebrations (
      id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      title TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS temp_voice_channels (
      channel_id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS number_game_sessions (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      target INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS game_stats (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      game TEXT NOT NULL,
      plays INTEGER NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, user_id, game)
    );
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY, guild_id TEXT NOT NULL, user_id TEXT NOT NULL,
      content TEXT NOT NULL, remind_at TEXT NOT NULL, completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS server_notes (
      guild_id TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL,
      updated_at TEXT NOT NULL, PRIMARY KEY (guild_id, title)
    );
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY, guild_id TEXT NOT NULL, channel_id TEXT,
      user_id TEXT NOT NULL, category TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL, closed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id TEXT NOT NULL, setting_key TEXT NOT NULL, setting_value TEXT NOT NULL,
      updated_at TEXT NOT NULL, PRIMARY KEY (guild_id, setting_key)
    );
    CREATE TABLE IF NOT EXISTS command_usage (
      id TEXT PRIMARY KEY, guild_id TEXT, user_id TEXT NOT NULL,
      command_name TEXT NOT NULL, success INTEGER NOT NULL,
      latency_ms INTEGER NOT NULL, created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS birthday_announcements (
      guild_id TEXT NOT NULL,
      birthday_date TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, birthday_date, user_id)
    );

    CREATE TABLE IF NOT EXISTS daily_job_runs (
      job_name TEXT NOT NULL,
      run_date TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      PRIMARY KEY (job_name, run_date)
    );

    CREATE TABLE IF NOT EXISTS event_reminders (
      event_id TEXT PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
      sent_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_point_balances_leaderboard
      ON point_balances (guild_id, balance DESC);
    CREATE INDEX IF NOT EXISTS idx_user_profiles_xp_leaderboard
      ON user_profiles (guild_id, total_xp DESC);
    CREATE INDEX IF NOT EXISTS idx_user_profiles_streak_leaderboard
      ON user_profiles (guild_id, streak_count DESC);
    CREATE INDEX IF NOT EXISTS idx_game_stats_wins_leaderboard
      ON game_stats (guild_id, wins DESC, score DESC);
    CREATE INDEX IF NOT EXISTS idx_reminders_due
      ON reminders (remind_at, completed_at);
    CREATE INDEX IF NOT EXISTS idx_command_usage_summary
      ON command_usage (guild_id, command_name, created_at);
  `);

  const photoColumns = database.prepare("PRAGMA table_info(photo_posts)").all() as unknown as { name: string }[];
  if (!photoColumns.some((column) => column.name === "image_key")) {
    database.exec("ALTER TABLE photo_posts ADD COLUMN image_key TEXT");
  }
  const recruitmentColumns = database.prepare("PRAGMA table_info(recruitments)").all() as unknown as { name: string }[];
  if (!recruitmentColumns.some((column) => column.name === "voice_channel_id")) {
    database.exec("ALTER TABLE recruitments ADD COLUMN voice_channel_id TEXT");
  }
}
