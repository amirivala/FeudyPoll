# FeudyPoll — Design Spec (2026-09-05)

## Purpose
A web party game. One admin creates a game and shares a room code. Players join with
just a name, then privately answer 35 "Who is most likely to…" questions by picking one
of the other players. Votes go only to the admin, who hosts a Family-Feud-style reveal.

## Decisions
- Self-votes allowed (changed 2026-09-05 at Amir's request; originally blocked).
- Player list locks when admin presses Start; admin can reopen the lobby.
- Players never see results in-app; the admin's screen is the reveal.
- Questions are stored per game so they can be edited without code changes.
- No accounts. Players are identified by a browser-held player token; admin by an admin token in the URL.

## Stack
- Next.js 15 (App Router, TypeScript), deployed on Vercel.
- Supabase Postgres (new project "feudypoll") + Supabase Realtime for live lobby/progress.
- All writes go through Next.js route handlers using the service-role key; the browser
  never talks to Supabase directly except Realtime subscriptions on public-safe tables.
- Tests: Vitest for tally/validation logic; Playwright smoke test for the join → vote → admin flow.

## Data model
```
games      id uuid pk, code text unique (4 letters), admin_token text unique,
           status text check in ('lobby','voting','closed'), created_at
players    id uuid pk, game_id fk, name text, token text unique, submitted_at timestamptz null,
           unique (game_id, lower(name))
questions  id uuid pk, game_id fk, position int, text text, unique (game_id, position)
votes      id uuid pk, game_id fk, question_id fk, voter_id fk players, target_id fk players,
           unique (question_id, voter_id), check (voter_id <> target_id)
```
Row Level Security on; anon key can only SELECT games(code,status) and players(name, submitted_at)
for realtime; all mutations via server routes with service role.

## Routes / screens
- `/` — landing: "Join a game" (code + name) and "Host a new game".
- `/api/games` POST → creates game + 35 questions, returns code + admin_token.
- `/api/games/:code/join` POST {name} → creates player, returns player token (also set as cookie).
- `/api/games/:code/start` POST (admin) → status=voting. `/reopen` → status=lobby.
- `/api/games/:code/votes` PUT {questionId, targetId} (player) → upsert vote.
- `/api/games/:code/submit` POST (player) → sets submitted_at.
- `/api/games/:code/results` GET (admin) → per-question tallies.
- `/play/:code` — player: lobby (live roster) → question wizard (one question per screen,
  tap a name, prev/next, progress bar) → "Submitted, look at the host" screen.
- `/host/:code?t=<admin_token>` — admin: share code, live roster, Start/Reopen,
  progress (who finished), results table, and Host Mode (one question at a time,
  reveal answers top-down with counts).

## Validation & errors
- Name: 1–20 chars, trimmed, unique per game (case-insensitive).
- Voting only while status='voting'; joining only while status='lobby'.
- Target must be a player in the same game and not the voter.
- Friendly error toasts on the client; 4xx JSON `{error}` from the API.

## Out of scope (YAGNI)
Player-facing results, multiple question sets UI, auth, scoring/points, timers.
