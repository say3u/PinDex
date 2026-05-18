-- Run this in your Supabase SQL editor

create table bowlers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avg_score int,
  created_at timestamptz default now()
);

create table games (
  id uuid primary key default gen_random_uuid(),
  bowler_id uuid references bowlers(id) on delete cascade,
  lane int,
  league text,
  total_score int,
  created_at timestamptz default now()
);

create table frames (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade,
  frame_number int not null check (frame_number between 1 and 10),
  ball1_pins int not null,   -- bitmask: pins knocked on ball 1
  ball2_pins int,
  ball3_pins int,            -- 10th frame only
  is_strike boolean default false,
  is_spare boolean default false,
  leave_bitmask int default 0, -- pins still standing after ball 1
  created_at timestamptz default now()
);

create index on frames(game_id);
create index on games(bowler_id);
