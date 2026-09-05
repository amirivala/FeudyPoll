# FeudyPoll

A party game. One host creates a room and shares a 4-letter code. Friends join with just a name and privately answer 35 "Who is most likely to…" questions by picking one of the players, themselves included. Votes go only to the host, who reveals them Family-Feud style on a board.

## How to play
1. Host opens the site and taps **Start a new game**. Keep the host link (it holds your admin token).
2. Players open the site, enter the room code and their name.
3. While the room is open, the host can remove any of the 35 template questions or add new ones.
4. Once everyone is in, host taps **Lock the room and start voting**. Players and questions lock.
5. Players answer every question and tap **Hand in your ballot**.
6. Host taps **Open the board**. Each question is a round: the app names this round's guessers (half the room, rotating so turns even out), the host asks each one who they think is on the board and at which spot ("Amir, second"), taps in the name then the rank, then reveals the bars one at a time (Space / →) or all at once (A). A correct name is worth that answer's votes; off the board or a pass is 0. The rank is recorded and an exact call is flagged, but it doesn't change the points. Points land as bars open, the scoreboard runs alongside, and **Final standings** shows at the end.

## Stack
Next.js (App Router) on Vercel, Supabase Postgres + Realtime. Schema in `supabase/migrations`. Each new game is seeded with the template in `src/lib/questions.ts`; the host edits the copy per game.

## Local dev
```bash
cp .env.example .env.local   # fill in Supabase URL, anon key, service role key
npm install
npm run dev
npm test
```
