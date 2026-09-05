export type Question = { id: string; position: number; text: string };
export type Player = { id: string; name: string };
export type Vote = { question_id: string; voter_id: string; target_id: string };

export type TallyRow = { playerId: string; name: string; count: number };
export type QuestionTally = { question: Question; totalVotes: number; rows: TallyRow[] };

export function tallyVotes(questions: Question[], players: Player[], votes: Vote[]): QuestionTally[] {
  const nameById = new Map(players.map((p) => [p.id, p.name]));
  const byQuestion = new Map<string, Map<string, number>>();
  for (const v of votes) {
    const counts = byQuestion.get(v.question_id) ?? new Map<string, number>();
    counts.set(v.target_id, (counts.get(v.target_id) ?? 0) + 1);
    byQuestion.set(v.question_id, counts);
  }
  return [...questions]
    .sort((a, b) => a.position - b.position)
    .map((question) => {
      const counts = byQuestion.get(question.id) ?? new Map<string, number>();
      const rows: TallyRow[] = [...counts.entries()]
        .map(([playerId, count]) => ({ playerId, name: nameById.get(playerId) ?? "?", count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
      const totalVotes = rows.reduce((sum, r) => sum + r.count, 0);
      return { question, totalVotes, rows };
    });
}
