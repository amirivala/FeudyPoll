"use client";
import { useEffect, useState } from "react";
import type { QuestionTally } from "@/lib/tally";
import { Button } from "./ui";

/**
 * Host mode. One question at a time; each answer sits behind a numbered panel
 * that flips open on click (or Space / →), highest vote count first.
 */
export function FeudBoard({ tallies, playerCount, onExit }: { tallies: QuestionTally[]; playerCount: number; onExit: () => void }) {
  const [qi, setQi] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const t = tallies[qi];
  const rows = t?.rows ?? [];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        advance();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      } else if (e.key === "Escape") onExit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi, revealed, rows.length]);

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

  if (!t) return null;
  const top = rows[0]?.count ?? 0;

  return (
    <main className="flex-1 flex flex-col px-6 py-6 max-w-5xl w-full mx-auto">
      <header className="flex items-center justify-between text-muted text-sm font-bold uppercase tracking-widest">
        <span>Question {t.question.position} of {tallies.length}</span>
        <span>{t.totalVotes} of {playerCount} voted</span>
      </header>

      <h1 className="display text-4xl sm:text-6xl leading-[1.05] text-center my-8 sm:my-12 text-paper text-balance">{t.question.text}</h1>

      <ol className="grid gap-3 sm:grid-cols-2 max-w-4xl w-full mx-auto">
        {rows.map((r, i) => (
          <li key={r.playerId} className={`panel h-20 ${i < revealed ? "open" : ""}`}>
            <button onClick={() => setRevealed(i < revealed ? i : i + 1)} className="panel-inner block w-full h-full text-left" aria-label={i < revealed ? `${r.name}, ${r.count} votes` : `Reveal answer ${i + 1}`}>
              <span className="panel-face w-full h-full rounded-2xl bg-ink-3 border-2 border-ink-3 justify-center">
                <span className="display text-4xl text-paper/70">{i + 1}</span>
              </span>
              <span
                className={`panel-face panel-back w-full h-full rounded-2xl px-5 justify-between border-2 ${
                  r.count === top ? "bg-marquee text-ink border-marquee-deep" : "bg-paper text-ink border-paper"
                }`}
              >
                <span className="display text-3xl truncate">{r.name}</span>
                <span className="display text-4xl tabular-nums pl-4">{r.count}</span>
              </span>
            </button>
          </li>
        ))}
        {rows.length === 0 && <li className="text-muted text-center sm:col-span-2 py-10">No votes on this one yet.</li>}
      </ol>

      <footer className="mt-auto pt-8 flex items-center justify-between gap-3">
        <Button tone="ghost" onClick={onExit}>Exit board</Button>
        <div className="flex gap-3">
          <Button tone="ghost" onClick={back} disabled={qi === 0 && revealed === 0}>← Back</Button>
          <Button big onClick={advance} disabled={qi === tallies.length - 1 && revealed >= rows.length}>
            {revealed < rows.length ? "Reveal" : qi < tallies.length - 1 ? "Next question →" : "That's the game"}
          </Button>
        </div>
      </footer>
    </main>
  );
}
