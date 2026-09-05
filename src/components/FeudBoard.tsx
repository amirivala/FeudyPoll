"use client";
import { useEffect, useState } from "react";
import type { QuestionTally } from "@/lib/tally";
import { Button, Label } from "./ui";

/**
 * Host mode. One question at a time. Each answer is a bar that stays blank until
 * revealed, then grows to its share of the vote in that player's color.
 * Space / → reveal, ← back, Esc exit.
 */
export function FeudBoard({ tallies, playerCount, colors, onExit }: { tallies: QuestionTally[]; playerCount: number; colors: Record<string, string>; onExit: () => void }) {
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
  const max = Math.max(1, t.totalVotes);
  const isEnd = qi === tallies.length - 1 && revealed >= rows.length;

  return (
    <main className="flex-1 flex flex-col px-5 sm:px-10 py-6 sm:py-8 max-w-6xl w-full mx-auto">
      <header className="flex items-baseline justify-between gap-4">
        <Label>
          <span className="text-text">{String(t.question.position).padStart(2, "0")}</span> / {String(tallies.length).padStart(2, "0")}
        </Label>
        <Label>{t.totalVotes} of {playerCount} voted</Label>
      </header>

      <h1 className="serif text-[clamp(34px,6vw,84px)] m-0 mt-8 sm:mt-14 max-w-[20ch] text-balance">{t.question.text}</h1>

      <ol className="m-0 p-0 list-none mt-10 sm:mt-14 flex flex-col gap-3 max-w-4xl">
        {rows.map((r, i) => {
          const open = i < revealed;
          const pct = Math.round((r.count / max) * 100);
          return (
            <li key={r.playerId}>
              <button
                onClick={() => setRevealed(open ? i : i + 1)}
                className="w-full text-left grid grid-cols-[2rem_1fr_3.5rem] items-center gap-3 h-16 sm:h-20"
                aria-label={open ? `${r.name}, ${r.count} votes` : `Reveal answer ${i + 1}`}
              >
                <span className="mono text-[13px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                <span className="relative h-full border border-line rounded-[3px] overflow-hidden">
                  <span
                    className="bar absolute inset-y-0 left-0"
                    style={{ width: open ? `${Math.max(pct, 12)}%` : "0%", background: colors[r.playerId] ?? "var(--text)" }}
                  />
                  <span className={`absolute inset-0 flex items-center px-4 serif text-[clamp(22px,3vw,36px)] transition-opacity duration-300 ${open ? "opacity-100 text-bg" : "opacity-0"}`}>
                    {r.name}
                  </span>
                  {!open && <span className="absolute inset-0 flex items-center px-4 text-faint text-[14px]">· · ·</span>}
                </span>
                <span className={`mono text-[clamp(20px,2.5vw,30px)] text-right transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}>{r.count}</span>
              </button>
            </li>
          );
        })}
        {rows.length === 0 && <li className="text-dim py-6">No votes on this one.</li>}
      </ol>

      <footer className="mt-auto pt-10 flex flex-wrap items-center justify-between gap-3">
        <Button line onClick={onExit}>Exit board</Button>
        <div className="flex gap-2">
          <Button line onClick={back} disabled={qi === 0 && revealed === 0}>Back</Button>
          <Button lg onClick={advance} disabled={isEnd}>
            {revealed < rows.length ? "Reveal next" : qi < tallies.length - 1 ? "Next question" : "That's the game"}
          </Button>
        </div>
      </footer>
    </main>
  );
}
