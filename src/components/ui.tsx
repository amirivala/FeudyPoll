"use client";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "glass" | "green"; big?: boolean };

export function Button({ tone = "primary", big, className = "", children, ...rest }: ButtonProps) {
  const tones = {
    primary: "bg-blue text-bg font-medium hover:-translate-y-px hover:brightness-110",
    glass: "glass text-text hover:bg-white/12 hover:border-white/30",
    green: "bg-green text-bg font-medium hover:-translate-y-px hover:brightness-110",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2.5 rounded-full tracking-[0.01em] transition disabled:opacity-40 disabled:pointer-events-none ${
        big ? "px-[34px] py-[15px] text-[15px]" : "px-[26px] py-[10px] text-[13px]"
      } ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12h15" />
      <path d="M13.5 5.5 20 12l-6.5 6.5" />
    </svg>
  );
}

export function Wordmark({ small }: { small?: boolean }) {
  return (
    <Link href="/" className={`display text-text hover:text-text select-none ${small ? "text-lg" : "text-xl"}`}>
      Feudy<span className="text-blue">Poll</span>
    </Link>
  );
}

export function Ornament() {
  return <div className="ornament" aria-hidden>✦</div>;
}

export function CodeBadge({ code, huge }: { code: string; huge?: boolean }) {
  return (
    <div className={`display inline-flex gap-2 ${huge ? "text-[clamp(44px,9vw,84px)]" : "text-2xl"}`} aria-label={`Room code ${code}`}>
      {code.split("").map((ch, i) => (
        <span key={i} className={`bg-purple text-text rounded-2xl ${huge ? "px-[0.35em] py-[0.12em]" : "px-3 py-1"}`}>
          {ch}
        </span>
      ))}
    </div>
  );
}

export function Notice({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "info" }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${tone === "error" ? "bg-red/15 text-red border border-red/30" : "glass text-dim"}`}>
      {children}
    </p>
  );
}

export function Roster({ players, meId, showSubmitted }: { players: { id: string; name: string; submitted: boolean }[]; meId?: string; showSubmitted?: boolean }) {
  if (players.length === 0) return <p className="text-dim text-[15px]">Nobody here yet. Share the code.</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {players.map((p) => (
        <li
          key={p.id}
          className={`rounded-full px-4 py-2 text-[14px] font-medium border ${
            p.id === meId ? "border-blue text-blue" : "border-white/14 text-text"
          } ${showSubmitted && p.submitted ? "bg-green/15 border-green/50 text-green" : "bg-white/6"}`}
        >
          {p.name}
          {showSubmitted && p.submitted ? " ✓" : ""}
          {p.id === meId ? " (you)" : ""}
        </li>
      ))}
    </ul>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-faint">{children}</p>;
}

export function Shell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <main className={`flex-1 w-full mx-auto px-[clamp(16px,5vw,40px)] py-[clamp(20px,4vh,40px)] ${wide ? "max-w-6xl" : "max-w-md"}`}>{children}</main>
  );
}
