import { ApiError, getGameByCode, handle, json, requirePlayer } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await params;
    const game = await getGameByCode(code);
    const me = await requirePlayer(req, game);
    if (game.status !== "voting") throw new ApiError(409, "Voting is not open");
    const db = supabaseAdmin();
    const [{ count: qCount }, { count: vCount }] = await Promise.all([
      db.from("questions").select("id", { count: "exact", head: true }).eq("game_id", game.id),
      db.from("votes").select("id", { count: "exact", head: true }).eq("voter_id", me.id),
    ]);
    if ((vCount ?? 0) < (qCount ?? 0)) {
      throw new ApiError(400, `Answer all questions first (${vCount ?? 0}/${qCount ?? 0})`);
    }
    const { error } = await db
      .from("players")
      .update({ submitted_at: new Date().toISOString() })
      .eq("id", me.id);
    if (error) throw error;
    return json({ ok: true });
  });
}
