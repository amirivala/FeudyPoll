"use client";

export type PlayerSession = { token: string; name: string; playerId: string };

const key = (kind: "player" | "admin", code: string) => `fp:${kind}:${code.toUpperCase()}`;

function read<T>(k: string): T | null {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

export const getPlayerSession = (code: string) => read<PlayerSession>(key("player", code));
export const setPlayerSession = (code: string, s: PlayerSession) => write(key("player", code), s);
export const getAdminToken = (code: string) => read<string>(key("admin", code));
export const setAdminToken = (code: string, t: string) => write(key("admin", code), t);

import { useMemo, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** Reads a localStorage key on the client without a hydration mismatch. `undefined` = not mounted yet, `null` = absent. */
function useRawStored(k: string): string | null | undefined {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    () => undefined,
  );
}

export function usePlayerSession(code: string): PlayerSession | null | undefined {
  const raw = useRawStored(key("player", code));
  return useMemo(() => (raw === undefined ? undefined : raw ? (JSON.parse(raw) as PlayerSession) : null), [raw]);
}

export function useStoredAdminToken(code: string): string | null | undefined {
  const raw = useRawStored(key("admin", code));
  return useMemo(() => (raw === undefined ? undefined : raw ? (JSON.parse(raw) as string) : null), [raw]);
}

const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

/** Reads `#t=<token>` from the URL fragment (never sent to the server). */
export function useHashToken(): string | null | undefined {
  return useSyncExternalStore(
    subscribeHash,
    () => new URLSearchParams(window.location.hash.slice(1)).get("t"),
    () => undefined,
  );
}
