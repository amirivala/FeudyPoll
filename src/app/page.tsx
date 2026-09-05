"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";
import { setAdminToken, setPlayerSession } from "@/lib/client/storage";
import { Arrow, Button, Notice, Ornament, Wordmark } from "@/components/ui";

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
    <section className="w-full min-h-screen flex flex-col">
      <nav className="flex flex-wrap items-center justify-between gap-4 px-[clamp(20px,5.5vw,80px)] py-[clamp(16px,3vw,32px)]">
        <Wordmark />
        <Button tone="glass" onClick={host} disabled={busy !== null}>
          {busy === "host" ? "Setting up…" : "Host a game"}
        </Button>
      </nav>

      <div className="my-auto flex flex-col items-center text-center px-[clamp(20px,8vw,120px)] py-[clamp(40px,8vh,96px)]">
        <div className="mb-[clamp(20px,3vh,32px)]"><Ornament /></div>
        <h1 className="display text-[clamp(30px,5.2vw,44px)] text-text m-0 mb-5 sm:whitespace-nowrap">
          Vote on your friends. <span className="text-blue">Reveal the board.</span>
        </h1>
        <p className="text-[15px] leading-[1.7] text-dim m-0 mb-9 max-w-[34rem]">
          Thirty-five questions about the people in the room. Everyone votes in secret,
          <br className="hidden sm:block" /> and the host reveals the answers like a game show.
        </p>

        <form onSubmit={join} className="w-full max-w-[26rem] flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))}
              placeholder="CODE"
              aria-label="Room code"
              autoCapitalize="characters"
              autoComplete="off"
              className="field display text-center text-[20px] tracking-[0.35em] px-5 py-[13px] sm:w-[9.5rem]"
              required
              minLength={4}
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              aria-label="Your name"
              maxLength={20}
              autoComplete="nickname"
              className="field flex-1 text-[15px] px-6 py-[13px]"
              required
            />
          </div>
          {error && <Notice>{error}</Notice>}
          <Button type="submit" big className="self-center mt-1" disabled={busy !== null || code.length < 4 || !name.trim()}>
            {busy === "join" ? "Joining…" : "Join the game"} <Arrow />
          </Button>
        </form>
      </div>
    </section>
  );
}
