'use strict';
const fs = require('fs');
const L = require('./brain-lib');
let input = {}; try { input = JSON.parse(fs.readFileSync(0,'utf8')||'{}'); } catch {}
try {
  const root = L.projectRoot(input);
  const id = input.session_id || 'unknown';
  const sf = L.sentinelFile(root,id);
  const sentinel = L.readJson(sf, { blockCount:0 });
  const un = L.unconsumed(root);
  if (un.length === 0) process.exit(0); // no substantive work

  const oldestTs = un.map(x=>x.ts).sort()[0];
  const oldestDay = oldestTs.slice(0,10);
  const blocks = L.journalBlocks(root);
  const covering = blocks.find(b => b.ok && b.day >= oldestDay);

  // PII heuristic (non-blocking warning) on the latest journal file
  const lj = L.latestJournal(root);
  if (lj && L.scanSecrets(fs.readFileSync(lj,'utf8')))
    console.error('[brain] WARNING: possible secret/PII in journal entry (AL-5 heuristic) - review before commit.');

  if (covering) {
    const newest = L.allLedgerLines(root).map(x=>x.ts).sort().pop() || L.nowIso();
    const b = L.getBrain(root);
    b.lastCoveredTs = newest;
    b.taskCountSinceConsolidation = (b.taskCountSinceConsolidation||0)+1;
    L.setBrain(root,b);
    process.exit(0);
  }
  if ((sentinel.blockCount||0) >= 2) {
    console.error('[brain] loop-breaker: failing open after 2 blocks - journal entry still missing (AL-3).');
    process.exit(0);
  }
  sentinel.blockCount = (sentinel.blockCount||0)+1;
  L.writeJson(sf, sentinel);
  const journalPath = L.vaultDir(root) + '/journal/';
  console.error('[brain] BLOCKED: append a journal entry to ' + journalPath
    + new Date().toISOString().slice(0,10)
    + '.md for the work just done (### [HH:MM] title; Synopsis; What worked + Evidence; What did NOT work; Artifacts; Next). Or write the one-line no-op entry if nothing substantive.');
  process.exit(2); // non-zero = block
} catch (e) { console.error('[brain] stop failed open: '+e.message); process.exit(0); }
