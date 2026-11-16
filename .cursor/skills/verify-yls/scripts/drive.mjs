#!/usr/bin/env node
/**
 * verify-yls drive harness.
 * fetch + optional headless Chrome. No Playwright/Cypress suite exists in this repo.
 *
 * Usage (from repo root):
 *   node .cursor/skills/verify-yls/scripts/drive.mjs --feature home
 *   node .cursor/skills/verify-yls/scripts/drive.mjs --feature auth --base-url http://127.0.0.1:3010
 */

import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, access, unlink } from 'node:fs/promises';
import { constants as fsConstants, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { driveAuthLive, driveMailingListLive, localGoTrueUp } from './drive-live.mjs';

const FEATURES = ['home', 'auth', 'templates', 'campaign-order', 'mailing-lists'];
const HOME_HEADING = 'Streamline Your Direct Mail Campaigns';
const LOGO_ALT = 'Yellow Letter Shop Logo';

function parseArgs(argv) {
  const out = {
    feature: 'home',
    baseUrl: process.env.VERIFY_BASE_URL || 'http://127.0.0.1:3010',
    outDir: '.verify-artifacts',
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--feature' && next) {
      out.feature = next;
      i += 1;
    } else if (arg === '--base-url' && next) {
      out.baseUrl = next.replace(/\/$/, '');
      i += 1;
    } else if (arg === '--out' && next) {
      out.outDir = next;
      i += 1;
    }
  }
  if (!FEATURES.includes(out.feature)) {
    throw new Error(`Unknown --feature ${out.feature}. Use: ${FEATURES.join(', ')}`);
  }
  return out;
}

function repoRootFromScript() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../..');
}

async function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    // Prefer the real binary. /usr/local/bin/google-chrome on this VM is a
    // wrapper that forces --remote-debugging-port=9399 and a shared profile.
    '/opt/google/chrome/chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/local/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // keep looking
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stopChild(child) {
  if (!child.pid) return;
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    try {
      child.kill('SIGTERM');
    } catch {
      // already gone
    }
  }
}

/** Chrome headless on this VM writes the artifact then hangs on dbus. Stop our PID/group once ready. */
function runChrome(chrome, args, { timeoutMs, isReady }) {
  return new Promise((resolve, reject) => {
    const child = spawn(chrome, args, { stdio: ['ignore', 'pipe', 'pipe'], detached: true });
    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (ok, error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(poll);
      stopChild(child);
      if (ok) resolve({ stdout, stderr });
      else reject(error);
    };

    const timer = setTimeout(() => {
      if (isReady(stdout)) finish(true);
      else finish(false, new Error(`chrome timed out after ${timeoutMs}ms: ${stderr.slice(-400)}`));
    }, timeoutMs);

    const poll = setInterval(() => {
      if (isReady(stdout)) finish(true);
    }, 250);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      if (isReady(stdout)) finish(true);
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) => finish(false, err));
    child.on('close', () => {
      if (isReady(stdout)) finish(true);
    });
  });
}

function mustInclude(haystack, needles, label) {
  const missing = needles.filter((needle) => !haystack.includes(needle));
  if (missing.length) {
    throw new Error(`${label} missing: ${missing.map((m) => JSON.stringify(m)).join(', ')}`);
  }
}

function mustNotInclude(haystack, needles, label) {
  const present = needles.filter((needle) => haystack.includes(needle));
  if (present.length) {
    throw new Error(`${label} unexpectedly contains: ${present.map((m) => JSON.stringify(m)).join(', ')}`);
  }
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'manual' });
  const body = await res.text();
  const location = res.headers.get('location');
  return { status: res.status, body, location, url };
}

async function chromeDump(chrome, url, destPng, destHtml) {
  const common = [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--window-size=1280,800',
  ];
  try {
    await unlink(destPng);
  } catch {
    // first run
  }

  await runChrome(chrome, [...common, `--screenshot=${destPng}`, url], {
    timeoutMs: 25000,
    isReady: () => {
      try {
        return statSync(destPng).size > 8000;
      } catch {
        return false;
      }
    },
  });
  await sleep(300);

  const dump = await runChrome(chrome, [...common, '--dump-dom', url], {
    timeoutMs: 25000,
    isReady: (stdout) => stdout.includes('</html>') && stdout.length > 1000,
  });
  await writeFile(destHtml, dump.stdout);
  return dump.stdout;
}

async function driveHome({ baseUrl, outDir, chrome }) {
  const skipped = [];
  const http = await fetchText(`${baseUrl}/`);
  await writeFile(path.join(outDir, 'home.html'), http.body);
  if (http.status !== 200) {
    throw new Error(`GET / HTTP ${http.status}`);
  }
  mustInclude(http.body, [HOME_HEADING, LOGO_ALT, '/design/customize', '/templates'], 'SSR home');

  let dom = http.body;
  if (chrome) {
    dom = await chromeDump(
      chrome,
      `${baseUrl}/`,
      path.join(outDir, 'home.png'),
      path.join(outDir, 'home.dom.html'),
    );
    mustInclude(
      dom,
      [HOME_HEADING, 'Start a New Design', 'Get Some Inspiration', 'New Campaign', 'Transparent Pricing'],
      'hydrated home',
    );
    // Header Sign In is client-rendered after supabase.auth.getSession(). Without
    // local GoTrue that call can hang and the header stays on animate-pulse placeholders.
    if (!dom.includes('Sign In')) {
      skipped.push(
        'Header Sign In not in DOM: auth chrome stays on loading placeholders until getSession() returns. Needs local Supabase on :62440. Card CTA "Get Started" is not the header signup button.',
      );
    }
  } else {
    skipped.push('headless Chrome not found — campaign cards and header were not screenshot-proven');
  }

  return {
    route: '/',
    httpStatus: http.status,
    skipped,
    observed: [
      'SSR heading Streamline Your Direct Mail Campaigns',
      'links to /design/customize and /templates',
      chrome ? 'hydrated Start a New Design, Get Some Inspiration, New Campaign, Transparent Pricing' : 'SSR only',
      chrome && !dom.includes('Sign In') ? 'Sign In skipped (session check hung)' : chrome ? 'Sign In present' : '',
    ].filter(Boolean),
    endState: 'Anonymous homepage is usable: heading, two campaign CTAs, New Campaign, pricing section.',
  };
}

async function driveAuth({ baseUrl, outDir, chrome }) {
  const skipped = [];
  const loginUrl = `${baseUrl}/?auth=login`;
  const http = await fetchText(loginUrl);
  await writeFile(path.join(outDir, 'auth-login.html'), http.body);
  if (http.status !== 200) {
    throw new Error(`GET /?auth=login HTTP ${http.status}`);
  }

  if (chrome) {
    const live = await driveAuthLive({ baseUrl, outDir, chromePath: chrome });
    const loginDom = await readFile(path.join(outDir, 'auth-login.dom.html'), 'utf8');
    mustInclude(
      loginDom,
      [
        'Welcome back',
        'Sign in to your account to continue',
        'Email Address',
        'id="login-email"',
        'id="login-password"',
        'Sign In',
        'Continue with Google',
        'Create Account',
      ],
      'login modal',
    );
    return {
      route: live.route || '/?auth=login',
      httpStatus: http.status,
      skipped: live.skipped || [],
      observed: live.observed || [],
      endState: live.endState,
    };
  }

  skipped.push('headless Chrome not found — auth modal is client-only (?auth= query); SSR will not contain Welcome back');
  skipped.push('Google OAuth not attempted.');
  skipped.push(
    'Actual email/password sign-in not attempted: needs Chrome + local GoTrue on :62440. Do not use hosted projects.',
  );

  return {
    route: '/?auth=login',
    httpStatus: http.status,
    skipped,
    observed: ['SSR homepage only; modal unverified without Chrome'],
    endState:
      'Auth modal chrome is on the real /?auth= path. A session (header avatar, /dashboard Total Orders) is NOT proven without local Supabase.',
  };
}

async function driveTemplates({ baseUrl, outDir, chrome }) {
  const skipped = [];
  const http = await fetchText(`${baseUrl}/templates`);
  await writeFile(path.join(outDir, 'templates.html'), http.body);
  if (http.status !== 200) {
    throw new Error(`GET /templates HTTP ${http.status}`);
  }

  let dom = http.body;
  if (chrome) {
    dom = await chromeDump(
      chrome,
      `${baseUrl}/templates`,
      path.join(outDir, 'templates.png'),
      path.join(outDir, 'templates.dom.html'),
    );
    mustInclude(dom, ['Template Gallery', 'Search templates'], 'templates gallery');
    mustNotInclude(dom, ['Loading templates...'], 'templates gallery still spinning');
  } else {
    skipped.push('headless Chrome not found — gallery heading is client-rendered after a 1s loader');
  }

  return {
    route: '/templates',
    httpStatus: http.status,
    skipped,
    observed: chrome ? ['Template Gallery heading', 'search aria-label'] : ['HTTP 200 only'],
    endState: 'Template Gallery is browsable from /templates without auth (in-memory templatesData).',
  };
}

async function driveCampaignOrder({ baseUrl, outDir, chrome }) {
  const skipped = [];
  const newCampaign = await fetchText(`${baseUrl}/new-campaign`);
  await writeFile(path.join(outDir, 'new-campaign.html'), newCampaign.body);
  if (newCampaign.status !== 200) {
    throw new Error(`GET /new-campaign HTTP ${newCampaign.status}`);
  }

  const orderUrl = `${baseUrl}/orders/new?source=dashboard_create_new`;
  const orderHttp = await fetchText(orderUrl);
  await writeFile(path.join(outDir, 'orders-new.html'), orderHttp.body);
  if (orderHttp.status !== 200) {
    throw new Error(`GET /orders/new HTTP ${orderHttp.status}`);
  }

  let orderDom = orderHttp.body;
  if (chrome) {
    orderDom = await chromeDump(
      chrome,
      orderUrl,
      path.join(outDir, 'orders-new.png'),
      path.join(outDir, 'orders-new.dom.html'),
    );
    mustInclude(
      orderDom,
      [
        'Create New Order',
        'Data & Mapping',
        'Choose Your Data Source',
        'Upload File',
        'Existing List',
        'Manual Entry',
        'Continue to Address Validation',
      ],
      'order stepper',
    );
  } else {
    skipped.push('headless Chrome not found — order stepper is a client component');
  }

  skipped.push('/new-campaign client-redirects unauthenticated users to /?auth=login&redirectedFrom=/new-campaign');
  skipped.push('Address Validation (AccuZip), payment (Stripe test keys), and print dispatch were not run. Do not complete a charge.');
  skipped.push('/orders/new is not in middleware.ts matcher — UI can render without a session; APIs still 401.');

  return {
    route: '/orders/new?source=dashboard_create_new',
    httpStatus: orderHttp.status,
    skipped,
    observed: chrome
      ? ['Create New Order', 'step Data & Mapping', 'Upload File / Existing List / Manual Entry']
      : ['HTTP 200 for /orders/new'],
    endState:
      'Order stepper step 1 is visible on the real /orders/new path. Completing mapping → validation → payment is unverified without local data + Stripe test keys.',
  };
}

async function driveMailingLists({ baseUrl, outDir, chrome }) {
  const skipped = [];
  const url = `${baseUrl}/mailing-services/mailing-list-manager`;
  const http = await fetchText(url);
  await writeFile(path.join(outDir, 'mailing-list-manager.html'), http.body);
  if (http.status !== 200) {
    throw new Error(`GET mailing-list-manager HTTP ${http.status}`);
  }

  let endState =
    'Unauthenticated users are redirected to /?auth=login (FeatureAuthGuard redirectToAuth). Authenticated manager UI was not reached.';
  const observed = [];

  skipped.push('Landing page MailingListManagerLanding is currently unreachable because redirectToAuth={true}.');
  skipped.push('Add List modal submit is a mock (no INSERT). Real save is authenticated POST /api/orders/upload-list.');

  const gotrue = await localGoTrueUp();
  // Skip the anonymous --screenshot dump when we will drive a live session.
  // The dump uses a wrapper Chrome on a shared debug port and races the CDP session.
  if (chrome && gotrue) {
    const live = await driveMailingListLive({ baseUrl, outDir, chromePath: chrome });
    return {
      route: live.route,
      httpStatus: http.status,
      skipped: [...skipped, ...(live.skipped || [])],
      observed: [...observed, ...(live.observed || [])],
      endState: live.endState,
      db: live.db,
    };
  }

  if (chrome) {
    const dom = await chromeDump(
      chrome,
      url,
      path.join(outDir, 'mailing-list-manager.png'),
      path.join(outDir, 'mailing-list-manager.dom.html'),
    );
    await writeFile(path.join(outDir, 'mailing-list-manager.dom.html'), dom);
    if (dom.includes('id="login-email"') || dom.includes('Welcome back')) {
      observed.push('redirected into auth modal (Welcome back / #login-email)');
    } else if (dom.includes('Mailing List Manager') && dom.includes('data-testid="add-button"')) {
      observed.push('authenticated manager: h1 Mailing List Manager + add-button');
      endState = 'Authenticated mailing list manager is usable (Add List / Upload List).';
    } else {
      observed.push('page loaded; neither manager chrome nor login modal detected — inspect DOM dump');
    }
  } else {
    skipped.push('headless Chrome not found — redirect is client-side');
  }

  skipped.push('Creating a list requires a signed-in user and local Postgres. Seed: supabase/seed.sql after `npx supabase start`.');

  return {
    route: '/mailing-services/mailing-list-manager',
    httpStatus: http.status,
    skipped,
    observed,
    endState,
  };
}

const drivers = {
  home: driveHome,
  auth: driveAuth,
  templates: driveTemplates,
  'campaign-order': driveCampaignOrder,
  'mailing-lists': driveMailingLists,
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = repoRootFromScript();
  const outDir = path.resolve(root, args.outDir);
  await mkdir(outDir, { recursive: true });

  const chrome = await findChrome();
  const startedAt = new Date().toISOString();
  let result;
  try {
    result = await drivers[args.feature]({
      baseUrl: args.baseUrl,
      outDir,
      chrome,
    });
    result.ok = true;
  } catch (err) {
    result = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      skipped: chrome ? [] : ['headless Chrome not found'],
    };
  }

  const report = {
    feature: args.feature,
    baseUrl: args.baseUrl,
    chrome: chrome || null,
    startedAt,
    finishedAt: new Date().toISOString(),
    ...result,
  };
  const reportPath = path.join(outDir, `drive-${args.feature}.json`);
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(outDir, `drive-${args.feature}.log`), `${JSON.stringify(report, null, 2)}\n`);

  if (!report.ok) {
    console.error(`verify-yls drive FAIL (${args.feature}): ${report.error}`);
    console.error(`report: ${reportPath}`);
    process.exit(1);
  }

  console.log(`verify-yls drive PASS (${args.feature})`);
  console.log(`report: ${reportPath}`);
  if (report.skipped?.length) {
    console.log('skipped:');
    for (const item of report.skipped) console.log(`  - ${item}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
