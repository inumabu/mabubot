/** 🔁 旧Command互換層：ゲーム操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { NumberGameService, playQuiz, playRps, rollDice } from "./game.service.js";

const numberGame = new NumberGameService();

export const command: BotCommand = {
  category: "fun",
  data: new SlashCommandBuilder()
    .setName("game")
    .setDescription("ミニゲームで遊びます")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("ゲームの種類")
        .setRequired(true)
        .addChoices(
          { name: "じゃんけん", value: "rps" },
          { name: "サイコロ", value: "dice" },
          { name: "数字当て", value: "number" },
          { name: "クイズ", value: "quiz" },
        ),
    )
    .addStringOption((option) =>
      option.setName("choice").setDescription("手またはクイズの答え").setRequired(false).setMaxLength(100),
    )
    .addIntegerOption((option) =>
      option.setName("guess").setDescription("数字当ての予想（1〜10）").setRequired(false).setMinValue(1).setMaxValue(10),
    ),
  async execute(interaction) {
    const type = interaction.options.getString("type", true);
    const choice = interaction.options.getString("choice");
    if (type === "rps") {
      if (!choice || !["rock", "paper", "scissors"].includes(choice)) {
        await interaction.reply({ content: "⚠️ choiceに rock、paper、scissors のいずれかを指定してください。", ephemeral: true });
        return;
      }
      await interaction.reply(`✊ ${playRps(choice)}`);
      return;
    }
    if (type === "dice") {
      await interaction.reply(`🎲 サイコロの目は **${rollDice()}**！`);
      return;
    }
    if (type === "number") {
      if (!interaction.guildId) {
        await interaction.reply({ content: "🏠 数字当てはサーバー内で使用してください。", ephemeral: true });
        return;
      }
      const guess = interaction.options.getInteger("guess");
      const result = numberGame.play(interaction.guildId, interaction.user.id, guess ?? undefined);
      const content = result.status === "started"
        ? "🔢 数字当てを開始しました。1〜10の数字をguessに入力してください（5回まで、10分有効）。"
        : result.status === "active"
          ? `ゲーム進行中です。guessを入力してください（残り${result.remaining}回）。`
          : result.status === "higher"
            ? `⬆️ もっと大きい数字です。（残り${result.remaining}回）`
            : result.status === "lower"
              ? `⬇️ もっと小さい数字です。（残り${result.remaining}回）`
              : result.status === "won"
                ? `🎉 正解！${result.attempts}回で当てました。`
                : result.status === "lost"
                  ? `🏁 今回は終了です。正解は${result.answer}でした。`
                  : "🔢 数字当てを開始しました。guessを入力してください。";
      await interaction.reply(content);
      return;
    }
    const result = playQuiz(`${interaction.guildId ?? "direct-message"}:${interaction.user.id}`, choice ?? undefined);
    if (result.status !== "answered") {
      await interaction.reply(`❓ ${result.question}\n次の /play game type:quiz choice:... で答えを入力してください（10分有効）。`);
      return;
    }
    await interaction.reply(`❓ ${result.question}\n${result.isCorrect ? "正解！🎉" : `不正解。正解は「${result.correct}」でした。`}`);
  },
};
