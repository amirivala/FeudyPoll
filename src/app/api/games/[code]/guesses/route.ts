import { ApiError, getGameByCode, handle, json, readJson, requireAdmin } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Host records who guessed what for a question. guessedId null = passed. */
export async function PUT(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await params;
    const game = await getGameByCode(code);
    requireAdmin(req, game);
    if (game.status === "lobby") throw new ApiError(409, "Guessing starts after voting");
    const { questionId, guesserId, guessedId, guessedRank } = await readJson<{ questionId?: string; guesserId?: string; guessedId?: string | null; guessedRank?: number | null }>(req);
    if (!questionId || !guesserId) throw new ApiError(400, "questionId and guesserId are required");
    const rank = guessedRank == null ? null : Number(guessedRank);
    if (rank !== null && (!Number.isInteger(rank) || rank < 1 || rank > 50)) throw new ApiError(400, "guessedRank must be a whole number from 1");

    const db = supabaseAdmin();
    const ids = [guesserId, ...(guessedId ? [guessedId] : [])];
    const [{ data: q }, { data: ps }] = await Promise.all([
      db.from("questions").select("id").eq("id", questionId).eq("game_id", game.id).maybeSingle(),
      db.from("players").select("id").eq("game_id", game.id).in("id", ids),
    ]);
    if (!q) throw new ApiError(400, "Unknown question");
    if ((ps?.length ?? 0) !== new Set(ids).size) throw new ApiError(400, "Unknown player");

    const { error } = await db
      .from("guesses")
      .upsert({ game_id: game.id, question_id: questionId, guesser_id: guesserId, guessed_id: guessedId ?? null, guessed_rank: guessedId ? rank : null }, { onConflict: "question_id,guesser_id" });
    if (error) throw error;
    return json({ ok: true });
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await params;
    const game = await getGameByCode(code);
    requireAdmin(req, game);
    const { questionId, guesserId } = await readJson<{ questionId?: string; guesserId?: string }>(req);
    if (!questionId || !guesserId) throw new ApiError(400, "questionId and guesserId are required");
    const { error } = await supabaseAdmin().from("guesses").delete().eq("game_id", game.id).eq("question_id", questionId).eq("guesser_id", guesserId);
    if (error) throw error;
    return json({ ok: true });
  });
}
