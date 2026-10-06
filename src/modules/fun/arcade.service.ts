/** ⚙️ Service：ミニゲームのセッションと報酬ルールを担当します。 */

import { claimGameReward, addPoints, addInventoryItem } from "../economy/economy.facade.js";
import { getTokyoDate } from "../../shared/time/tokyo-date.js";
import { GameStatsRepository } from "./game/game-stats.repository.js";

const mysteryQuestions = [
  { question: "Minecraftで爆発する緑色のMobは？", answer: "クリーパー" },
  { question: "日本の国鳥は？", answer: "キジ" },
  { question: "1年は何か月？", answer: "12" },
];
const quizQuestions = [
  { question: "太陽系で一番大きい惑星は？", answer: "木星" },
  { question: "水の化学式は？", answer: "h2o" },
  { question: "日本で一番高い山は？", answer: "富士山" },
];
const fish = [
  { id: "fish_sardine", name: "イワシ", rarity: "Common", points: 3, weight: 55 },
  { id: "fish_salmon", name: "サケ", rarity: "Rare", points: 8, weight: 30 },
  { id: "fish_tuna", name: "マグロ", rarity: "Epic", points: 20, weight: 12 },
  { id: "fish_moonfish", name: "月魚", rarity: "Legendary", points: 50, weight: 3 },
] as const;
const racers = ["月うさぎ", "星ねこ", "夜ふくろう", "流れ星"] as const;
const gameStats = new GameStatsRepository();
export const fishCatalog = fish;

export function getMystery(date = getTokyoDate()) {
  return mysteryQuestions[Math.abs(hash(date)) % mysteryQuestions.length];
}
export function answerMystery(guildId: string, userId: string, answer: string, date = getTokyoDate()) {
  const mystery = getMystery(date);
  if (answer.trim().toLocaleLowerCase("ja") !== mystery.answer.toLocaleLowerCase("ja")) {
    gameStats.record(guildId, userId, "mystery");
    return { correct: false, reward: 0, answer: mystery.answer };
  }
  const reward = claimGameReward(guildId, userId, `mystery:${date}`, date, 25, "mystery_clear");
  gameStats.record(guildId, userId, "mystery", { win: reward.result === "ok", score: reward.result === "ok" ? 25 : 0 });
  return { correct: true, reward: reward.result === "ok" ? 25 : 0, answer: mystery.answer };
}

interface QuizRound { question: string; answer: string; expiresAt: number }
const quizRounds = new Map<string, QuizRound>();
export function startArcadeQuiz(guildId: string, now = Date.now()) {
  const quiz = quizQuestions[Math.abs(hash(`${guildId}:${getTokyoDate(new Date(now))}`)) % quizQuestions.length];
  quizRounds.set(guildId, { ...quiz, expiresAt: now + 10 * 60 * 1000 });
  return quiz.question;
}
export function answerArcadeQuiz(guildId: string, answer: string, now = Date.now(), userId = "server") {
  const round = quizRounds.get(guildId);
  if (!round || round.expiresAt <= now) return { status: "not-started" as const };
  quizRounds.delete(guildId);
  const correct = answer.trim().toLocaleLowerCase("ja") === round.answer.toLocaleLowerCase("ja");
  gameStats.record(guildId, userId, "quiz", { win: correct, score: correct ? 1 : 0 });
  return { status: "answered" as const, correct, answer: round.answer };
}

interface WolfGame { ownerId: string; players: Set<string>; roles: Map<string, "wolf" | "villager">; votes: Map<string, string> }
const wolfGames = new Map<string, WolfGame>();
function assignWolfRoles(guildId: string, game: WolfGame): void {
  if (game.roles.size) return;
  const players = [...game.players];
  const wolf = players[Math.abs(hash(guildId)) % players.length];
  players.forEach((id) => game.roles.set(id, id === wolf ? "wolf" : "villager"));
}
export function startWolf(guildId: string, ownerId: string) {
  const game: WolfGame = { ownerId, players: new Set([ownerId]), roles: new Map(), votes: new Map() };
  wolfGames.set(guildId, game);
  return game.players.size;
}
export function joinWolf(guildId: string, userId: string) {
  const game = wolfGames.get(guildId);
  if (!game) return "not-started" as const;
  game.players.add(userId);
  return "joined" as const;
}
export function getWolfRole(guildId: string, userId: string) {
  const game = wolfGames.get(guildId);
  if (!game || !game.players.has(userId)) return "not-player" as const;
  assignWolfRoles(guildId, game);
  return game.roles.get(userId) ?? "villager";
}
export function voteWolf(guildId: string, userId: string, targetId: string) {
  const game = wolfGames.get(guildId);
  if (!game) return { status: "not-started" as const };
  if (!game.players.has(userId) || !game.players.has(targetId)) return { status: "invalid-player" as const };
  assignWolfRoles(guildId, game);
  game.votes.set(userId, targetId);
  if (game.votes.size < game.players.size) return { status: "voted" as const, votes: game.votes.size, total: game.players.size };
  const counts = new Map<string, number>();
  for (const target of game.votes.values()) counts.set(target, (counts.get(target) ?? 0) + 1);
  const accused = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const wolf = [...game.roles.entries()].find(([, role]) => role === "wolf")?.[0];
  const won = accused === wolf;
  for (const voterId of game.votes.keys()) gameStats.record(guildId, voterId, "wolf", { win: won, score: won ? 1 : 0 });
  wolfGames.delete(guildId);
  return { status: "finished" as const, won, wolfId: wolf, accusedId: accused };
}

interface ReactionRound { prompt: string; answer: string; expiresAt: number; winnerId?: string }
const reactionRounds = new Map<string, ReactionRound>();
const reactionPrompts = [
  { prompt: "月に関係する絵文字を押せ！", answer: "🌙" },
  { prompt: "赤いハートを押せ！", answer: "❤️" },
  { prompt: "星の絵文字を押せ！", answer: "⭐" },
];
export function startReaction(guildId: string, now = Date.now()) {
  const item = reactionPrompts[Math.abs(hash(`${guildId}:${now}`)) % reactionPrompts.length];
  reactionRounds.set(guildId, { ...item, expiresAt: now + 60_000 });
  return item;
}
export function answerReaction(guildId: string, userId: string, answer: string, now = Date.now()) {
  const round = reactionRounds.get(guildId);
  if (!round || round.expiresAt <= now) return { status: "expired" as const };
  if (round.winnerId) return { status: "finished" as const, winnerId: round.winnerId };
  if (answer !== round.answer) {
    gameStats.record(guildId, userId, "reaction");
    return { status: "wrong" as const };
  }
  round.winnerId = userId;
  gameStats.record(guildId, userId, "reaction", { win: true, score: 20 });
  addPoints(guildId, userId, 20, "reaction_win");
  return { status: "won" as const, winnerId: userId, points: 20 };
}

interface RaceRound { racers: readonly string[]; winner: string; picks: Map<string, string> }
const raceRounds = new Map<string, RaceRound>();
export function startRace(guildId: string, random = Math.random) {
  const winner = racers[Math.floor(random() * racers.length)];
  const round = { racers, winner, picks: new Map<string, string>() };
  raceRounds.set(guildId, round);
  return { racers, winner };
}
export function pickRace(guildId: string, userId: string, pick: string) {
  const round = raceRounds.get(guildId);
  if (!round) return { status: "not-started" as const };
  if (!round.racers.includes(pick as typeof racers[number])) return { status: "invalid-racer" as const };
  if (round.picks.has(userId)) return { status: "already-picked" as const };
  round.picks.set(userId, pick);
  const won = pick === round.winner;
  gameStats.record(guildId, userId, "race", { win: won, score: won ? 30 : 0 });
  if (won) addPoints(guildId, userId, 30, "race_prediction");
  return { status: won ? "won" as const : "lost" as const, winner: round.winner, points: won ? 30 : 0 };
}

const fishingCooldowns = new Map<string, number>();
export function castFishing(guildId: string, userId: string, now = Date.now(), random = Math.random) {
  const key = `${guildId}:${userId}`;
  const last = fishingCooldowns.get(key) ?? 0;
  if (last + 30_000 > now) return { status: "cooldown" as const, remaining: Math.ceil((last + 30_000 - now) / 1000) };
  fishingCooldowns.set(key, now);
  let roll = random() * 100;
  const caught = fish.find((item) => (roll -= item.weight) < 0) ?? fish[0];
  gameStats.record(guildId, userId, "fishing", { score: caught.points });
  addInventoryItem(guildId, userId, caught.id, 1);
  addPoints(guildId, userId, caught.points, "fishing_catch");
  return { status: "caught" as const, fish: caught };
}

interface Raid { date: string; hp: number; attackers: Set<string>; defeated: boolean }
const raids = new Map<string, Raid>();
function getRaid(guildId: string, date = getTokyoDate()) {
  const current = raids.get(guildId);
  if (!current || current.date !== date) {
    const next = { date, hp: 1000, attackers: new Set<string>(), defeated: false };
    raids.set(guildId, next);
    return next;
  }
  return current;
}
export function raidStatus(guildId: string, date = getTokyoDate()) {
  const raid = getRaid(guildId, date);
  return { hp: raid.hp, maxHp: 1000, defeated: raid.defeated, attackers: raid.attackers.size };
}
export function attackRaid(guildId: string, userId: string, date = getTokyoDate(), random = Math.random) {
  const raid = getRaid(guildId, date);
  if (raid.defeated) return { status: "defeated" as const, damage: 0, hp: 0 };
  if (raid.attackers.has(userId)) return { status: "already-attacked" as const, damage: 0, hp: raid.hp };
  raid.attackers.add(userId);
  const damage = 25 + Math.floor(random() * 51);
  gameStats.record(guildId, userId, "raid", { score: damage });
  raid.hp = Math.max(0, raid.hp - damage);
  addPoints(guildId, userId, 5, "raid_attack");
  if (raid.hp === 0) {
    raid.defeated = true;
    addPoints(guildId, userId, 50, "raid_defeat_bonus");
    return { status: "defeated" as const, damage, hp: 0 };
  }
  return { status: "attacked" as const, damage, hp: raid.hp };
}

function hash(value: string): number {
  let result = 0;
  for (const char of value) result = (result * 31 + char.charCodeAt(0)) | 0;
  return result;
}
