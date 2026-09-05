"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";
import { setAdminToken, setPlayerSession } from "@/lib/client/storage";
import { Button, Notice, Shell, Wordmark } from "@/components/ui";

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
    <Shell>
      <div className="text-center mt-6 mb-10">
        <Wordmark />
        <p className="mt-6 text-muted text-lg">Vote on your friends. The host reveals the board.</p>
      </div>

      <form onSubmit={join} className="bg-ink-2/80 rounded-3xl p-6 flex flex-col gap-4 border border-white/10">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold uppercase tracking-widest text-muted">Room code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))}
            placeholder="ABCD"
            autoCapitalize="characters"
            autoComplete="off"
            inputMode="text"
            className="display bg-ink text-paper text-4xl tracking-[0.4em] text-center rounded-2xl px-4 py-3 border border-white/10 placeholder:text-ink-3"
            required
            minLength={4}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold uppercase tracking-widest text-muted">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What your friends call you"
            maxLength={20}
            autoComplete="nickname"
            className="bg-ink text-paper text-xl rounded-2xl px-4 py-3 border border-white/10 placeholder:text-muted/60"
            required
          />
        </label>
        {error && <Notice>{error}</Notice>}
        <Button type="submit" big disabled={busy !== null || code.length < 4 || !name.trim()}>
          {busy === "join" ? "Joining…" : "Join game"}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-muted mb-3">Hosting tonight?</p>
        <Button tone="ghost" onClick={host} disabled={busy !== null}>
          {busy === "host" ? "Setting up…" : "Start a new game"}
        </Button>
      </div>
    </Shell>
  );
}
