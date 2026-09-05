import type { QuestionTally } from "./tally";

export type Guess = { question_id: string; guesser_id: string; guessed_id: string | null; guessed_rank: number | null };

export type Scores = {
  /** questionId -> guesserId -> points earned on that question */
  byQuestion: Record<string, Record<string, number>>;
  /** guesserId -> total points */
  totals: Record<string, number>;
};

/**
 * Exact or nothing: the guess must name the right player at the right spot on the
 * board to earn that answer's votes. Anything else (wrong spot, off the board,
 * no rank, passed) is 0. Tied vote counts share a spot.
 */
export function pointsFor(t: QuestionTally, guessedId: string | null, rank: number | null): { points: number; exact: boolean } {
  if (!guessedId || !rank) return { points: 0, exact: false };
  const row = t.rows.find((r) => r.playerId === guessedId);
  const atRank = t.rows[rank - 1];
  if (!row || !atRank || atRank.count !== row.count) return { points: 0, exact: false };
  return { points: row.count, exact: true };
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
