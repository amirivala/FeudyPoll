-- Host-entered guesses for the reveal round. Points are derived: a guess is worth
-- the number of votes the guessed player received on that question (0 if not on the board).
create table guesses (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  guesser_id uuid not null references players(id) on delete cascade,
  guessed_id uuid references players(id) on delete cascade, -- null = passed
  created_at timestamptz not null default now(),
  unique (question_id, guesser_id)
);
alter table guesses enable row level security;
