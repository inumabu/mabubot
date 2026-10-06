/** 🗃️ Repository：リマインダーとメモの永続化を担当します。 */

import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../../infrastructure/database/sqlite.js";

export interface Reminder { id: string; userId: string; content: string; remindAt: string; }
export interface Note { title: string; content: string; updatedAt: string; }
export interface DueReminder extends Reminder { guildId: string; }

export class CommunityToolsRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}
  addReminder(guildId: string, userId: string, content: string, remindAt: string): Reminder {
    const id = randomUUID();
    this.database.prepare("INSERT INTO reminders (id,guild_id,user_id,content,remind_at) VALUES (?,?,?,?,?)").run(id, guildId, userId, content, remindAt);
    return { id, userId, content, remindAt };
  }
  listReminders(guildId: string, userId: string): Reminder[] {
    const rows = this.database.prepare("SELECT id,user_id,content,remind_at FROM reminders WHERE guild_id=? AND user_id=? AND completed_at IS NULL ORDER BY remind_at LIMIT 20").all(guildId, userId) as unknown as { id:string; user_id:string; content:string; remind_at:string }[];
    return rows.map((r) => ({ id:r.id, userId:r.user_id, content:r.content, remindAt:r.remind_at }));
  }
  dueReminders(now: string): DueReminder[] {
    const rows = this.database.prepare("SELECT id,guild_id,user_id,content,remind_at FROM reminders WHERE completed_at IS NULL AND remind_at <= ? ORDER BY remind_at LIMIT 100").all(now) as unknown as { id:string; guild_id:string; user_id:string; content:string; remind_at:string }[];
    return rows.map((r) => ({ id:r.id, guildId:r.guild_id, userId:r.user_id, content:r.content, remindAt:r.remind_at }));
  }
  completeReminder(id: string): void { this.database.prepare("UPDATE reminders SET completed_at=? WHERE id=?").run(new Date().toISOString(), id); }
  saveNote(guildId: string, title: string, content: string): void { this.database.prepare("INSERT INTO server_notes (guild_id,title,content,updated_at) VALUES (?,?,?,?) ON CONFLICT (guild_id,title) DO UPDATE SET content=excluded.content,updated_at=excluded.updated_at").run(guildId, title, content, new Date().toISOString()); }
  listNotes(guildId: string): Note[] { const rows = this.database.prepare("SELECT title,content,updated_at FROM server_notes WHERE guild_id=? ORDER BY title LIMIT 30").all(guildId) as unknown as { title:string; content:string; updated_at:string }[]; return rows.map((r) => ({ title:r.title, content:r.content, updatedAt:r.updated_at })); }
  openTicket(guildId: string, userId: string, category: string): string { const id = randomUUID(); this.database.prepare("INSERT INTO tickets (id,guild_id,user_id,category,created_at) VALUES (?,?,?,?,?)").run(id,guildId,userId,category,new Date().toISOString()); return id; }
  closeTicket(idPrefix: string, guildId: string, userId: string): boolean {
    const escaped = idPrefix.replace(/[\\%_]/g, "\\$&");
    const matches = this.database.prepare("SELECT id FROM tickets WHERE id LIKE ? ESCAPE '\\' AND guild_id=? AND user_id=? AND status='open' LIMIT 2").all(`${escaped}%`, guildId, userId) as unknown as { id:string }[];
    if (matches.length !== 1) return false;
    const result = this.database.prepare("UPDATE tickets SET status='closed',closed_at=? WHERE id=? AND guild_id=? AND user_id=? AND status='open'").run(new Date().toISOString(), matches[0].id, guildId, userId);
    return result.changes === 1;
  }
  set(guildId: string, key: string, value: string): void { this.database.prepare("INSERT INTO guild_settings (guild_id,setting_key,setting_value,updated_at) VALUES (?,?,?,?) ON CONFLICT (guild_id,setting_key) DO UPDATE SET setting_value=excluded.setting_value,updated_at=excluded.updated_at").run(guildId,key,value,new Date().toISOString()); }
  get(guildId: string, key: string): string | undefined { const row = this.database.prepare("SELECT setting_value FROM guild_settings WHERE guild_id=? AND setting_key=?").get(guildId,key) as { setting_value:string } | undefined; return row?.setting_value; }
  delete(guildId: string, key: string): void { this.database.prepare("DELETE FROM guild_settings WHERE guild_id=? AND setting_key=?").run(guildId, key); }
  settings(guildId: string): { key:string; value:string }[] { const rows = this.database.prepare("SELECT setting_key,setting_value FROM guild_settings WHERE guild_id=? ORDER BY setting_key").all(guildId) as unknown as { setting_key:string; setting_value:string }[]; return rows.map((r) => ({ key:r.setting_key, value:r.setting_value })); }
}
