import { ApiError, getGameByCode, handle, json, readJson, requirePlayer } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await params;
    const game = await getGameByCode(code);
    const me = await requirePlayer(req, game);
    if (game.status !== "voting") throw new ApiError(409, "Voting is not open");
    if (me.submitted_at) throw new ApiError(409, "You already submitted your answers");
    const { questionId, targetId } = await readJson<{ questionId?: string; targetId?: string }>(req);
    if (!questionId || !targetId) throw new ApiError(400, "questionId and targetId are required");
    if (targetId === me.id) throw new ApiError(400, "You can't vote for yourself");

    const db = supabaseAdmin();
    const [{ data: q }, { data: target }] = await Promise.all([
      db.from("questions").select("id").eq("id", questionId).eq("game_id", game.id).maybeSingle(),
      db.from("players").select("id").eq("id", targetId).eq("game_id", game.id).maybeSingle(),
    ]);
    if (!q) throw new ApiError(400, "Unknown question");
    if (!target) throw new ApiError(400, "Unknown player");

    const { error } = await db
      .from("votes")
      .upsert(
        { game_id: game.id, question_id: questionId, voter_id: me.id, target_id: targetId, updated_at: new Date().toISOString() },
        { onConflict: "question_id,voter_id" },
      );
    if (error) throw error;
    return json({ ok: true });
  });
}
