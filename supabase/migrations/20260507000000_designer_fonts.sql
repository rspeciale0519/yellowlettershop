create table if not exists public.designer_fonts (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  css_family text not null,
  font_url text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.designer_fonts enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'designer_fonts' and policyname = 'Designer fonts are readable') then
    create policy "Designer fonts are readable"
      on public.designer_fonts for select
      using (enabled = true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'designer_fonts' and policyname = 'Admins manage designer fonts') then
    create policy "Admins manage designer fonts"
      on public.designer_fonts for all
      using (
        exists (
          select 1 from public.user_profiles
          where user_profiles.user_id = auth.uid()
          and user_profiles.role = 'admin'
        )
      )
      with check (
        exists (
          select 1 from public.user_profiles
          where user_profiles.user_id = auth.uid()
          and user_profiles.role = 'admin'
        )
      );
  end if;
end $$;

insert into public.designer_fonts (label, css_family, enabled)
values
  ('Arial', 'Arial, sans-serif', true),
  ('Georgia', 'Georgia, serif', true),
  ('Times New Roman', '''Times New Roman'', serif', true),
  ('Courier New', '''Courier New'', monospace', true),
  ('Handwritten', '''Comic Sans MS'', ''Bradley Hand'', cursive', true)
on conflict do nothing;
