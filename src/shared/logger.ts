/** 📝 Logger：ログレベル判定と構造化ログの整形を担当します。 */

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogDetails = Record<string, unknown>;

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function configuredLevel(): LogLevel {
  const value = process.env.LOG_LEVEL?.trim().toLowerCase();
  return value === "debug" || value === "warn" || value === "error" ? value : "info";
}

function serializeDetails(details?: LogDetails): string {
  if (!details || Object.keys(details).length === 0) return "";
  try {
    return ` ${JSON.stringify(details)}`;
  } catch {
    return " {\"details\":\"unserializable\"}";
  }
}

export function formatError(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
    };
  }
  return { name: "UnknownError", message: String(error) };
}

function write(level: LogLevel, scope: string, message: string, details?: LogDetails): void {
  if (levelWeight[level] < levelWeight[configuredLevel()]) return;
  const line = `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)} [${scope}] ${message}${serializeDetails(details)}`;
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

export const logger = {
  debug(scope: string, message: string, details?: LogDetails): void {
    write("debug", scope, message, details);
  },
  info(scope: string, message: string, details?: LogDetails): void {
    write("info", scope, message, details);
  },
  warn(scope: string, message: string, details?: LogDetails): void {
    write("warn", scope, message, details);
  },
  error(scope: string, message: string, details?: LogDetails): void {
    write("error", scope, message, details);
  },
};
