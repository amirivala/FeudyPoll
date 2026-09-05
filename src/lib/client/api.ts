"use client";
import type { StateResponse } from "../types";
import type { QuestionTally } from "../tally";

export type ResultsResponse = { status: string; playerCount: number; submitted: number; tallies: QuestionTally[] };

async function call<T>(url: string, init: RequestInit & { playerToken?: string; adminToken?: string } = {}): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (init.playerToken) headers["x-player-token"] = init.playerToken;
  if (init.adminToken) headers["x-admin-token"] = init.adminToken;
  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  createGame: () => call<{ code: string; adminToken: string }>("/api/games", { method: "POST" }),
  join: (code: string, name: string) =>
    call<{ playerId: string; name: string; playerToken: string; code: string }>(`/api/games/${code}/join`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  state: (code: string, tokens: { playerToken?: string; adminToken?: string }) =>
    call<StateResponse>(`/api/games/${code}/state`, tokens),
  setStatus: (code: string, adminToken: string, action: "start" | "reopen" | "close") =>
    call<{ status: string }>(`/api/games/${code}/start`, { method: "POST", body: JSON.stringify({ action }), adminToken }),
  vote: (code: string, playerToken: string, questionId: string, targetId: string) =>
    call<{ ok: true }>(`/api/games/${code}/votes`, {
      method: "PUT",
      body: JSON.stringify({ questionId, targetId }),
      playerToken,
    }),
  submit: (code: string, playerToken: string) => call<{ ok: true }>(`/api/games/${code}/submit`, { method: "POST", playerToken }),
  addQuestion: (code: string, adminToken: string, text: string) =>
    call<{ id: string; position: number; text: string }>(`/api/games/${code}/questions`, {
      method: "POST",
      body: JSON.stringify({ text }),
      adminToken,
    }),
  removeQuestion: (code: string, adminToken: string, questionId: string) =>
    call<{ ok: true }>(`/api/games/${code}/questions`, { method: "DELETE", body: JSON.stringify({ questionId }), adminToken }),
  results: (code: string, adminToken: string) => call<ResultsResponse>(`/api/games/${code}/results`, { adminToken }),
};
