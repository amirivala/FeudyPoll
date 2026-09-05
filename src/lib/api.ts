import "server-only";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "./supabase/server";
import type { GameRow, PlayerRow } from "./types";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function handle(fn: () => Promise<Response>): Promise<Response> {
  return fn().catch((err: unknown) => {
    if (err instanceof ApiError) return json({ error: err.message }, err.status);
    console.error(err);
    return json({ error: "Something went wrong" }, 500);
  });
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
}

export async function getGameByCode(code: string): Promise<GameRow> {
  const { data, error } = await supabaseAdmin()
    .from("games")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "Game not found");
  return data as GameRow;
}

export function adminTokenFrom(req: Request): string | null {
  return req.headers.get("x-admin-token") || new URL(req.url).searchParams.get("t");
}

export function playerTokenFrom(req: Request): string | null {
  return req.headers.get("x-player-token");
}

export function requireAdmin(req: Request, game: GameRow): void {
  const token = adminTokenFrom(req);
  if (!token || token !== game.admin_token) throw new ApiError(403, "Admin token required");
}

export async function requirePlayer(req: Request, game: GameRow): Promise<PlayerRow> {
  const token = playerTokenFrom(req);
  if (!token) throw new ApiError(401, "Player token required");
  const { data, error } = await supabaseAdmin()
    .from("players")
    .select("*")
    .eq("game_id", game.id)
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(401, "Player not found in this game");
  return data as PlayerRow;
}

export function normalizeName(raw: unknown): string {
  if (typeof raw !== "string") throw new ApiError(400, "Name is required");
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 20) throw new ApiError(400, "Name must be 1–20 characters");
  return name;
}
