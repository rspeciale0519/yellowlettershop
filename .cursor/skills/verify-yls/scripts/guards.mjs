/**
 * Loopback / local-only guards for verify-yls drive scripts.
 * Never print secret values.
 */
export const LOCAL_SUPABASE_PORT = 62440;
export const LOCAL_SUPABASE_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

export function hostnameOf(urlString, label = 'url') {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error(`${label} is not a URL`);
  }
  return parsed.hostname.replace(/^\[|\]$/g, '');
}

export function assertLoopbackUrl(urlString, label = 'url') {
  const host = hostnameOf(urlString, label);
  if (!LOCAL_SUPABASE_HOSTS.has(host)) {
    throw new Error(`${label} host '${host}' is not loopback (127.0.0.1 / localhost / ::1)`);
  }
  return host;
}

export function assertLoopbackBaseUrl(urlString) {
  return assertLoopbackUrl(urlString, '--base-url / VERIFY_BASE_URL');
}

const HOSTED_SUPABASE = /https?:\/\/[a-z0-9.-]+\.supabase\.(co|in)\b/i;

function mentionsLocalGoTrue(text) {
  return (
    text.includes('127.0.0.1:62440')
    || text.includes('localhost:62440')
    || text.includes('[::1]:62440')
  );
}

async function scanSource(url, body) {
  const hosted = body.match(HOSTED_SUPABASE);
  if (hosted) {
    throw new Error(`served client at ${url} points at hosted Supabase (${hosted[0]})`);
  }
  return mentionsLocalGoTrue(body);
}

export async function assertServedClientIsLocal(baseUrl) {
  assertLoopbackBaseUrl(baseUrl);
  const origin = baseUrl.replace(/\/$/, '');
  const homeUrl = `${origin}/`;
  const res = await fetch(homeUrl, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  const html = await res.text();
  let sawLocal = await scanSource(homeUrl, html);

  const scripts = [];
  for (const match of html.matchAll(/\/_next\/static\/[^"'\\\s]+/g)) {
    const src = match[0];
    if (!scripts.includes(src)) scripts.push(src);
    if (scripts.length >= 24) break;
  }
  for (const src of scripts) {
    const abs = new URL(src, homeUrl).href;
    try {
      const jsRes = await fetch(abs, { signal: AbortSignal.timeout(10000) });
      if (!jsRes.ok) continue;
      const body = await jsRes.text();
      if (await scanSource(abs, body)) sawLocal = true;
    } catch {
      // missing chunk is not evidence of hosted config
    }
  }

  if (!sawLocal) {
    throw new Error(
      `served client config does not point at 127.0.0.1:${LOCAL_SUPABASE_PORT}. Aborting signup/write.`,
    );
  }
}
