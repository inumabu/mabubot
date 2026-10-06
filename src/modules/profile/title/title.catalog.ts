/** 📚 定義カタログ：称号で使う固定値を管理します。 */

export const titles = [
  { id: "newcomer", name: "まぶ鯖の新人", unlockLevel: 1 },
  { id: "vc_regular", name: "VC常連", unlockLevel: 5 },
  { id: "gamer", name: "ゲーマー", unlockLevel: 10 },
  { id: "night_owl", name: "深夜の住人", unlockLevel: 20 },
  { id: "community", name: "コミュニティの一員", unlockLevel: 30 },
] as const;

export type TitleId = (typeof titles)[number]["id"];

export function getTitleName(titleId: string): string {
  return titles.find((title) => title.id === titleId)?.name ?? titles[0].name;
}