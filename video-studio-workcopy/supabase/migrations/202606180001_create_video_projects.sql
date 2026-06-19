create extension if not exists "pgcrypto";

create table if not exists public.video_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_video_url text,
  transcript text not null default '',
  project_json jsonb not null default '{}'::jsonb,
  branding_handle text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_video_projects_updated_at on public.video_projects;
create trigger set_video_projects_updated_at
before update on public.video_projects
for each row
execute function public.set_updated_at();

alter table public.video_projects enable row level security;

create policy "Authenticated users can read video projects"
on public.video_projects
for select
to authenticated
using (true);

create policy "Authenticated users can write video projects"
on public.video_projects
for all
to authenticated
using (true)
with check (true);
