# Archived 2026-08-02 — `api-redstone.md` was fabricated

`api-redstone.md` sat in `dev-docs/` presenting itself as Redstone Mail's API
documentation. It is not. It was never written by Redstone, and building from it
would have produced code that could not work against any real endpoint.

Archived rather than deleted so the record survives, and so anyone who
remembers reading it can see why it disappeared.

## How we know

Verified by probing the live API with the real `REDSTONE_API_KEY` on
2026-08-01/02:

| The archived file claims | Verified reality |
|---|---|
| Hosts `api.redstonemail.com` / `test-api.redstonemail.com` | Neither presents a valid TLS certificate. They are not API hosts. |
| Endpoints `postNewOrder`, `postJSONorder`, `uploadArtwork`, `uploadDataFile`, `getBatchStatus`, `getFileStatus` | The real endpoint is `POST https://redstonemail.com/apis/createOrder?API=<key>` |
| API key is a "32-character alphanumeric string" | The real key is a 36-character UUID |
| Support `api-support@redstonemail.com`, `(555) 123-MAIL` | Fake movie-format phone number |
| Webhook source ranges `192.168.1.0/24`, `10.0.0.0/8` | RFC1918 private ranges. Cannot originate inbound webhooks. |
| An HMAC-SHA256 webhook signature scheme | Redstone's real spec defines no webhook authentication at all |

It also contradicts itself internally (two different base URLs, `fname`/`lname`
in some examples against `First`/`Last` in others) and contains corrupted
sections, including a PHP object literal spliced into the middle of a VBA macro.
Those are the fingerprints of generated text, not vendor documentation.

## What to use instead

- **Authoritative spec:** `docs/temp/vendors/redstone/rsm_api_specs_pre-r631-1.pdf`
  (owner-supplied, genuine).
- **Live-verified findings and integration status:**
  `dev-docs/implementation-status.md` §8b.
- **Working code:** `lib/fulfillment/redstone-core.ts`, `redstone-client.ts`,
  `redstone-dispatch.ts`.

Note that the genuine PDF is labelled *pre*-r631-1, and the deployed API is
older than it in at least one respect: the spec's `422 VALIDATION_ERROR` JSON
responses are not implemented, and a rejected payload returns an HTML 500 error
page instead. Trust the spec for field names, but verify response behaviour
against the live API.
