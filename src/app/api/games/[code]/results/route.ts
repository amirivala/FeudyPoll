import { getGameByCode, handle, json, requireAdmin } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/server";
import { tallyVotes, type Player, type Question, type Vote } from "@/lib/tally";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await params;
    const game = await getGameByCode(code);
    requireAdmin(req, game);
    const db = supabaseAdmin();
    const [{ data: questions, error: qErr }, { data: players, error: pErr }, { data: votes, error: vErr }, { data: guesses, error: gErr }] =
      await Promise.all([
        db.from("questions").select("id, position, text").eq("game_id", game.id),
        db.from("players").select("id, name, submitted_at").eq("game_id", game.id),
        db.from("votes").select("question_id, voter_id, target_id").eq("game_id", game.id),
        db.from("guesses").select("question_id, guesser_id, guessed_id, guessed_rank").eq("game_id", game.id),
      ]);
    if (qErr || pErr || vErr || gErr) throw qErr ?? pErr ?? vErr ?? gErr;
    const tallies = tallyVotes(questions as Question[], players as Player[], votes as Vote[]);
    const submitted = (players ?? []).filter((p) => (p as { submitted_at: string | null }).submitted_at).length;
    return json({ status: game.status, playerCount: players?.length ?? 0, submitted, tallies, guesses: guesses ?? [] });
  });
}
