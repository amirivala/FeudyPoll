# FeudyPoll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Vercel-hosted Next.js app where players join a room by code, vote on 35 "most likely to" questions, and the admin sees/reveals tallies.

**Architecture:** Next.js App Router with route handlers as the only writer to Supabase Postgres (service role). Browser clients hold a player/admin token and poll or subscribe via Supabase Realtime for roster and progress. Pure tally/validation logic lives in `src/lib` and is unit-tested with Vitest.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind, @supabase/supabase-js, Vitest, Playwright.

**Spec:** docs/superpowers/specs/2026-09-05-feudypoll-design.md

## Global Constraints
- No self-votes: DB check `voter_id <> target_id` and API rejects.
- Join only while `status='lobby'`; vote only while `status='voting'`.
- Names 1–20 chars, unique per game case-insensitively.
- Browser never uses the service-role key.

---

## File structure
```
supabase/migrations/0001_init.sql      schema + RLS
src/lib/questions.ts                    DEFAULT_QUESTIONS (35 strings)
src/lib/codes.ts                        generateCode(), generateToken()
src/lib/tally.ts                        tallyVotes(players, votes) -> per-question sorted counts
src/lib/supabase/server.ts              service-role client (server only)
src/lib/supabase/client.ts              anon client (browser, realtime only)
src/lib/api.ts                          json(), error(), getGameByCode(), requireAdmin(), requirePlayer()
src/app/api/games/route.ts              POST create
src/app/api/games/[code]/join/route.ts  POST join
src/app/api/games/[code]/start/route.ts POST start / reopen (body {action})
src/app/api/games/[code]/state/route.ts GET game status + roster + my votes (player or admin)
src/app/api/games/[code]/votes/route.ts PUT upsert vote
src/app/api/games/[code]/submit/route.ts POST submit
src/app/api/games/[code]/results/route.ts GET admin tallies
src/app/page.tsx                        landing (join / host)
src/app/play/[code]/page.tsx            player flow
src/app/host/[code]/page.tsx            admin dashboard + host mode
src/components/*                        Lobby, QuestionCard, ProgressBar, ResultsTable, HostMode
tests/tally.test.ts, tests/codes.test.ts
```

## Tasks
1. **Infra**: create Supabase project `feudypoll`, scaffold Next.js, env vars, migration, push schema. Commit.
2. **Pure logic (TDD)**: `codes.ts`, `tally.ts`, `questions.ts` with Vitest tests. Commit.
3. **API routes**: create/join/start/state/votes/submit/results with token auth helpers. Curl smoke test. Commit.
4. **Player UI**: landing, lobby, question wizard, submitted screen. Commit.
5. **Admin UI**: dashboard with roster, progress, results, host mode. Commit.
6. **Deploy**: push to GitHub, Vercel project + env, production deploy, end-to-end smoke test in browser. Commit.
