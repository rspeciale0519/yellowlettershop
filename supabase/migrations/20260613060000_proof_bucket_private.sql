-- Proof PDFs contain recipient PII (names/addresses merged onto the mail piece).
-- They must live in a PRIVATE bucket served via short-lived signed URLs
-- (lib/orders/proof-storage.ts). This migration owns bucket provisioning so the
-- request handlers no longer auto-create it as public. Additive + idempotent.

begin;

-- Ensure the bucket exists and is PRIVATE (flips any existing public bucket).
insert into storage.buckets (id, name, public)
values ('design-previews', 'design-previews', false)
on conflict (id) do update set public = false;

-- Self-heal legacy rows: proof_urls historically stored full public URLs. Rewrite
-- any such entry to the storage path so signed-URL minting works post-flip.
update public.orders
set proof_urls = (
  select jsonb_agg(regexp_replace(elem, '^https?://[^/]+/storage/v1/object/(public|sign)/design-previews/', ''))
  from jsonb_array_elements_text(orders.proof_urls) as elem
)
where proof_urls is not null
  and jsonb_typeof(proof_urls) = 'array'
  and exists (
    select 1 from jsonb_array_elements_text(orders.proof_urls) e
    where e like 'http%/design-previews/%'
  );

commit;
