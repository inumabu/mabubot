/** 🎯 公開入口：/help で利用可能なCommandを案内します。 */

import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../core/client/command-types.js";

const categories = [
  { value: "profile", label: "プロフィール", icon: "👤" },
  { value: "economy", label: "まぶP・経済", icon: "🪙" },
  { value: "fun", label: "ゲーム", icon: "🎮" },
  { value: "community", label: "交流・統計", icon: "💬" },
  { value: "events", label: "イベント", icon: "🎉" },
  { value: "recruitment", label: "募集", icon: "📣" },
  { value: "moderation", label: "管理", icon: "🛡️" },
  { value: "voice", label: "ボイス", icon: "🔊" },
  { value: "ai", label: "AI", icon: "🤖" },
] as const;

const examples: Record<string, string> = {
  profile: "/profile view",
  economy: "/economy points claim:true",
  fun: "/play game type:dice",
  community: "/community status",
  events: "/event event-list",
  recruitment: "/recruit lfg game:Minecraft members:4",
  moderation: "/moderation config-show",
  voice: "/voice tempvc-create",
  ai: "/ai prompt:質問",
};

function routeLines(command: BotCommand): string[] {
  const data = command.data.toJSON() as { name: string; options?: { name?: string; description?: string }[] };
  return (data.options ?? []).map((option) => `/${data.name} ${option.name} — ${option.description}`);
}

export const command: BotCommand = {
  category: "onboarding",
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("まぶBotの使い方をカテゴリ別に案内します")
    .addStringOption((option) => option
      .setName("category")
      .setDescription("詳しく見るカテゴリ")
      .setRequired(false)
      .addChoices(...categories.map(({ value, label, icon }) => ({ name: `${icon} ${label}`, value })))),
  async execute(interaction, { commands }) {
    const selected = interaction.options.getString("category");
    if (!selected) {
      const rootLines = [
        `📚 **案内**　/help`,
        ...categories.map(({ label, icon, value }) => {
          const aggregate = [...commands.values()].find((item) => item.category === value);
          return `${icon} **${label}**　${aggregate ? `/${aggregate.data.toJSON().name}` : "—"}`;
        }),
      ];
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle("🌙 まぶBot Help")
          .setDescription(`公開入口は **${commands.size}個** です。\n\n${rootLines.join("\n")}\n\n💡 詳しくは \`/help category:...\` を使ってください。`)
          .setColor(0x617f77)
          .setFooter({ text: "✨ 機能をカテゴリごとにまとめています" })],
        ephemeral: true,
      });
      return;
    }

    const command = [...commands.values()].find((item) => item.category === selected);
    const category = categories.find((item) => item.value === selected);
    if (!command || !category) {
      await interaction.reply({ content: "⚠️ そのカテゴリは見つかりません。", ephemeral: true });
      return;
    }

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle(`${category.icon} ${category.label}`)
        .setDescription(`${routeLines(command).join("\n")}\n\n💡 例：\`${examples[selected] ?? `/${command.data.toJSON().name}`}\``)
        .setColor(0x617f77)],
      ephemeral: true,
    });
  },
};
