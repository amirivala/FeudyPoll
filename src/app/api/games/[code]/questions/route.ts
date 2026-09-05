import { ApiError, getGameByCode, handle, json, readJson, requireAdmin } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { GameRow } from "@/lib/types";

export const dynamic = "force-dynamic";

function requireEditable(game: GameRow) {
  if (game.status !== "lobby") throw new ApiError(409, "Questions can only be changed before voting starts");
}

/** Add a question to the end of this game's list. */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await params;
    const game = await getGameByCode(code);
    requireAdmin(req, game);
    requireEditable(game);
    const body = await readJson<{ text?: unknown }>(req);
    const text = typeof body.text === "string" ? body.text.trim().replace(/\s+/g, " ") : "";
    if (text.length < 3 || text.length > 200) throw new ApiError(400, "Question must be 3–200 characters");

    const db = supabaseAdmin();
    const { data: last } = await db
      .from("questions")
      .select("position")
      .eq("game_id", game.id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const position = ((last as { position: number } | null)?.position ?? 0) + 1;
    const { data, error } = await db
      .from("questions")
      .insert({ game_id: game.id, position, text })
      .select("id, position, text")
      .single();
    if (error) throw error;
    return json(data, 201);
  });
}

/** Remove a question from this game. */
export async function DELETE(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await params;
    const game = await getGameByCode(code);
    requireAdmin(req, game);
    requireEditable(game);
    const { questionId } = await readJson<{ questionId?: string }>(req);
    if (!questionId) throw new ApiError(400, "questionId is required");
    const { error, count } = await supabaseAdmin()
      .from("questions")
      .delete({ count: "exact" })
      .eq("id", questionId)
      .eq("game_id", game.id);
    if (error) throw error;
    if (!count) throw new ApiError(404, "Question not found");
    return json({ ok: true });
  });
}
