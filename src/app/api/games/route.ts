import { handle, json } from "@/lib/api";
import { generateCode, generateToken } from "@/lib/codes";
import { DEFAULT_QUESTIONS } from "@/lib/questions";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return handle(async () => {
    const db = supabaseAdmin();
    const admin_token = generateToken();
    let game: { id: string; code: string } | null = null;
    for (let attempt = 0; attempt < 5 && !game; attempt++) {
      const { data, error } = await db
        .from("games")
        .insert({ code: generateCode(), admin_token })
        .select("id, code")
        .single();
      if (error && error.code === "23505") continue; // code collision, retry
      if (error) throw error;
      game = data as { id: string; code: string };
    }
    if (!game) throw new Error("Could not allocate a room code");

    const rows = DEFAULT_QUESTIONS.map((text, i) => ({ game_id: game!.id, position: i + 1, text }));
    const { error: qErr } = await db.from("questions").insert(rows);
    if (qErr) throw qErr;

    return json({ code: game.code, adminToken: admin_token }, 201);
  });
}
