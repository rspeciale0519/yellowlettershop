-- Provision the 'assets' storage bucket used app-wide for client-side uploads:
-- profile avatars (components/profile/personal-info-tab.tsx) and the media
-- library / asset service (lib/assets/*, app/api/assets/*). The hosted project
-- had this bucket, but it was never captured in a migration, so local uploads
-- failed with "Bucket not found". Public bucket because avatars and assets are
-- served via getPublicUrl() and rendered directly in <img>. Unlike the private
-- design-previews bucket (recipient PII on proofs), these assets are not PII.
-- Additive + idempotent.

begin;

-- Ensure the bucket exists and is PUBLIC.
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do update set public = true;

-- Public read: anyone may view objects in this public bucket.
drop policy if exists "assets public read" on storage.objects;
create policy "assets public read"
  on storage.objects for select
  using (bucket_id = 'assets');

-- Authenticated users may upload into the assets bucket. Owner is stamped by
-- the storage layer to auth.uid() on insert.
drop policy if exists "assets authenticated insert" on storage.objects;
create policy "assets authenticated insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'assets');

-- Owners may update their own objects.
drop policy if exists "assets owner update" on storage.objects;
create policy "assets owner update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'assets' and owner = auth.uid())
  with check (bucket_id = 'assets' and owner = auth.uid());

-- Owners may delete their own objects.
drop policy if exists "assets owner delete" on storage.objects;
create policy "assets owner delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'assets' and owner = auth.uid());

commit;
