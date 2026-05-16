create table if not exists public.baby_profiles (
  family_code_hash text primary key,
  age_months integer not null default 4,
  updated_at timestamptz not null default now()
);

create table if not exists public.baby_food_tests (
  id uuid primary key,
  family_code_hash text not null,
  food_id text not null,
  date date not null,
  reaction text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists baby_food_tests_family_code_hash_created_at_idx
  on public.baby_food_tests (family_code_hash, created_at desc);

alter table public.baby_profiles enable row level security;
alter table public.baby_food_tests enable row level security;

drop policy if exists "Allow public family profile reads" on public.baby_profiles;
drop policy if exists "Allow public family profile writes" on public.baby_profiles;
drop policy if exists "Allow public family profile updates" on public.baby_profiles;
drop policy if exists "Allow public food test reads" on public.baby_food_tests;
drop policy if exists "Allow public food test writes" on public.baby_food_tests;

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
        from public.baby_profiles
        where family_code_hash = p_family_code_hash
      ),
      jsonb_build_object('ageMonths', 4)
    ),
    'tests',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', id,
            'foodId', food_id,
            'date', date,
            'reaction', reaction,
            'note', note
          )
          order by date desc, created_at desc
        )
        from public.baby_food_tests
        where family_code_hash = p_family_code_hash
      ),
      '[]'::jsonb
    )
  );
$$;

create or replace function public.upsert_baby_profile(
  p_family_code_hash text,
  p_age_months integer
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.baby_profiles (family_code_hash, age_months, updated_at)
  values (p_family_code_hash, p_age_months, now())
  on conflict (family_code_hash)
  do update set age_months = excluded.age_months, updated_at = now();
$$;

create or replace function public.add_baby_food_test(
  p_id uuid,
  p_family_code_hash text,
  p_food_id text,
  p_date date,
  p_reaction text,
  p_note text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.baby_food_tests (
    id,
    family_code_hash,
    food_id,
    date,
    reaction,
    note
  )
  values (
    p_id,
    p_family_code_hash,
    p_food_id,
    p_date,
    p_reaction,
    coalesce(p_note, '')
  );
$$;

grant execute on function public.get_baby_family_state(text) to anon, authenticated;
grant execute on function public.upsert_baby_profile(text, integer) to anon, authenticated;
grant execute on function public.add_baby_food_test(uuid, text, text, date, text, text) to anon, authenticated;
