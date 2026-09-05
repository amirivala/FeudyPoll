"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/lib/client/api";
import { colorMap } from "@/lib/client/colors";
import { usePlayerSession, type PlayerSession } from "@/lib/client/storage";
import { useGameState } from "@/lib/client/useGameState";
import { Button, Label, Notice, Roster, Shell, Wordmark } from "@/components/ui";

export default function PlayClient({ code }: { code: string }) {
  const session = usePlayerSession(code);

  if (session === undefined) return null;
  if (!session) {
    return (
      <Shell>
        <Wordmark />
        <p className="mono text-[64px] leading-none tracking-[0.12em] mt-10 mb-4">{code}</p>
        <p className="text-dim text-[15px] m-0">You haven&apos;t joined this room on this phone.</p>
        <p className="mt-2 m-0"><Link href="/">Fill in a ballot</Link></p>
      </Shell>
    );
  }
  return <Game code={code} session={session} />;
}

function Game({ code, session }: { code: string; session: PlayerSession }) {
  const { state, error, refresh } = useGameState(code, { playerToken: session.token });

  if (error && !state) return <Shell><Notice>{error}</Notice></Shell>;
  if (!state) return <Shell><p className="text-dim">Loading…</p></Shell>;

  if (state.me?.submitted) return <Submitted name={state.me.name} />;
  if (state.game.status === "lobby") return <Lobby code={code} state={state} />;
  if (state.game.status === "closed") {
    return (
      <Shell>
        <Wordmark />
        <h1 className="serif text-[40px] mt-16 m-0">That&apos;s the game.</h1>
        <p className="text-dim text-[15px] mt-3 m-0">Ask the host how you did.</p>
      </Shell>
    );
  }
  return <Wizard code={code} session={session} state={state} onSubmitted={refresh} />;
}

type State = NonNullable<ReturnType<typeof useGameState>["state"]>;

function Lobby({ code, state }: { code: string; state: State }) {
  const colors = colorMap(state.players);
  return (
    <Shell>
      <header className="flex items-baseline justify-between">
        <Wordmark />
        <Label>Room {code}</Label>
      </header>
      <h1 className="serif text-[clamp(34px,9vw,44px)] mt-12 m-0 text-balance">You&apos;re in. Waiting on the host.</h1>
      <p className="text-dim text-[15px] mt-3 m-0">Once everyone&apos;s here, the host starts the vote and the names below become your answer choices.</p>
      <div className="mt-10">
        <div className="flex items-baseline justify-between border-b border-line pb-2">
          <Label>In the room</Label>
          <Label>{state.players.length}</Label>
        </div>
        <Roster players={state.players} colors={colors} meId={state.me?.id} />
      </div>
    </Shell>
  );
}

function Wizard({ code, session, state, onSubmitted }: { code: string; session: PlayerSession; state: State; onSubmitted: () => void }) {
  const questions = state.questions;
  const colors = useMemo(() => colorMap(state.players), [state.players]);
  const others = useMemo(() => state.players.filter((p) => p.id !== state.me?.id), [state.players, state.me?.id]);
  const [votes, setVotes] = useState<Record<string, string>>(state.myVotes);
  const [index, setIndex] = useState(() => {
    const firstUnanswered = questions.findIndex((q) => !state.myVotes[q.id]);
    return firstUnanswered === -1 ? Math.max(0, questions.length - 1) : firstUnanswered;
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const q = questions[index];
  const answered = questions.filter((qq) => votes[qq.id]).length;
  const allDone = answered === questions.length;

  async function pick(targetId: string) {
    if (!q) return;
    const previous = votes[q.id];
    setVotes((v) => ({ ...v, [q.id]: targetId }));
    setError(null);
    try {
      await api.vote(code, session.token, q.id, targetId);
      if (index < questions.length - 1) setTimeout(() => setIndex((i) => Math.min(i + 1, questions.length - 1)), 220);
    } catch (e) {
      setVotes((v) => (previous ? { ...v, [q.id]: previous } : Object.fromEntries(Object.entries(v).filter(([k]) => k !== q.id))));
      setError((e as Error).message);
    }
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await api.submit(code, session.token);
      onSubmitted();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  if (!q) return null;
  const isLast = index === questions.length - 1;

  return (
    <Shell>
      <header className="flex items-baseline justify-between">
        <Wordmark />
        <Label>
          <span className="text-text">{String(q.position).padStart(2, "0")}</span> / {String(questions.length).padStart(2, "0")}
        </Label>
      </header>

      <h1 className="serif text-[clamp(30px,8vw,40px)] mt-10 mb-8 m-0 text-balance min-h-[2.2em]">{q.text}</h1>

      <ul className="m-0 p-0 list-none flex flex-col gap-2">
        {others.map((p) => {
          const selected = votes[q.id] === p.id;
          const color = colors[p.id];
          return (
            <li key={p.id}>
              <button
                onClick={() => pick(p.id)}
                aria-pressed={selected}
                className="w-full text-left flex items-center gap-4 px-4 py-3.5 border rounded-[3px] text-[17px] transition-colors"
                style={
                  selected
                    ? { background: color, borderColor: color, color: "var(--bg)" }
                    : { borderColor: "var(--line)" }
                }
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: selected ? "var(--bg)" : color }} aria-hidden />
                <span className="flex-1">{p.name}</span>
                {selected && <span className="mono text-[12px]">your pick</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {others.length === 0 && <Notice tone="info">No one else is in this room yet.</Notice>}
      {error && <div className="mt-4"><Notice>{error}</Notice></div>}

      <nav className="flex items-center justify-between gap-3 mt-8">
        <Button line onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>Back</Button>
        {isLast ? (
          <Button lg onClick={submit} disabled={!allDone || saving}>
            {saving ? "Sending…" : allDone ? "Hand in your ballot" : `${questions.length - answered} left to answer`}
          </Button>
        ) : allDone ? (
          <Button onClick={() => setIndex(questions.length - 1)}>Go to the last one</Button>
        ) : (
          <Button line onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>
            {votes[q.id] ? "Next" : "Skip for now"}
          </Button>
        )}
      </nav>

      {/* Punch card: 35 cells, 7 across. Filled = answered. Tap a cell to jump. */}
      <div className="mt-10 pt-4 border-t border-line">
        <div className="flex items-baseline justify-between mb-2">
          <Label>Your ballot</Label>
          <Label>{answered} / {questions.length}</Label>
        </div>
        <div className="punch" role="list">
          {questions.map((qq, i) => (
            <span
              key={qq.id}
              role="listitem"
              data-done={!!votes[qq.id]}
              data-current={i === index}
              onClick={() => setIndex(i)}
              className="cursor-pointer"
              aria-label={`Question ${i + 1}${votes[qq.id] ? ", answered" : ""}`}
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Submitted({ name }: { name: string }) {
  return (
    <Shell>
      <Wordmark />
      <h1 className="serif text-[clamp(36px,10vw,52px)] mt-16 m-0 text-balance">Ballot&apos;s in, {name}.</h1>
      <p className="text-dim text-[16px] leading-[1.6] mt-4 m-0 max-w-[26rem]">
        Your answers are locked. Put the phone down and watch the host&apos;s screen. If your name comes up a lot, that&apos;s between you and your friends.
      </p>
    </Shell>
  );
}
