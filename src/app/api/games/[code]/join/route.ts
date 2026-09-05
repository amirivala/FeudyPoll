import { ApiError, getGameByCode, handle, json, normalizeName, readJson } from "@/lib/api";
import { generateToken } from "@/lib/codes";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await params;
    const game = await getGameByCode(code);
    if (game.status !== "lobby") throw new ApiError(409, "This game has already started");
    const body = await readJson<{ name?: unknown }>(req);
    const name = normalizeName(body.name);
    const token = generateToken();
    const { data, error } = await supabaseAdmin()
      .from("players")
      .insert({ game_id: game.id, name, token })
      .select("id, name")
      .single();
    if (error?.code === "23505") throw new ApiError(409, "That name is already taken in this game");
    if (error) throw error;
    return json({ playerId: data.id, name: data.name, playerToken: token, code: game.code }, 201);
  });
}
