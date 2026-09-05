"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type ResultsResponse } from "@/lib/client/api";
import { colorMap } from "@/lib/client/colors";
import { setAdminToken, useHashToken, useStoredAdminToken } from "@/lib/client/storage";
import { useGameState } from "@/lib/client/useGameState";
import { Button, Label, Notice, Roster, Shell, Wordmark } from "@/components/ui";
import { FeudBoard } from "@/components/FeudBoard";

export default function HostClient({ code }: { code: string }) {
  const fromUrl = useHashToken();
  const stored = useStoredAdminToken(code);
  // Prefer the link's token; fall back to what this device saved. The link token is only saved once the server accepts it.
  const token = fromUrl === undefined || stored === undefined ? undefined : fromUrl ?? stored;

  if (token === undefined) return null;
  if (!token) {
    return (
      <Shell>
        <Notice>This device doesn&apos;t have the host link for room {code}. Open the link you got when you created the room.</Notice>
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
  const colors = useMemo(() => colorMap(state?.players ?? []), [state?.players]);

  const verified = state?.isAdmin === true;
  useEffect(() => {
    if (verified) setAdminToken(code, adminToken);
  }, [verified, code, adminToken]);

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
  if (!state) return <Shell><p className="text-dim">Loading…</p></Shell>;
  if (!state.isAdmin) {
    return (
      <Shell>
        <Wordmark />
        <div className="mt-10"><Notice>This host link doesn&apos;t match room {code}. Open the link you got when you created the room.</Notice></div>
      </Shell>
    );
  }

  if (hostMode && results) {
    return <FeudBoard tallies={results.tallies} playerCount={results.playerCount} colors={colors} onExit={() => setHostMode(false)} />;
  }

  const joinHost = typeof window !== "undefined" ? window.location.host : "";
  const submitted = state.players.filter((p) => p.submitted).length;
  const lobby = state.game.status === "lobby";

  return (
    <Shell wide>
      <header className="flex items-baseline justify-between gap-4">
        <Wordmark />
        <Label>Host · {state.game.status}</Label>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] mt-10 sm:mt-14">
        <section className="flex flex-col gap-8">
          <div>
            <Label>Tell everyone: go to {joinHost} and type</Label>
            <p className="mono text-[clamp(64px,14vw,128px)] leading-none tracking-[0.12em] m-0 mt-2">{code}</p>
          </div>

          <div>
            <div className="flex items-baseline justify-between border-b border-line pb-2">
              <Label>{lobby ? "In the room" : "Ballots in"}</Label>
              <Label>{lobby ? state.players.length : `${submitted} / ${state.players.length}`}</Label>
            </div>
            <Roster players={state.players} colors={colors} showSubmitted={!lobby} />
          </div>

          {actionError && <Notice>{actionError}</Notice>}

          <div className="flex flex-wrap gap-2">
            {lobby && (
              <Button lg onClick={() => setStatus("start")} disabled={busy || state.players.length < 2}>
                {state.players.length < 2 ? "Need two people to start" : "Lock the room and start voting"}
              </Button>
            )}
            {state.game.status === "voting" && (
              <>
                <Button lg onClick={() => setHostMode(true)} disabled={!results}>Open the board</Button>
                <Button line onClick={() => setStatus("reopen")} disabled={busy}>Let more people in</Button>
                <Button line onClick={() => setStatus("close")} disabled={busy}>End game</Button>
              </>
            )}
            {state.game.status === "closed" && (
              <Button lg onClick={() => setHostMode(true)} disabled={!results}>Open the board</Button>
            )}
          </div>
          {lobby && <p className="m-0 text-[14px] text-dim">Starting locks the player list, since players are the answer choices. You can reopen it later.</p>}
        </section>

        {lobby ? (
          <QuestionEditor code={code} adminToken={adminToken} questions={state.questions} onChanged={refresh} />
        ) : (
        <section>
          <div className="flex items-baseline justify-between border-b border-line pb-2">
            <Label>Tallies, host&apos;s eyes only</Label>
            {results && <Label>leader · votes</Label>}
          </div>
          {results && !lobby && (
            <ol className="m-0 p-0 list-none flex flex-col divide-y divide-line">
              {results.tallies.map((t, i) => {
                const lead = t.rows[0];
                return (
                  <li key={t.question.id} className="py-3 grid grid-cols-[2rem_1fr_auto] gap-3 items-baseline">
                    <span className="mono text-[12px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-[15px] leading-snug">{t.question.text}</span>
                    <span className="mono text-[13px] text-right whitespace-nowrap flex items-center gap-2 justify-end">
                      {lead ? (
                        <>
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: colors[lead.playerId] }} aria-hidden />
                          {lead.name} · {lead.count}
                        </>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
        )}
      </div>
    </Shell>
  );
}

/** Lobby-only editor. The 35 defaults are a template: cut any, add your own. Locks when voting starts. */
function QuestionEditor({ code, adminToken, questions, onChanged }: { code: string; adminToken: string; questions: { id: string; text: string }[]; onChanged: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null); // question id being removed, or "add"
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 3) return;
    setBusy("add");
    setError(null);
    try {
      await api.addQuestion(code, adminToken, text);
      setText("");
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    setBusy(id);
    setError(null);
    try {
      await api.removeQuestion(code, adminToken, id);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <div className="flex items-baseline justify-between border-b border-line pb-2">
        <Label>Questions · edit until you start</Label>
        <Label>{questions.length}</Label>
      </div>

      <form onSubmit={add} className="flex gap-2 items-end mt-4">
        <label className="flex-1 flex flex-col gap-1">
          <span className="label">Add one (who is most likely to…)</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Who would text their ex tonight?"
            maxLength={200}
            className="field text-[16px]"
          />
        </label>
        <Button type="submit" disabled={busy !== null || text.trim().length < 3}>
          {busy === "add" ? "Adding…" : "Add"}
        </Button>
      </form>
      {error && <div className="mt-3"><Notice>{error}</Notice></div>}

      <ol className="m-0 mt-4 p-0 list-none flex flex-col divide-y divide-line">
        {questions.map((q, i) => (
          <li key={q.id} className="py-2.5 grid grid-cols-[2rem_1fr_auto] gap-3 items-center">
            <span className="mono text-[12px] text-faint">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-[15px] leading-snug">{q.text}</span>
            <button
              onClick={() => remove(q.id)}
              disabled={busy !== null}
              aria-label={`Remove question ${i + 1}`}
              className="mono text-[12px] text-faint hover:text-red disabled:opacity-40 px-2 py-1"
            >
              remove
            </button>
          </li>
        ))}
        {questions.length === 0 && <li className="py-4 text-dim text-[15px]">No questions left. Add at least one to start.</li>}
      </ol>
    </section>
  );
}
