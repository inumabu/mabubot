/** ⚙️ Service：ゲームの業務ルールとユースケースを担当します。 */

import { NumberGameRepository } from "./number-game.repository.js";

const quizzes = [
  { question: "Minecraftで爆発する緑色のMobは？", answer: "クリーパー" },
  { question: "チェスで最も動けるマスが多い駒は？", answer: "クイーン" },
  { question: "スーパーマリオの弟の名前は？", answer: "ルイージ" },
];

export function playRps(choice: string): string {
  const options = ["rock", "paper", "scissors"];
  const bot = options[Math.floor(Math.random() * options.length)];
  const names: Record<string, string> = { rock: "グー", paper: "パー", scissors: "チョキ" };
  const wins = (choice === "rock" && bot === "scissors")
    || (choice === "paper" && bot === "rock")
    || (choice === "scissors" && bot === "paper");
  const result = choice === bot ? "あいこ" : wins ? "あなたの勝ち" : "Botの勝ち";
  return `あなた：${names[choice]} / Bot：${names[bot]}\n**${result}！**`;
}

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

interface QuizSession {
  question: string;
  answer: string;
  expiresAt: number;
}
export type QuizResult =
  | { status: "started" | "active"; question: string }
  | { status: "answered"; question: string; correct: string; isCorrect: boolean };
const quizSessions = new Map<string, QuizSession>();

export type NumberGameResult =
  | { status: "started"; attempts: number; remaining: number }
  | { status: "active"; attempts: number; remaining: number }
  | { status: "higher" | "lower"; attempts: number; remaining: number }
  | { status: "won"; attempts: number }
  | { status: "lost"; answer: number; attempts: number };

export class NumberGameService {
  constructor(
    private readonly repository = new NumberGameRepository(),
    private readonly random: () => number = Math.random,
  ) {}

  play(guildId: string, userId: string, guess?: number, now = Date.now()): NumberGameResult {
    let session = this.repository.find(guildId, userId);
    if (!session || Date.parse(session.expiresAt) <= now) {
      session = this.repository.start(
        guildId,
        userId,
        Math.floor(this.random() * 10) + 1,
        new Date(now + 10 * 60 * 1000).toISOString(),
      );
      if (guess === undefined) return { status: "started", attempts: 0, remaining: 5 };
    }
    if (guess === undefined) {
      return { status: "active", attempts: session.attempts, remaining: 5 - session.attempts };
    }

    const attempts = session.attempts + 1;
    if (guess === session.target) {
      this.repository.delete(guildId, userId);
      return { status: "won", attempts };
    }
    if (attempts >= 5) {
      this.repository.delete(guildId, userId);
      return { status: "lost", answer: session.target, attempts };
    }

    this.repository.setAttempts(guildId, userId, attempts);
    return {
      status: guess < session.target ? "higher" : "lower",
      attempts,
      remaining: 5 - attempts,
    };
  }
}

export function playQuiz(
  sessionKey: string,
  answer?: string,
  now = Date.now(),
  random: () => number = Math.random,
): QuizResult {
  const existing = quizSessions.get(sessionKey);
  if (!existing || existing.expiresAt <= now) {
    const quiz = quizzes[Math.floor(random() * quizzes.length)];
    quizSessions.set(sessionKey, {
      question: quiz.question,
      answer: quiz.answer,
      expiresAt: now + 10 * 60 * 1000,
    });
    return { status: "started", question: quiz.question };
  }
  if (answer === undefined) return { status: "active", question: existing.question };
  quizSessions.delete(sessionKey);
  return {
    status: "answered",
    question: existing.question,
    correct: existing.answer,
    isCorrect: answer.trim().toLocaleLowerCase("ja") === existing.answer.toLocaleLowerCase("ja"),
  };
}
