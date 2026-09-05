"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "marquee" | "ghost" | "hot"; big?: boolean };

export function Button({ tone = "marquee", big, className = "", ...rest }: ButtonProps) {
  const tones = {
    marquee: "bg-marquee text-ink hover:bg-marquee-deep shadow-[0_4px_0_var(--marquee-deep)] active:translate-y-[2px] active:shadow-none",
    ghost: "bg-ink-3/60 text-paper hover:bg-ink-3 border border-white/10",
    hot: "bg-hot text-ink hover:brightness-110 shadow-[0_4px_0_#c2306f] active:translate-y-[2px] active:shadow-none",
  };
  return (
    <button
      className={`display rounded-2xl font-bold tracking-wide transition disabled:opacity-40 disabled:pointer-events-none ${
        big ? "px-8 py-4 text-2xl" : "px-5 py-3 text-lg"
      } ${tones[tone]} ${className}`}
      {...rest}
    />
  );
}

export function Wordmark({ small }: { small?: boolean }) {
  return (
    <div className={`display leading-none select-none ${small ? "text-2xl" : "text-6xl sm:text-7xl bulbs inline-block px-4 py-2"}`}>
      <span className="text-marquee drop-shadow-[0_3px_0_var(--marquee-deep)]">Feudy</span>
      <span className="text-paper">Poll</span>
    </div>
  );
}

export function CodeBadge({ code, huge }: { code: string; huge?: boolean }) {
  return (
    <div className={`display inline-flex gap-1 ${huge ? "text-7xl sm:text-8xl" : "text-3xl"}`} aria-label={`Room code ${code}`}>
      {code.split("").map((ch, i) => (
        <span key={i} className={`bg-paper text-ink rounded-xl ${huge ? "px-5 py-2" : "px-3 py-1"}`}>
          {ch}
        </span>
      ))}
    </div>
  );
}

export function Notice({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "info" }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-base ${tone === "error" ? "bg-hot/15 text-hot" : "bg-ink-3/60 text-muted"}`}>
      {children}
    </p>
  );
}

export function Roster({ players, meId, showSubmitted }: { players: { id: string; name: string; submitted: boolean }[]; meId?: string; showSubmitted?: boolean }) {
  if (players.length === 0) return <p className="text-muted">Nobody here yet. Share the code.</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {players.map((p) => (
        <li
          key={p.id}
          className={`rounded-full px-4 py-2 text-base font-bold border ${
            p.id === meId ? "border-marquee text-marquee" : "border-white/15 text-paper"
          } ${showSubmitted && p.submitted ? "bg-ok/15 border-ok/50" : "bg-ink-2"}`}
        >
          {p.name}
          {showSubmitted && p.submitted ? " ✓" : ""}
          {p.id === meId ? " (you)" : ""}
        </li>
      ))}
    </ul>
  );
}

export function Shell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <main className={`flex-1 w-full mx-auto px-4 py-6 sm:py-10 ${wide ? "max-w-6xl" : "max-w-md"}`}>{children}</main>;
}
