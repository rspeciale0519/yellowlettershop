-- Team Management foundation: team_members (authoritative per-team roles) +
-- team_invitations (pending invites for the "no account yet" path), plus the
-- teams.max_seats default bump to 25. See .claude/plans/feature-team-management.md.
create extension if not exists citext;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  status text not null default 'active' check (status in ('active','invited','suspended')),
  invited_by uuid references auth.users(id),
  joined_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, user_id)
);
-- "one ACTIVE team per user" as a PARTIAL unique index (not unique(user_id)),
-- so suspended/historical rows never permanently block re-joining.
create unique index if not exists team_members_one_active_team
  on public.team_members (user_id) where status = 'active';
create index if not exists team_members_team_idx
  on public.team_members (team_id) where status = 'active';

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  email citext not null,
  role text not null check (role in ('admin','member')),
  invited_by uuid not null references auth.users(id),
  token text not null,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists team_invitations_one_live
  on public.team_invitations (team_id, email) where status = 'pending';
create index if not exists team_invitations_token_idx
  on public.team_invitations (token) where status = 'pending';

alter table public.teams alter column max_seats set default 25;

alter table public.team_members enable row level security;
alter table public.team_invitations enable row level security;
-- RLS policies are added in a later migration (after the authority helpers exist).
-- Until then, only SECURITY DEFINER RPCs and the service role can touch these.
