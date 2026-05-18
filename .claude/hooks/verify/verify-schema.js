'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..', '..');
const checks = {
  'ylsbrain/CLAUDE.md': ['## Session-Start Ritual','## Per-task Journal','## Skill','## Accepted Limitations','AL-1','AL-5','no-op','Evidence'],
  'ylsbrain/STATE.md': ['Current focus','Latest synopsis','Open threads'],
  'ylsbrain/index.md': ['## Skills','## Recent journal'],
  'ylsbrain/log.md': ['# Log'],
};
const rootClaude = path.join(root, 'CLAUDE.md');
let fail = [];
for (const [f, toks] of Object.entries(checks)) {
  const fp = path.join(root, f);
  if (!fs.existsSync(fp)) { fail.push(f + ' (absent)'); continue; }
  const c = fs.readFileSync(fp, 'utf8');
  toks.forEach(t => { if (!c.includes(t)) fail.push(`${f}: missing "${t}"`); });
}
if (!fs.existsSync(rootClaude) || !fs.readFileSync(rootClaude,'utf8').includes('## YLS Brain'))
  fail.push('yls/CLAUDE.md: missing "## YLS Brain" pointer section');
if (fail.length) { console.log('SCHEMA FAIL:\n'+fail.join('\n')); process.exit(1); }
console.log('SCHEMA OK'); process.exit(0);
