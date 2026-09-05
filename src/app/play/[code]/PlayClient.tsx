"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/lib/client/api";
import { usePlayerSession, type PlayerSession } from "@/lib/client/storage";
import { useGameState } from "@/lib/client/useGameState";
import { Button, CodeBadge, Notice, Roster, Shell, Wordmark } from "@/components/ui";

export default function PlayClient({ code }: { code: string }) {
  const session = usePlayerSession(code);

  if (session === undefined) return null;
  if (!session) {
    return (
      <Shell>
        <div className="text-center mt-10 flex flex-col items-center gap-6">
          <Wordmark small />
          <CodeBadge code={code} />
          <p className="text-muted">You haven&apos;t joined this room on this device.</p>
          <Link href="/" className="underline text-marquee">Join with your name</Link>
        </div>
      </Shell>
    );
  }
  return <Game code={code} session={session} />;
}

function Game({ code, session }: { code: string; session: PlayerSession }) {
  const { state, error, refresh } = useGameState(code, { playerToken: session.token });

  if (error && !state) return <Shell><Notice>{error}</Notice></Shell>;
  if (!state) return <Shell><p className="text-muted text-center mt-20">Loading…</p></Shell>;

  if (state.me?.submitted) return <Submitted name={state.me.name} />;
  if (state.game.status === "lobby") return <Lobby code={code} state={state} />;
  if (state.game.status === "closed") {
    return (
      <Shell>
        <div className="text-center mt-20 flex flex-col items-center gap-4">
          <Wordmark small />
          <p className="display text-3xl">This game is over.</p>
          <p className="text-muted">Ask the host how you did.</p>
        </div>
      </Shell>
    );
  }
  return <Wizard code={code} session={session} state={state} onSubmitted={refresh} />;
}

type State = NonNullable<ReturnType<typeof useGameState>["state"]>;

function Lobby({ code, state }: { code: string; state: State }) {
  return (
    <Shell>
      <div className="flex flex-col items-center gap-6 mt-6 text-center">
        <Wordmark small />
        <CodeBadge code={code} />
        <p className="text-muted">Waiting for the host to start. Sit tight.</p>
        <div className="w-full bg-ink-2/80 rounded-3xl p-5 border border-white/10 text-left">
          <p className="text-sm font-bold uppercase tracking-widest text-muted mb-3">
            In the room · {state.players.length}
          </p>
          <Roster players={state.players} meId={state.me?.id} />
        </div>
      </div>
    </Shell>
  );
}

function Wizard({ code, session, state, onSubmitted }: { code: string; session: PlayerSession; state: State; onSubmitted: () => void }) {
  const questions = state.questions;
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
      if (index < questions.length - 1) setTimeout(() => setIndex((i) => Math.min(i + 1, questions.length - 1)), 180);
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
      <header className="flex items-center justify-between mb-4">
        <Wordmark small />
        <span className="text-muted text-sm font-bold">{answered}/{questions.length} answered</span>
      </header>

      {/* Progress strip: one segment per question, lit when answered */}
      <div className="grid gap-[3px] mb-6" style={{ gridTemplateColumns: `repeat(${questions.length}, minmax(0, 1fr))` }} aria-hidden>
        {questions.map((qq, i) => (
          <span
            key={qq.id}
            className={`h-1.5 rounded-sm ${votes[qq.id] ? "bg-marquee" : "bg-ink-3"} ${i === index ? "outline outline-1 outline-paper" : ""}`}
          />
        ))}
      </div>

      <section className="bg-ink-2/80 rounded-3xl p-6 border border-white/10">
        <p className="text-sm font-bold uppercase tracking-widest text-muted">Question {q.position} of {questions.length}</p>
        <h1 className="display text-3xl sm:text-4xl leading-tight mt-2 mb-6 text-paper">{q.text}</h1>

        <div className="grid grid-cols-2 gap-3">
          {others.map((p) => {
            const selected = votes[q.id] === p.id;
            return (
              <button
                key={p.id}
                onClick={() => pick(p.id)}
                aria-pressed={selected}
                className={`rounded-2xl px-3 py-4 text-lg font-extrabold break-words transition border-2 ${
                  selected
                    ? "bg-marquee text-ink border-marquee shadow-[0_4px_0_var(--marquee-deep)] scale-[1.02]"
                    : "bg-ink text-paper border-white/10 hover:border-marquee/60"
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
        {others.length === 0 && <Notice tone="info">No one else is in this game yet.</Notice>}
        {error && <div className="mt-4"><Notice>{error}</Notice></div>}
      </section>

      <nav className="flex items-center justify-between gap-3 mt-6">
        <Button tone="ghost" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          ← Back
        </Button>
        {isLast ? (
          <Button tone="hot" big onClick={submit} disabled={!allDone || saving}>
            {saving ? "Sending…" : allDone ? "Submit answers" : `${questions.length - answered} left`}
          </Button>
        ) : allDone ? (
          <Button tone="hot" onClick={() => setIndex(questions.length - 1)}>Review & submit →</Button>
        ) : (
          <Button tone="ghost" onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>
            {votes[q.id] ? "Next →" : "Skip →"}
          </Button>
        )}
      </nav>
    </Shell>
  );
}

function Submitted({ name }: { name: string }) {
  return (
    <Shell>
      <div className="text-center mt-20 flex flex-col items-center gap-5">
        <Wordmark small />
        <p className="display text-5xl text-marquee">You&apos;re in, {name}.</p>
        <p className="text-muted text-lg max-w-xs">Your answers are locked. Now look up from your phone and watch the host&apos;s board.</p>
      </div>
    </Shell>
  );
}
