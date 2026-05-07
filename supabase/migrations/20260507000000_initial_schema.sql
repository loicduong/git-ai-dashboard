create extension if not exists "pgcrypto";

create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  repo_url text not null,
  author text not null,
  "timestamp" timestamptz not null,
  human_additions integer not null default 0 check (human_additions >= 0),
  ai_additions integer not null default 0 check (ai_additions >= 0),
  total_additions integer not null default 0 check (total_additions >= 0),
  ai_ratio numeric not null default 0 check (ai_ratio >= 0 and ai_ratio <= 1),
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists metrics_timestamp_idx
  on public.metrics ("timestamp" desc);

create index if not exists metrics_repo_timestamp_idx
  on public.metrics (repo_url, "timestamp" desc);

create index if not exists metrics_author_timestamp_idx
  on public.metrics (author, "timestamp" desc);

create table if not exists public.cas_objects (
  hash text primary key,
  repo_url text,
  author text,
  content jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cas_objects_repo_idx
  on public.cas_objects (repo_url);

create index if not exists cas_objects_author_idx
  on public.cas_objects (author);

create index if not exists cas_objects_updated_at_idx
  on public.cas_objects (updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cas_objects_set_updated_at on public.cas_objects;

create trigger cas_objects_set_updated_at
before update on public.cas_objects
for each row
execute function public.set_updated_at();
