/** 🧩 Command契約：公開Commandと互換層で共有する型を定義します。 */

import type {
  AnySelectMenuInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

// 🔗 公開入口から旧機能へ渡す共通実行情報を固定し、互換層の受け渡し契約を保ちます。
export interface CommandContext {
  commands: ReadonlyMap<string, BotCommand>;
}

export type CommandCategory =
  | "onboarding"
  | "social"
  | "recruitment"
  | "events"
  | "economy"
  | "profile"
  | "fun"
  | "community"
  | "ai"
  | "moderation"
  | "voice";

// 🧩 公開Commandと旧機能Commandが共有する実行契約です。
export interface BotCommand {
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder;
  category: CommandCategory;
  buttonHandlers?: readonly ButtonHandler[];
  selectMenuHandlers?: readonly SelectMenuHandler[];
  modalHandlers?: readonly ModalHandler[];
  autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
  execute(
    interaction: ChatInputCommandInteraction,
    context: CommandContext,
  ): Promise<void>;
}

export interface ButtonHandler {
  matches(customId: string): boolean;
  execute(interaction: ButtonInteraction): Promise<void>;
}

export interface SelectMenuHandler {
  matches(customId: string): boolean;
  execute(interaction: AnySelectMenuInteraction): Promise<void>;
}

export interface ModalHandler {
  matches(customId: string): boolean;
  execute(interaction: ModalSubmitInteraction): Promise<void>;
}