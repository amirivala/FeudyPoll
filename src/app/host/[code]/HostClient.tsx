"use client";
import { useCallback, useEffect, useState } from "react";
import { api, type ResultsResponse } from "@/lib/client/api";
import { setAdminToken, useHashToken, useStoredAdminToken } from "@/lib/client/storage";
import { useGameState } from "@/lib/client/useGameState";
import { Arrow, Button, CodeBadge, Eyebrow, Notice, Roster, Shell, Wordmark } from "@/components/ui";
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
  if (!state) return <Shell><p className="text-dim text-center mt-20">Loading…</p></Shell>;

  if (hostMode && results) {
    return <FeudBoard tallies={results.tallies} playerCount={results.playerCount} onExit={() => setHostMode(false)} />;
  }

  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/` : "/";
  const submitted = state.players.filter((p) => p.submitted).length;

  return (
    <Shell wide>
      <header className="flex items-center justify-between mb-8">
        <Wordmark small />
        <Eyebrow>Host · {state.game.status}</Eyebrow>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className="glass rounded-3xl p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Eyebrow>Players go to {joinUrl.replace(/^https?:\/\//, "")} and enter</Eyebrow>
            <CodeBadge code={code} huge />
          </div>

          <div className="flex flex-col gap-3">
            <Eyebrow>
              {state.game.status === "lobby" ? `In the room · ${state.players.length}` : `Finished · ${submitted} of ${state.players.length}`}
            </Eyebrow>
            <Roster players={state.players} showSubmitted={state.game.status !== "lobby"} />
          </div>

          {actionError && <Notice>{actionError}</Notice>}

          <div className="flex flex-wrap gap-3 mt-auto">
            {state.game.status === "lobby" && (
              <Button big onClick={() => setStatus("start")} disabled={busy || state.players.length < 2}>
                {state.players.length < 2 ? "Need 2+ players" : "Start voting"} <Arrow />
              </Button>
            )}
            {state.game.status === "voting" && (
              <>
                <Button big onClick={() => setHostMode(true)} disabled={!results}>
                  Open the board <Arrow />
                </Button>
                <Button tone="glass" onClick={() => setStatus("reopen")} disabled={busy}>Reopen lobby</Button>
                <Button tone="glass" onClick={() => setStatus("close")} disabled={busy}>End game</Button>
              </>
            )}
            {state.game.status === "closed" && (
              <Button big onClick={() => setHostMode(true)} disabled={!results}>Open the board <Arrow /></Button>
            )}
          </div>
        </section>

        <section className="glass rounded-3xl p-6">
          <div className="mb-4"><Eyebrow>Live tallies</Eyebrow></div>
          {state.game.status === "lobby" && <p className="text-dim text-[15px]">Tallies appear once voting starts. Only you can see them.</p>}
          {results && state.game.status !== "lobby" && (
            <ol className="flex flex-col divide-y divide-white/10">
              {results.tallies.map((t) => (
                <li key={t.question.id} className="py-3 grid gap-1 sm:grid-cols-[2rem_1fr_auto] items-baseline">
                  <span className="text-faint tabular-nums">{t.question.position}</span>
                  <span className="text-[15px] font-medium">{t.question.text}</span>
                  <span className="text-[13px] text-dim sm:text-right">
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
