import { adminTokenFrom, getGameByCode, handle, json, playerTokenFrom } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { PlayerRow, QuestionRow, StateResponse, VoteRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await params;
    const game = await getGameByCode(code);
    const db = supabaseAdmin();
    const isAdmin = adminTokenFrom(req) === game.admin_token;
    const playerToken = playerTokenFrom(req);

    const { data: players, error: pErr } = await db
      .from("players")
      .select("id, name, token, submitted_at")
      .eq("game_id", game.id)
      .order("created_at");
    if (pErr) throw pErr;
    const rows = (players ?? []) as Pick<PlayerRow, "id" | "name" | "token" | "submitted_at">[];
    const me = playerToken ? rows.find((p) => p.token === playerToken) ?? null : null;

    let questions: StateResponse["questions"] = [];
    const myVotes: Record<string, string> = {};
    if (me || isAdmin) {
      const { data: qs, error: qErr } = await db
        .from("questions")
        .select("id, position, text")
        .eq("game_id", game.id)
        .order("position");
      if (qErr) throw qErr;
      questions = (qs ?? []) as QuestionRow[];
    }
    if (me) {
      const { data: votes, error: vErr } = await db
        .from("votes")
        .select("question_id, target_id")
        .eq("voter_id", me.id);
      if (vErr) throw vErr;
      for (const v of (votes ?? []) as Pick<VoteRow, "question_id" | "target_id">[]) {
        myVotes[v.question_id] = v.target_id;
      }
    }

    const res: StateResponse = {
      game: { code: game.code, status: game.status },
      players: rows.map((p) => ({ id: p.id, name: p.name, submitted: !!p.submitted_at })),
      me: me ? { id: me.id, name: me.name, submitted: !!me.submitted_at } : null,
      isAdmin,
      questions,
      myVotes,
    };
    return json(res);
  });
}
