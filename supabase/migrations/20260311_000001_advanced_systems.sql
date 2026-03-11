create table if not exists public.player_security (
  player_id uuid primary key references public.profiles(id) on delete cascade,
  suspicious_score integer not null default 0,
  flagged boolean not null default false,
  under_review_until timestamptz null,
  reward_multiplier numeric not null default 1,
  pvp_restricted_until timestamptz null,
  updated_at timestamptz not null default now()
);

create table if not exists public.player_daily_economy (
  player_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  coins_earned bigint not null default 0,
  primary key (player_id, day)
);

create or replace function public.reward_for_difficulty(p_difficulty text)
returns integer
language sql
stable
as $$
select case lower(p_difficulty)
  when 'easy' then 100
  when 'medium' then 250
  when 'hard' then 600
  else 1200
end
$$;

create or replace function public.apply_daily_coin_cap(p_player uuid, p_coins integer)
returns integer
language plpgsql
volatile
as $$
declare
  v_day date := (now() at time zone 'utc')::date;
  v_level integer := 1;
  v_cap bigint := 200000;
  v_so_far bigint := 0;
  v_remaining bigint := 0;
  v_to_add bigint := greatest(0, p_coins);
begin
  select coalesce(level, 1) into v_level from public.profiles where id = p_player;
  v_cap := greatest(50000, 50000 + (v_level * 5000));

  insert into public.player_daily_economy(player_id, day, coins_earned)
  values(p_player, v_day, 0)
  on conflict (player_id, day) do nothing;

  select coins_earned into v_so_far
  from public.player_daily_economy
  where player_id = p_player and day = v_day;

  v_remaining := greatest(0, v_cap - v_so_far);
  v_to_add := least(v_to_add, v_remaining);

  update public.player_daily_economy
  set coins_earned = coins_earned + v_to_add
  where player_id = p_player and day = v_day;

  return v_to_add::integer;
end;
$$;

create or replace function public.update_security_and_multiplier(
  p_player uuid,
  p_difficulty text,
  p_correct boolean,
  p_response_time_ms integer
)
returns numeric
language plpgsql
volatile
as $$
declare
  v_fast boolean := coalesce(p_response_time_ms, 999999) < 600;
  v_min_ms integer := case lower(p_difficulty)
    when 'easy' then 700
    when 'medium' then 900
    when 'hard' then 1200
    else 1500
  end;
  v_too_fast boolean := coalesce(p_response_time_ms, 999999) < v_min_ms;
  v_score integer := 0;
  v_now timestamptz := now();
  v_reward_multiplier numeric := 1;
  v_pvp_restricted_until timestamptz := null;
  v_under_review_until timestamptz := null;
begin
  insert into public.player_security(player_id)
  values(p_player)
  on conflict (player_id) do nothing;

  select suspicious_score, reward_multiplier, pvp_restricted_until, under_review_until
    into v_score, v_reward_multiplier, v_pvp_restricted_until, v_under_review_until
  from public.player_security
  where player_id = p_player;

  if v_too_fast then
    v_score := v_score + 1;
  end if;

  if lower(p_difficulty) = 'expert' and p_correct then
    v_score := v_score + 1;
  end if;

  v_score := greatest(0, v_score - 1);

  if v_score >= 10 then
    v_reward_multiplier := 0.2;
    v_under_review_until := v_now + interval '30 minutes';
    v_pvp_restricted_until := v_now + interval '30 minutes';
  elsif v_score >= 6 then
    v_reward_multiplier := 0.5;
    v_under_review_until := v_now + interval '15 minutes';
  else
    v_reward_multiplier := 1;
  end if;

  update public.player_security
  set suspicious_score = v_score,
      reward_multiplier = v_reward_multiplier,
      under_review_until = v_under_review_until,
      pvp_restricted_until = v_pvp_restricted_until,
      flagged = flagged or v_fast,
      updated_at = v_now
  where player_id = p_player;

  return v_reward_multiplier;
end;
$$;

create or replace function public.answer_question_secure(
  p_player uuid,
  p_question uuid,
  p_answer integer,
  p_response_time_ms integer
)
returns table(correct boolean, reward integer, reward_multiplier numeric)
language plpgsql
volatile
as $$
declare
  v_q record;
  v_correct boolean := false;
  v_base_reward integer := 0;
  v_multiplier numeric := 1;
  v_reward integer := 0;
  v_capped integer := 0;
begin
  select id, correct_option, difficulty, category into v_q
  from public.questions
  where id = p_question;

  if v_q.id is null then
    correct := false;
    reward := 0;
    reward_multiplier := 1;
    return;
  end if;

  v_correct :=
    case v_q.correct_option
      when 'A' then p_answer = 0
      when 'B' then p_answer = 1
      when 'C' then p_answer = 2
      else p_answer = 3
    end;

  v_base_reward := case when v_correct then public.reward_for_difficulty(v_q.difficulty) else 0 end;
  v_multiplier := public.update_security_and_multiplier(p_player, v_q.difficulty, v_correct, p_response_time_ms);
  v_reward := floor(v_base_reward * v_multiplier)::integer;
  v_capped := public.apply_daily_coin_cap(p_player, v_reward);

  update public.profiles
  set coins = coalesce(coins, 0) + v_capped,
      total_earned = coalesce(total_earned, 0) + v_capped,
      updated_at = now()
  where id = p_player;

  insert into public.player_question_history(player_id, question_id, correct, response_time_ms, difficulty, category)
  values (p_player, p_question, v_correct, p_response_time_ms, v_q.difficulty, v_q.category);

  correct := v_correct;
  reward := v_capped;
  reward_multiplier := v_multiplier;
  return;
end;
$$;

