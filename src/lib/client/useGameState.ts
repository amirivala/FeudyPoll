"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { supabaseBrowser } from "../supabase/client";
import type { StateResponse } from "../types";

/** Fetches /state, refetches on Realtime changes to the game or its roster, and polls as a fallback. */
export function useGameState(code: string, tokens: { playerToken?: string; adminToken?: string }, pollMs = 4000) {
  const [state, setState] = useState<StateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { playerToken, adminToken } = tokens;

  const refresh = useCallback(async () => {
    try {
      setState(await api.state(code, { playerToken, adminToken }));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [code, playerToken, adminToken]);

  useEffect(() => {
    const kick = setTimeout(refresh, 0);
    const timer = setInterval(refresh, pollMs);
    return () => {
      clearTimeout(kick);
      clearInterval(timer);
    };
  }, [refresh, pollMs]);

  const gameId = state?.game.id;
  useEffect(() => {
    if (!gameId) return;
    const channel = supabaseBrowser
      .channel(`game-${gameId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` }, refresh)
      .subscribe();
    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [gameId, refresh]);

  return { state, error, refresh };
}
