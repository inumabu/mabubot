/** 🧩 Facade：まぶP・在庫・報酬操作を利用側向けAPIへまとめます。 */

import { EconomyRepository, type EconomyResult } from "./economy.repository.js";

const repository = new EconomyRepository();

export function getPoints(guildId: string, userId: string): number {
  return repository.getBalance(guildId, userId);
}

export function getInventory(guildId: string, userId: string) {
  return repository.getInventory(guildId, userId);
}

export function addPoints(guildId: string, userId: string, amount: number, reason: string): number {
  return repository.addPoints(guildId, userId, amount, reason);
}

export function transferPoints(guildId: string, fromId: string, toId: string, amount: number): EconomyResult {
  return repository.transferPoints(guildId, fromId, toId, amount);
}

export function claimDailyPoints(guildId: string, userId: string, date: string) {
  return repository.claimPoints(guildId, userId, "points", date, 15, "daily_claim");
}

export function claimMissionReward(guildId: string, userId: string, date: string) {
  return repository.claimPoints(guildId, userId, "mission", date, 50, "daily_mission");
}

export function claimGameReward(
  guildId: string,
  userId: string,
  claimType: string,
  claimDate: string,
  amount: number,
  reason: string,
) {
  return repository.claimPoints(guildId, userId, claimType, claimDate, amount, reason);
}

export function addInventoryItem(guildId: string, userId: string, itemId: string, quantity: number): void {
  repository.addInventoryItem(guildId, userId, itemId, quantity);
}

export function purchaseItem(guildId: string, userId: string, itemId: string, cost: number): EconomyResult {
  return repository.purchaseItem(guildId, userId, itemId, cost);
}

export function drawGacha(guildId: string, userId: string, itemId: string, cost: number): EconomyResult {
  return repository.recordGachaDraw(guildId, userId, itemId, cost);
}

export function giftItem(guildId: string, fromId: string, toId: string, itemId: string): EconomyResult {
  return repository.transferItem(guildId, fromId, toId, itemId);
}
