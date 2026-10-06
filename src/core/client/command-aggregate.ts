/** 🧩 統合ルーター：公開10コマンドと旧Command実装の境界を管理します。 */

import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { SlashCommandBuilder as SlashCommandBuilderClass } from "discord.js";
import type { BotCommand, CommandContext } from "./command-types.js";

type JsonChoice = { name: string; value: string | number };
type JsonOption = {
  type: number;
  name: string;
  description: string;
  required?: boolean;
  choices?: JsonChoice[];
  autocomplete?: boolean;
  min_value?: number;
  max_value?: number;
  min_length?: number;
  max_length?: number;
  channel_types?: number[];
};
type JsonSubcommand = JsonOption & { options?: JsonOption[] };
type JsonCommand = { name: string; description: string; options?: JsonSubcommand[] };

export type AggregateMount = {
  command: BotCommand;
  /** 🔗 公開Command上のroute契約です。省略時は元Command名を使います。 */
  route?: string;
};

// 🔄 旧CommandのJSON定義を統合Builderへ復元するため、DiscordのOption typeを固定します。
const SUBCOMMAND = 1;
const STRING = 3;
const INTEGER = 4;
const BOOLEAN = 5;
const USER = 6;
const CHANNEL = 7;
const ROLE = 8;
const MENTIONABLE = 9;
const NUMBER = 10;
const ATTACHMENT = 11;

// 🔄 旧CommandのOption定義を統合CommandのBuilderへ復元します。Option定義は旧Command側を正とします。
function applyOption(builder: any, option: JsonOption): void {
  builder.setName(option.name).setDescription(option.description);
  if (option.required !== undefined) builder.setRequired(option.required);
  if (option.choices?.length) builder.addChoices(...option.choices);
  if (option.autocomplete) builder.setAutocomplete(true);
  if (option.min_value !== undefined) builder.setMinValue(option.min_value);
  if (option.max_value !== undefined) builder.setMaxValue(option.max_value);
  if (option.min_length !== undefined) builder.setMinLength(option.min_length);
  if (option.max_length !== undefined) builder.setMaxLength(option.max_length);
  if (option.channel_types?.length) builder.addChannelTypes(...option.channel_types);
}

function addOption(target: any, option: JsonOption): void {
  // 🛡️ Discord.jsのOption callback契約を保ち、統合登録時のBuilder検証を通します。
  const apply = (builder: any) => {
    applyOption(builder, option);
    return builder;
  };
  switch (option.type) {
    case STRING: target.addStringOption(apply); return;
    case INTEGER: target.addIntegerOption(apply); return;
    case BOOLEAN: target.addBooleanOption(apply); return;
    case USER: target.addUserOption(apply); return;
    case CHANNEL: target.addChannelOption(apply); return;
    case ROLE: target.addRoleOption(apply); return;
    case MENTIONABLE: target.addMentionableOption(apply); return;
    case NUMBER: target.addNumberOption(apply); return;
    case ATTACHMENT: target.addAttachmentOption(apply); return;
    default: throw new Error(`Unsupported aggregate option type: ${option.type}`);
  }
}

function addLeaf(builder: any, route: string, description: string, options: readonly JsonOption[] = []): void {
  // 🛡️ Discord.jsのBuilder callback契約を守り、統合Commandの登録時検証を通します。
  builder.addSubcommand((subcommand: any) => {
    subcommand.setName(route).setDescription(description);
    for (const option of options) addOption(subcommand, option);
    return subcommand;
  });
}

// 🔗 公開routeと旧Commandの対応を固定し、実行とautocompleteで同じ互換契約を使います。
function routeMap(mounts: readonly AggregateMount[]): Map<string, { command: BotCommand; subcommand?: string }> {
  const routes = new Map<string, { command: BotCommand; subcommand?: string }>();
  for (const mount of mounts) {
    const source = mount.command.data.toJSON() as JsonCommand;
    const nested = (source.options ?? []).filter((option) => option.type === SUBCOMMAND) as JsonSubcommand[];
    if (nested.length) {
      for (const subcommand of nested) {
        const route = `${mount.route ?? source.name}-${subcommand.name}`;
        if (routes.has(route)) throw new Error(`Duplicate aggregate route: ${route}`);
        routes.set(route, { command: mount.command, subcommand: subcommand.name });
      }
    } else {
      const route = mount.route ?? source.name;
      if (routes.has(route)) throw new Error(`Duplicate aggregate route: ${route}`);
      routes.set(route, { command: mount.command });
    }
  }
  return routes;
}

// 🎯 旧Commandの登録定義を正として、公開10コマンドのDiscord登録契約を再構成します。
function aggregateData(name: string, description: string, mounts: readonly AggregateMount[]): SlashCommandBuilder {
  const builder = new SlashCommandBuilderClass().setName(name).setDescription(description);
  for (const mount of mounts) {
    const source = mount.command.data.toJSON() as JsonCommand;
    const nested = (source.options ?? []).filter((option) => option.type === SUBCOMMAND) as JsonSubcommand[];
    if (nested.length) {
      for (const subcommand of nested) {
        addLeaf(builder, `${mount.route ?? source.name}-${subcommand.name}`, subcommand.description, subcommand.options);
      }
    } else {
      addLeaf(builder, mount.route ?? source.name, source.description, source.options);
    }
  }
  return builder;
}

// 🔁 Autocompleteでも旧Commandが従来のSubcommand名を受け取れるよう、互換ビューを提供します。
function routedAutocompleteInteraction(interaction: AutocompleteInteraction, subcommand?: string): AutocompleteInteraction {
  if (!subcommand) return interaction;
  const options = new Proxy(interaction.options, {
    get(target, property, receiver) {
      if (property === "getSubcommand") return () => subcommand;
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  return new Proxy(interaction, {
    get(target, property, receiver) {
      if (property === "options") return options;
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

// 🔁 実行時も旧Commandが従来のSubcommand名を受け取れるよう、互換ビューを提供します。
function routedInteraction(interaction: ChatInputCommandInteraction, subcommand?: string): ChatInputCommandInteraction {
  if (!subcommand) return interaction;
  const options = new Proxy(interaction.options, {
    get(target, property, receiver) {
      if (property === "getSubcommand") return () => subcommand;
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  return new Proxy(interaction, {
    get(target, property, receiver) {
      if (property === "options") return options;
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

// 🔗 公開入口・実行ルート・Component Handlerを一元化し、旧Commandの業務ロジックをそのまま再利用します。
export function createAggregateCommand(
  name: string,
  description: string,
  category: BotCommand["category"],
  mounts: readonly AggregateMount[],
): BotCommand {
  const routes = routeMap(mounts);
  return {
    category,
    data: aggregateData(name, description, mounts),
    buttonHandlers: mounts.flatMap(({ command }) => command.buttonHandlers ?? []),
    selectMenuHandlers: mounts.flatMap(({ command }) => command.selectMenuHandlers ?? []),
    modalHandlers: mounts.flatMap(({ command }) => command.modalHandlers ?? []),
    autocomplete: async (interaction: AutocompleteInteraction) => {
      const resolved = routes.get(interaction.options.getSubcommand());
      if (resolved?.command.autocomplete) {
        await resolved.command.autocomplete(routedAutocompleteInteraction(interaction, resolved.subcommand));
      }
    },
    async execute(interaction, context: CommandContext) {
      const resolved = routes.get(interaction.options.getSubcommand());
      if (!resolved) throw new Error(`Unknown aggregate route: /${name} ${interaction.options.getSubcommand()}`);
      await resolved.command.execute(routedInteraction(interaction, resolved.subcommand), context);
    },
  };
}
