"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";
import { setAdminToken, setPlayerSession } from "@/lib/client/storage";
import { Button, Label, Notice } from "@/components/ui";
import { Logo } from "@/components/Logo";

const STEPS = [
  "Everyone joins with the room code and their name.",
  "Each person answers every question in secret, picking one of the others.",
  "The host reveals the answers on the board, one at a time.",
];

export default function Landing() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<"join" | "host" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy("join");
    setError(null);
    try {
      const res = await api.join(code.trim().toUpperCase(), name);
      setPlayerSession(res.code, { token: res.playerToken, name: res.name, playerId: res.playerId });
      router.push(`/play/${res.code}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  }

  async function host() {
    setBusy("host");
    setError(null);
    try {
      const res = await api.createGame();
      setAdminToken(res.code, res.adminToken);
      router.push(`/host/${res.code}#t=${res.adminToken}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  }

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-5 sm:px-8 py-6 sm:py-10 flex flex-col">
      <header className="flex items-center justify-between gap-4">
        <Logo size={22} />
        <Label className="hidden sm:block">One room code · no accounts</Label>
      </header>

      <div className="flex-1 grid gap-10 lg:gap-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-start mt-12 sm:mt-20 lg:mt-28">
        <div>
          <h1 className="serif text-[clamp(40px,7vw,88px)] m-0 text-balance">
            Everyone votes <em>on everyone.</em>
          </h1>
          <p className="mt-6 text-[17px] leading-[1.6] text-dim max-w-[36rem]">
            A stack of questions about the people in the room, and the host can add or cut some.
            Answers stay secret until the host reads them off the board, Family Feud style.
          </p>

          <ol className="mt-10 m-0 p-0 list-none border-t border-line max-w-[36rem]">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-4 py-3 border-b border-line">
                <span className="mono text-[12px] text-faint pt-1.5 w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span className="serif text-[clamp(20px,2.2vw,26px)]">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <form onSubmit={join} className="ballot p-6 sm:p-8 flex flex-col gap-6 lg:mt-4">
          <div className="flex items-baseline justify-between">
            <Label>Ballot</Label>
            <Label>Fill in both lines</Label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="label">Room code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))}
              placeholder="ABCD"
              autoCapitalize="characters"
              autoComplete="off"
              className="field mono text-[28px] tracking-[0.3em]"
              required
              minLength={4}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="label">Your name, as your friends say it</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sam"
              maxLength={20}
              autoComplete="nickname"
              className="field text-[20px]"
              required
            />
          </label>

          {error && <Notice>{error}</Notice>}

          <Button type="submit" lg disabled={busy !== null || code.length < 4 || !name.trim()}>
            {busy === "join" ? "Joining…" : "Join the room"}
          </Button>

          <p className="m-0 text-[14px] text-dim">
            Hosting?{" "}
            <button type="button" onClick={host} disabled={busy !== null} className="underline underline-offset-[3px] decoration-faint hover:decoration-text disabled:opacity-40">
              {busy === "host" ? "Opening a room…" : "Open a new room"}
            </button>
            . You&apos;ll get the code to read out.
          </p>
        </form>
      </div>

      <footer className="mt-16 pt-4 border-t border-line flex flex-wrap justify-between gap-2">
        <Label>Votes are anonymous. Only the host sees the tallies.</Label>
        <Label>Yes, you can vote for yourself.</Label>
      </footer>
    </main>
  );
}
