# FeudyPoll

A party game. One host creates a room and shares a 4-letter code. Friends join with just a name and privately answer 35 "Who is most likely to…" questions by picking one of the other players. Votes go only to the host, who reveals them Family-Feud style on a board.

## How to play
1. Host opens the site and taps **Start a new game**. Keep the host link (it holds your admin token).
2. Players open the site, enter the room code and their name.
3. While the room is open, the host can remove any of the 35 template questions or add new ones.
4. Once everyone is in, host taps **Lock the room and start voting**. Players and questions lock.
5. Players answer every question and tap **Hand in your ballot**.
6. Host taps **Open the board** and reveals answers one at a time (Space / → to reveal, ← to go back, Esc to exit).

## Stack
Next.js (App Router) on Vercel, Supabase Postgres + Realtime. Schema in `supabase/migrations`. Each new game is seeded with the template in `src/lib/questions.ts`; the host edits the copy per game.

## Local dev
```bash
cp .env.example .env.local   # fill in Supabase URL, anon key, service role key
npm install
npm run dev
npm test
```
