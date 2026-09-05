import type { GameRow, PlayerRow, QuestionRow, VoteRow } from "../types";

type Table<Row, Insert> = { Row: Row; Insert: Insert; Update: Partial<Insert>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      games: Table<GameRow, { code: string; admin_token: string; status?: GameRow["status"] }>;
      players: Table<PlayerRow, { game_id: string; name: string; token: string; submitted_at?: string | null }>;
      questions: Table<QuestionRow, { game_id: string; position: number; text: string }>;
      votes: Table<
        VoteRow & { updated_at: string },
        { game_id: string; question_id: string; voter_id: string; target_id: string; updated_at?: string }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
