/** 🕒 時刻ユーティリティ：Asia/Tokyo基準の日付・時刻変換を提供します。 */

function tokyoDateParts(date: Date): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
}

export function getTokyoDate(date = new Date()): string {
  const parts = tokyoDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getTokyoMonthDay(date = new Date()): string {
  const parts = tokyoDateParts(date);
  return `${parts.month}-${parts.day}`;
}