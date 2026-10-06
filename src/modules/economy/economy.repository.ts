/** 🗃️ Repository：まぶP・在庫・報酬履歴の永続化を担当します。 */

import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../../infrastructure/database/sqlite.js";

export interface InventoryItem {
  itemId: string;
  quantity: number;
}
export interface PointsLeaderboardEntry {
  userId: string;
  balance: number;
}

// 🔗 まぶP・アイテム操作の成否を呼び出し側へ返す分岐契約です。
export type EconomyResult = "ok" | "insufficient" | "already-claimed" | "invalid";

export class EconomyRepository {
  constructor(private readonly database: DatabaseSync = getDatabase()) {}

  getBalance(guildId: string, userId: string): number {
    const row = this.database.prepare(
      "SELECT balance FROM point_balances WHERE guild_id = ? AND user_id = ?",
    ).get(guildId, userId) as { balance: number } | undefined;
    return row?.balance ?? 0;
  }
  getPointsLeaderboard(guildId: string, limit = 10): PointsLeaderboardEntry[] {
    const safeLimit = Math.min(10, Math.max(3, Math.floor(limit)));
    const rows = this.database.prepare(
      `SELECT user_id, balance FROM point_balances
       WHERE guild_id = ? AND balance > 0
       ORDER BY balance DESC, user_id ASC LIMIT ?`,
    ).all(guildId, safeLimit) as unknown as { user_id: string; balance: number }[];
    return rows.map(({ user_id, balance }) => ({ userId: user_id, balance }));
  }

  getInventory(guildId: string, userId: string): InventoryItem[] {
    const rows = this.database.prepare(
      "SELECT item_id, quantity FROM inventories WHERE guild_id = ? AND user_id = ? AND quantity > 0 ORDER BY item_id",
    ).all(guildId, userId) as unknown as { item_id: string; quantity: number }[];
    return rows.map(({ item_id, quantity }) => ({ itemId: item_id, quantity }));
  }
  addInventoryItem(guildId: string, userId: string, itemId: string, quantity: number): void {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new Error("Inventory quantity must be positive");
    this.database.prepare(
      `INSERT INTO inventories (guild_id, user_id, item_id, quantity) VALUES (?, ?, ?, ?)
       ON CONFLICT (guild_id, user_id, item_id) DO UPDATE SET quantity = quantity + excluded.quantity`,
    ).run(guildId, userId, itemId, quantity);
  }

  addPoints(guildId: string, userId: string, amount: number, reason: string): number {
    if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Point amount must be a positive integer");
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.changeBalance(guildId, userId, amount, reason);
      const balance = this.getBalance(guildId, userId);
      this.database.exec("COMMIT");
      return balance;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  transferPoints(
    guildId: string,
    senderId: string,
    recipientId: string,
    amount: number,
  ): EconomyResult {
    if (senderId === recipientId || !Number.isSafeInteger(amount) || amount <= 0) return "invalid";
    this.database.exec("BEGIN IMMEDIATE");
    try {
      if (this.getBalance(guildId, senderId) < amount) {
        this.database.exec("ROLLBACK");
        return "insufficient";
      }
      this.changeBalance(guildId, senderId, -amount, "gift_sent", recipientId);
      this.changeBalance(guildId, recipientId, amount, "gift_received", senderId);
      this.database.exec("COMMIT");
      return "ok";
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  claimPoints(
    guildId: string,
    userId: string,
    claimType: string,
    claimDate: string,
    amount: number,
    reason: string,
  ): { result: EconomyResult; balance: number } {
    if (!Number.isSafeInteger(amount) || amount <= 0) return { result: "invalid", balance: this.getBalance(guildId, userId) };
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const claim = this.database.prepare(
        "SELECT 1 FROM daily_claims WHERE guild_id = ? AND user_id = ? AND claim_type = ? AND claim_date = ?",
      ).get(guildId, userId, claimType, claimDate);
      if (claim) {
        const balance = this.getBalance(guildId, userId);
        this.database.exec("ROLLBACK");
        return { result: "already-claimed", balance };
      }
      this.database.prepare(
        "INSERT INTO daily_claims (guild_id, user_id, claim_type, claim_date, created_at) VALUES (?, ?, ?, ?, ?)",
      ).run(guildId, userId, claimType, claimDate, new Date().toISOString());
      this.changeBalance(guildId, userId, amount, reason);
      const balance = this.getBalance(guildId, userId);
      this.database.exec("COMMIT");
      return { result: "ok", balance };
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  purchaseItem(
    guildId: string,
    userId: string,
    itemId: string,
    cost: number,
  ): EconomyResult {
    if (!Number.isSafeInteger(cost) || cost <= 0) return "invalid";
    this.database.exec("BEGIN IMMEDIATE");
    try {
      if (this.getBalance(guildId, userId) < cost) {
        this.database.exec("ROLLBACK");
        return "insufficient";
      }
      this.changeBalance(guildId, userId, -cost, `shop:${itemId}`);
      this.database.prepare(
        `INSERT INTO inventories (guild_id, user_id, item_id, quantity) VALUES (?, ?, ?, 1)
         ON CONFLICT (guild_id, user_id, item_id) DO UPDATE SET quantity = quantity + 1`,
      ).run(guildId, userId, itemId);
      this.database.exec("COMMIT");
      return "ok";
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  transferItem(
    guildId: string,
    senderId: string,
    recipientId: string,
    itemId: string,
  ): EconomyResult {
    if (senderId === recipientId) return "invalid";
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const owned = this.database.prepare(
        "SELECT quantity FROM inventories WHERE guild_id = ? AND user_id = ? AND item_id = ?",
      ).get(guildId, senderId, itemId) as { quantity: number } | undefined;
      if (!owned?.quantity) {
        this.database.exec("ROLLBACK");
        return "insufficient";
      }
      this.database.prepare(
        "UPDATE inventories SET quantity = quantity - 1 WHERE guild_id = ? AND user_id = ? AND item_id = ?",
      ).run(guildId, senderId, itemId);
      this.database.prepare(
        `INSERT INTO inventories (guild_id, user_id, item_id, quantity) VALUES (?, ?, ?, 1)
         ON CONFLICT (guild_id, user_id, item_id) DO UPDATE SET quantity = quantity + 1`,
      ).run(guildId, recipientId, itemId);
      this.database.exec("COMMIT");
      return "ok";
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  recordGachaDraw(
    guildId: string,
    userId: string,
    itemId: string,
    cost: number,
  ): EconomyResult {
    if (!Number.isSafeInteger(cost) || cost <= 0) return "invalid";
    this.database.exec("BEGIN IMMEDIATE");
    try {
      if (this.getBalance(guildId, userId) < cost) {
        this.database.exec("ROLLBACK");
        return "insufficient";
      }
      this.changeBalance(guildId, userId, -cost, "gacha_draw");
      this.database.prepare(
        `INSERT INTO inventories (guild_id, user_id, item_id, quantity) VALUES (?, ?, ?, 1)
         ON CONFLICT (guild_id, user_id, item_id) DO UPDATE SET quantity = quantity + 1`,
      ).run(guildId, userId, itemId);
      this.database.prepare(
        "INSERT INTO point_transactions (id, guild_id, user_id, amount, reason, created_at) VALUES (?, ?, ?, 0, ?, ?)",
      ).run(randomUUID(), guildId, userId, `gacha_item:${itemId}`, new Date().toISOString());
      this.database.exec("COMMIT");
      return "ok";
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  private changeBalance(
    guildId: string,
    userId: string,
    amount: number,
    reason: string,
    relatedUserId?: string,
  ): void {
    this.database.prepare(
      "INSERT OR IGNORE INTO point_balances (guild_id, user_id, balance) VALUES (?, ?, 0)",
    ).run(guildId, userId);
    this.database.prepare(
      "UPDATE point_balances SET balance = balance + ? WHERE guild_id = ? AND user_id = ?",
    ).run(amount, guildId, userId);
    this.database.prepare(
      `INSERT INTO point_transactions (id, guild_id, user_id, amount, reason, related_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(randomUUID(), guildId, userId, amount, reason, relatedUserId ?? null, new Date().toISOString());
  }
}
