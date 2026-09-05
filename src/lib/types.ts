export type GameStatus = "lobby" | "voting" | "closed";

export type GameRow = { id: string; code: string; admin_token: string; status: GameStatus; created_at: string };
export type PlayerRow = { id: string; game_id: string; name: string; token: string; submitted_at: string | null };
export type QuestionRow = { id: string; game_id: string; position: number; text: string };
export type VoteRow = { id: string; game_id: string; question_id: string; voter_id: string; target_id: string };

export type PublicPlayer = { id: string; name: string; submitted: boolean };
export type PublicQuestion = { id: string; position: number; text: string };

export type StateResponse = {
  game: { code: string; status: GameStatus };
  players: PublicPlayer[];
  me: { id: string; name: string; submitted: boolean } | null;
  isAdmin: boolean;
  questions: PublicQuestion[];
  myVotes: Record<string, string>; // questionId -> targetId
};
