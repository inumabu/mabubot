/** 🧪 テスト：主要機能・10公開Command・互換ルーターの回帰条件を検証します。 */

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { initializeDatabase } from "../../src/infrastructure/database/sqlite.js";
import { EventRepository } from "../../src/modules/events/event/event.repository.js";
import { IdleRepository } from "../../src/modules/social/idle/idle.repository.js";
import { RecruitmentRepository } from "../../src/modules/recruitment/recruitment.repository.js";
import { EconomyRepository } from "../../src/modules/economy/economy.repository.js";
import { ProfileRepository } from "../../src/modules/profile/profile.repository.js";
import { StreakRepository } from "../../src/modules/profile/streak/streak.repository.js";
import { AiRepository } from "../../src/modules/ai/ai/ai.repository.js";
import { loadCommands } from "../../src/core/client/command-loader.js";
import { getStoredImagePath } from "../../src/infrastructure/storage/image-storage.js";
import { resolveDataDirectory } from "../../src/infrastructure/storage/data-directory.js";
import { buildIdleBoard } from "../../src/modules/social/idle/idle.view.js";
import { buildEventPost } from "../../src/modules/events/event/event.view.js";
import { NumberGameRepository } from "../../src/modules/fun/game/number-game.repository.js";
import { NumberGameService, playQuiz } from "../../src/modules/fun/game/game.service.js";
import { GameStatsRepository } from "../../src/modules/fun/game/game-stats.repository.js";
import { getMystery, joinWolf, pickRace, startRace, startWolf, voteWolf } from "../../src/modules/fun/arcade.service.js";
import { SlashCommandBuilder, type Client, type Interaction } from "discord.js";
import type { BotCommand } from "../../src/core/client/command-types.js";
import { registerInteractionCreate } from "../../src/core/events/interaction-create.js";
import { command as helpCommand } from "../../src/commands/help.command.js";
import { AnalyticsRepository } from "../../src/modules/community/analytics.repository.js";
import { CommunityToolsRepository } from "../../src/modules/community/tools.repository.js";
import { buildWelcomeContent } from "../../src/modules/onboarding/welcome/welcome.listener.js";

const databases: DatabaseSync[] = [];

function createDatabase(): DatabaseSync {
  const database = new DatabaseSync(":memory:");
  initializeDatabase(database);
  databases.push(database);
  return database;
}

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

test("idle state is guild-scoped and can be cleared", () => {
  const repository = new IdleRepository(createDatabase());
  repository.setActivity("guild-a", "user-1", "games");
  repository.setActivity("guild-a", "user-2", "chat");
  repository.setActivity("guild-b", "user-1", "vc");

  assert.deepEqual(repository.listByGuild("guild-a"), [
    { userId: "user-1", activity: "games" },
    { userId: "user-2", activity: "chat" },
  ]);

  repository.clearActivity("guild-a", "user-1");
  assert.deepEqual(repository.listByGuild("guild-a"), [
    { userId: "user-2", activity: "chat" },
  ]);
});

test("recruitment counts the owner, enforces capacity, and restricts closure", () => {
  const repository = new RecruitmentRepository(createDatabase());
  const post = repository.create({
    kind: "lfg",
    guildId: "guild-a",
    channelId: "channel-a",
    ownerId: "owner",
    activity: "Minecraft",
    capacity: 2,
  });

  assert.deepEqual(post.memberIds, ["owner"]);
  assert.equal(repository.join(post.id, "member-1"), "joined");
  assert.equal(repository.join(post.id, "member-1"), "already-joined");
  assert.equal(repository.join(post.id, "member-2"), "full");
  assert.equal(repository.leave(post.id, "owner"), "owner");
  assert.equal(repository.close(post.id, "member-1"), "not-owner");
  assert.equal(repository.close(post.id, "owner"), "closed-by-owner");
  assert.equal(repository.join(post.id, "member-2"), "closed");
  assert.equal(repository.countOpen("guild-a", "lfg"), 0);
});

test("event cancellation is restricted to its owner", () => {
  const repository = new EventRepository(createDatabase());
  const event = repository.create({
    guildId: "guild-a",
    channelId: "channel-a",
    ownerId: "owner",
    name: "Test event",
    startsAt: "2030-01-01T00:00:00.000Z",
  });

  assert.equal(repository.join(event.id, "member-1"), "updated");
  assert.equal(repository.join(event.id, "member-1"), "already-joined");
  assert.equal(repository.cancel(event.id, "member-1"), "not-owner");
  assert.equal(repository.cancel(event.id, "owner"), "cancelled");
  assert.equal(repository.join(event.id, "member-2"), "cancelled");
});

test("point claims are once per day and transfers are atomic", () => {
  const repository = new EconomyRepository(createDatabase());
  repository.addPoints("guild-a", "sender", 100, "test_seed");

  assert.equal(repository.claimPoints("guild-a", "sender", "points", "2026-10-03", 15, "daily").balance, 115);
  assert.equal(repository.claimPoints("guild-a", "sender", "points", "2026-10-03", 15, "daily").result, "already-claimed");
  assert.equal(repository.transferPoints("guild-a", "sender", "recipient", 50), "ok");
  assert.equal(repository.transferPoints("guild-a", "sender", "recipient", 1000), "insufficient");
  assert.equal(repository.getBalance("guild-a", "sender"), 65);
  assert.equal(repository.getBalance("guild-a", "recipient"), 50);
});
test("leaderboards are guild-scoped, sorted, and capped", () => {
  const database = createDatabase();
  const economy = new EconomyRepository(database);
  const profiles = new ProfileRepository(database);
  economy.addPoints("guild-a", "user-1", 30, "test_seed");
  economy.addPoints("guild-a", "user-2", 50, "test_seed");
  economy.addPoints("guild-b", "user-3", 999, "test_seed");
  profiles.addXp("guild-a", "user-1", 500);
  profiles.addXp("guild-a", "user-2", 200);
  assert.deepEqual(economy.getPointsLeaderboard("guild-a", 99), [
    { userId: "user-2", balance: 50 },
    { userId: "user-1", balance: 30 },
  ]);
  assert.deepEqual(profiles.getLeaderboard("guild-a", "xp", 3), [
    { userId: "user-1", value: 500 },
    { userId: "user-2", value: 200 },
  ]);
  assert.deepEqual(economy.getPointsLeaderboard("guild-b"), [{ userId: "user-3", balance: 999 }]);
});

test("game stats are persistent, guild-scoped, and rank wins before score", () => {
  const repository = new GameStatsRepository(createDatabase());
  repository.record("guild-a", "user-1", "fishing", { score: 20 });
  repository.record("guild-a", "user-1", "fishing", { win: true, score: 30 });
  repository.record("guild-a", "user-2", "raid", { win: true, score: 5 });
  repository.record("guild-b", "user-3", "raid", { win: true, score: 999 });
  assert.deepEqual(repository.getUserStats("guild-a", "user-1"), [
    { game: "fishing", plays: 2, wins: 1, score: 50 },
  ]);
  assert.deepEqual(repository.getWinsLeaderboard("guild-a"), [
    { userId: "user-1", wins: 1, plays: 2, score: 50 },
    { userId: "user-2", wins: 1, plays: 1, score: 5 },
  ]);
});

test("streak check-in atomically awards points and preserves the daily streak", () => {
  const database = createDatabase();
  const repository = new StreakRepository(database);
  const profiles = new ProfileRepository(database);
  const economy = new EconomyRepository(database);

  assert.equal(repository.checkIn("guild-a", "user-1", "2026-10-01").streakCount, 1);
  assert.equal(repository.checkIn("guild-a", "user-1", "2026-10-01").changed, false);
  assert.equal(repository.checkIn("guild-a", "user-1", "2026-10-02").streakCount, 2);
  assert.equal(repository.checkIn("guild-a", "user-1", "2026-10-04").streakCount, 1);
  assert.equal(economy.getBalance("guild-a", "user-1"), 15);
  assert.equal(profiles.getProfile("guild-a", "user-1").totalXp, 75);
  profiles.addXp("guild-a", "user-1", 8025);
  assert.equal(profiles.equipTitle("guild-a", "user-1", "gamer"), true);
  assert.equal(profiles.getProfile("guild-a", "user-1").equippedTitle, "gamer");
});

test("streak transaction rolls back profile and balance together", () => {
  const database = createDatabase();
  database.exec(`CREATE TRIGGER fail_streak_reward BEFORE INSERT ON point_transactions
    WHEN NEW.reason = 'streak_checkin'
    BEGIN SELECT RAISE(ABORT, 'simulated reward failure'); END`);
  const repository = new StreakRepository(database);
  assert.throws(() => repository.checkIn("guild-a", "user-1", "2026-10-01"));
  assert.equal(new ProfileRepository(database).getProfile("guild-a", "user-1").totalXp, 0);
  assert.equal(new EconomyRepository(database).getBalance("guild-a", "user-1"), 0);
});

test("shop, gacha, and item gifts update balances and inventory together", () => {
  const repository = new EconomyRepository(createDatabase());
  repository.addPoints("guild-a", "sender", 500, "test_seed");
  assert.equal(repository.purchaseItem("guild-a", "sender", "moon_sticker", 100), "ok");
  assert.equal(repository.transferItem("guild-a", "sender", "recipient", "moon_sticker"), "ok");
  assert.equal(repository.recordGachaDraw("guild-a", "sender", "night_badge", 50), "ok");
  assert.equal(repository.getBalance("guild-a", "sender"), 350);
  assert.deepEqual(repository.getInventory("guild-a", "sender"), [{ itemId: "night_badge", quantity: 1 }]);
  assert.deepEqual(repository.getInventory("guild-a", "recipient"), [{ itemId: "moon_sticker", quantity: 1 }]);
});

test("AI history is isolated by guild and user and remains chronological", () => {
  const repository = new AiRepository(createDatabase());
  repository.append("guild-a", "user-1", [
    { role: "user", content: "最初の質問" },
    { role: "assistant", content: "最初の回答" },
  ]);
  repository.append("guild-a", "user-1", [
    { role: "user", content: "次の質問" },
    { role: "assistant", content: "次の回答" },
  ]);

  assert.deepEqual(repository.listRecent("guild-a", "user-1").map(({ content }) => content), [
    "最初の質問",
    "最初の回答",
    "次の質問",
    "次の回答",
  ]);
  assert.deepEqual(repository.listRecent("guild-b", "user-1"), []);
});

test("all 10 public commands load and serialize for Discord registration", async () => {
  const commands = await loadCommands();
  const expected = [
    "ai", "community", "economy", "event", "help", "moderation", "play", "profile", "recruit", "voice",
  ].sort();
  assert.deepEqual([...commands.keys()].sort(), expected);
  for (const command of commands.values()) {
    const json = command.data.toJSON() as { name?: string; description?: string; options?: { name?: string }[] };
    assert.equal(json.name, command.data.name);
    assert.ok(json.description);
    assert.ok((json.options?.length ?? 0) <= 25);
  }
});

test("help renders the consolidated 10-command summary", async () => {
  const commands = await loadCommands();
  const replies: unknown[] = [];
  const interaction = { options: { getString: () => null }, reply: async (payload: unknown) => { replies.push(payload); } } as never;
  await helpCommand.execute(interaction, { commands });
  const overview = replies[0] as { embeds: { data: { title?: string; description?: string } }[] };
  assert.equal(overview.embeds[0].data.title, "🌙 まぶBot Help");
  assert.match(overview.embeds[0].data.description ?? "", /10個/);
  assert.match(overview.embeds[0].data.description ?? "", /\/profile/);
  assert.match(overview.embeds[0].data.description ?? "", /\/play/);

  const categoryInteraction = { options: { getString: () => "fun" }, reply: async (payload: unknown) => { replies.push(payload); } } as never;
  await helpCommand.execute(categoryInteraction, { commands });
  const fun = replies[1] as { embeds: { data: { description?: string } }[] };
  assert.match(fun.embeds[0].data.description ?? "", /\/play fishing-cast/);
  assert.match(fun.embeds[0].data.description ?? "", /\/play quiz-start/);
});

test("analytics records command usage and summarizes failures", () => {
  const repository = new AnalyticsRepository(createDatabase());
  repository.record("guild-a", "user-1", "help", true, 12);
  repository.record("guild-a", "user-2", "help", false, 30);
  repository.record("guild-a", "user-1", "card", true, 8);
  assert.equal(repository.total("guild-a", "2020-01-01T00:00:00.000Z"), 3);
  assert.deepEqual(repository.summary("guild-a", "2020-01-01T00:00:00.000Z"), [
    { commandName: "help", uses: 2, failures: 1, averageLatencyMs: 21 },
    { commandName: "card", uses: 1, failures: 0, averageLatencyMs: 8 },
  ]);
});

test("ticket closing is guild-scoped and does not treat wildcards as IDs", () => {
  const repository = new CommunityToolsRepository(createDatabase());
  const guildATicket = repository.openTicket("guild-a", "user-1", "support");
  const guildBTicket = repository.openTicket("guild-b", "user-1", "support");
  assert.equal(repository.closeTicket("%", "guild-a", "user-1"), false);
  assert.equal(repository.closeTicket(guildBTicket.slice(0, 8), "guild-a", "user-1"), false);
  assert.equal(repository.closeTicket(guildATicket.slice(0, 8), "guild-a", "user-1"), true);
  assert.equal(repository.closeTicket(guildATicket.slice(0, 8), "guild-a", "user-1"), false);
});

test("all 10 public commands pass integration registration contracts", async () => {
  const commands = await loadCommands();
  assert.equal(commands.size, 10);
  for (const [name, command] of commands) {
    const json = command.data.toJSON() as { name?: string; description?: string };
    assert.equal(json.name, name);
    assert.ok(json.description && json.description.length > 0);
    assert.equal(typeof command.execute, "function");
    assert.ok(command.category);
  }
  const moderation = commands.get("moderation")!.data.toJSON() as { options?: { name?: string }[] };
  assert.ok(moderation.options?.some((option) => option.name === "config-show"));
  assert.ok(moderation.options?.some((option) => option.name === "automod-enable"));

  const play = commands.get("play")!.data.toJSON() as { options?: { name?: string }[] };
  assert.ok(play.options?.some((option) => option.name === "raid-status"));
  assert.ok(play.options?.some((option) => option.name === "wolf-vote"));
});

test("welcome E2E uses guild customization and falls back to defaults", () => {
  const settings = new Map<string, string>([
    ["welcome.title", "🎉 {user}さん、{user}さん！"],
    ["welcome.message", "サーバー独自の案内です。"],
    ["welcome.tutorial", "① /help\n② #rules を読む"],
  ]);
  const customized = buildWelcomeContent("まぶ太郎", (key) => settings.get(key));
  assert.deepEqual(customized, { title: "🎉 まぶ太郎さん、まぶ太郎さん！", message: "サーバー独自の案内です。", tutorial: "① /help\n② #rules を読む" });
  const defaults = buildWelcomeContent("新人", () => undefined);
  assert.match(defaults.title, /新人/);
  assert.match(defaults.tutorial, /\/help/);
});

test("select menu and modal interactions reach their feature handlers", async () => {
  const handled: string[] = [];
  const command: BotCommand = {
    category: "social",
    data: new SlashCommandBuilder().setName("routertest").setDescription("Router test"),
    execute: async () => {},
    selectMenuHandlers: [{
      matches: (customId) => customId === "select:test",
      execute: async (interaction) => { handled.push(`select:${interaction.values[0]}`); },
    }],
    modalHandlers: [{
      matches: (customId) => customId === "modal:test",
      execute: async (interaction) => { handled.push(`modal:${interaction.customId}`); },
    }],
  };
  let listener: ((interaction: Interaction) => void) | undefined;
  const client = {
    on: (_event: string, callback: (interaction: Interaction) => void) => {
      listener = callback;
    },
  } as unknown as Client;
  registerInteractionCreate(client, new Map([["routertest", command]]));
  assert.ok(listener);

  await listener({
    isAutocomplete: () => false,
    isButton: () => false,
    isAnySelectMenu: () => true,
    isModalSubmit: () => false,
    customId: "select:test",
    values: ["chat"],
  } as unknown as Interaction);
  await listener({
    isAutocomplete: () => false,
    isButton: () => false,
    isAnySelectMenu: () => false,
    isModalSubmit: () => true,
    customId: "modal:test",
  } as unknown as Interaction);

  assert.deepEqual(handled, ["select:chat", "modal:modal:test"]);
});

test("database initialization upgrades existing photo tables", () => {
  const database = new DatabaseSync(":memory:");
  databases.push(database);
  database.exec(`CREATE TABLE photo_posts (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TEXT NOT NULL
  )`);
  database.exec(`CREATE TABLE recruitments (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT,
    owner_id TEXT NOT NULL,
    activity TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    start_time TEXT,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL
  )`);
  initializeDatabase(database);
  const columns = database.prepare("PRAGMA table_info(photo_posts)").all() as { name: string }[];
  assert.ok(columns.some((column) => column.name === "image_key"));
  const recruitmentColumns = database.prepare("PRAGMA table_info(recruitments)").all() as { name: string }[];
  assert.ok(recruitmentColumns.some((column) => column.name === "voice_channel_id"));
});

test("stored image path rejects traversal input", () => {
  assert.throws(() => getStoredImagePath("../../package.json"), /INVALID_IMAGE_KEY/);
});

test("data directory is independent of source or dist module location", () => {
  assert.equal(resolveDataDirectory("/app", "data"), "/app/data");
  assert.equal(resolveDataDirectory("/app", "/mnt/mabu-data"), "/mnt/mabu-data");
});

test("idle and event embeds stay under Discord field limits with many members", () => {
  const memberIds = Array.from({ length: 1000 }, (_, index) => `user-${index}`);
  const idleBoard = buildIdleBoard(memberIds.map((userId) => ({ userId, activity: "games" as const })));
  assert.ok(idleBoard.embeds[0].data.description!.length < 4096);
  assert.match(idleBoard.embeds[0].data.description!, /ほか980人/);

  const eventPost = buildEventPost({
    id: "event-1",
    guildId: "guild-1",
    channelId: "channel-1",
    messageId: null,
    ownerId: "user-0",
    name: "test",
    startsAt: "2030-01-01T00:00:00.000Z",
    description: null,
    status: "open",
    memberIds,
  });
  const attendeeField = eventPost.embeds[0].data.fields?.find((field) => field.name === "参加者");
  assert.ok(attendeeField);
  assert.ok(attendeeField.value.length < 1024);
  assert.match(attendeeField.value, /ほか975人/);
});

test("number game sessions retain a target and expire after ten minutes", () => {
  const database = createDatabase();
  const repository = new NumberGameRepository(database);
  repository.start("guild-a", "user-1", 7, "2026-10-03T00:10:00.000Z");
  repository.setAttempts("guild-a", "user-1", 2);

  assert.deepEqual(repository.find("guild-a", "user-1"), {
    target: 7,
    attempts: 2,
    expiresAt: "2026-10-03T00:10:00.000Z",
  });
  assert.equal(repository.find("guild-b", "user-1"), undefined);
  repository.delete("guild-a", "user-1");
  assert.equal(repository.find("guild-a", "user-1"), undefined);
});

test("number game uses the same target until win or five attempts", () => {
  const repository = new NumberGameRepository(createDatabase());
  const game = new NumberGameService(repository, () => 0.6);
  assert.equal(game.play("guild-a", "user-1", undefined, 1000).status, "started");
  assert.equal(game.play("guild-a", "user-1", 5, 2000).status, "higher");
  assert.equal(game.play("guild-a", "user-1", 8, 3000).status, "lower");
  assert.equal(game.play("guild-a", "user-1", 7, 4000).status, "won");
  assert.equal(repository.find("guild-a", "user-1"), undefined);

  game.play("guild-a", "user-1", undefined, 5000);
  for (let attempt = 1; attempt < 5; attempt += 1) {
    assert.equal(game.play("guild-a", "user-1", 1, 5000 + attempt).status, "higher");
  }
  const finalAttempt = game.play("guild-a", "user-1", 1, 5010);
  assert.equal(finalAttempt.status, "lost");
  if (finalAttempt.status === "lost") assert.equal(finalAttempt.answer, 7);
  assert.equal(repository.find("guild-a", "user-1"), undefined);
});
test("quiz presents a stable question before checking the answer", () => {
  const first = playQuiz("guild-a:user-1", undefined, 1000, () => 0);
  assert.equal(first.status, "started");
  assert.match(first.question, /Minecraft/);
  const repeat = playQuiz("guild-a:user-1", undefined, 2000, () => 0.9);
  assert.deepEqual(repeat, first.status === "started" ? { status: "active", question: first.question } : repeat);
  const answer = playQuiz("guild-a:user-1", "クリーパー", 3000, () => 0.9);
  assert.deepEqual(answer, {
    status: "answered",
    question: first.question,
    correct: "クリーパー",
    isCorrect: true,
  });
});
test("arcade games expose deterministic mystery and multiplayer state", () => {
  assert.equal(getMystery("2026-10-04").question, getMystery("2026-10-04").question);
  const race = startRace("arcade-race", () => 0);
  assert.equal(race.winner, "月うさぎ");
  assert.equal(pickRace("arcade-race", "user-1", "invalid").status, "invalid-racer");
  startWolf("arcade-wolf", "user-1");
  assert.equal(joinWolf("arcade-wolf", "user-2"), "joined");
  assert.equal(voteWolf("arcade-wolf", "user-1", "user-2").status, "voted");
});

test("aggregate commands preserve legacy subcommands during autocomplete", async () => {
  const { createAggregateCommand } = await import("../../src/core/client/command-aggregate.js");
  const { SlashCommandBuilder } = await import("discord.js");
  let seen = "";
  const child: BotCommand = {
    category: "recruitment",
    data: new SlashCommandBuilder()
      .setName("lfg")
      .setDescription("lfg")
      .addStringOption((option) => option.setName("game").setDescription("game").setAutocomplete(true)),
    autocomplete: async (interaction) => {
      seen = interaction.options.getSubcommand();
      await interaction.respond([]);
    },
    execute: async () => {},
  };
  const aggregate = createAggregateCommand("recruit", "recruit", "recruitment", [{ command: child }]);
  const interaction = {
    commandName: "recruit",
    options: { getSubcommand: () => "lfg" },
    respond: async () => {},
  } as never;
  await aggregate.autocomplete!(interaction);
  assert.equal(seen, "lfg");
});

test("aggregate commands route flattened subcommands to their original handlers", async () => {
  const { createAggregateCommand } = await import("../../src/core/client/command-aggregate.js");
  const { SlashCommandBuilder } = await import("discord.js");
  let seen = "";
  const child: BotCommand = {
    category: "fun",
    data: new SlashCommandBuilder()
      .setName("quiz")
      .setDescription("quiz")
      .addSubcommand((subcommand) => subcommand.setName("start").setDescription("start")),
    execute: async (interaction) => {
      seen = interaction.options.getSubcommand();
    },
  };
  const aggregate = createAggregateCommand("play", "play", "fun", [{ command: child }]);
  let reply = false;
  const interaction = {
    options: { getSubcommand: () => "quiz-start" },
    reply: async () => { reply = true; },
  } as never;
  await aggregate.execute(interaction, { commands: new Map([["play", aggregate]]) });
  assert.equal(seen, "start");
  assert.equal(reply, false);
  const json = aggregate.data.toJSON() as { options?: { name?: string }[] };
  assert.deepEqual(json.options?.map((option) => option.name), ["quiz-start"]);
});
