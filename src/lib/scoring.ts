import type { QuestionTally } from "./tally";

export type Guess = { question_id: string; guesser_id: string; guessed_id: string | null };

export type Scores = {
  /** questionId -> guesserId -> points earned on that question */
  byQuestion: Record<string, Record<string, number>>;
  /** guesserId -> total points */
  totals: Record<string, number>;
};

/** Family Feud rule scaled to the room: a guess is worth the votes the guessed player got. Off the board or passed = 0. */
export function scoreGuesses(tallies: QuestionTally[], guesses: Guess[]): Scores {
  const countFor = new Map<string, Map<string, number>>();
  for (const t of tallies) countFor.set(t.question.id, new Map(t.rows.map((r) => [r.playerId, r.count])));

  const byQuestion: Scores["byQuestion"] = {};
  const totals: Scores["totals"] = {};
  for (const g of guesses) {
    const pts = g.guessed_id ? countFor.get(g.question_id)?.get(g.guessed_id) ?? 0 : 0;
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
