/** 🔁 旧Command互換層：写真操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { getStoredImagePath, storeImage } from "../../../infrastructure/storage/image-storage.js";
import { addPhoto, getTodayPhoto } from "./photo.service.js";

export const command: BotCommand = {
  category: "events",
  data: new SlashCommandBuilder()
    .setName("photo")
    .setDescription("今日の一枚を投稿・表示します")
    .addAttachmentOption((option) =>
      option.setName("image").setDescription("投稿する画像").setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("caption").setDescription("写真へのひとこと").setRequired(false).setMaxLength(200),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const image = interaction.options.getAttachment("image");
    if (!image) {
      const photo = getTodayPhoto(interaction.guildId);
      if (!photo) {
        await interaction.reply({ content: "📸 今日の写真はまだありません。imageを付けて最初の一枚を投稿しよう。", ephemeral: true });
        return;
      }
      const files = photo.imageKey ? [new AttachmentBuilder(getStoredImagePath(photo.imageKey), { name: photo.imageKey })] : [];
      await interaction.reply({
        embeds: [{
          title: "📸 今日の一枚",
          description: photo.caption ?? undefined,
          image: { url: photo.imageKey ? `attachment://${photo.imageKey}` : photo.imageUrl },
          footer: { text: `📷 投稿者: ${photo.userId}` },
          color: 0x698c6b,
        }],
        files,
      });
      return;
    }
    if (!image.contentType?.startsWith("image/") || image.size > 8 * 1024 * 1024) {
      await interaction.reply({ content: "📸 8MB以下の画像ファイルを指定してください。", ephemeral: true });
      return;
    }
    await interaction.deferReply();
    const caption = interaction.options.getString("caption")?.trim();
    let imageKey: string;
    try {
      imageKey = await storeImage(image.url, image.contentType);
    } catch (error) {
      const message = error instanceof Error && error.message === "IMAGE_TOO_LARGE"
        ? "📸 画像は8MB以下にしてください。"
        : "❌ 画像を保存できませんでした。JPEG/PNG/GIF/WebP形式か確認してください。";
      await interaction.editReply({ content: message });
      return;
    }
    const photo = addPhoto(interaction.guildId, interaction.user.id, imageKey, caption || undefined);
    const file = new AttachmentBuilder(getStoredImagePath(imageKey), { name: imageKey });
    await interaction.editReply({
      embeds: [{
        title: "📸 今日の一枚",
        description: photo.caption ?? undefined,
        image: { url: `attachment://${imageKey}` },
        footer: { text: `📷 投稿者: ${interaction.user.username}` },
        color: 0x698c6b,
      }],
      files: [file],
    });
  },
};