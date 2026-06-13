create table if not exists public.baby_profiles (
  family_code_hash text primary key,
  child_name text,
  birth_date date,
  avatar_emoji text,
  age_months integer not null default 4,
  updated_at timestamptz not null default now()
);

alter table public.baby_profiles
  add column if not exists child_name text,
  add column if not exists birth_date date,
  add column if not exists avatar_emoji text;

create table if not exists public.baby_food_tests (
  id uuid primary key,
  family_code_hash text not null,
  food_id text not null,
  date date not null,
  meal_time time,
  reaction text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.baby_food_tests
  add column if not exists meal_time time;

alter table public.baby_food_tests
  drop column if exists is_popote;

create index if not exists baby_food_tests_family_code_hash_created_at_idx
  on public.baby_food_tests (family_code_hash, created_at desc);

alter table public.baby_profiles enable row level security;
alter table public.baby_food_tests enable row level security;

revoke all on table public.baby_profiles from anon, authenticated;
revoke all on table public.baby_food_tests from anon, authenticated;

drop policy if exists "Allow public family profile reads" on public.baby_profiles;
drop policy if exists "Allow public family profile writes" on public.baby_profiles;
drop policy if exists "Allow public family profile updates" on public.baby_profiles;
drop policy if exists "Allow public food test reads" on public.baby_food_tests;
drop policy if exists "Allow public food test writes" on public.baby_food_tests;

create or replace function public.is_valid_baby_family_hash(value text)
returns boolean
language sql
immutable
as $$
  select value ~ '^[a-f0-9]{64}$';
$$;

create or replace function public.is_valid_baby_reaction(value text)
returns boolean
language sql
immutable
as $$
  select value = any(array['Aucune', 'Aime', 'Aime pas', 'Allergie', 'Vomi', 'Digestion', 'Autre']);
$$;

create or replace function public.get_baby_family_state(p_family_code_hash text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'profile',
    coalesce(
      (
        select jsonb_build_object('ageMonths', age_months)
          || jsonb_build_object('childName', coalesce(child_name, ''))
          || jsonb_build_object('birthDate', coalesce(birth_date::text, ''))
          || jsonb_build_object('avatarEmoji', coalesce(avatar_emoji, ''))
        from public.baby_profiles
        where public.is_valid_baby_family_hash(p_family_code_hash)
          and family_code_hash = p_family_code_hash
      ),
      jsonb_build_object('ageMonths', 4, 'childName', '', 'birthDate', '', 'avatarEmoji', '')
    ),
    'tests',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', id,
            'foodId', food_id,
            'date', date,
            'mealTime', coalesce(to_char(meal_time, 'HH24:MI'), ''),
            'reaction', reaction,
            'note', note
          )
          order by date desc, meal_time desc nulls last, created_at desc
        )
        from public.baby_food_tests
        where public.is_valid_baby_family_hash(p_family_code_hash)
          and family_code_hash = p_family_code_hash
      ),
      '[]'::jsonb
    )
  );
$$;

drop function if exists public.upsert_baby_profile(text, integer);
drop function if exists public.upsert_baby_profile(text, integer, text, date);

create or replace function public.upsert_baby_profile(
  p_family_code_hash text,
  p_age_months integer,
  p_child_name text,
  p_birth_date date,
  p_avatar_emoji text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_baby_family_hash(p_family_code_hash) then
    raise exception 'Invalid family code hash';
  end if;

  if p_age_months < 0 or p_age_months > 36 then
    raise exception 'Invalid age';
  end if;

  if p_child_name is not null and length(p_child_name) > 40 then
    raise exception 'Child name is too long';
  end if;

  if p_avatar_emoji is not null and length(p_avatar_emoji) > 16 then
    raise exception 'Avatar emoji is too long';
  end if;

  if p_birth_date is not null and (p_birth_date < current_date - interval '4 years' or p_birth_date > current_date) then
    raise exception 'Invalid birth date';
  end if;

  insert into public.baby_profiles (
    family_code_hash,
    age_months,
    child_name,
    birth_date,
    avatar_emoji,
    updated_at
  )
  values (
    p_family_code_hash,
    p_age_months,
    nullif(p_child_name, ''),
    p_birth_date,
    nullif(p_avatar_emoji, ''),
    now()
  )
  on conflict (family_code_hash)
  do update set
    age_months = excluded.age_months,
    child_name = excluded.child_name,
    birth_date = excluded.birth_date,
    avatar_emoji = excluded.avatar_emoji,
    updated_at = now();
end;
$$;

drop function if exists public.add_baby_food_test(uuid, text, text, date, text, text);
drop function if exists public.add_baby_food_test(uuid, text, text, date, text, text, boolean);
drop function if exists public.add_baby_food_test(uuid, text, text, date, text, text, boolean, time);

create or replace function public.add_baby_food_test(
  p_id uuid,
  p_family_code_hash text,
  p_food_id text,
  p_date date,
  p_reaction text,
  p_note text,
  p_meal_time time
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_baby_family_hash(p_family_code_hash) then
    raise exception 'Invalid family code hash';
  end if;

  if p_food_id is null or length(p_food_id) = 0 or length(p_food_id) > 80 then
    raise exception 'Invalid food id';
  end if;

  if p_date < current_date - interval '6 years' or p_date > current_date + interval '1 day' then
    raise exception 'Invalid test date';
  end if;

  if not public.is_valid_baby_reaction(p_reaction) then
    raise exception 'Invalid reaction';
  end if;

  if p_note is not null and length(p_note) > 800 then
    raise exception 'Note is too long';
  end if;

  insert into public.baby_food_tests (
    id,
    family_code_hash,
    food_id,
    date,
    meal_time,
    reaction,
    note
  )
  values (
    p_id,
    p_family_code_hash,
    p_food_id,
    p_date,
    p_meal_time,
    p_reaction,
    coalesce(p_note, '')
  );
end;
$$;

drop function if exists public.update_baby_food_test(uuid, text, date, text, text, boolean);
drop function if exists public.update_baby_food_test(uuid, text, date, text, text, boolean, time);

create or replace function public.update_baby_food_test(
  p_id uuid,
  p_family_code_hash text,
  p_date date,
  p_reaction text,
  p_note text,
  p_meal_time time
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_baby_family_hash(p_family_code_hash) then
    raise exception 'Invalid family code hash';
  end if;

  if p_date < current_date - interval '6 years' or p_date > current_date + interval '1 day' then
    raise exception 'Invalid test date';
  end if;

  if not public.is_valid_baby_reaction(p_reaction) then
    raise exception 'Invalid reaction';
  end if;

  if p_note is not null and length(p_note) > 800 then
    raise exception 'Note is too long';
  end if;

  update public.baby_food_tests
  set
    date = p_date,
    meal_time = p_meal_time,
    reaction = p_reaction,
    note = coalesce(p_note, '')
  where id = p_id
    and family_code_hash = p_family_code_hash;
end;
$$;

create or replace function public.delete_baby_food_test(
  p_id uuid,
  p_family_code_hash text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_baby_family_hash(p_family_code_hash) then
    raise exception 'Invalid family code hash';
  end if;

  delete from public.baby_food_tests
  where id = p_id
    and family_code_hash = p_family_code_hash;
end;
$$;

create or replace function public.delete_baby_family_state(
  p_family_code_hash text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_valid_baby_family_hash(p_family_code_hash) then
    raise exception 'Invalid family code hash';
  end if;

  delete from public.baby_food_tests
  where family_code_hash = p_family_code_hash;

  delete from public.baby_profiles
  where family_code_hash = p_family_code_hash;
end;
$$;

revoke execute on function public.is_valid_baby_family_hash(text) from public, anon, authenticated;
revoke execute on function public.is_valid_baby_reaction(text) from public, anon, authenticated;
grant execute on function public.get_baby_family_state(text) to anon, authenticated;
grant execute on function public.upsert_baby_profile(text, integer, text, date, text) to anon, authenticated;
grant execute on function public.add_baby_food_test(uuid, text, text, date, text, text, time) to anon, authenticated;
grant execute on function public.update_baby_food_test(uuid, text, date, text, text, time) to anon, authenticated;
grant execute on function public.delete_baby_food_test(uuid, text) to anon, authenticated;
grant execute on function public.delete_baby_family_state(text) to anon, authenticated;
