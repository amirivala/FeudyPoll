import { ApiError, getGameByCode, handle, json, readJson, requireAdmin } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { GameStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const TRANSITIONS: Record<string, GameStatus> = { start: "voting", reopen: "lobby", close: "closed" };

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await params;
    const game = await getGameByCode(code);
    requireAdmin(req, game);
    const { action } = await readJson<{ action?: string }>(req);
    const status = action ? TRANSITIONS[action] : undefined;
    if (!status) throw new ApiError(400, "action must be start, reopen, or close");
    if (status === "voting") {
      const { count } = await supabaseAdmin()
        .from("players")
        .select("id", { count: "exact", head: true })
        .eq("game_id", game.id);
      if ((count ?? 0) < 2) throw new ApiError(400, "Need at least 2 players to start");
    }
    const { error } = await supabaseAdmin().from("games").update({ status }).eq("id", game.id);
    if (error) throw error;
    return json({ status });
  });
}
