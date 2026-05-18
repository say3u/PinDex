-- Run this in Supabase SQL Editor to add new fields

alter table games
  add column if not exists oil_pattern text default 'house',  -- 'house' | 'transition' | 'sport'
  add column if not exists ball_used text,
  add column if not exists notes text;

alter table frames
  add column if not exists ball1_speed numeric(4,1),   -- mph, e.g. 17.5
  add column if not exists ball1_arrow int,            -- 1-7 (arrow targeted)
  add column if not exists ball1_hook int,             -- 0-10 subjective hook amount
  add column if not exists hand_style text,            -- '1hand' | '2hand' | 'cranker'
  add column if not exists ball2_speed numeric(4,1),
  add column if not exists ball2_arrow int;
