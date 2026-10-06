/** 🪦 旧Command：公開 /help に置き換えられ、Discord登録対象から外れている保管実装です。 */

import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand, CommandCategory } from "../../../core/client/command-types.js";

const categories: readonly { name: string; value: CommandCategory; label: string; icon: string }[] = [
  { name: "Onboarding", value: "onboarding", label: "案内", icon: "🌱" },
  { name: "Social", value: "social", label: "交流", icon: "💬" },
  { name: "Recruitment", value: "recruitment", label: "募集", icon: "📣" },
  { name: "Events", value: "events", label: "イベント", icon: "🎉" },
  { name: "Economy", value: "economy", label: "まぶP・経済", icon: "🪙" },
  { name: "Profile", value: "profile", label: "プロフィール", icon: "👤" },
  { name: "Fun", value: "fun", label: "ゲーム", icon: "🎮" },
  { name: "Community", value: "community", label: "コミュニティ", icon: "🌙" },
  { name: "AI", value: "ai", label: "AI", icon: "🤖" },
  { name: "Moderation", value: "moderation", label: "管理", icon: "🛡️" },
  { name: "Voice", value: "voice", label: "ボイス", icon: "🔊" },
];

const usage: Record<string, string> = {
  hello: "/community hello", help: "/help category:ゲーム", topic: "/community topic category:fun", idle: "/community idle",
  thanks: "/community thanks user:@メンバー", feedback: "/community feedback category:要望 message:内容",
  lfg: "/recruit lfg game:ゲーム名 members:4", vc: "/recruit vc activity:gaming", event: "/event event-create",
  poll: "/event poll question:質問 choices:はい|いいえ", photo: "/event photo", celebrate: "/event celebrate-list",
  points: "/economy points claim:true", gacha: "/economy gacha", mission: "/economy mission", shop: "/economy shop",
  gift: "/economy gift user:@相手 points:10", level: "/profile level", title: "/profile title-list", birthday: "/profile birthday",
  profile: "/profile view", streak: "/profile streak checkin:true", card: "/profile card", game: "/play game type:dice",
  mystery: "/play mystery", quiz: "/play quiz-start", wolf: "/play wolf-start", reaction: "/play reaction",
  race: "/play race-start", fishing: "/play fishing-cast", raid: "/play raid-status", status: "/community status",
  match: "/community match type:game", digest: "/community digest", leaderboard: "/community leaderboard metric:game_wins",
  remind: "/community remind-add", note: "/community note-list", ticket: "/community ticket-open", stats: "/community stats",
  achievements: "/profile achievements", weekly: "/community weekly", announce: "/community announce text:お知らせ", ai: "/ai prompt:質問",
  modlog: "/moderation modlog", automod: "/moderation automod-enable", config: "/moderation config-show", tempvc: "/voice tempvc-create",
};

export const command: BotCommand = {
  category: "onboarding",
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("統合されたコマンドの使い方を表示します")
    .addStringOption((option) => option.setName("category").setDescription("詳しく見るカテゴリ").setRequired(false).addChoices(...categories.map(({ name, value }) => ({ name, value })))),
  async execute(interaction, { commands }) {
    const selected = interaction.options.getString("category") as CommandCategory | null;
    if (!selected) {
      const lines = categories.map(({ value, label, icon }) => {
        const count = [...commands.values()].filter((item) => item.category === value).length;
        return `${icon} **${label}**　${count}コマンド`;
      });
      await interaction.reply({ embeds: [new EmbedBuilder().setTitle("🌙 まぶBot Help").setDescription(`全${commands.size}コマンド\n\n${lines.join("\n")}\n\n詳しくは：\`/help category:...\``).setColor(0x617f77).setFooter({ text: "コマンド名をタップして実行できます" })], ephemeral: true });
      return;
    }
    const category = categories.find((item) => item.value === selected)!;
    const items = [...commands.values()].filter((item) => item.category === selected).sort((a, b) => a.data.name.localeCompare(b.data.name, "ja"));
    const embed = new EmbedBuilder().setTitle(`${category.icon} ${category.label} Help`).setColor(0x617f77).setFooter({ text: "引数はDiscordの入力欄から選択できます" });
    for (const item of items) embed.addFields({ name: `/${item.data.name}`, value: `${item.data.description}\n例：\`${usage[item.data.name] ?? `/${item.data.name}`}\``, inline: true });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
