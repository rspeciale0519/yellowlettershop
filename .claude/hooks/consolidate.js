'use strict';
const fs = require('fs');
const cp = require('child_process');
const L = require('./brain-lib');
try {
  const root = L.projectRoot({});
  const b = L.getBrain(root);
  // journal-vs-git gap check (heuristic): commits since lastConsolidationTs with
  // no journal file dated that day. execFileSync + arg array => no shell injection.
  let commits = '';
  try {
    const since = b.lastConsolidationTs || '1970-01-01';
    commits = cp.execFileSync('git',
      ['-C', root, 'log', '--since', since, '--pretty=%h%x09%ad', '--date=short'],
      { encoding:'utf8' });
  } catch { commits = ''; }
  const jdir = L.P(root,'journal');
  const days = fs.existsSync(jdir)
    ? fs.readdirSync(jdir).map(f=>f.replace('.md','')) : [];
  const gaps = commits.split('\n').filter(Boolean)
    .filter(l => { const day=l.split('\t')[1]; return day && !days.includes(day); });
  console.log('CONSOLIDATION HELPER');
  console.log('Tasks since last consolidation: ' + (b.taskCountSinceConsolidation||0));
  console.log('Potential journal-vs-git gaps (commit dates with no journal file):');
  console.log(gaps.length ? gaps.join('\n') : '(none)');
  console.log('\nNow distil: cluster recurring "what worked"->skill, "what did NOT work"->pitfalls; revise/deprecate contradicted skills; trim STATE.md; refresh index.md.');
  b.lastConsolidationTs = L.nowIso();
  b.taskCountSinceConsolidation = 0;
  L.setBrain(root,b);
  process.exit(0);
} catch (e) { console.error('[brain] consolidate helper error (non-fatal): '+e.message); process.exit(0); }
