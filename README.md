# FeudyPoll

A party game. One host creates a room and shares a 4-letter code. Friends join with just a name and privately answer 35 "Who is most likely to…" questions by picking one of the other players. Votes go only to the host, who reveals them Family-Feud style on a board.

## How to play
1. Host opens the site and taps **Start a new game**. Keep the host link (it holds your admin token).
2. Players open the site, enter the room code and their name.
3. Once everyone is in, host taps **Start voting**. The player list locks.
4. Players answer all 35 questions and tap **Submit answers**.
5. Host taps **Open the board** and reveals answers one at a time (Space / → to reveal, ← to go back, Esc to exit).

## Stack
Next.js (App Router) on Vercel, Supabase Postgres + Realtime. Schema in `supabase/migrations`. Questions are seeded per game from `src/lib/questions.ts`.

## Local dev
```bash
cp .env.example .env.local   # fill in Supabase URL, anon key, service role key
npm install
npm run dev
npm test
```
