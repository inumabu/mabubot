/** ⚙️ Service：トピックの業務ルールとユースケースを担当します。 */

export type TopicCategory = "random" | "games" | "music" | "daily" | "fun";

const topics: Record<TopicCategory, readonly string[]> = {
  random: [
    "最近買ってよかったものは？",
    "一日だけ別の仕事をするなら何をしてみたい？",
    "最近ちょっと嬉しかったことは？",
  ],
  games: [
    "今まで遊んだ中で一番印象に残っているゲームは？",
    "次にみんなで遊ぶなら何のゲームがいい？",
    "ゲームの中で一日暮らすなら、どの世界を選ぶ？",
  ],
  music: [
    "最近よく聴いている曲は？",
    "作業中に聴くなら、どんな音楽が好き？",
    "ライブやコンサートで聴いてみたい曲は？",
  ],
  daily: [
    "今日食べたものの中で一番おいしかったのは？",
    "最近の小さなマイブームは？",
    "明日ひとつ予定を増やせるなら何をする？",
  ],
  fun: [
    "好きなものを一つだけ無限に食べられるなら何にする？",
    "もし動物と話せたら、最初に誰と話したい？",
    "一週間だけ超能力を使えるなら何を選ぶ？",
  ],
};

export function getRandomTopic(category: TopicCategory): string {
  const choices = topics[category];
  return choices[Math.floor(Math.random() * choices.length)];
}