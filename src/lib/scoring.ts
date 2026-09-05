import type { QuestionTally } from "./tally";

export type Guess = { question_id: string; guesser_id: string; guessed_id: string | null; guessed_rank: number | null };

export type Scores = {
  /** questionId -> guesserId -> points earned on that question */
  byQuestion: Record<string, Record<string, number>>;
  /** guesserId -> total points */
  totals: Record<string, number>;
};

/**
 * Family Feud rule scaled to the room, with a rank bonus:
 *  - right name at the right spot on the board: votes × 2
 *  - right name, wrong spot (or no rank called): votes × 1
 *  - off the board, or passed: 0
 * Rows are sorted by votes; tied counts share a spot, so calling either position is exact.
 */
export function pointsFor(t: QuestionTally, guessedId: string | null, rank: number | null): { points: number; exact: boolean } {
  if (!guessedId) return { points: 0, exact: false };
  const row = t.rows.find((r) => r.playerId === guessedId);
  if (!row) return { points: 0, exact: false };
  const atRank = rank ? t.rows[rank - 1] : undefined;
  const exact = !!atRank && atRank.count === row.count;
  return { points: row.count * (exact ? 2 : 1), exact };
}

export function scoreGuesses(tallies: QuestionTally[], guesses: Guess[]): Scores {
  const byId = new Map(tallies.map((t) => [t.question.id, t]));
  const byQuestion: Scores["byQuestion"] = {};
  const totals: Scores["totals"] = {};
  for (const g of guesses) {
    const t = byId.get(g.question_id);
    const pts = t ? pointsFor(t, g.guessed_id, g.guessed_rank).points : 0;
    (byQuestion[g.question_id] ??= {})[g.guesser_id] = pts;
    totals[g.guesser_id] = (totals[g.guesser_id] ?? 0) + pts;
  }
  return { byQuestion, totals };
}

/**
 * Who answers this round. Half the room rounded up by default, rotating through
 * the join order so everyone gets the same number of turns over the game.
 */
export function pickGuessers(playerIds: string[], round: number, count?: number): string[] {
  const n = playerIds.length;
  if (n === 0) return [];
  const c = Math.min(n, Math.max(1, count ?? Math.ceil(n / 2)));
  const start = (round * c) % n;
  return Array.from({ length: c }, (_, k) => playerIds[(start + k) % n]);
}

export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}
