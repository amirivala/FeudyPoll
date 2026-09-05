"use client";
import { useEffect, useMemo, useState } from "react";
import type { QuestionTally } from "@/lib/tally";
import { ordinal, pickGuessers, pointsFor, scoreGuesses, type Guess } from "@/lib/scoring";
import { api } from "@/lib/client/api";
import { Button, Label, Notice } from "./ui";

type Player = { id: string; name: string };

type Props = {
  code: string;
  adminToken: string;
  tallies: QuestionTally[];
  players: Player[];
  colors: Record<string, string>;
  guesses: Guess[];
  onGuessChanged: () => void;
  onExit: () => void;
};

/**
 * Host mode. Each question is a round:
 *   1. The app names this round's guessers (half the room, rotating).
 *   2. Host taps each guesser, then the name they said. Board stays dark.
 *   3. Reveal one bar at a time (Space / →) or all at once (A). Points land as bars open.
 * A guess is worth the votes the guessed player got on that question.
 */
export function FeudBoard({ code, adminToken, tallies, players, colors, guesses, onGuessChanged, onExit }: Props) {
  const [qi, setQi] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [countOverride, setCountOverride] = useState<Record<number, number>>({});
  const [swaps, setSwaps] = useState<Record<number, Record<string, string>>>({});
  const [picking, setPicking] = useState<{ guesserId: string; mode: "guess" | "swap"; guessedId?: string } | null>(null);
  const [standings, setStandings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = tallies[qi];
  const rows = t?.rows ?? [];
  const nameOf = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p.name])), [players]);
  const scores = useMemo(() => scoreGuesses(tallies, guesses), [tallies, guesses]);

  // This round's guessers: rotation, then any swaps the host made.
  const guessers = useMemo(() => {
    const base = pickGuessers(players.map((p) => p.id), qi, countOverride[qi]);
    const sw = swaps[qi] ?? {};
    return base.map((id) => sw[id] ?? id);
  }, [players, qi, countOverride, swaps]);

  const guessFor = (guesserId: string) => guesses.find((g) => g.question_id === t?.question.id && g.guesser_id === guesserId);
  const revealedIds = new Set(rows.slice(0, revealed).map((r) => r.playerId));
  const allOpen = revealed >= rows.length;

  /** Scoreboard shows points from finished questions plus whatever is open on the current one. */
  const liveTotals = useMemo(() => {
    const totals: Record<string, number> = Object.fromEntries(players.map((p) => [p.id, 0]));
    for (const g of guesses) {
      const idx = tallies.findIndex((x) => x.question.id === g.question_id);
      if (idx === -1 || idx > qi) continue;
      if (idx === qi && !(g.guessed_id && revealedIds.has(g.guessed_id)) && !allOpen) continue;
      totals[g.guesser_id] = (totals[g.guesser_id] ?? 0) + (scores.byQuestion[g.question_id]?.[g.guesser_id] ?? 0);
    }
    return totals;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guesses, tallies, qi, revealed, players, scores]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (picking || standings) return;
      if (e.key === " " || e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        advance();
      } else if (e.key === "a" || e.key === "A") {
        setRevealed(rows.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      } else if (e.key === "Escape") onExit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi, revealed, rows.length, picking, standings]);

  function advance() {
    if (revealed < rows.length) setRevealed((r) => r + 1);
    else if (qi < tallies.length - 1) {
      setQi((i) => i + 1);
      setRevealed(0);
    }
  }
  function back() {
    if (revealed > 0) setRevealed((r) => r - 1);
    else if (qi > 0) {
      setQi((i) => i - 1);
      setRevealed(0);
    }
  }

  async function record(guesserId: string, guessedId: string | null | "clear", rank: number | null = null) {
    if (!t) return;
    setPicking(null);
    setError(null);
    try {
      if (guessedId === "clear") await api.clearGuess(code, adminToken, t.question.id, guesserId);
      else await api.setGuess(code, adminToken, t.question.id, guesserId, guessedId, rank);
      onGuessChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  /** Step 1 of a guess: the name. Passing or clearing finishes immediately; a name moves on to the rank. */
  function pickedName(guesserId: string, v: string | null | "clear") {
    if (v === null || v === "clear") return record(guesserId, v);
    setPicking({ guesserId, mode: "guess", guessedId: v });
  }

  function swap(from: string, to: string) {
    setSwaps((s) => ({ ...s, [qi]: { ...(s[qi] ?? {}), [from]: to } }));
    setPicking(null);
  }

  if (!t) return null;
  const max = Math.max(1, t.totalVotes);
  const isEnd = qi === tallies.length - 1 && allOpen;

  if (standings) return <Standings players={players} colors={colors} totals={scores.totals} onBack={() => setStandings(false)} onExit={onExit} />;

  return (
    <main className="flex-1 flex flex-col px-5 sm:px-10 py-6 sm:py-8 max-w-7xl w-full mx-auto">
      <header className="flex items-baseline justify-between gap-4">
        <Label>
          <span className="text-text">{String(qi + 1).padStart(2, "0")}</span> / {String(tallies.length).padStart(2, "0")}
        </Label>
        <Label>{rows.length} on the board · {t.totalVotes} votes</Label>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] mt-8 sm:mt-12 flex-1">
        {/* Left: question + board */}
        <section>
          <h1 className="serif text-[clamp(32px,5vw,72px)] m-0 max-w-[22ch] text-balance">{t.question.text}</h1>

          <ol className="m-0 p-0 list-none mt-8 sm:mt-12 flex flex-col gap-3">
            {rows.map((r, i) => {
              const open = i < revealed;
              const pct = Math.round((r.count / max) * 100);
              return (
                <li key={r.playerId}>
                  <button
                    onClick={() => setRevealed(open ? i : i + 1)}
                    className="w-full text-left grid grid-cols-[2rem_1fr_3.5rem] items-center gap-3 h-14 sm:h-[4.5rem]"
                    aria-label={open ? `${r.name}, ${r.count} votes` : `Reveal answer ${i + 1}`}
                  >
                    <span className="mono text-[13px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                    <span className="relative h-full bg-white/6 rounded-[10px] overflow-hidden">
                      <span className="bar absolute inset-y-0 left-0" style={{ width: open ? `${Math.max(pct, 12)}%` : "0%", background: colors[r.playerId] ?? "var(--text)" }} />
                      <span className={`absolute inset-0 flex items-center px-4 serif text-[clamp(20px,2.6vw,32px)] transition-opacity duration-300 ${open ? "opacity-100 text-bg" : "opacity-0"}`}>{r.name}</span>
                      {!open && <span className="absolute inset-0 flex items-center px-4 text-faint text-[14px]">· · ·</span>}
                    </span>
                    <span className={`mono text-[clamp(18px,2.2vw,28px)] text-right transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}>{r.count}</span>
                  </button>
                </li>
              );
            })}
            {rows.length === 0 && <li className="text-dim py-6">No votes on this one.</li>}
          </ol>
        </section>

        {/* Right: this round's guessers + scoreboard */}
        <aside className="flex flex-col gap-8">
          <div>
            <div className="flex items-baseline justify-between border-b border-line pb-2">
              <Label>Guessers this round</Label>
              <span className="flex items-center gap-1">
                <button onClick={() => setCountOverride((c) => ({ ...c, [qi]: Math.max(1, guessers.length - 1) }))} className="label px-2 py-0.5 hover:text-text" aria-label="Fewer guessers">−</button>
                <Label>{guessers.length}</Label>
                <button onClick={() => setCountOverride((c) => ({ ...c, [qi]: Math.min(players.length, guessers.length + 1) }))} className="label px-2 py-0.5 hover:text-text" aria-label="More guessers">+</button>
              </span>
            </div>
            <ul className="m-0 p-0 list-none flex flex-col divide-y divide-line">
              {guessers.map((gid) => {
                const g = guessFor(gid);
                const result = g ? pointsFor(t, g.guessed_id, g.guessed_rank) : null;
                const earned = result?.points;
                const showPts = g !== undefined && (allOpen || (g.guessed_id ? revealedIds.has(g.guessed_id) : false));
                return (
                  <li key={gid} className="py-2.5 grid grid-cols-[auto_1fr_auto_auto] items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: colors[gid] }} aria-hidden />
                    <span className="text-[15px] truncate">{nameOf[gid]}</span>
                    <button
                      onClick={() => setPicking({ guesserId: gid, mode: "guess" })}
                      className={`mono text-[13px] px-3 py-1.5 rounded-[8px] ${g ? "bg-white/10 text-text" : "bg-white/6 text-faint"}`}
                    >
                      {g ? (g.guessed_id ? `${nameOf[g.guessed_id]}${g.guessed_rank ? ` · ${ordinal(g.guessed_rank)}` : ""}` : "passed") : "enter guess"}
                    </button>
                    <span className={`mono text-[13px] w-20 text-right ${showPts ? (earned ? "text-green" : "text-faint") : "text-faint/40"}`}>
                      {showPts ? `+${earned ?? 0}${result?.exact ? " exact" : ""}` : "·"}
                    </span>
                    <span className="col-span-4 -mt-1">
                      <button onClick={() => setPicking({ guesserId: gid, mode: "swap" })} className="label hover:text-text">swap out</button>
                    </span>
                  </li>
                );
              })}
            </ul>
            {error && <div className="mt-3"><Notice>{error}</Notice></div>}
          </div>

          <Scoreboard players={players} colors={colors} totals={liveTotals} />
        </aside>
      </div>

      {picking && picking.mode === "swap" && (
        <Picker
          title={`Swap ${nameOf[picking.guesserId]} for…`}
          options={players.filter((p) => !guessers.includes(p.id)).map((p) => ({ value: p.id, label: p.name, color: colors[p.id] }))}
          onPick={(v) => swap(picking.guesserId, v as string)}
          onClose={() => setPicking(null)}
        />
      )}
      {picking && picking.mode === "guess" && !picking.guessedId && (
        <Picker
          title={`${nameOf[picking.guesserId]} said…`}
          options={[
            ...players.map((p) => ({ value: p.id, label: p.name, color: colors[p.id] })),
            { value: null, label: "passed", quiet: true },
            ...(guessFor(picking.guesserId) ? [{ value: "clear" as const, label: "clear", quiet: true }] : []),
          ]}
          onPick={(v) => pickedName(picking.guesserId, v as string | null | "clear")}
          onClose={() => setPicking(null)}
        />
      )}
      {picking && picking.mode === "guess" && picking.guessedId && (
        <Picker
          title={`${nameOf[picking.guessedId]} would be…`}
          options={[
            ...Array.from({ length: Math.max(1, rows.length) }, (_, i) => ({ value: String(i + 1), label: ordinal(i + 1) })),
            { value: null, label: "no rank, just the name", quiet: true },
          ]}
          onPick={(v) => record(picking.guesserId, picking.guessedId!, v === null ? null : Number(v))}
          onClose={() => setPicking(null)}
        />
      )}

      <footer className="mt-10 pt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button line onClick={onExit}>Exit board</Button>
          <Button line onClick={() => setStandings(true)}>Standings</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button line onClick={back} disabled={qi === 0 && revealed === 0}>Back</Button>
          {!allOpen && <Button line onClick={() => setRevealed(rows.length)}>Reveal all</Button>}
          <Button lg onClick={isEnd ? () => setStandings(true) : advance}>
            {!allOpen ? "Reveal next" : qi < tallies.length - 1 ? "Next question" : "Final standings"}
          </Button>
        </div>
      </footer>
    </main>
  );
}

function Scoreboard({ players, colors, totals }: { players: Player[]; colors: Record<string, string>; totals: Record<string, number> }) {
  const sorted = [...players].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0) || a.name.localeCompare(b.name));
  const top = Math.max(1, ...sorted.map((p) => totals[p.id] ?? 0));
  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-line pb-2">
        <Label>Scoreboard</Label>
        <Label>points</Label>
      </div>
      <ol className="m-0 p-0 list-none flex flex-col gap-1.5 mt-3">
        {sorted.map((p) => {
          const pts = totals[p.id] ?? 0;
          return (
            <li key={p.id} className="grid grid-cols-[1fr_2.5rem] items-center gap-3 h-8">
              <span className="relative h-full rounded-[6px] bg-white/6 overflow-hidden">
                <span className="bar absolute inset-y-0 left-0 opacity-35" style={{ width: `${Math.max(4, (pts / top) * 100)}%`, background: colors[p.id] }} />
                <span className="absolute inset-0 flex items-center gap-2 px-3 text-[14px] font-medium text-text">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[p.id] }} aria-hidden />
                  {p.name}
                </span>
              </span>
              <span className="mono text-[15px] text-right">{pts}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Standings({ players, colors, totals, onBack, onExit }: { players: Player[]; colors: Record<string, string>; totals: Record<string, number>; onBack: () => void; onExit: () => void }) {
  const sorted = [...players].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0) || a.name.localeCompare(b.name));
  const top = Math.max(1, ...sorted.map((p) => totals[p.id] ?? 0));
  return (
    <main className="flex-1 flex flex-col px-5 sm:px-10 py-6 sm:py-8 max-w-5xl w-full mx-auto">
      <Label>Final standings</Label>
      <h1 className="serif text-[clamp(36px,6vw,80px)] m-0 mt-6">
        {sorted[0] ? <>{sorted[0].name} <em>knows this room.</em></> : "Nobody scored."}
      </h1>
      <ol className="m-0 p-0 list-none mt-10 flex flex-col gap-3 max-w-4xl">
        {sorted.map((p, i) => {
          const pts = totals[p.id] ?? 0;
          return (
            <li key={p.id} className="grid grid-cols-[2rem_1fr_3.5rem] items-center gap-3 h-14 sm:h-16">
              <span className="mono text-[13px] text-faint">{String(i + 1).padStart(2, "0")}</span>
              <span className="relative h-full bg-white/6 rounded-[10px] overflow-hidden">
                <span className="bar absolute inset-y-0 left-0 opacity-40" style={{ width: `${Math.max(3, (pts / top) * 100)}%`, background: colors[p.id] }} />
                <span className="absolute inset-0 flex items-center gap-3 px-4 serif text-[clamp(20px,2.4vw,30px)] text-text">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors[p.id] }} aria-hidden />
                  {p.name}
                </span>
              </span>
              <span className="mono text-[clamp(18px,2.2vw,28px)] text-right">{pts}</span>
            </li>
          );
        })}
      </ol>
      <footer className="mt-auto pt-10 flex justify-between gap-3">
        <Button line onClick={onExit}>Exit board</Button>
        <Button onClick={onBack}>Back to the board</Button>
      </footer>
    </main>
  );
}

type Option = { value: string | null | "clear"; label: string; color?: string; quiet?: boolean };

function Picker({ title, options, onPick, onClose }: { title: string; options: Option[]; onPick: (v: string | null | "clear") => void; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={onClose} role="dialog" aria-label={title}>
      <div className="w-full max-w-lg bg-[#242424] border border-line rounded-[14px] p-5" onClick={(e) => e.stopPropagation()}>
        <p className="serif text-[26px] m-0 mb-4">{title}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {options.map((o) =>
            o.quiet ? (
              <button key={o.label} onClick={() => onPick(o.value)} className="col-span-2 sm:col-span-3 px-4 py-3 rounded-[10px] bg-transparent border border-line hover:border-text text-left mono text-[13px] text-dim">
                {o.label}
              </button>
            ) : (
              <button key={o.label} onClick={() => onPick(o.value)} className="flex items-center gap-3 px-4 py-3 rounded-[10px] bg-white/6 hover:bg-white/12 text-left text-[15px]">
                {o.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: o.color }} aria-hidden />}
                <span className="truncate">{o.label}</span>
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
