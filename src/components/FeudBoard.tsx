"use client";
import { useEffect, useState } from "react";
import type { QuestionTally } from "@/lib/tally";
import { Arrow, Button, Eyebrow, Ornament } from "./ui";

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
    <main className="flex-1 flex flex-col px-[clamp(16px,5vw,40px)] py-6 max-w-5xl w-full mx-auto">
      <header className="flex items-center justify-between">
        <Eyebrow>Question {t.question.position} of {tallies.length}</Eyebrow>
        <Eyebrow>{t.totalVotes} of {playerCount} voted</Eyebrow>
      </header>

      <div className="relative flex flex-col items-center my-[clamp(24px,5vh,56px)] gap-[clamp(16px,3vh,28px)]">
        <Ornament />
        <h1 className="display text-[clamp(28px,5vw,52px)] text-center text-text text-balance m-0">{t.question.text}</h1>
      </div>

      <ol className="relative grid gap-3 sm:grid-cols-2 max-w-4xl w-full mx-auto">
        {rows.map((r, i) => (
          <li key={r.playerId} className={`panel h-20 ${i < revealed ? "open" : ""}`}>
            <button onClick={() => setRevealed(i < revealed ? i : i + 1)} className="panel-inner block w-full h-full text-left" aria-label={i < revealed ? `${r.name}, ${r.count} votes` : `Reveal answer ${i + 1}`}>
              <span className="panel-face w-full h-full rounded-2xl glass justify-center">
                <span className="display text-3xl text-purple">{i + 1}</span>
              </span>
              <span
                className={`panel-face panel-back w-full h-full rounded-2xl px-6 justify-between ${
                  r.count === top ? "bg-green text-bg" : "bg-text text-bg"
                }`}
              >
                <span className="display text-2xl sm:text-3xl truncate">{r.name}</span>
                <span className="display text-3xl sm:text-4xl tabular-nums pl-4">{r.count}</span>
              </span>
            </button>
          </li>
        ))}
        {rows.length === 0 && <li className="text-dim text-center sm:col-span-2 py-10">No votes on this one yet.</li>}
      </ol>

      <footer className="relative mt-auto pt-8 flex flex-wrap items-center justify-between gap-3">
        <Button tone="glass" onClick={onExit}>Exit board</Button>
        <div className="flex gap-3">
          <Button tone="glass" onClick={back} disabled={qi === 0 && revealed === 0}>Back</Button>
          <Button big onClick={advance} disabled={qi === tallies.length - 1 && revealed >= rows.length}>
            {revealed < rows.length ? "Reveal" : qi < tallies.length - 1 ? "Next question" : "That's the game"} <Arrow />
          </Button>
        </div>
      </footer>
    </main>
  );
}
