'use strict';
const fs = require('fs'); const path = require('path');
const L = require('./brain-lib');
let input = {}; try { input = JSON.parse(fs.readFileSync(0,'utf8')||'{}'); } catch {}
try {
  const root = L.projectRoot(input);
  const id = input.session_id || 'unknown';
  L.ensureDir(L.stateDir(root));
  // prune >14d sentinels/ledgers
  const d = L.stateDir(root), cutoff = Date.now()-14*864e5;
  for (const f of fs.readdirSync(d)) {
    if (/\.(sentinel|ledger)$/.test(f)) {
      const fp = path.join(d,f);
      if (fs.statSync(fp).mtimeMs < cutoff) fs.rmSync(fp,{force:true});
    }
  }
  L.writeJson(L.sentinelFile(root,id),
    { sessionId:id, startTs:L.nowIso(), branch:(input.branch||''), blockCount:0 });
  const rd = f => { try { return fs.readFileSync(L.P(root,f),'utf8'); } catch { return ''; } };
  const brain = L.getBrain(root);
  const overdue = brain.taskCountSinceConsolidation >= 5;
  const _pn = L.projectName(root).toUpperCase();
  let out = '';
  if (overdue) out += 'INFO Consolidation overdue - after the user task, offer/run a time-boxed consolidation.\n\n';
  out += `=== ${_pn} BRAIN (session start) ===\n`;
  out += 'Protocol: state what we last did before new work; on task completion append a journal entry (Synopsis/What worked+Evidence/What did NOT work/Artifacts/Next); NO secrets/PII; consolidation after the user task only.\n\n';
  out += '--- STATE.md ---\n' + rd('STATE.md') + '\n';
  const lj = L.latestJournal(root);
  out += '--- latest journal ---\n' + (lj ? path.basename(lj) : '(none yet)') + '\n';
  try {
    const lk = JSON.parse(fs.readFileSync(path.join(root,'.brain.lock'),'utf8')||'{}');
    const rel = L.vaultDir(root) + '/CLAUDE.md';
    const rec = lk && lk.renderManaged && lk.renderManaged[rel] && lk.renderManaged[rel].renderedHash;
    const dp = L.P(root,'CLAUDE.md');
    if (rec && fs.existsSync(dp) && L.sha256Norm(fs.readFileSync(dp,'utf8')) !== rec)
      out = 'INFO Protocol doc diverges from its tracked baseline (local edits or awaiting re-baseline) — run `brain sync` (-ProtocolDiff to inspect, -AcceptDoc to keep yours, -Force to take upstream).\n\n' + out;
  } catch {}
  process.stdout.write(out);
  process.exit(0);
} catch (e) { console.error('[brain] session-start failed open: '+e.message); process.exit(0); }
