"use client";
import { useCallback, useEffect, useState } from "react";
import { api, type ResultsResponse } from "@/lib/client/api";
import { setAdminToken, useHashToken, useStoredAdminToken } from "@/lib/client/storage";
import { useGameState } from "@/lib/client/useGameState";
import { Button, CodeBadge, Notice, Roster, Shell, Wordmark } from "@/components/ui";
import { FeudBoard } from "@/components/FeudBoard";

export default function HostClient({ code }: { code: string }) {
  const fromUrl = useHashToken();
  const stored = useStoredAdminToken(code);
  useEffect(() => {
    if (fromUrl) setAdminToken(code, fromUrl);
  }, [code, fromUrl]);
  const token = fromUrl === undefined || stored === undefined ? undefined : fromUrl ?? stored;

  if (token === undefined) return null;
  if (!token) {
    return (
      <Shell>
        <Notice>This device doesn&apos;t have the host link for room {code}. Open the host link you got when you created the game.</Notice>
      </Shell>
    );
  }
  return <Dashboard code={code} adminToken={token} />;
}

function Dashboard({ code, adminToken }: { code: string; adminToken: string }) {
  const { state, error, refresh } = useGameState(code, { adminToken }, 3000);
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [hostMode, setHostMode] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadResults = useCallback(async () => {
    try {
      setResults(await api.results(code, adminToken));
    } catch (e) {
      setActionError((e as Error).message);
    }
  }, [code, adminToken]);

  const status = state?.game.status;
  useEffect(() => {
    if (status !== "voting" && status !== "closed") return;
    const kick = setTimeout(loadResults, 0);
    const t = setInterval(loadResults, 3000);
    return () => {
      clearTimeout(kick);
      clearInterval(t);
    };
  }, [status, loadResults]);

  async function setStatus(action: "start" | "reopen" | "close") {
    setBusy(true);
    setActionError(null);
    try {
      await api.setStatus(code, adminToken, action);
      await refresh();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !state) return <Shell><Notice>{error}</Notice></Shell>;
  if (!state) return <Shell><p className="text-muted text-center mt-20">Loading…</p></Shell>;

  if (hostMode && results) {
    return <FeudBoard tallies={results.tallies} playerCount={results.playerCount} onExit={() => setHostMode(false)} />;
  }

  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/` : "/";
  const submitted = state.players.filter((p) => p.submitted).length;

  return (
    <Shell wide>
      <header className="flex items-center justify-between mb-8">
        <Wordmark small />
        <span className="text-muted text-sm font-bold uppercase tracking-widest">Host · {state.game.status}</span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className="bg-ink-2/80 rounded-3xl p-6 border border-white/10 flex flex-col gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-muted mb-3">Players go to {joinUrl.replace(/^https?:\/\//, "")} and enter</p>
            <CodeBadge code={code} huge />
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-muted mb-3">
              {state.game.status === "lobby" ? `In the room · ${state.players.length}` : `Finished · ${submitted} of ${state.players.length}`}
            </p>
            <Roster players={state.players} showSubmitted={state.game.status !== "lobby"} />
          </div>

          {actionError && <Notice>{actionError}</Notice>}

          <div className="flex flex-wrap gap-3 mt-auto">
            {state.game.status === "lobby" && (
              <Button big onClick={() => setStatus("start")} disabled={busy || state.players.length < 2}>
                {state.players.length < 2 ? "Need 2+ players" : "Start voting"}
              </Button>
            )}
            {state.game.status === "voting" && (
              <>
                <Button tone="hot" big onClick={() => setHostMode(true)} disabled={!results}>
                  Open the board
                </Button>
                <Button tone="ghost" onClick={() => setStatus("reopen")} disabled={busy}>Reopen lobby</Button>
                <Button tone="ghost" onClick={() => setStatus("close")} disabled={busy}>End game</Button>
              </>
            )}
            {state.game.status === "closed" && (
              <Button tone="hot" big onClick={() => setHostMode(true)} disabled={!results}>Open the board</Button>
            )}
          </div>
        </section>

        <section className="bg-ink-2/80 rounded-3xl p-6 border border-white/10">
          <p className="text-sm font-bold uppercase tracking-widest text-muted mb-4">Live tallies</p>
          {state.game.status === "lobby" && <p className="text-muted">Tallies appear once voting starts. Only you can see them.</p>}
          {results && state.game.status !== "lobby" && (
            <ol className="flex flex-col divide-y divide-white/10">
              {results.tallies.map((t) => (
                <li key={t.question.id} className="py-3 grid gap-1 sm:grid-cols-[2rem_1fr_auto] items-baseline">
                  <span className="display text-muted">{t.question.position}</span>
                  <span className="font-semibold">{t.question.text}</span>
                  <span className="text-sm text-muted sm:text-right">
                    {t.rows.length === 0 ? "—" : t.rows.slice(0, 3).map((r) => `${r.name} ${r.count}`).join(" · ")}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </Shell>
  );
}
