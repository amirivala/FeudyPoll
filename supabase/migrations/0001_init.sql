create extension if not exists pgcrypto;

create table games (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  admin_token text not null unique,
  status text not null default 'lobby' check (status in ('lobby','voting','closed')),
  created_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  token text not null unique,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index players_game_name_idx on players (game_id, lower(name));

create table questions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  position int not null,
  text text not null,
  unique (game_id, position)
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  voter_id uuid not null references players(id) on delete cascade,
  target_id uuid not null references players(id) on delete cascade,
  updated_at timestamptz not null default now(),
  unique (question_id, voter_id),
  check (voter_id <> target_id)
);

-- Lock everything down; the server uses the service role. The browser only
-- subscribes to realtime changes on players/games via the anon key.
alter table games enable row level security;
alter table players enable row level security;
alter table questions enable row level security;
alter table votes enable row level security;

create policy "anon reads game status" on games for select to anon using (true);
create policy "anon reads roster" on players for select to anon using (true);

-- Hide secret columns from anon.
revoke select on games from anon;
grant select (id, code, status, created_at) on games to anon;
revoke select on players from anon;
grant select (id, game_id, name, submitted_at, created_at) on players to anon;

alter publication supabase_realtime add table games, players;
