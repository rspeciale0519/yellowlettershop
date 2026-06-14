-- The /api/tags routes + Tag Manager UI expect an "enhanced tags" schema
-- (is_system, sort_order, parent_tag_id, visibility, metadata) that the migrated
-- public.tags table never had — the GET query orders by is_system/sort_order and
-- embeds parent_tag_id, so it 500'd on a fresh local DB. Add the missing columns.
alter table public.tags add column if not exists is_system boolean not null default false;
alter table public.tags add column if not exists sort_order integer not null default 0;
alter table public.tags add column if not exists visibility text not null default 'private';
alter table public.tags add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.tags add column if not exists parent_tag_id uuid references public.tags(id) on delete set null;

create index if not exists tags_parent_tag_id_idx on public.tags (parent_tag_id);
