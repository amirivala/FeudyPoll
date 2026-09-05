"use client";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { line?: boolean; lg?: boolean };

export function Button({ line, lg, className = "", ...rest }: ButtonProps) {
  return <button className={`btn ${line ? "btn-line" : "btn-solid"} ${lg ? "btn-lg" : ""} ${className}`} {...rest} />;
}

export function Wordmark() {
  return (
    <Link href="/" className="serif text-[22px] no-underline hover:no-underline">
      Feudy<span className="italic">Poll</span>
    </Link>
  );
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`label m-0 ${className}`}>{children}</p>;
}

export function Notice({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "info" }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`m-0 border-l-2 pl-3 py-1 text-[15px] ${tone === "error" ? "border-red text-red" : "border-line text-dim"}`}>
      {children}
    </p>
  );
}

/** Player list. Each player carries the same color everywhere in the game. */
export function Roster({ players, colors, meId, showSubmitted }: { players: { id: string; name: string; submitted: boolean }[]; colors: Record<string, string>; meId?: string; showSubmitted?: boolean }) {
  if (players.length === 0) return <p className="m-0 text-dim text-[15px]">Nobody yet. Read the code out loud.</p>;
  return (
    <ul className="m-0 p-0 list-none flex flex-col divide-y divide-line">
      {players.map((p, i) => (
        <li key={p.id} className="flex items-center gap-3 py-2.5">
          <span className="mono text-[12px] text-faint w-5">{String(i + 1).padStart(2, "0")}</span>
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors[p.id] }} aria-hidden />
          <span className="text-[15px] flex-1">
            {p.name}
            {p.id === meId && <span className="text-faint"> (you)</span>}
          </span>
          {showSubmitted && <span className={`mono text-[12px] ${p.submitted ? "text-green" : "text-faint"}`}>{p.submitted ? "done" : "voting"}</span>}
        </li>
      ))}
    </ul>
  );
}

export function Shell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <main className={`flex-1 w-full mx-auto px-5 sm:px-8 py-6 sm:py-10 ${wide ? "max-w-6xl" : "max-w-md"}`}>{children}</main>;
}
