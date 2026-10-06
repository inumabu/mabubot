/** 🔐 環境設定：環境変数を検証してアプリケーション設定へ変換します。 */

import "dotenv/config";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get discordToken(): string {
    return required("DISCORD_TOKEN");
  },
  get discordClientId(): string {
    return required("DISCORD_CLIENT_ID");
  },
  get discordGuildId(): string | undefined {
    return process.env.DISCORD_GUILD_ID?.trim() || undefined;
  },
  get feedbackChannelId(): string | undefined {
    return process.env.FEEDBACK_CHANNEL_ID?.trim() || undefined;
  },
  get birthdayChannelId(): string | undefined {
    return process.env.BIRTHDAY_CHANNEL_ID?.trim() || undefined;
  },
  get digestChannelId(): string | undefined {
    return process.env.DIGEST_CHANNEL_ID?.trim() || undefined;
  },
  get welcomeChannelId(): string | undefined {
    return process.env.WELCOME_CHANNEL_ID?.trim() || undefined;
  },
  get tempVcCategoryId(): string | undefined {
    return process.env.TEMP_VC_CATEGORY_ID?.trim() || undefined;
  },
  get aiApiKey(): string | undefined {
    return process.env.AI_API_KEY?.trim() || undefined;
  },
  get aiApiBaseUrl(): string {
    return process.env.AI_API_BASE_URL?.trim() || "https://api.openai.com/v1";
  },
  get aiModel(): string {
    return process.env.AI_MODEL?.trim() || "gpt-4o-mini";
  },
};
